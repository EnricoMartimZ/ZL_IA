// Fase 3: palco, quadro em PNG, folha de contato e MP4. Precisa do Chromium do Playwright e,
// para o vídeo, do FFmpeg; sem eles o teste é pulado dizendo o que falta.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, readFileSync, rmSync, cpSync, existsSync, statSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { captureFrames, renderFrame, renderProject, renderContactSheet, keyFrames, RenderError } from '../export/index.js';
import { startStageServer, dentroDe } from '../export/server.js';
import { ffmpegAdapter } from '../adapters/ffmpeg.js';
import { imageSize, describeAsset, assetTypesFor } from '../media/index.js';
import { decodePng } from '../media/png.js';
import { createProject } from '../../core/src/index.js';
import { saveProject } from '../../storage/index.js';

const motor = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const exemploDir = path.join(motor, 'fixtures/projects/motion-ad-4-scenes');
const exemplo = JSON.parse(readFileSync(path.join(exemploDir, 'project.mazy.json'), 'utf8'));

let chromiumOk = true;
try { const { chromium } = await import('playwright'); const b = await chromium.launch(); await b.close(); } catch { chromiumOk = false; }
const semNavegador = chromiumOk ? false : 'pulado: falta o Chromium do Playwright (npm run setup na raiz)';
const ffmpeg = ffmpegAdapter.available();
const semVideo = semNavegador || (ffmpeg.ok ? false : `pulado: ${ffmpeg.reason}`);

const pastaNova = (t) => { const d = mkdtempSync(path.join(tmpdir(), 'mazy-render-')); t.after(() => rmSync(d, { recursive: true, force: true })); return d; };
const hex = ([r, g, b]) => `#${[r, g, b].map((n) => n.toString(16).padStart(2, '0')).join('').toUpperCase()}`;

/** Projeto só de formas, com cores e posições conhecidas. */
function projetoDeFormas(dir) {
  const p = createProject({ id: 'formas', name: 'Formas', now: '2026-11-11T12:00:00Z' });
  p.scenes = [{
    id: 'unica', name: 'Única', durationFrames: 30, background: '#102030',
    layers: [
      { id: 'quadrado', name: 'Quadrado', type: 'shape', startFrame: 0, durationFrames: 30, box: { x: 100, y: 200, width: 300, height: 300 }, shape: { kind: 'rect', fill: '#FF0000' } },
      { id: 'bola', name: 'Bola', type: 'shape', startFrame: 0, durationFrames: 30, box: { x: 600, y: 1000, width: 200, height: 200 }, shape: { kind: 'ellipse', fill: '#00FF00' } },
      { id: 'tarde', name: 'Entra depois', type: 'shape', startFrame: 10, durationFrames: 20, box: { x: 0, y: 1700, width: 1080, height: 100 }, shape: { kind: 'rect', fill: '#0000FF' },
        animations: [{ id: 'entra', preset: 'slide', role: 'in', durationFrames: 10, easing: 'linear', params: { direction: 'right', distance: 1080 } }] },
      { id: 'meio', name: 'Meio transparente', type: 'shape', startFrame: 0, durationFrames: 30, box: { x: 700, y: 200, width: 200, height: 200 }, opacity: 0.5, shape: { kind: 'rect', fill: '#FFFFFF' } },
    ],
  }];
  p.composition.durationFrames = 30;
  saveProject(dir, p, { source: 'cli' });
  return dir;
}

test('medidas de imagem lidas do arquivo', () => {
  assert.deepEqual(imageSize(readFileSync(path.join(exemploDir, 'assets/foto-rosto.jpg'))), { width: 1080, height: 1920 });
  assert.deepEqual(imageSize(readFileSync(path.join(exemploDir, 'assets/foto-armacao.jpg'))), { width: 800, height: 800 });
  assert.deepEqual(imageSize(readFileSync(path.join(exemploDir, 'assets/logo-claro.svg'))), { width: 400, height: 200 });
  assert.equal(imageSize(Buffer.from('isto não é imagem')), null);
  const d = describeAsset(path.join(exemploDir, 'assets/foto-armacao.jpg'));
  assert.equal(d.width, 800); assert.match(d.sha256, /^[0-9a-f]{64}$/); assert.ok(d.bytes > 1000);
  assert.deepEqual(assetTypesFor('foto.JPG'), ['image', 'logo']);
  assert.deepEqual(assetTypesFor('fonte.woff2'), ['font']);
  assert.deepEqual(assetTypesFor('planilha.csv'), []);
});

test('o servidor do palco só entrega a pasta do projeto e o código do palco', async (t) => {
  assert.equal(dentroDe('/a/b', 'c/d.png'), '/a/b/c/d.png');
  assert.equal(dentroDe('/a/b', '../segredo'), null);
  assert.equal(dentroDe('/a/b', '%2e%2e/segredo'), null);
  assert.equal(dentroDe('/a/b', '/etc/passwd'), '/a/b/etc/passwd');
  const servidor = await startStageServer({ projectDir: exemploDir, project: exemplo });
  t.after(() => servidor.close());
  const status = async (caminho, opcoes) => (await fetch(servidor.url + caminho, opcoes)).status;
  assert.match(servidor.url, /^http:\/\/127\.0\.0\.1:\d+$/);
  assert.equal(await status('/stage.html'), 200);
  assert.equal(await status('/project/assets/logo-claro.svg'), 200);
  assert.equal(await status('/engine/renderer/stage/stage.js'), 200);
  assert.equal(await status('/engine/core/src/evaluate/index.js'), 200);
  assert.equal(await status('/project/%2e%2e/%2e%2e/%2e%2e/package.json'), 404);
  assert.equal(await status('/engine/package.json'), 404, 'fora do palco e do Core');
  assert.equal(await status('/engine/storage/index.js'), 404);
  assert.equal(await status('/engine/core/src/%2e%2e/%2e%2e/package.json'), 404);
  assert.equal(await status('/project.json', { method: 'POST' }), 405);
  assert.deepEqual((await (await fetch(`${servidor.url}/project.json`)).json()).project.id, exemplo.project.id);
});

test('formas: cada cor no lugar certo, no tamanho da composição', { skip: semNavegador }, async (t) => {
  const dir = projetoDeFormas(pastaNova(t));
  const [png] = await captureFrames({ dir, frames: [0] });
  const img = decodePng(png);
  assert.deepEqual([img.width, img.height], [1080, 1920]);
  assert.equal(hex(img.pixel(10, 10)), '#102030', 'fundo da cena');
  assert.equal(hex(img.pixel(250, 350)), '#FF0000', 'meio do quadrado');
  assert.equal(hex(img.pixel(99, 350)), '#102030', 'um pixel antes do quadrado');
  assert.equal(hex(img.pixel(700, 1100)), '#00FF00', 'meio da bola');
  assert.equal(hex(img.pixel(605, 1005)), '#102030', 'canto da caixa da bola: é elipse');
  assert.equal(hex(img.pixel(800, 300)), '#889098', 'branco a 50% sobre o fundo');
  assert.equal(hex(img.pixel(540, 1750)), '#102030', 'a faixa azul ainda não entrou');
});

test('animação: a faixa entra pela esquerda e para no lugar; o mesmo quadro sai idêntico', { skip: semNavegador }, async (t) => {
  const dir = projetoDeFormas(pastaNova(t));
  const [meio, fim, fimDeNovo] = await captureFrames({ dir, frames: [15, 25, 25] });
  const m = decodePng(meio), f = decodePng(fim);
  assert.equal(hex(m.pixel(200, 1750)), '#0000FF', 'no meio da entrada, a metade esquerda já está coberta');
  assert.equal(hex(m.pixel(900, 1750)), '#102030', 'e a direita ainda não');
  assert.equal(hex(f.pixel(900, 1750)), '#0000FF');
  assert.ok(fim.equals(fimDeNovo), 'dois prints do mesmo quadro têm os mesmos bytes');
  const [outraVez] = await captureFrames({ dir, frames: [25] });
  assert.ok(fim.equals(outraVez), 'e em outra execução também');
});

test('exemplo: imagem, logo e texto com a fonte do projeto aparecem', { skip: semNavegador }, async () => {
  const [gancho, chamada] = await captureFrames({ dir: exemploDir, frames: [0, 449] });
  const g = decodePng(gancho), c = decodePng(chamada);
  // JPEG não guarda a cor exata: confere com folga
  const [r, gg, b] = g.pixel(540, 640);
  assert.ok(Math.abs(r - 0xD9) < 8 && Math.abs(gg - 0xB3) < 8 && Math.abs(b - 0x8C) < 8, `rosto da foto de teste: veio ${hex([r, gg, b])}`);
  // o título é branco sobre o véu escuro: tem que haver pixel branco na caixa dele
  let brancos = 0;
  for (let y = 900; y < 1200; y += 4) for (let x = 64; x < 1016; x += 4) if (hex(g.pixel(x, y)) === '#FFFFFF') brancos++;
  assert.ok(brancos > 300, `achei só ${brancos} pontos brancos no título`);
  assert.equal(hex(c.pixel(540, 840)).slice(0, 3), '#E4', 'o botão na cor de destaque');
  let logo = 0;
  for (let y = 360; y < 560; y += 2) for (let x = 340; x < 740; x += 2) if (hex(c.pixel(x, y)) === '#FFFFFF') logo++;
  assert.ok(logo > 200, `achei só ${logo} pontos brancos no logo`);
});

test('projeto com arquivo faltando não é desenhado', async (t) => {
  const dir = pastaNova(t);
  cpSync(path.join(exemploDir, 'project.mazy.json'), path.join(dir, 'project.mazy.json'));
  await assert.rejects(() => captureFrames({ dir, frames: [0] }), (e) => e instanceof RenderError && e.code === 'INVALID_PROJECT' && e.problems[0].code === 'ASSET_FILE_MISSING');
  await assert.rejects(() => captureFrames({ dir: exemploDir, frames: [450] }), (e) => e.code === 'BAD_RANGE');
});

test('quadros principais: de cada cena, o começo, o meio e o último antes da próxima', () => {
  const quadros = keyFrames(exemplo);
  assert.deepEqual(quadros.filter((q) => q.sceneId === 'cena-gancho').map((q) => q.frame), [0, 41, 83]);
  assert.deepEqual(quadros.filter((q) => q.sceneId === 'cena-produto').map((q) => q.frame), [96, 149, 203]);
  assert.deepEqual(quadros.filter((q) => q.sceneId === 'cena-chamada').map((q) => q.frame), [336, 392, 449]);
});

test('quadro avulso e folha de contato viram arquivos PNG', { skip: semNavegador }, async (t) => {
  const dir = projetoDeFormas(pastaNova(t));
  const quadro = await renderFrame({ dir, frame: 12 });
  assert.equal(quadro.output, path.join(dir, 'renders', 'frame-000012.png'));
  assert.deepEqual(imageSize(readFileSync(quadro.output)), { width: 1080, height: 1920 });
  const folha = await renderContactSheet({ dir });
  assert.equal(folha.frames.length, 3);
  assert.ok(imageSize(readFileSync(folha.output)).width > 900);
});

test('MP4: 1 segundo do exemplo sai com medidas, taxa, quadros e codec certos', { skip: semVideo }, async (t) => {
  const saida = path.join(pastaNova(t), 'um-segundo.mp4');
  const avancos = [];
  const r = await renderProject({ dir: exemploDir, output: saida, range: [84, 113], onProgress: (feitos, total) => avancos.push(`${feitos}/${total}`) });
  assert.deepEqual(r.checks, { width: 1080, height: 1920, codec: 'h264', pixelFormat: 'yuv420p', fps: 30, frames: 30, seconds: 1 });
  assert.equal(r.frames, 30); assert.equal(r.seconds, 1);
  assert.equal(avancos.length, 30); assert.equal(avancos.at(-1), '30/30');
  assert.ok(statSync(saida).size > 5000);
  assert.ok(r.msPerFrame > 0);
});

test('sem FFmpeg a exportação para com a instrução de instalar', { skip: semNavegador }, async (t) => {
  const antes = process.env.MAZY_FFMPEG;
  process.env.MAZY_FFMPEG = '/nao/existe/ffmpeg';
  t.after(() => { if (antes === undefined) delete process.env.MAZY_FFMPEG; else process.env.MAZY_FFMPEG = antes; });
  assert.equal(ffmpegAdapter.available().ok, false);
  await assert.rejects(() => renderProject({ dir: exemploDir, output: path.join(pastaNova(t), 'x.mp4') }),
    (e) => e.code === 'ENVIRONMENT' && /sudo apt install ffmpeg/.test(e.message));
});

test('MP4 completo: o exemplo de 4 cenas vira 450 quadros e 15 s', { skip: semVideo || (process.env.MAZY_FULL_RENDER === '1' ? false : 'pulado: demora mais de um minuto. Rode com MAZY_FULL_RENDER=1') }, async (t) => {
  const r = await renderProject({ dir: exemploDir, output: path.join(pastaNova(t), 'completo.mp4') });
  assert.equal(r.checks.frames, 450); assert.equal(r.checks.seconds, 15);
  console.log(`# render completo: ${r.renderMs} ms, ${r.msPerFrame} ms por quadro`);
});
