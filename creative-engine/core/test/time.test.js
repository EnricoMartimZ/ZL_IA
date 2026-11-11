// Etapas 2.1 a 2.5: timeline, curvas, keyframes, animações prontas e transições.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import {
  getTimeline, scenesAtFrame, resolveEasing, cubicBezier, EASING_NAMES, trackValue,
  animationModifiers, animationProgress, transitionContainers, transitionProgress, listPresets, listTransitions, schema,
} from '../src/index.js';

const motor = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const exemplo = JSON.parse(readFileSync(path.join(motor, 'fixtures/projects/motion-ad-4-scenes/project.mazy.json'), 'utf8'));
const perto = (a, b, tolerancia = 1e-4) => assert.ok(Math.abs(a - b) <= tolerancia, `${a} deveria ser ~${b}`);

// ---------- timeline ----------
test('timeline do exemplo: inícios 0, 84, 204, 324 e total 450', () => {
  const t = getTimeline(exemplo);
  assert.deepEqual(t.scenes.map((s) => s.startFrame), [0, 84, 204, 324]);
  assert.deepEqual(t.scenes.map((s) => s.endFrame), [96, 216, 336, 450]);
  assert.deepEqual(t.scenes.map((s) => s.overlapIn), [0, 12, 12, 12]);
  assert.equal(t.totalFrames, 450);
});

test('quadros de fronteira caem nas cenas certas', () => {
  const t = getTimeline(exemplo);
  const ids = (f) => scenesAtFrame(t, f).map((s) => s.sceneId);
  assert.deepEqual(ids(0), ['cena-gancho']);
  assert.deepEqual(ids(83), ['cena-gancho']);
  assert.deepEqual(ids(84), ['cena-gancho', 'cena-produto']);
  assert.deepEqual(ids(95), ['cena-gancho', 'cena-produto']);
  assert.deepEqual(ids(96), ['cena-produto']);
  assert.deepEqual(ids(449), ['cena-chamada']);
  assert.deepEqual(ids(450), []);
});

test('timeline de uma cena só e de corte seco', () => {
  assert.deepEqual(getTimeline({ scenes: [{ id: 'a', durationFrames: 30 }] }), { totalFrames: 30, scenes: [{ sceneId: 'a', index: 0, startFrame: 0, endFrame: 30, overlapIn: 0 }] });
  const corte = getTimeline({ scenes: [{ id: 'a', durationFrames: 30 }, { id: 'b', durationFrames: 20 }] });
  assert.equal(corte.scenes[1].startFrame, 30);
  assert.equal(corte.totalFrames, 50);
  // transição na primeira cena não conta (e o validador recusa)
  assert.equal(getTimeline({ scenes: [{ id: 'a', durationFrames: 30, transitionIn: { durationFrames: 10 } }] }).totalFrames, 30);
});

// ---------- curvas ----------
test('a lista de curvas do Core é a mesma do schema', () => {
  assert.deepEqual(EASING_NAMES, schema.$defs.easing.oneOf[0].enum);
});

test('toda curva vai de 0 a 1 e aguenta entrada fora da faixa', () => {
  for (const nome of EASING_NAMES) {
    const f = resolveEasing(nome);
    assert.equal(f(0), 0, nome); assert.equal(f(1), 1, nome);
    assert.equal(f(-3), 0, nome); assert.equal(f(7), 1, nome);
    assert.ok(Number.isFinite(f(0.37)), nome);
  }
});

test('linear é a reta, hold segura até o fim, e o padrão vale quando o campo falta', () => {
  const linear = resolveEasing('linear'), hold = resolveEasing('hold');
  for (const t of [0.1, 0.25, 0.5, 0.9]) { assert.equal(linear(t), t); assert.equal(hold(t), 0); }
  assert.equal(hold(1), 1);
  assert.equal(resolveEasing(undefined)(0.3), 0.3);
  perto(resolveEasing(undefined, 'ease-in-out')(0.5), 0.5);
  assert.throws(() => resolveEasing('bounce'), /curva desconhecida/);
});

test('Bézier confere com valores conhecidos', () => {
  perto(cubicBezier(0, 0, 1, 1)(0.3), 0.3);
  perto(cubicBezier(0.25, 0.1, 0.25, 1)(0.5), 0.8024, 1e-3); // a curva "ease" do CSS
  perto(resolveEasing('ease-in-out')(0.5), 0.5);
  perto(resolveEasing({ type: 'cubicBezier', x1: 0.42, y1: 0, x2: 0.58, y2: 1 })(0.25), resolveEasing('ease-in-out')(0.25));
  assert.ok(resolveEasing('ease-out-cubic')(0.5) > 0.5, 'ease-out anda mais no começo');
  assert.ok(resolveEasing('ease-in-cubic')(0.5) < 0.5, 'ease-in anda mais no fim');
  assert.ok(Math.max(...[0.5, 0.6, 0.7, 0.8].map(resolveEasing('ease-out-back'))) > 1, 'ease-out-back passa do alvo');
});

test('curvas sem ultrapassagem nunca andam para trás (varredura com semente)', () => {
  let semente = 20261111;
  const sortear = () => { semente = (semente * 1664525 + 1013904223) % 4294967296; return semente / 4294967296; };
  for (const nome of EASING_NAMES.filter((n) => n !== 'ease-out-back' && n !== 'hold')) {
    const f = resolveEasing(nome);
    for (let i = 0; i < 300; i++) {
      const a = sortear(), b = sortear();
      const [menor, maior] = a < b ? [a, b] : [b, a];
      assert.ok(f(menor) <= f(maior) + 1e-6, `${nome}: f(${menor}) > f(${maior})`);
      assert.ok(f(a) >= -1e-6 && f(a) <= 1 + 1e-6, `${nome}: f(${a}) fora de 0..1`);
    }
  }
});

// ---------- keyframes ----------
test('trilha: antes do primeiro ponto, depois do último, entre dois e com um ponto só', () => {
  const trilha = [{ frame: 10, value: 100 }, { frame: 20, value: 200, easing: 'hold' }, { frame: 30, value: 50 }];
  assert.equal(trackValue(trilha, 0), 100);
  assert.equal(trackValue(trilha, 10), 100);
  assert.equal(trackValue(trilha, 15), 150);
  assert.equal(trackValue(trilha, 20), 200);
  assert.equal(trackValue(trilha, 29), 200, 'hold segura até o próximo ponto');
  assert.equal(trackValue(trilha, 30), 50);
  assert.equal(trackValue(trilha, 99), 50);
  assert.equal(trackValue([{ frame: 5, value: 7 }], 0), 7);
  assert.equal(trackValue([{ frame: 5, value: 7 }], 50), 7);
});

test('a curva de um trecho é a do ponto da esquerda', () => {
  const trilha = [{ frame: 0, value: 0, easing: 'ease-in-cubic' }, { frame: 10, value: 100, easing: 'ease-out-cubic' }, { frame: 20, value: 0 }];
  assert.ok(trackValue(trilha, 5) < 50, 'primeiro trecho usa ease-in');
  assert.ok(trackValue(trilha, 15) < 50, 'segundo trecho usa ease-out (cai rápido)');
});

// ---------- animações prontas ----------
test('progresso: entrada começa em 0 no primeiro quadro; saída chega a 1 no último', () => {
  const entra = { role: 'in', durationFrames: 10 }, sai = { role: 'out', durationFrames: 10 };
  assert.equal(animationProgress(entra, 60, 0), 0);
  assert.equal(animationProgress(entra, 60, 5), 0.5);
  assert.equal(animationProgress(entra, 60, 10), 1);
  assert.equal(animationProgress(entra, 60, 40), 1);
  assert.equal(animationProgress(sai, 60, 49), 0);
  assert.equal(animationProgress(sai, 60, 50), 0.1);
  assert.equal(animationProgress(sai, 60, 59), 1);
  assert.equal(animationProgress({ ...entra, delayFrames: 6 }, 60, 6), 0);
  assert.equal(animationProgress({ ...entra, delayFrames: 6 }, 60, 3), 0, 'durante o atraso fica no estado de partida');
  assert.equal(animationProgress({ ...sai, delayFrames: 5 }, 60, 54), 1, 'folga antes do fim');
});

test('fade, slide e scale em cada ponto da entrada e da saída', () => {
  const linear = { easing: 'linear' };
  const fadeIn = [{ preset: 'fade', role: 'in', durationFrames: 10, ...linear }];
  assert.equal(animationModifiers(fadeIn, 60, 0).opacity, 0);
  perto(animationModifiers(fadeIn, 60, 5).opacity, 0.5);
  assert.equal(animationModifiers(fadeIn, 60, 10).opacity, 1);
  assert.equal(animationModifiers(fadeIn, 60, 59).opacity, 1);

  const fadeOut = [{ preset: 'fade', role: 'out', durationFrames: 10, ...linear }];
  assert.equal(animationModifiers(fadeOut, 60, 30).opacity, 1);
  perto(animationModifiers(fadeOut, 60, 54).opacity, 0.5);
  assert.equal(animationModifiers(fadeOut, 60, 59).opacity, 0);

  // slide up: a camada sobe. Na entrada vem de baixo (dy positivo); na saída vai para cima (dy negativo)
  const sobe = (role) => [{ preset: 'slide', role, durationFrames: 10, ...linear, params: { direction: 'up', distance: 40 } }];
  assert.deepEqual(animationModifiers(sobe('in'), 60, 0), { dx: 0, dy: 40, scale: 1, opacity: 1 });
  perto(animationModifiers(sobe('in'), 60, 5).dy, 20);
  assert.equal(animationModifiers(sobe('in'), 60, 10).dy, 0);
  assert.equal(animationModifiers(sobe('out'), 60, 59).dy, -40);
  const esquerda = [{ preset: 'slide', role: 'in', durationFrames: 10, ...linear, params: { direction: 'left' } }];
  assert.equal(animationModifiers(esquerda, 60, 0).dx, 80, 'distância padrão de 80 px, vindo da direita');

  const cresce = [{ preset: 'scale', role: 'in', durationFrames: 10, ...linear, params: { scale: 0.6 } }];
  perto(animationModifiers(cresce, 60, 0).scale, 0.6);
  perto(animationModifiers(cresce, 60, 5).scale, 0.8);
  assert.equal(animationModifiers(cresce, 60, 10).scale, 1);
  const encolhe = [{ preset: 'scale', role: 'out', durationFrames: 10, ...linear }];
  perto(animationModifiers(encolhe, 60, 59).scale, 0.8);
});

test('duas entradas na mesma camada se combinam; sem animação nada muda', () => {
  const duas = [
    { preset: 'fade', role: 'in', durationFrames: 10, easing: 'linear' },
    { preset: 'slide', role: 'in', durationFrames: 20, easing: 'linear', params: { direction: 'up', distance: 100 } },
  ];
  const m = animationModifiers(duas, 60, 5);
  perto(m.opacity, 0.5); perto(m.dy, 75);
  assert.deepEqual(animationModifiers(undefined, 60, 5), { dx: 0, dy: 0, scale: 1, opacity: 1 });
  assert.deepEqual(animationModifiers([], 60, 5), { dx: 0, dy: 0, scale: 1, opacity: 1 });
});

test('o catálogo lista os presets e as transições do schema', () => {
  assert.deepEqual(listPresets().map((p) => p.id), schema.$defs.animation.properties.preset.enum);
  assert.deepEqual(listTransitions().map((t) => t.id), schema.$defs.transition.properties.type.enum);
  assert.ok(listPresets().every((p) => p.description.length > 10));
});

// ---------- transições ----------
test('o progresso da transição nunca é 0 nem 1 dentro da sobreposição', () => {
  perto(transitionProgress(12, 0), 1 / 13);
  perto(transitionProgress(12, 11), 12 / 13);
  perto(transitionProgress(1, 0), 0.5);
});

test('fade: a cena nova ganha opacidade; a antiga fica parada', () => {
  const t = { type: 'fade', durationFrames: 9, easing: 'linear' };
  const meio = transitionContainers(t, 4, 1080, 1920);
  perto(meio.incoming.opacity, 0.5);
  assert.deepEqual(meio.outgoing, { x: 0, y: 0, opacity: 1, clip: null });
});

test('slide: a cena nova empurra a antiga, sempre coladas', () => {
  const t = { type: 'slide', durationFrames: 9, direction: 'left', easing: 'linear' };
  const meio = transitionContainers(t, 4, 1080, 1920);
  perto(meio.incoming.x, 540); perto(meio.outgoing.x, -540);
  for (const quadro of [0, 3, 8]) {
    const c = transitionContainers({ ...t, easing: 'ease-out-expo' }, quadro, 1080, 1920);
    perto(c.incoming.x - c.outgoing.x, 1080);
  }
  const sobe = transitionContainers({ ...t, direction: 'up' }, 4, 1080, 1920);
  perto(sobe.incoming.y, 960); perto(sobe.outgoing.y, -960);
});

test('wipe: a cortina corta o lado que ainda não alcançou', () => {
  const t = { type: 'wipe', durationFrames: 9, easing: 'linear' };
  assert.deepEqual(transitionContainers({ ...t, direction: 'left' }, 4, 1080, 1920).incoming.clip, { top: 0, right: 0, bottom: 0, left: 540 });
  assert.deepEqual(transitionContainers({ ...t, direction: 'right' }, 4, 1080, 1920).incoming.clip, { top: 0, right: 540, bottom: 0, left: 0 });
  assert.deepEqual(transitionContainers({ ...t, direction: 'down' }, 4, 1080, 1920).incoming.clip, { top: 0, right: 0, bottom: 960, left: 0 });
  assert.equal(transitionContainers({ ...t, direction: 'up' }, 4, 1080, 1920).incoming.clip.top, 960);
});
