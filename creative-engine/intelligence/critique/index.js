// Crítica por regras: o que dá para medir numa peça, sem opinião. Cada achado tem dimensão,
// severidade e a camada onde está. O que é julgamento (composição, foto, clareza) fica com o
// Claude, olhando a folha de contato: aqui não entra modelo de IA.
import { validateProject, getTimeline, evaluateFrame, resolveColor, MIN_FONT_SIZE } from '../../core/src/index.js';
import { missingAssetFiles } from '../../storage/index.js';
import { brandConsistency } from '../brand/index.js';

export const DIMENSIONS = { legibilidade: 0.3, mensagem: 0.25, marca: 0.2, ritmo: 0.15, tecnica: 0.1 };
const PENALIDADE = { critical: 30, warning: 12, info: 3, strength: 0 };
const NOMES = { legibilidade: 'Legibilidade', mensagem: 'Mensagem', marca: 'Marca', ritmo: 'Ritmo', tecnica: 'Técnica' };
const MARCAS = { critical: '✗', warning: '!', info: '·', strength: '✓' };

const palavras = (texto) => texto.split(/\s+/).filter(Boolean).length;

/** Luminância e contraste do WCAG, de #RRGGBB. */
function luminancia(hex) {
  const [r, g, b] = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255).map((c) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}
export function contrast(a, b) {
  const [claro, escuro] = [luminancia(a), luminancia(b)].sort((x, y) => y - x);
  return (claro + 0.05) / (escuro + 0.05);
}

const contem = (fora, dentro) => fora.x <= dentro.x && fora.y <= dentro.y && fora.x + fora.width >= dentro.x + dentro.width && fora.y + fora.height >= dentro.y + dentro.height;
const cruza = (a, b) => a.x < b.x + b.width && a.x + a.width > b.x && a.y < b.y + b.height && a.y + a.height > b.y;

/** A cor chapada atrás de um texto, ou null quando há foto ou transparência no caminho. */
function fundoDoTexto(project, cena, indice) {
  const texto = cena.layers[indice];
  for (let j = indice - 1; j >= 0; j--) {
    const abaixo = cena.layers[j];
    if (abaixo.visible === false || !cruza(abaixo.box, texto.box)) continue;
    if (abaixo.type === 'shape' && abaixo.shape.kind === 'rect' && abaixo.shape.fill && (abaixo.opacity ?? 1) === 1 && !abaixo.keyframes?.opacity
      && abaixo.shape.fill.length <= 15 && !/^#.{8}$/.test(abaixo.shape.fill) && contem(abaixo.box, texto.box)) {
      return resolveColor(project.brand, abaixo.shape.fill);
    }
    if (abaixo.type === 'text') continue;
    return null; // foto, logo, forma parcial ou transparente: não dá para medir por regra
  }
  return resolveColor(project.brand, cena.background ?? project.composition.background);
}

/**
 * @param {{ project: any, dir?: string, measure?: boolean | Function }} opcoes
 *   dir: pasta do projeto, para conferir arquivos e medir o texto no navegador.
 *   measure: false desliga a medição no navegador; uma função a substitui (para teste).
 * @returns {Promise<{ score: number, dimensions: Record<string, { score: number, findings: any[] }>, findings: any[], measured: boolean }>}
 */
export async function critiqueProject({ project, dir, measure = true }) {
  const achados = [];
  const achar = (dimension, severity, code, message, extra = {}) => achados.push({ dimension, severity, code, message, ...extra });

  const validacao = validateProject(project);
  if (!validacao.valid) {
    for (const e of validacao.errors) achar('tecnica', 'critical', e.code, e.message, { path: e.path });
    return fechar(achados, false);
  }
  const { composition, brand, scenes } = project;
  const { fps } = composition;
  const linha = getTimeline(project);
  const total = linha.totalFrames;

  // ---------- técnica ----------
  if (dir) for (const f of missingAssetFiles(dir, project)) achar('tecnica', 'critical', f.code, f.message, { path: f.path });
  for (const w of validacao.warnings) {
    if (w.code === 'UNUSED_ASSET') achar('tecnica', 'info', w.code, w.message, { path: w.path });
    if (w.code === 'EMPTY_SCENE') achar('tecnica', 'warning', w.code, w.message, { path: w.path });
    if (w.code === 'FONT_WITHOUT_FILE') achar('marca', 'info', w.code, `${w.message} ${w.hint}`, { path: w.path });
  }
  const assets = new Map(project.assets.map((a) => [a.id, a]));

  // ---------- por cena e camada ----------
  const eventos = new Set([0]);
  let temLogo = false;
  scenes.forEach((cena, i) => {
    const inicio = linha.scenes[i].startFrame;
    eventos.add(inicio);
    const sozinha = (linha.scenes[i + 1]?.startFrame ?? linha.scenes[i].endFrame) - (inicio + linha.scenes[i].overlapIn);
    if (sozinha < fps) achar('ritmo', 'warning', 'SCENE_TOO_SHORT', `A cena "${cena.id}" fica menos de 1 s sozinha na tela (${sozinha} quadros).`, { sceneId: cena.id });
    let palavrasDaCena = 0;

    cena.layers.forEach((camada, j) => {
      if (camada.visible === false) return;
      eventos.add(inicio + camada.startFrame);
      const onde = { layerId: camada.id, path: `/scenes/${i}/layers/${j}` };

      if (camada.type === 'logo') {
        temLogo = true;
        if (camada.box.width < 160) achar('marca', 'warning', 'LOGO_TOO_SMALL', `O logo "${camada.id}" tem ${camada.box.width} px de largura: some no celular.`, onde);
      }
      if (camada.type === 'image') {
        const asset = assets.get(camada.image.assetId);
        if (asset?.width && (asset.width < camada.box.width * 0.8 || asset.height < camada.box.height * 0.8)) {
          achar('tecnica', 'warning', 'IMAGE_LOW_RES', `A imagem "${asset.id}" (${asset.width}×${asset.height}) é menor que a caixa de ${camada.box.width}×${camada.box.height}: vai aparecer borrada.`, onde);
        }
      }
      const opacidade = camada.keyframes?.opacity;
      if (opacidade && opacidade.length >= 4) {
        let viradas = 0;
        for (let k = 2; k < opacidade.length; k++) if ((opacidade[k].value - opacidade[k - 1].value) * (opacidade[k - 1].value - opacidade[k - 2].value) < 0) viradas++;
        const duracao = (opacidade.at(-1).frame - opacidade[0].frame) / fps;
        if (duracao > 0 && viradas / duracao > 3) achar('legibilidade', 'critical', 'FLASH_HAZARD', `A camada "${camada.id}" pisca mais de 3 vezes por segundo: risco para quem tem fotossensibilidade.`, onde);
      }
      if (camada.type !== 'text') return;

      const t = camada.text;
      const n = palavras(t.content);
      palavrasDaCena += n;
      if (t.fontSize < MIN_FONT_SIZE) achar('legibilidade', 'critical', 'TEXT_TOO_SMALL', `"${camada.id}" tem ${t.fontSize} px: abaixo de ${MIN_FONT_SIZE} px não se lê no celular.`, onde);
      const entrada = Math.max(0, ...(camada.animations ?? []).filter((a) => a.role === 'in').map((a) => (a.delayFrames ?? 0) + a.durationFrames));
      const saida = Math.max(0, ...(camada.animations ?? []).filter((a) => a.role === 'out').map((a) => (a.delayFrames ?? 0) + a.durationFrames));
      const legivel = (camada.durationFrames - entrada - saida) / fps;
      const precisa = 0.5 + n / 3.5; // cerca de 3,5 palavras por segundo, mais meio segundo para achar o texto
      if (legivel < precisa) achar('legibilidade', 'warning', 'READING_TIME', `"${camada.id}" tem ${n} palavra(s) e fica ${legivel.toFixed(1)} s legível; precisa de uns ${precisa.toFixed(1)} s.`, onde);
      const linhaLonga = t.content.split('\n').find((l) => palavras(l) > 6);
      if (linhaLonga && t.fontSize >= 64) achar('legibilidade', 'info', 'LINE_TOO_LONG', `"${camada.id}" tem linha com mais de 6 palavras em fonte grande: corte palavras em vez de apertar.`, onde);

      const fundo = fundoDoTexto(project, cena, j);
      const cor = resolveColor(brand, t.color).slice(0, 7);
      if (fundo === null) achar('legibilidade', 'info', 'CONTRAST_NOT_MEASURED', `"${camada.id}" está sobre foto ou transparência: conferir o contraste olhando o quadro.`, onde);
      else {
        const razao = contrast(cor, fundo.slice(0, 7));
        const minimo = t.fontSize >= 48 ? 3 : 4.5;
        if (razao < minimo) achar('legibilidade', 'critical', 'LOW_CONTRAST', `"${camada.id}": contraste de ${razao.toFixed(1)}:1 entre ${cor} e ${fundo}; o mínimo aqui é ${minimo}:1.`, onde);
      }
    });
    if (palavrasDaCena > 14) achar('mensagem', 'warning', 'TOO_MUCH_TEXT', `A cena "${cena.id}" tem ${palavrasDaCena} palavras: uma ideia por cena.`, { sceneId: cena.id });

    const primeiro = inicio + linha.scenes[i].overlapIn;
    if (i > 0 && !evaluateFrame(project, primeiro).scenes.at(-1).layers.some((l) => l.opacity > 0)) {
      achar('ritmo', 'info', 'EMPTY_START', `A cena "${cena.id}" começa vazia (quadro ${primeiro}): nada aparece junto com o fundo.`, { sceneId: cena.id });
    }
  });

  // ---------- legibilidade: área segura (vem dos avisos da validação) ----------
  for (const w of validacao.warnings.filter((x) => x.code === 'TEXT_OUTSIDE_SAFE_AREA')) achar('legibilidade', 'warning', w.code, `${w.message} ${w.hint}`, { path: w.path });

  // ---------- medição no navegador ----------
  let measured = false;
  if (measure && (dir || typeof measure === 'function')) {
    try {
      const medir = typeof measure === 'function' ? measure : (await import('../../renderer/export/index.js')).measureTextLayers;
      for (const m of await medir({ dir })) {
        if (m.overflow) achar('legibilidade', 'critical', 'TEXT_OVERFLOW', `O texto de "${m.layerId}" não cabe na caixa (${m.textWidth}×${m.textHeight} px numa caixa de ${m.boxWidth}×${m.boxHeight}).`, { layerId: m.layerId });
        else if (m.wrapped) achar('legibilidade', 'warning', 'TEXT_WRAPPED', `O texto de "${m.layerId}" quebrou em ${m.lines} linhas (o roteiro tem ${m.expectedLines}): diminua a fonte ou alargue a caixa.`, { layerId: m.layerId });
      }
      measured = true;
    } catch (e) {
      achar('tecnica', 'info', 'TEXT_NOT_MEASURED', `Não medi se os textos cabem nas caixas: ${e.message.split('\n')[0]}`);
    }
  } else achar('tecnica', 'info', 'TEXT_NOT_MEASURED', 'Não medi se os textos cabem nas caixas (sem a pasta do projeto ou com a medição desligada).');

  // ---------- marca ----------
  const foraDaMarca = brandConsistency(project);
  for (const f of foraDaMarca) achar('marca', 'warning', f.code, f.message, { path: f.path });
  if (!foraDaMarca.length) achar('marca', 'strength', 'COLORS_IN_BRAND', 'Todas as cores são da marca.');
  if (!temLogo) achar('marca', 'warning', 'NO_LOGO', 'A peça não mostra o logo em nenhuma cena.');

  // ---------- ritmo ----------
  const zero = evaluateFrame(project, 0).scenes[0].layers.filter((l) => l.opacity > 0);
  if (!zero.some((l) => l.type === 'text' || l.type === 'image')) {
    achar('ritmo', 'critical', 'HOOK_NOT_AT_FRAME_0', zero.some((l) => l.type === 'logo') ? 'O vídeo abre com o logo: o gancho tem que estar no quadro 0.' : 'O quadro 0 não tem texto nem imagem: o gancho tem que estar no primeiro quadro.');
  } else achar('ritmo', 'strength', 'HOOK_AT_FRAME_0', 'O quadro 0 já mostra texto ou imagem.');
  const ordenados = [...eventos, total].sort((a, b) => a - b);
  let maior = 0, ondeMaior = 0;
  for (let k = 1; k < ordenados.length; k++) if (ordenados[k] - ordenados[k - 1] > maior) { maior = ordenados[k] - ordenados[k - 1]; ondeMaior = ordenados[k - 1]; }
  if (maior > 4 * fps) achar('ritmo', 'warning', 'STATIC_STRETCH', `Do quadro ${ondeMaior} em diante passam ${(maior / fps).toFixed(1)} s sem nada novo entrar: algo novo a cada 2 a 4 s.`);

  // ---------- mensagem ----------
  const primeira = scenes[0], ultima = scenes.at(-1);
  if (primeira.beat?.role !== 'hook') achar('mensagem', 'warning', 'NO_HOOK_BEAT', 'A primeira cena não está marcada como gancho (beat.role = hook).', { sceneId: primeira.id });
  const textosFinais = ultima.layers.filter((l) => l.type === 'text' && l.visible !== false).map((l) => l.text.content);
  if (ultima.beat?.role !== 'cta' || !textosFinais.length) achar('mensagem', 'critical', 'NO_CTA', 'A última cena não tem chamada para ação (beat.role = cta com um texto).', { sceneId: ultima.id });
  const chamada = project.project.brief?.callToAction;
  const normal = (s) => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/\s+/g, ' ').trim();
  if (chamada && textosFinais.length && !textosFinais.some((t) => normal(t).includes(normal(chamada)))) {
    achar('mensagem', 'warning', 'BRIEF_CTA_MISSING', `O briefing pede a chamada "${chamada}" e ela não aparece na última cena.`, { sceneId: ultima.id });
  }
  const duracao = total / fps;
  if (duracao < 6 || duracao > 30) achar('mensagem', 'info', 'DURATION_UNUSUAL', `A peça tem ${duracao.toFixed(1)} s: anúncio vertical costuma ficar entre 6 e 30 s.`);

  return fechar(achados, measured);
}

function fechar(findings, measured) {
  const dimensions = {};
  let score = 0;
  for (const [nome, peso] of Object.entries(DIMENSIONS)) {
    const dele = findings.filter((f) => f.dimension === nome);
    const nota = Math.max(0, 100 - dele.reduce((soma, f) => soma + PENALIDADE[f.severity], 0));
    dimensions[nome] = { score: nota, findings: dele };
    score += nota * peso;
  }
  return { score: Math.round(score), dimensions, findings, measured };
}

/** O relatório em texto, para o terminal e para o critica.md. */
export function critiqueText(c) {
  const linhas = [`Crítica por regras: ${c.score}/100${c.measured ? '' : '  (textos não medidos no navegador)'}`];
  for (const [nome, d] of Object.entries(c.dimensions)) {
    linhas.push('', `${NOMES[nome]}: ${d.score}/100`);
    if (!d.findings.length) linhas.push('  nada a apontar');
    for (const f of d.findings) linhas.push(`  ${MARCAS[f.severity]} ${f.code}${f.layerId ? ` (${f.layerId})` : ''}: ${f.message}`);
  }
  linhas.push('', 'O que regra não mede (composição, foto, clareza da mensagem) se confere olhando a folha de contato.');
  return linhas.join('\n');
}
