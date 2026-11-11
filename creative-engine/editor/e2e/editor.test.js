// Editor de ponta a ponta: o Playwright abre o editor de verdade sobre uma cópia do exemplo e faz
// o que uma pessoa faria. Precisa do Chromium do Playwright; a exportação precisa do FFmpeg.
import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync, cpSync, readFileSync, existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { startEditor } from '../../cli/server.js';
import { openProject, saveProject } from '../../storage/index.js';
import { validateProject, applyCommands, createProject } from '../../core/src/index.js';
import { ffmpegAdapter } from '../../renderer/adapters/ffmpeg.js';
import { probeVideo } from '../../renderer/media/index.js';

const motor = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const exemploDir = path.join(motor, 'fixtures/projects/motion-ad-4-scenes');

let chromium = null;
try { ({ chromium } = await import('playwright')); const b = await chromium.launch(); await b.close(); } catch { chromium = null; }
const pular = chromium ? false : 'pulado: falta o Chromium do Playwright (npm run setup na raiz)';

let dir, editor, navegador, pagina;
const errosDoConsole = [];
const disco = () => openProject(dir).project;
const camadaNoDisco = (id) => disco().scenes.flatMap((s) => s.layers).find((l) => l.id === id);
const noEditor = (f, arg) => pagina.evaluate(f, arg);
const camadaNoEditor = (id) => noEditor((i) => window.__editor.store.getState().project.scenes.flatMap((s) => s.layers).find((l) => l.id === i), id);
const gravado = () => pagina.waitForFunction(() => document.querySelector('[data-testid="save-status"]').textContent === 'gravado' && !window.__editor.store.getState().dirty, null, { timeout: 8000 });
const el = (id) => pagina.locator(`[data-testid="${id}"]`);
/** Ponto da tela que corresponde a um ponto da composição (1080×1920). */
async function pontoNoPalco(x, y) {
  const r = await el('stage').boundingBox();
  return { x: r.x + x * r.width / 1080, y: r.y + y * r.height / 1920, escala: r.width / 1080 };
}
async function arrastar(de, dx, dy) {
  await pagina.mouse.move(de.x, de.y);
  await pagina.mouse.down();
  await pagina.mouse.move(de.x + dx / 2, de.y + dy / 2, { steps: 4 });
  await pagina.mouse.move(de.x + dx, de.y + dy, { steps: 4 });
  await pagina.mouse.up();
}
const centro = async (testid) => { const r = await el(testid).boundingBox(); return { x: r.x + r.width / 2, y: r.y + r.height / 2, r }; };

before(async () => {
  if (pular) return;
  dir = mkdtempSync(path.join(tmpdir(), 'mazy-e2e-'));
  cpSync(exemploDir, dir, { recursive: true });
  editor = await startEditor({ dir, port: 5391 });
  navegador = await chromium.launch();
  pagina = await navegador.newPage({ viewport: { width: 1500, height: 950 } });
  pagina.on('console', (m) => { if (m.type() === 'error') errosDoConsole.push(m.text()); });
  pagina.on('pageerror', (e) => errosDoConsole.push(String(e)));
  await pagina.goto(editor.url);
  await el('stage').waitFor();
  await pagina.waitForFunction(() => document.querySelector('.mazy-stage')?.dataset.frame === '0');
});
after(async () => {
  await navegador?.close();
  await editor?.close();
  if (dir) rmSync(dir, { recursive: true, force: true });
});

test('abre o projeto e mostra palco, camadas, inspector e timeline', { skip: pular }, async () => {
  assert.equal(await el('frame-counter').textContent(), 'quadro 0 de 449 · 0,00 s de 15,00 s');
  assert.equal(await el('save-status').textContent(), 'gravado');
  assert.equal(await pagina.locator('[data-testid^="bar-"]').count(), 14, 'uma barra por camada');
  assert.equal(await pagina.locator('[data-testid^="scene-cena-"]').count(), 4);
  assert.ok(await el('list-layer-gancho-titulo').isVisible());
  assert.ok(await el('p-name').isVisible(), 'sem seleção, o inspector mostra o projeto');
});

test('arrastar o tempo desenha o quadro certo, com as duas cenas da transição', { skip: pular }, async () => {
  await noEditor(() => window.__editor.store.setFrame(210));
  await pagina.waitForFunction(() => document.querySelector('.mazy-stage').dataset.frame === '210');
  const cenas = await noEditor(() => [...document.querySelectorAll('.mazy-stage [data-scene-id]')].filter((e) => e.style.display !== 'none').map((e) => e.dataset.sceneId));
  assert.deepEqual(cenas, ['cena-produto', 'cena-oferta']);
  assert.match(await el('frame-counter').textContent(), /^quadro 210 de 449 · 7,00 s/);
  // clique na régua leva a agulha para lá
  const regua = await el('ruler').boundingBox();
  await pagina.mouse.click(regua.x + regua.width * 300 / 450, regua.y + 8);
  const quadro = await noEditor(() => window.__editor.store.getState().frame);
  assert.ok(Math.abs(quadro - 300) <= 2, `fui para o quadro ${quadro}`);
});

test('tocar avança o tempo e pausar para', { skip: pular }, async () => {
  await noEditor(() => window.__editor.store.setFrame(0));
  await el('play').click();
  await pagina.waitForFunction(() => window.__editor.store.getState().frame > 5);
  await el('play').click();
  const parou = await noEditor(() => window.__editor.store.getState().frame);
  await pagina.waitForTimeout(250);
  assert.equal(await noEditor(() => window.__editor.store.getState().frame), parou);
  await noEditor(() => window.__editor.store.setFrame(0));
});

test('clicar no palco seleciona a camada, e editar o texto no inspector grava no disco', { skip: pular }, async () => {
  const p = await pontoNoPalco(400, 1000);
  await pagina.mouse.click(p.x, p.y);
  assert.equal(await el('selection').getAttribute('data-layer'), 'gancho-titulo');
  assert.equal(await el('f-content').inputValue(), 'Óculos novos\nainda hoje.');
  await el('f-content').fill('Óculos prontos\nhoje.');
  await el('f-name').click(); // sair do campo envia
  await gravado();
  assert.equal(camadaNoDisco('gancho-titulo').text.content, 'Óculos prontos\nhoje.');
  assert.equal(openProject(dir).revision, 2);
  assert.deepEqual(validateProject(disco()).errors, []);
  assert.equal(await noEditor(() => document.querySelector('.mazy-stage [data-layer-id="gancho-titulo"]').textContent), 'Óculos prontos\nhoje.', 'o palco já mostra o texto novo');
});

test('desfazer e refazer mudam o projeto e o disco', { skip: pular }, async () => {
  await el('undo').click();
  await gravado();
  assert.equal(camadaNoDisco('gancho-titulo').text.content, 'Óculos novos\nainda hoje.');
  await el('redo').click();
  await gravado();
  assert.equal(camadaNoDisco('gancho-titulo').text.content, 'Óculos prontos\nhoje.');
  assert.ok(await el('redo').isDisabled());
});

test('valor inválido aparece como erro no campo e não é gravado', { skip: pular }, async () => {
  const revisao = openProject(dir).revision;
  await el('f-fontsize').fill('5');
  await el('f-name').click();
  assert.match(await el('f-fontsize-error').textContent(), /mínimo 8/);
  await pagina.waitForTimeout(800);
  assert.equal(openProject(dir).revision, revisao);
  assert.equal(camadaNoDisco('gancho-titulo').text.fontSize, 128);
  await el('f-fontsize').fill('abc');
  await el('f-name').click();
  assert.match(await el('f-fontsize-error').textContent(), /número/);
  await el('f-fontsize').fill('128');
  await el('f-name').click();
});

test('arrastar no palco move a camada pelo tanto certo, como uma alteração só', { skip: pular }, async () => {
  const antes = await camadaNoEditor('gancho-titulo');
  const passado = await noEditor(() => window.__editor.store.getState().past.length);
  const p = await pontoNoPalco(400, 1000);
  await arrastar(p, 40, 25);
  const depois = await camadaNoEditor('gancho-titulo');
  assert.ok(Math.abs(depois.box.x - (antes.box.x + 40 / p.escala)) <= 2, `x foi de ${antes.box.x} para ${depois.box.x}`);
  assert.ok(Math.abs(depois.box.y - (antes.box.y + 25 / p.escala)) <= 2, `y foi de ${antes.box.y} para ${depois.box.y}`);
  assert.deepEqual([depois.box.width, depois.box.height], [antes.box.width, antes.box.height]);
  assert.equal(await noEditor(() => window.__editor.store.getState().past.length), passado + 1);
  await gravado();
  assert.deepEqual(camadaNoDisco('gancho-titulo').box, depois.box);
  await el('undo').click();
  assert.deepEqual((await camadaNoEditor('gancho-titulo')).box, antes.box);
  await gravado();
});

test('as alças redimensionam e giram', { skip: pular }, async () => {
  const antes = await camadaNoEditor('gancho-titulo');
  const escala = (await pontoNoPalco(0, 0)).escala;
  const alca = await centro('handle-se');
  await arrastar(alca, -30, 20);
  const maior = await camadaNoEditor('gancho-titulo');
  assert.ok(Math.abs(maior.box.width - (antes.box.width - 30 / escala)) <= 3);
  assert.ok(Math.abs(maior.box.height - (antes.box.height + 20 / escala)) <= 3);
  assert.deepEqual([maior.box.x, maior.box.y], [antes.box.x, antes.box.y], 'o canto oposto fica parado');
  const giro = await centro('handle-rotate');
  await arrastar(giro, 60, 10);
  const girada = await camadaNoEditor('gancho-titulo');
  assert.ok(girada.transform.rotation > 5, `rotação ${girada.transform.rotation}`);
  assert.equal(await el('handle-se').count(), 0, 'girada, não oferece redimensionar');
  await el('undo').click(); await el('undo').click();
  assert.deepEqual((await camadaNoEditor('gancho-titulo')).box, antes.box);
  await gravado();
});

test('camada travada não sai do lugar', { skip: pular }, async () => {
  await el('f-locked').check();
  await gravado();
  const antes = await camadaNoEditor('gancho-titulo');
  assert.equal(antes.locked, true);
  await arrastar(await pontoNoPalco(400, 1000), 50, 50);
  assert.deepEqual((await camadaNoEditor('gancho-titulo')).box, antes.box);
  await el('list-layer-gancho-titulo').click();
  await el('f-locked').uncheck();
  await gravado();
});

test('timeline: arrastar a barra muda o início, a borda muda a duração, e o limite da cena segura', { skip: pular }, async () => {
  const ppf = (await el('ruler').boundingBox()).width / 450;
  const barra = await centro('bar-gancho-apoio');
  await arrastar(barra, -Math.round(6 * ppf), 0);
  const movida = await camadaNoEditor('gancho-apoio');
  assert.ok(Math.abs(movida.startFrame - 6) <= 1, `início ${movida.startFrame}`);
  await arrastar(await centro('bar-gancho-apoio'), -400, 0);
  assert.equal((await camadaNoEditor('gancho-apoio')).startFrame, 0, 'não passa do começo da cena');
  await arrastar(await centro('edge-gancho-apoio'), 400, 0);
  const esticada = await camadaNoEditor('gancho-apoio');
  assert.equal(esticada.startFrame + esticada.durationFrames, 96, 'não passa do fim da cena');
  const borda = await centro('edge-gancho-apoio');
  await arrastar(borda, -Math.round(20 * ppf), 0);
  assert.ok(Math.abs((await camadaNoEditor('gancho-apoio')).durationFrames - 76) <= 1);
  await gravado();
  assert.deepEqual(validateProject(disco()).errors, []);
});

test('timeline: entrada, duração da cena e transição', { skip: pular }, async () => {
  const ppf = (await el('ruler').boundingBox()).width / 450;
  const entrada = await el('in-gancho-apoio').boundingBox();
  await arrastar({ x: entrada.x + entrada.width - 1, y: entrada.y + entrada.height / 2 }, Math.round(10 * ppf), 0);
  const anim = (await camadaNoEditor('gancho-apoio')).animations;
  assert.ok(anim.every((a) => a.durationFrames >= 18 && a.durationFrames <= 22), JSON.stringify(anim.map((a) => a.durationFrames)));

  const total = () => noEditor(() => window.__editor.store.getState().project.composition.durationFrames);
  assert.equal(await total(), 450);
  await arrastar(await centro('scene-edge-cena-chamada'), Math.round(30 * ppf), 0);
  const novoTotal = await total();
  assert.ok(Math.abs(novoTotal - 480) <= 1, `total ${novoTotal}`);
  assert.match(await el('frame-counter').textContent(), new RegExp(`de ${novoTotal - 1} `));

  const t = await el('transition-cena-produto').boundingBox();
  await arrastar({ x: t.x + t.width / 2, y: t.y + t.height / 2 }, Math.round(8 * ppf), 0);
  const cena = await noEditor(() => window.__editor.store.getState().project.scenes[1].transitionIn.durationFrames);
  assert.ok(Math.abs(cena - 20) <= 1, `transição ${cena}`);
  await gravado();
  const p = disco();
  assert.deepEqual(validateProject(p).errors, []);
  assert.equal(p.composition.durationFrames, await total());
});

test('edição de fora (o Claude) aparece no editor aberto', { skip: pular }, async () => {
  const { project, revision } = openProject(dir);
  const r = applyCommands(project, [{ type: 'layer.update', layerId: 'oferta-numero', patch: { text: { content: '30% OFF' } } }]);
  saveProject(dir, r.project, { baseRevision: revision, source: 'claude' });
  await pagina.waitForFunction(() => window.__editor.store.getState().project.scenes[2].layers[0].text.content === '30% OFF', null, { timeout: 8000 });
  assert.match(await el('notice').textContent(), /mudou no disco/);
  assert.equal(await noEditor(() => window.__editor.store.getState().revision), revision + 1);
  assert.equal(await noEditor(() => window.__editor.store.getState().dirty), false);
});

test('edição simultânea: o editor pergunta, e nenhuma das duas se perde em silêncio', { skip: pular }, async () => {
  const { project, revision } = openProject(dir);
  await noEditor(() => window.__editor.store.dispatch([{ type: 'project.update', patch: { name: 'Nome do editor' } }]));
  const r = applyCommands(project, [{ type: 'project.update', patch: { description: 'Descrição do Claude' } }]);
  saveProject(dir, r.project, { baseRevision: revision, source: 'claude' });
  await el('conflict').waitFor({ timeout: 8000 });
  assert.equal(disco().project.description, 'Descrição do Claude', 'o disco ficou com a edição de fora');
  assert.equal(await noEditor(() => window.__editor.store.getState().project.project.name), 'Nome do editor', 'e o editor com a dele');
  await pagina.waitForTimeout(900);
  assert.equal(openProject(dir).revision, revision + 1, 'com conflito aberto, o editor não grava sozinho');

  await el('conflict-overwrite').click();
  await gravado();
  assert.equal(disco().project.name, 'Nome do editor');
  assert.equal(await el('conflict').count(), 0);

  // de novo, agora escolhendo ficar com a do disco
  const outro = openProject(dir);
  await noEditor(() => window.__editor.store.dispatch([{ type: 'project.update', patch: { name: 'Vai ser descartado' } }]));
  saveProject(dir, applyCommands(outro.project, [{ type: 'project.update', patch: { name: 'Nome do Claude' } }]).project, { baseRevision: outro.revision, source: 'claude' });
  await el('conflict').waitFor({ timeout: 8000 });
  await el('conflict-reload').click();
  await pagina.waitForFunction(() => window.__editor.store.getState().project.project.name === 'Nome do Claude');
  assert.equal(await el('conflict').count(), 0);
  assert.equal(disco().project.name, 'Nome do Claude');
});

test('Asset Library: trazer um arquivo e pôr na cena', { skip: pular }, async () => {
  await el('tab-assets').click();
  await el('upload-input').setInputFiles({ name: 'Vitrine Nova.jpg', mimeType: 'image/jpeg', buffer: readFileSync(path.join(exemploDir, 'assets', 'foto-armacao.jpg')) });
  await el('asset-vitrine-nova').waitFor();
  assert.ok(existsSync(path.join(dir, 'assets', 'vitrine-nova.jpg')));
  await gravado();
  const asset = disco().assets.find((a) => a.id === 'vitrine-nova');
  assert.deepEqual([asset.type, asset.width, asset.height], ['image', 800, 800]);
  assert.match(asset.sha256, /^[0-9a-f]{64}$/);

  await noEditor(() => { window.__editor.store.setFrame(0); window.__editor.store.select({ sceneId: 'cena-gancho' }); });
  await el('use-vitrine-nova').click();
  const selecao = await noEditor(() => window.__editor.store.getState().selection);
  assert.deepEqual(selecao, { sceneId: 'cena-gancho', layerId: 'imagem' });
  await pagina.waitForFunction(() => document.querySelector('.mazy-stage [data-layer-id="imagem"] img')?.naturalWidth === 800, null, { timeout: 8000 });
  await gravado();
  assert.equal(camadaNoDisco('imagem').image.assetId, 'vitrine-nova');
  assert.deepEqual(validateProject(disco()).errors, []);
  await pagina.locator('.tabs button').first().click();
});

test('camadas: criar texto, apagar com a tecla e criar cena', { skip: pular }, async () => {
  await el('add-text').click();
  const sel = await noEditor(() => window.__editor.store.getState().selection);
  assert.equal(sel.layerId, 'texto');
  await pagina.keyboard.press('Delete');
  assert.equal(await camadaNoEditor('texto'), undefined);
  const cenas = await noEditor(() => window.__editor.store.getState().project.scenes.length);
  await el('add-scene').click();
  assert.equal(await noEditor(() => window.__editor.store.getState().project.scenes.length), cenas + 1);
  await pagina.keyboard.press('Control+z');
  assert.equal(await noEditor(() => window.__editor.store.getState().project.scenes.length), cenas);
  await gravado();
});

test('histórico: guardar uma versão e voltar para ela', { skip: pular }, async () => {
  const nome = disco().project.name;
  await el('open-history').click();
  await el('version-name').fill('antes do teste');
  await el('make-version').click();
  await el('history-version').first().waitFor();
  await el('modal-close').click();
  await noEditor(() => window.__editor.store.dispatch([{ type: 'project.update', patch: { name: 'Nome provisório' } }]));
  await gravado();
  assert.equal(disco().project.name, 'Nome provisório');
  await el('open-history').click();
  await el('history-version').first().locator('[data-testid="rollback"]').click();
  await pagina.waitForFunction((n) => window.__editor.store.getState().project.project.name === n, nome, { timeout: 8000 });
  assert.equal(disco().project.name, nome);
  await el('modal-close').click();
});

test('crítica por regras abre com nota', { skip: pular }, async () => {
  await el('open-critique').click();
  await el('critique-score').waitFor({ timeout: 30000 });
  assert.match(await el('critique-score').textContent(), /^\d+\/100$/);
  await el('modal-close').click();
});

test('o editor não deixou erro no console', { skip: pular }, () => {
  assert.deepEqual(errosDoConsole.filter((e) => !/409|422/.test(e)), []);
});

test('exportar pelo editor gera um MP4 com os quadros e as medidas do projeto', { skip: pular || (ffmpegAdapter.available().ok ? false : 'pulado: falta o FFmpeg') }, async (t) => {
  // projeto curto (1 s), para a exportação caber no teste
  const curto = mkdtempSync(path.join(tmpdir(), 'mazy-e2e-export-'));
  const p = createProject({ id: 'curto', name: 'Curto', now: '2026-11-11T12:00:00Z' });
  p.scenes = [{ id: 'unica', name: 'Única', durationFrames: 30, background: '#102030', beat: { role: 'cta' },
    layers: [{ id: 'bloco', name: 'Bloco', type: 'shape', startFrame: 0, durationFrames: 30, box: { x: 100, y: 300, width: 400, height: 400 }, shape: { kind: 'rect', fill: '#FF0000' },
      animations: [{ id: 'entra', preset: 'fade', role: 'in', durationFrames: 10 }] }] }];
  p.composition.durationFrames = 30;
  saveProject(curto, p, { source: 'cli' });
  const outro = await startEditor({ dir: curto, port: 5392 });
  const aba = await navegador.newPage({ viewport: { width: 1300, height: 900 } });
  t.after(async () => { await aba.close(); await outro.close(); rmSync(curto, { recursive: true, force: true }); });
  await aba.goto(outro.url);
  await aba.locator('[data-testid="export"]').click();
  const link = aba.locator('[data-testid="export-link"]');
  await link.waitFor({ timeout: 60000 });
  assert.match(await aba.locator('[data-testid="export-status"]').textContent(), /MP4 pronto: 30 quadros, 1,00 s/);
  const arquivo = path.join(curto, 'renders', 'curto.mp4');
  assert.ok(existsSync(arquivo));
  const medido = probeVideo(arquivo);
  assert.deepEqual([medido.width, medido.height, medido.fps, medido.frames, medido.codec], [1080, 1920, 30, 30, 'h264']);
  assert.equal((await fetch(new URL(await link.getAttribute('href'), outro.url))).status, 200, 'o link do vídeo abre');
  assert.ok(openProject(curto).dir && readFileSync(path.join(curto, '.history', 'log.jsonl'), 'utf8').includes('antes de exportar'));
});
