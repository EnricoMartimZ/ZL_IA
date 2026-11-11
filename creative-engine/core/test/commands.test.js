// Etapa 4.1: comandos de edição, modelos de projeto e versão do formato.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { applyCommands, mergePatch, COMMAND_TYPES, createProject, migrateProject, listTemplates, validateProject, getTimeline } from '../src/index.js';

const motor = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const exemplo = JSON.parse(readFileSync(path.join(motor, 'fixtures/projects/motion-ad-4-scenes/project.mazy.json'), 'utf8'));
const congelar = (v) => { if (v && typeof v === 'object') { Object.values(v).forEach(congelar); Object.freeze(v); } return v; };
const base = congelar(structuredClone(exemplo));
const aplicar = (...comandos) => applyCommands(base, comandos);
const certo = (...comandos) => { const r = aplicar(...comandos); assert.ok(r.ok, JSON.stringify(r.error, null, 1)); return r.project; };
const errado = (codigo, ...comandos) => { const r = aplicar(...comandos); assert.equal(r.ok, false); assert.equal(r.error.code, codigo, JSON.stringify(r.error)); return r.error; };
const camada = (p, id) => p.scenes.flatMap((s) => s.layers).find((l) => l.id === id);
const novaCamada = { id: 'selo', name: 'Selo', type: 'shape', startFrame: 0, durationFrames: 30, box: { x: 100, y: 300, width: 200, height: 200 }, shape: { kind: 'ellipse', fill: 'brand.accent' } };

test('mergePatch: mescla em profundidade, lista substitui, null apaga', () => {
  const alvo = { a: 1, b: { c: 2, d: 3 }, e: [1, 2] };
  assert.deepEqual(mergePatch(alvo, { b: { c: 9, d: null }, e: [7], f: 'x' }), { a: 1, b: { c: 9 }, e: [7], f: 'x' });
});

test('lista vazia não muda nada e o projeto de entrada nunca é alterado', () => {
  const r = aplicar();
  assert.ok(r.ok);
  assert.deepEqual(r.project, exemplo);
  assert.notEqual(r.project, base);
  certo({ type: 'layer.update', layerId: 'oferta-numero', patch: { text: { content: '30% OFF' } } });
  assert.deepEqual(base, exemplo, 'a entrada congelada continua igual');
});

test('layer.update: troca texto, mexe na caixa e apaga campo com null', () => {
  const p = certo(
    { type: 'layer.update', layerId: 'oferta-numero', patch: { text: { content: '30% OFF' }, box: { y: 500 } } },
    { type: 'layer.update', layerId: 'gancho-veu', patch: { opacity: null } },
  );
  assert.equal(camada(p, 'oferta-numero').text.content, '30% OFF');
  assert.equal(camada(p, 'oferta-numero').text.fontSize, 180, 'o resto do bloco fica');
  assert.deepEqual(camada(p, 'oferta-numero').box, { x: 64, y: 500, width: 952, height: 300 });
  assert.equal('opacity' in camada(p, 'gancho-veu'), false);
  errado('COMMAND_FIELD_NOT_PATCHABLE', { type: 'layer.update', layerId: 'gancho-veu', patch: { type: 'text' } });
  errado('LAYER_NOT_FOUND', { type: 'layer.update', layerId: 'nao-existe', patch: {} });
});

test('layer.add, remove, reorder e move', () => {
  let p = certo({ type: 'layer.add', sceneId: 'cena-oferta', layer: novaCamada, index: 0 });
  assert.equal(p.scenes[2].layers[0].id, 'selo');
  p = certo({ type: 'layer.add', sceneId: 'cena-oferta', layer: novaCamada });
  assert.equal(p.scenes[2].layers.at(-1).id, 'selo', 'sem index entra por cima');
  p = certo({ type: 'layer.remove', layerId: 'gancho-apoio' });
  assert.equal(camada(p, 'gancho-apoio'), undefined);
  p = certo({ type: 'layer.reorder', layerId: 'gancho-titulo', index: 0 });
  assert.deepEqual(p.scenes[0].layers.map((l) => l.id), ['gancho-titulo', 'gancho-foto', 'gancho-veu', 'gancho-apoio']);
  p = certo({ type: 'layer.move', layerId: 'chamada-prazo', sceneId: 'cena-oferta' });
  assert.equal(p.scenes[2].layers.at(-1).id, 'chamada-prazo');
  assert.equal(p.scenes[3].layers.length, 3);
  errado('RESULT_INVALID', { type: 'layer.add', sceneId: 'cena-oferta', layer: { ...novaCamada, id: 'oferta-numero' } });
  errado('SCENE_NOT_FOUND', { type: 'layer.add', sceneId: 'cena-x', layer: novaCamada });
});

test('cenas: a duração total acompanha sozinha', () => {
  let p = certo({ type: 'scene.update', sceneId: 'cena-chamada', patch: { durationFrames: 156 } });
  assert.equal(p.composition.durationFrames, 480);
  p = certo({ type: 'scene.setTransition', sceneId: 'cena-produto', transition: null });
  assert.equal(p.composition.durationFrames, 462, 'sem a sobreposição de 12');
  p = certo({ type: 'scene.setTransition', sceneId: 'cena-produto', transition: { type: 'wipe', durationFrames: 20, direction: 'up' } });
  assert.equal(p.composition.durationFrames, 442);
  p = certo({ type: 'scene.remove', sceneId: 'cena-produto' });
  assert.equal(p.scenes.length, 3);
  assert.equal(p.composition.durationFrames, getTimeline(p).totalFrames);
  p = certo({ type: 'scene.add', scene: { id: 'cena-prova', name: 'Prova', durationFrames: 60, background: 'brand.background', layers: [] }, index: 2 });
  assert.equal(p.scenes[2].id, 'cena-prova');
  assert.equal(p.composition.durationFrames, 510);
  errado('COMMAND_FIELD_NOT_PATCHABLE', { type: 'composition.update', patch: { durationFrames: 300 } });
  errado('COMMAND_FIELD_NOT_PATCHABLE', { type: 'scene.update', sceneId: 'cena-oferta', patch: { layers: [] } });
});

test('scene.reorder: quem vira a primeira cena perde a transição', () => {
  const r = aplicar({ type: 'scene.reorder', sceneId: 'cena-oferta', index: 0 });
  assert.ok(r.ok, JSON.stringify(r.error));
  assert.deepEqual(r.project.scenes.map((s) => s.id), ['cena-oferta', 'cena-gancho', 'cena-produto', 'cena-chamada']);
  assert.equal(r.project.scenes[0].transitionIn, undefined);
  assert.ok(r.changes.some((c) => c.type === 'auto' && c.target.includes('transição da primeira cena')));
  assert.equal(r.project.composition.durationFrames, getTimeline(r.project).totalFrames);
  errado('LAST_SCENE', ...['cena-gancho', 'cena-produto', 'cena-oferta', 'cena-chamada'].map((sceneId) => ({ type: 'scene.remove', sceneId })));
});

test('animações e keyframes', () => {
  let p = certo({ type: 'animation.add', layerId: 'gancho-veu', animation: { id: 'entra', preset: 'fade', role: 'in', durationFrames: 6 } });
  assert.equal(camada(p, 'gancho-veu').animations.length, 1);
  p = certo({ type: 'animation.update', layerId: 'gancho-apoio', animationId: 'entra-sobe', patch: { durationFrames: 16, params: { distance: 90 } } });
  assert.deepEqual(camada(p, 'gancho-apoio').animations[1].params, { direction: 'up', distance: 90 });
  p = certo({ type: 'animation.remove', layerId: 'gancho-titulo', animationId: 'sai' });
  assert.equal('animations' in camada(p, 'gancho-titulo'), false, 'lista vazia some');
  errado('ANIMATION_NOT_FOUND', { type: 'animation.remove', layerId: 'gancho-titulo', animationId: 'nada' });

  p = certo(
    { type: 'keyframe.set', layerId: 'gancho-foto', property: 'scale', frame: 50, value: 1.1, easing: 'ease-out' },
    { type: 'keyframe.set', layerId: 'gancho-foto', property: 'scale', frame: 95, value: 1.2 },
    { type: 'keyframe.set', layerId: 'gancho-veu', property: 'opacity', frame: 0, value: 0.5 },
  );
  assert.deepEqual(camada(p, 'gancho-foto').keyframes.scale.map((k) => [k.frame, k.value]), [[0, 1], [50, 1.1], [95, 1.2]]);
  assert.deepEqual(camada(p, 'gancho-veu').keyframes, { opacity: [{ frame: 0, value: 0.5 }] });
  p = certo({ type: 'keyframe.remove', layerId: 'gancho-foto', property: 'scale', frame: 0 }, { type: 'keyframe.remove', layerId: 'gancho-foto', property: 'scale', frame: 95 });
  assert.equal('keyframes' in camada(p, 'gancho-foto'), false);
  errado('PROPERTY_NOT_ANIMATABLE', { type: 'keyframe.set', layerId: 'gancho-foto', property: 'width', frame: 0, value: 1 });
  errado('KEYFRAME_NOT_FOUND', { type: 'keyframe.remove', layerId: 'gancho-foto', property: 'x', frame: 0 });
  errado('RESULT_INVALID', { type: 'keyframe.set', layerId: 'gancho-foto', property: 'scale', frame: 200, value: 1 });
});

test('projeto, marca, exportação e assets', () => {
  let p = certo(
    { type: 'project.update', patch: { name: 'Outro nome', brief: { offer: '30% de desconto' } } },
    { type: 'export.update', patch: { crf: 28 } },
    { type: 'composition.update', patch: { safeArea: { left: 80, right: 80 } } },
  );
  assert.equal(p.project.name, 'Outro nome');
  assert.equal(p.project.brief.audience, exemplo.project.brief.audience);
  assert.equal(p.export.crf, 28);
  assert.deepEqual(p.composition.safeArea, { top: 168, right: 80, bottom: 590, left: 80 });
  errado('COMMAND_FIELD_NOT_PATCHABLE', { type: 'project.update', patch: { revision: 99 } });

  p = certo({ type: 'asset.add', asset: { id: 'foto-loja', type: 'image', src: 'assets/loja.jpg' } }, { type: 'asset.update', assetId: 'foto-loja', patch: { alt: 'Fachada' } });
  assert.equal(p.assets.at(-1).alt, 'Fachada');
  errado('RESULT_INVALID', { type: 'asset.remove', assetId: 'foto-rosto' }); // ainda é usado por uma camada
  errado('ASSET_NOT_FOUND', { type: 'asset.remove', assetId: 'nao-existe' });
  const marca = { ...structuredClone(exemplo.brand), colors: { ...exemplo.brand.colors, accent: '#0066FF' } };
  assert.equal(certo({ type: 'brand.set', brand: marca }).brand.colors.accent, '#0066FF');
});

test('tudo ou nada: um comando ruim no meio não deixa rastro', () => {
  const erro = errado('LAYER_NOT_FOUND',
    { type: 'layer.update', layerId: 'oferta-numero', patch: { text: { content: 'mudou' } } },
    { type: 'layer.remove', layerId: 'nao-existe' },
  );
  assert.equal(erro.index, 1);
  const invalido = errado('RESULT_INVALID', { type: 'layer.update', layerId: 'oferta-numero', patch: { text: { color: 'vermelho' } } });
  assert.equal(invalido.problems[0].code, 'SCHEMA_PATTERN');
  assert.match(invalido.message, /Nada foi alterado/);
  errado('COMMAND_UNKNOWN', { type: 'layer.explode', layerId: 'x' });
  errado('COMMAND_MISSING_FIELD', { type: 'layer.update', layerId: 'oferta-numero' });
  assert.equal(applyCommands(base, { type: 'x' }).error.code, 'COMMAND_LIST_INVALID');
  assert.equal(COMMAND_TYPES.length, 22);
});

test('createProject: o modelo motion-ad-9x16 nasce válido, com 15 s em 4 cenas', () => {
  const p = createProject({ id: 'novo-criativo', name: 'Novo criativo', now: '2026-11-11T12:00:00Z' });
  const v = validateProject(p);
  assert.deepEqual(v.errors, []);
  assert.deepEqual(v.warnings.map((w) => w.code), ['FONT_WITHOUT_FILE', 'FONT_WITHOUT_FILE'], 'só o aviso das fontes da marca neutra');
  assert.equal(p.scenes.length, 4);
  assert.deepEqual([p.composition.width, p.composition.height, p.composition.fps, p.composition.durationFrames], [1080, 1920, 30, 450]);
  assert.deepEqual(p.scenes.map((s) => s.beat.role), ['hook', 'product', 'offer', 'cta']);
  assert.equal(p.clientId, null);
  assert.equal(p.export.fileName, 'novo-criativo.mp4');
  const comMarca = createProject({ id: 'x1', name: 'X', clientId: 'cliente-exemplo', brand: exemplo.brand, now: '2026-11-11T12:00:00Z' });
  assert.equal(comMarca.brand.colors.accent, '#E4572E');
  assert.equal(listTemplates()[0].id, 'motion-ad-9x16');
  assert.throws(() => createProject({ template: 'nao-existe', id: 'x', name: 'x', now: '2026-11-11T12:00:00Z' }), /modelo desconhecido/);
});

test('migrateProject: abre a série 1.0 e recusa versão mais nova', () => {
  assert.equal(migrateProject(exemplo).ok, true);
  assert.equal(migrateProject({ schemaVersion: '1.3.0' }).code, 'VERSION_NEWER');
  assert.equal(migrateProject({ schemaVersion: '2.0.0' }).code, 'VERSION_NEWER');
  assert.equal(migrateProject({ schemaVersion: '0.9.0' }).code, 'VERSION_UNSUPPORTED');
  assert.equal(migrateProject({}).code, 'VERSION_MISSING');
});
