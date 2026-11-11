// Etapa 2.6: evaluateFrame, determinismo e fronteiras do Core.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync, readdirSync, statSync, writeFileSync, mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { evaluateFrame, resolveColor, resolveFont, resolveEasing } from '../src/index.js';
import { applyPatch } from '../../fixtures/patch.js';

const motor = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const exemplo = JSON.parse(readFileSync(path.join(motor, 'fixtures/projects/motion-ad-4-scenes/project.mazy.json'), 'utf8'));
const perto = (a, b, tolerancia = 1e-3) => assert.ok(Math.abs(a - b) <= tolerancia, `${a} deveria ser ~${b}`);
const camada = (estado, id) => estado.scenes.flatMap((s) => s.layers).find((l) => l.layerId === id);
const congelar = (v) => { if (v && typeof v === 'object') { Object.values(v).forEach(congelar); Object.freeze(v); } return v; };

test('quadro 0: o gancho já está na tela, com cor da marca resolvida', () => {
  const e = evaluateFrame(exemplo, 0);
  assert.equal(e.background, '#14181F');
  assert.equal(e.timeSeconds, 0);
  assert.deepEqual(e.scenes.map((s) => s.sceneId), ['cena-gancho']);
  assert.deepEqual(e.scenes[0].layers.map((l) => l.layerId), ['gancho-foto', 'gancho-veu', 'gancho-titulo']);
  assert.equal(e.scenes[0].background, null);
  assert.deepEqual(e.scenes[0].container, { x: 0, y: 0, opacity: 1, clip: null });
  assert.equal(camada(e, 'gancho-foto').scale, 1);
  assert.equal(camada(e, 'gancho-foto').content.src, 'assets/foto-rosto.jpg');
  assert.equal(camada(e, 'gancho-veu').opacity, 0.72);
  assert.equal(camada(e, 'gancho-veu').content.fill, '#14181F');
  const titulo = camada(e, 'gancho-titulo');
  assert.equal(titulo.opacity, 1);
  assert.equal(titulo.content.fontFamily, 'DejaVu Sans Bold');
  assert.equal(titulo.content.fontAssetId, 'fonte-titulo');
  assert.equal(titulo.content.lineHeight, 1);
  assert.equal(titulo.content.verticalAlign, 'top');
});

test('entrada: a linha de apoio nasce invisível e abaixo, e chega no lugar', () => {
  assert.equal(camada(evaluateFrame(exemplo, 11), 'gancho-apoio'), undefined, 'ainda não começou');
  const nasce = camada(evaluateFrame(exemplo, 12), 'gancho-apoio');
  assert.equal(nasce.opacity, 0);
  assert.equal(nasce.y, 1250);
  const chegou = camada(evaluateFrame(exemplo, 22), 'gancho-apoio');
  assert.equal(chegou.opacity, 1);
  assert.equal(chegou.y, 1210);
  assert.equal(chegou.content.fontWeight, 400);
  assert.equal(chegou.content.align, 'left', 'padrão preenchido');
});

test('keyframes e saída: a foto cresce até 1,06 e o título some no último quadro da cena', () => {
  const fim = evaluateFrame(exemplo, 95);
  assert.equal(camada(fim, 'gancho-foto').scale, 1.06);
  assert.equal(camada(fim, 'gancho-titulo').opacity, 0);
  perto(camada(evaluateFrame(exemplo, 48), 'gancho-foto').scale, 1 + 0.06 * 48 / 95);
  assert.equal(camada(evaluateFrame(exemplo, 87), 'gancho-titulo').opacity, 1, 'a saída ainda não começou');
});

test('keyframe e animação pronta na mesma propriedade se combinam', () => {
  // oferta-numero: entrada scale (0.6 → 1, 14 quadros) e trilha de scale com pulso em 40–70
  const inicio = 204 + 6; // início da cena + startFrame da camada
  perto(camada(evaluateFrame(exemplo, inicio), 'oferta-numero').scale, 0.6);
  assert.equal(camada(evaluateFrame(exemplo, inicio + 30), 'oferta-numero').scale, 1);
  assert.equal(camada(evaluateFrame(exemplo, inicio + 55), 'oferta-numero').scale, 1.05);
  assert.equal(camada(evaluateFrame(exemplo, inicio + 100), 'oferta-numero').scale, 1);
});

test('transição fade: duas cenas vivas, a nova por cima ganhando opacidade', () => {
  const e = evaluateFrame(exemplo, 90);
  assert.deepEqual(e.scenes.map((s) => s.sceneId), ['cena-gancho', 'cena-produto']);
  assert.deepEqual(e.scenes.map((s) => s.localFrame), [90, 6]);
  assert.deepEqual(e.scenes[0].container, { x: 0, y: 0, opacity: 1, clip: null });
  perto(e.scenes[1].container.opacity, resolveEasing('ease-in-out')(7 / 13));
  assert.equal(e.scenes[1].background, '#F6F4EF');
  assert.equal(evaluateFrame(exemplo, 96).scenes.length, 1, 'acabou a sobreposição');
});

test('transição slide: a oferta empurra o produto para a esquerda', () => {
  const e = evaluateFrame(exemplo, 210);
  assert.deepEqual(e.scenes.map((s) => s.sceneId), ['cena-produto', 'cena-oferta']);
  const p = resolveEasing('ease-out-expo')(7 / 13);
  perto(e.scenes[0].container.x, -1080 * p);
  perto(e.scenes[1].container.x, 1080 * (1 - p));
  assert.equal(e.scenes[1].background, '#E4572E');
});

test('último quadro: só a chamada, tudo no lugar', () => {
  const e = evaluateFrame(exemplo, 449);
  assert.deepEqual(e.scenes.map((s) => s.sceneId), ['cena-chamada']);
  assert.deepEqual(e.scenes[0].layers.map((l) => l.layerId), ['chamada-logo', 'chamada-botao', 'chamada-texto', 'chamada-prazo']);
  assert.ok(e.scenes[0].layers.every((l) => l.opacity === 1 && l.scale === 1));
  assert.equal(camada(e, 'chamada-logo').content.src, 'assets/logo-claro.svg');
  perto(e.timeSeconds, 449 / 30);
});

test('camada invisível some; quadro fora do vídeo é erro', () => {
  const sem = applyPatch(exemplo, [{ op: 'set', path: '/scenes/0/layers/1/visible', value: false }]);
  assert.equal(camada(evaluateFrame(sem, 0), 'gancho-veu'), undefined);
  for (const quadro of [-1, 450, 1.5, NaN, '3']) assert.throws(() => evaluateFrame(exemplo, quadro), RangeError);
});

test('cores e fontes da marca', () => {
  assert.equal(resolveColor(exemplo.brand, 'brand.accent'), '#E4572E');
  assert.equal(resolveColor(exemplo.brand, 'brand.secondary.0'), '#2E4057');
  assert.equal(resolveColor(exemplo.brand, '#FFFFFF80'), '#FFFFFF80');
  assert.equal(resolveColor(exemplo.brand, undefined), undefined);
  assert.deepEqual(resolveFont(exemplo.brand, 'brand.body'), { family: 'DejaVu Sans', assetId: 'fonte-corpo' });
  assert.deepEqual(resolveFont(exemplo.brand, 'DejaVu Sans Bold'), { family: 'DejaVu Sans Bold', assetId: 'fonte-titulo' });
});

test('determinismo: o mesmo quadro dá o mesmo estado, e o projeto não é alterado', () => {
  const congelado = congelar(structuredClone(exemplo));
  for (const quadro of [0, 90, 210, 449]) {
    assert.deepEqual(evaluateFrame(congelado, quadro), evaluateFrame(congelado, quadro));
  }
  assert.deepEqual(congelado, exemplo);
});

test('os estados de referência do exemplo não mudaram', () => {
  const QUADROS = [0, 6, 12, 22, 83, 84, 90, 95, 96, 204, 210, 330, 449];
  const arquivo = path.join(motor, 'fixtures', 'expected', 'motion-ad-4-scenes.frames.json');
  const atual = Object.fromEntries(QUADROS.map((q) => [q, evaluateFrame(exemplo, q)]));
  if (process.env.UPDATE_REFERENCE === '1') { // atualizar a referência é ato consciente: olhar o diff antes de aceitar
    mkdirSync(path.dirname(arquivo), { recursive: true });
    writeFileSync(arquivo, `${JSON.stringify(atual, null, 1)}\n`);
  }
  assert.ok(existsSync(arquivo), 'falta a referência: rode uma vez com UPDATE_REFERENCE=1');
  assert.deepEqual(JSON.parse(JSON.stringify(atual)), JSON.parse(readFileSync(arquivo, 'utf8')));
});

test('fronteiras do Core: nada de Node, DOM, relógio ou sorteio', () => {
  const PROIBIDO = [
    [/from\s+['"]node:/, 'módulo do Node'], [/\brequire\s*\(/, 'require'], [/\bprocess\./, 'process'],
    [/\bDate\.now\b|\bnew Date\b|\bperformance\.now\b/, 'relógio'], [/\bMath\.random\b/, 'sorteio'],
    [/\b(document|window|navigator|localStorage)\./, 'DOM'], [/\bsetTimeout\b|\bsetInterval\b|\brequestAnimationFrame\b/, 'temporizador'],
    [/from\s+['"]\.\.\/\.\.\/\.\.\/(renderer|editor|cli|storage|intelligence)/, 'outra parte do motor'],
  ];
  const arquivos = [];
  const andar = (dir) => readdirSync(dir).forEach((n) => { const p = path.join(dir, n); statSync(p).isDirectory() ? andar(p) : n.endsWith('.js') && arquivos.push(p); });
  andar(path.join(motor, 'core', 'src'));
  assert.ok(arquivos.length >= 8);
  const achados = [];
  for (const arquivo of arquivos) {
    readFileSync(arquivo, 'utf8').split('\n').forEach((linha, i) => {
      const codigo = linha.replace(/\/\/.*$/, '');
      for (const [regra, nome] of PROIBIDO) if (regra.test(codigo)) achados.push(`${path.relative(motor, arquivo)}:${i + 1} usa ${nome}`);
    });
  }
  assert.deepEqual(achados, []);
});
