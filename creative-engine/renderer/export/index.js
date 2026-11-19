// Export Renderer: abre o palco no Chromium do Playwright, avança quadro a quadro (sem relógio),
// tira um print de cada um e entrega ao adaptador de vídeo. Também tira quadros avulsos e a
// folha de contato, que é como o Claude olha a peça.
import { mkdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { validateProject, getTimeline } from '../../core/src/index.js';
import { openProject, missingAssetFiles } from '../../storage/index.js';
import { ffmpegAdapter } from '../adapters/ffmpeg.js';
import { probeVideo } from '../media/index.js';
import { startStageServer } from './server.js';

export class RenderError extends Error {
  /** @param {'INVALID_PROJECT' | 'ENVIRONMENT' | 'STAGE_FAILED' | 'OUTPUT_MISMATCH' | 'BAD_RANGE'} code */
  constructor(code, message, detalhes = {}) { super(message); this.name = 'RenderError'; this.code = code; Object.assign(this, detalhes); }
}

/** Abre e confere o projeto: forma, regras e arquivos de asset. Erro aqui impede qualquer desenho. */
export function loadForRender(dir) {
  const aberto = openProject(dir);
  const validacao = validateProject(aberto.project);
  const problemas = validacao.valid ? missingAssetFiles(aberto.dir, aberto.project) : validacao.errors;
  if (problemas.length) throw new RenderError('INVALID_PROJECT', 'O projeto tem erro e não pode ser desenhado.', { problems: problemas });
  return { ...aberto, warnings: validacao.warnings };
}

/** Sobe o servidor local e abre a página do palco, já com fontes e imagens carregadas. */
async function abrirPalco({ dir, project }) {
  let chromium;
  try { ({ chromium } = await import('playwright')); } catch {
    throw new RenderError('ENVIRONMENT', 'Playwright não encontrado. Rode "npm run setup" na raiz do ZL_IA.');
  }
  const servidor = await startStageServer({ projectDir: dir, project });
  let navegador;
  try {
    navegador = await chromium.launch();
  } catch (e) {
    await servidor.close();
    throw new RenderError('ENVIRONMENT', `Não consegui abrir o Chromium do Playwright. Rode "npm run setup" na raiz do ZL_IA. (${e.message.split('\n')[0]})`);
  }
  const fechar = async () => { await navegador.close().catch(() => {}); await servidor.close(); };
  try {
    const { width, height } = project.composition;
    const pagina = await navegador.newPage({ viewport: { width, height }, deviceScaleFactor: 1 });
    await pagina.goto(`${servidor.url}/stage.html`, { waitUntil: 'load' });
    await pagina.waitForFunction(() => window.__stage && window.__stage.status !== 'carregando', null, { timeout: 30000 });
    const estado = await pagina.evaluate(() => ({ status: window.__stage.status, error: window.__stage.error }));
    if (estado.status !== 'pronto') throw new RenderError('STAGE_FAILED', estado.error?.message ?? 'O palco não carregou.');
    const quadro = async (frame) => {
      await pagina.evaluate((f) => window.__stage.seek(f), frame);
      return pagina.screenshot({ type: 'png', clip: { x: 0, y: 0, width, height } });
    };
    const medir = (frame, layerId) => pagina.evaluate(([f, id]) => {
      window.__stage.seek(f);
      const el = document.querySelector(`[data-layer-id="${id}"]`);
      const miolo = el.firstElementChild;
      // mede o texto solto, sem a largura da caixa forçando a quebra de palavra
      const antes = miolo.style.overflowWrap;
      miolo.style.overflowWrap = 'normal';
      const r = { boxWidth: el.offsetWidth, boxHeight: el.offsetHeight, textWidth: miolo.scrollWidth, textHeight: miolo.scrollHeight };
      miolo.style.overflowWrap = antes;
      const lines = Math.round(r.textHeight / parseFloat(getComputedStyle(miolo).lineHeight));
      const expectedLines = miolo.textContent.split('\n').length;
      // wrapped: o navegador quebrou uma linha que o roteiro escreveu inteira
      return { ...r, lines, expectedLines, wrapped: lines > expectedLines, overflow: r.textWidth > r.boxWidth + 1 || r.textHeight > r.boxHeight + 1 };
    }, [frame, layerId]);
    return { quadro, medir, navegador, fechar };
  } catch (e) {
    await fechar();
    throw e;
  }
}

/**
 * Quadros avulsos em PNG.
 * @param {{ dir: string, frames: number[] }} opcoes
 * @returns {Promise<Buffer[]>}
 */
export async function captureFrames({ dir, frames }) {
  const { dir: pasta, project } = loadForRender(dir);
  const total = getTimeline(project).totalFrames;
  for (const f of frames) {
    if (!Number.isInteger(f) || f < 0 || f >= total) throw new RenderError('BAD_RANGE', `Quadro ${f} fora do vídeo (0 a ${total - 1}).`);
  }
  const palco = await abrirPalco({ dir: pasta, project });
  try {
    const saida = [];
    for (const f of frames) saida.push(await palco.quadro(f));
    return saida;
  } finally { await palco.fechar(); }
}

/**
 * Mede cada caixa de texto no navegador: o texto cabe na caixa com a fonte de verdade?
 * @returns {Promise<Array<{ layerId: string, frame: number, boxWidth: number, boxHeight: number, textWidth: number, textHeight: number, lines: number, expectedLines: number, wrapped: boolean, overflow: boolean }>>}
 */
export async function measureTextLayers({ dir }) {
  const { dir: pasta, project } = loadForRender(dir);
  const linha = getTimeline(project);
  const palco = await abrirPalco({ dir: pasta, project });
  try {
    const medidas = [];
    for (const [i, cena] of project.scenes.entries()) {
      for (const camada of cena.layers.filter((l) => l.type === 'text' && l.visible !== false)) {
        // o último quadro da camada: as entradas já terminaram
        const frame = Math.min(linha.totalFrames - 1, linha.scenes[i].startFrame + camada.startFrame + camada.durationFrames - 1);
        medidas.push({ layerId: camada.id, frame, ...(await palco.medir(frame, camada.id)) });
      }
    }
    return medidas;
  } finally { await palco.fechar(); }
}

/** Um quadro em PNG, gravado em `output` (padrão: renders/frame-000123.png). */
export async function renderFrame({ dir, frame, output }) {
  const { dir: pasta } = openProject(dir);
  const [png] = await captureFrames({ dir, frames: [frame] });
  const destino = path.resolve(output ?? path.join(pasta, 'renders', `frame-${String(frame).padStart(6, '0')}.png`));
  mkdirSync(path.dirname(destino), { recursive: true });
  writeFileSync(destino, png);
  return { output: destino, frame };
}

/** Quadros que resumem a peça: de cada cena, o primeiro depois da transição, o do meio e o último antes da próxima entrar. */
export function keyFrames(project) {
  const { scenes } = getTimeline(project);
  return scenes.flatMap((s, i) => {
    const primeiro = s.startFrame + s.overlapIn;
    // o último quadro em que a cena está sozinha: depois dele a próxima já entra por cima
    const ultimo = Math.max(primeiro, (scenes[i + 1]?.startFrame ?? s.endFrame) - 1);
    return [...new Set([primeiro, Math.floor((primeiro + ultimo) / 2), ultimo])].map((frame) => ({ sceneId: s.sceneId, frame }));
  });
}

/** Folha de contato: os quadros principais lado a lado, com cena, quadro e tempo embaixo. */
export async function renderContactSheet({ dir, output, columns }) {
  const { dir: pasta, project } = loadForRender(dir);
  const { width, height, fps } = project.composition;
  const itens = keyFrames(project);
  const palco = await abrirPalco({ dir: pasta, project });
  try {
    const pngs = [];
    for (const item of itens) pngs.push(await palco.quadro(item.frame));
    const colunas = columns ?? Math.min(6, itens.length);
    const larguraMini = 300, alturaMini = Math.round(larguraMini * height / width);
    const linhas = Math.ceil(itens.length / colunas);
    const folha = await palco.navegador.newPage({ viewport: { width: colunas * (larguraMini + 16) + 16, height: linhas * (alturaMini + 60) + 16 }, deviceScaleFactor: 1 });
    const celulas = itens.map((item, i) => `<figure><img src="data:image/png;base64,${pngs[i].toString('base64')}"><figcaption><b>${item.sceneId}</b><br>quadro ${item.frame} · ${(item.frame / fps).toFixed(2)} s</figcaption></figure>`).join('');
    await folha.setContent(`<!doctype html><meta charset="utf-8"><style>
      body{margin:0;padding:16px 0 0 16px;background:#1b1b1f;font:14px/1.3 sans-serif;color:#e8e8ea;display:grid;grid-template-columns:repeat(${colunas},${larguraMini}px);gap:0 16px}
      figure{margin:0 0 16px;height:${alturaMini + 44}px}img{width:${larguraMini}px;height:${alturaMini}px;display:block;background:#000}figcaption{padding-top:6px}
    </style>${celulas}`, { waitUntil: 'load' });
    const png = await folha.screenshot({ type: 'png', fullPage: true });
    const destino = path.resolve(output ?? path.join(pasta, 'renders', 'folha-de-contato.png'));
    mkdirSync(path.dirname(destino), { recursive: true });
    writeFileSync(destino, png);
    return { output: destino, frames: itens };
  } finally { await palco.fechar(); }
}

/**
 * Exporta o vídeo.
 * @param {{ dir: string, output?: string, range?: [number, number], adapter?: any, crf?: number, onProgress?: (feitos: number, total: number) => void }} opcoes
 *   range: [primeiro, último] em quadros, para exportar só um trecho.
 * @returns {Promise<{ output: string, frames: number, seconds: number, renderMs: number, msPerFrame: number, checks: object, warnings: any[] }>}
 */
export async function renderProject({ dir, output, range, adapter = ffmpegAdapter, crf, onProgress }) {
  const { dir: pasta, project, warnings } = loadForRender(dir);
  const disponivel = adapter.available();
  if (!disponivel.ok) throw new RenderError('ENVIRONMENT', disponivel.reason);

  const { width, height, fps } = project.composition;
  const total = getTimeline(project).totalFrames;
  const [primeiro, ultimo] = range ?? [0, total - 1];
  if (![primeiro, ultimo].every(Number.isInteger) || primeiro < 0 || ultimo >= total || primeiro > ultimo) {
    throw new RenderError('BAD_RANGE', `Trecho ${primeiro}–${ultimo} fora do vídeo (0 a ${total - 1}).`);
  }
  const quantos = ultimo - primeiro + 1;
  const destino = path.resolve(output ?? path.join(pasta, 'renders', project.export.fileName ?? `${project.project.id}.mp4`));
  mkdirSync(path.dirname(destino), { recursive: true });

  const palco = await abrirPalco({ dir: pasta, project });
  const inicio = performance.now();
  const video = adapter.open({ width, height, fps, output: destino, crf: crf ?? project.export.crf });
  try {
    for (let f = primeiro; f <= ultimo; f++) {
      await video.write(await palco.quadro(f));
      onProgress?.(f - primeiro + 1, quantos);
    }
    await video.close();
  } catch (e) {
    video.abort?.();
    throw e;
  } finally { await palco.fechar(); }
  const renderMs = Math.round(performance.now() - inicio);

  // a prova de que saiu o que foi pedido
  const medido = probeVideo(destino);
  const esperado = { width, height, fps, frames: quantos, codec: 'h264', pixelFormat: 'yuv420p' };
  const diferencas = Object.keys(esperado).filter((k) => medido[k] !== esperado[k]).map((k) => `${k}: esperado ${esperado[k]}, saiu ${medido[k]}`);
  if (diferencas.length) throw new RenderError('OUTPUT_MISMATCH', `O vídeo saiu diferente do pedido (${diferencas.join('; ')}).`, { output: destino });
  return { output: destino, frames: quantos, seconds: quantos / fps, renderMs, msPerFrame: Math.round(renderMs / quantos), checks: medido, warnings };
}
