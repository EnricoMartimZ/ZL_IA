// Estado do editor: comandos, desfazer e refazer, gestos, seleção e quadro. Roda no Node, sem navegador.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { createStore, sceneAtFrame, HISTORY_LIMIT } from '../src/state/store.js';
import { uniqueId, clamp, findLayer } from '../src/util.js';

const motor = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const exemplo = JSON.parse(readFileSync(path.join(motor, 'fixtures/projects/motion-ad-4-scenes/project.mazy.json'), 'utf8'));
const novo = () => createStore({ project: structuredClone(exemplo), revision: 1 });
const texto = (s, id) => findLayer(s.getState().project, id).layer.text.content;
const trocar = (conteudo) => [{ type: 'layer.update', layerId: 'oferta-numero', patch: { text: { content: conteudo } } }];

test('dispatch aplica, marca como pendente e avisa quem escuta', () => {
  const s = novo();
  let avisos = 0;
  const parar = s.subscribe(() => avisos++);
  assert.equal(s.dispatch(trocar('30% OFF')), null);
  assert.equal(texto(s, 'oferta-numero'), '30% OFF');
  assert.equal(s.getState().dirty, true);
  assert.equal(s.getState().past.length, 1);
  assert.equal(avisos, 1);
  parar(); s.dispatch(trocar('40% OFF'));
  assert.equal(avisos, 1);
});

test('comando recusado não muda o projeto e fica em error', () => {
  const s = novo();
  const antes = s.getState().project;
  const erro = s.dispatch([{ type: 'layer.update', layerId: 'oferta-numero', patch: { text: { fontSize: 2 } } }]);
  assert.equal(erro.code, 'RESULT_INVALID');
  assert.equal(s.getState().project, antes);
  assert.equal(s.getState().error.problems[0].code, 'SCHEMA_RANGE');
  assert.equal(s.getState().dirty, false);
  s.clearError();
  assert.equal(s.getState().error, null);
});

test('desfazer e refazer; alteração nova apaga o refazer', () => {
  const s = novo();
  s.dispatch(trocar('A')); s.dispatch(trocar('B'));
  s.undo(); assert.equal(texto(s, 'oferta-numero'), 'A');
  s.undo(); assert.equal(texto(s, 'oferta-numero'), '20% OFF');
  s.undo(); assert.equal(texto(s, 'oferta-numero'), '20% OFF', 'desfazer sem histórico não faz nada');
  s.redo(); s.redo(); assert.equal(texto(s, 'oferta-numero'), 'B');
  s.undo(); s.dispatch(trocar('C'));
  assert.equal(s.getState().future.length, 0);
  s.redo(); assert.equal(texto(s, 'oferta-numero'), 'C');
});

test('o desfazer tem limite', () => {
  const s = novo();
  for (let i = 0; i < HISTORY_LIMIT + 5; i++) s.dispatch(trocar(`v${i}`));
  assert.equal(s.getState().past.length, HISTORY_LIMIT);
});

test('gesto: várias atualizações viram uma alteração só, sempre a partir do estado de antes', () => {
  const s = novo();
  const mover = (x) => [{ type: 'layer.update', layerId: 'oferta-numero', patch: { box: { x } } }];
  s.beginGesture();
  s.updateGesture(mover(100)); s.updateGesture(mover(140)); s.updateGesture(mover(180));
  assert.equal(findLayer(s.getState().project, 'oferta-numero').layer.box.x, 180);
  assert.equal(s.getState().dirty, false, 'durante o arrasto ainda não grava');
  s.commitGesture();
  assert.equal(s.getState().past.length, 1);
  assert.equal(s.getState().dirty, true);
  s.undo();
  assert.equal(findLayer(s.getState().project, 'oferta-numero').layer.box.x, 64);

  s.beginGesture(); s.updateGesture(mover(500)); s.cancelGesture();
  assert.equal(findLayer(s.getState().project, 'oferta-numero').layer.box.x, 64);
  s.beginGesture(); s.commitGesture();
  assert.equal(s.getState().past.length, 0, 'gesto sem movimento não entra no desfazer');
});

test('seleção acompanha o projeto: camada apagada ou movida de cena', () => {
  const s = novo();
  s.select({ sceneId: 'cena-gancho', layerId: 'gancho-apoio' });
  assert.equal(s.dispatch([{ type: 'layer.move', layerId: 'gancho-apoio', sceneId: 'cena-chamada' }]), null);
  assert.deepEqual(s.getState().selection, { sceneId: 'cena-chamada', layerId: 'gancho-apoio' });
  s.dispatch([{ type: 'layer.remove', layerId: 'gancho-apoio' }]);
  assert.deepEqual(s.getState().selection, { sceneId: 'cena-chamada' });
  s.select({ sceneId: 'nao-existe' });
  assert.equal(s.getState().selection, null);
});

test('quadro: fica dentro do vídeo, inclusive quando o vídeo encurta', () => {
  const s = novo();
  s.setFrame(9999); assert.equal(s.getState().frame, 449);
  s.setFrame(-5); assert.equal(s.getState().frame, 0);
  s.setFrame(12.6); assert.equal(s.getState().frame, 13);
  s.setFrame(440);
  s.dispatch([{ type: 'scene.remove', sceneId: 'cena-chamada' }]);
  assert.equal(s.getState().frame, 335);
});

test('markSaved e load', () => {
  const s = novo();
  s.dispatch(trocar('A'));
  const enviado = s.getState().project;
  s.dispatch(trocar('B')); // mudou enquanto gravava
  s.markSaved(2, enviado);
  assert.deepEqual([s.getState().revision, s.getState().dirty], [2, true]);
  s.markSaved(3, s.getState().project);
  assert.deepEqual([s.getState().revision, s.getState().dirty], [3, false]);
  s.load(structuredClone(exemplo), 7);
  assert.deepEqual([s.getState().revision, s.getState().dirty, s.getState().past.length], [7, false, 0]);
  assert.equal(texto(s, 'oferta-numero'), '20% OFF');
});

test('utilidades', () => {
  assert.equal(sceneAtFrame(exemplo, 0).sceneId, 'cena-gancho');
  assert.equal(sceneAtFrame(exemplo, 90).sceneId, 'cena-produto', 'na transição, a cena que entra');
  assert.equal(sceneAtFrame(exemplo, 449).sceneId, 'cena-chamada');
  assert.equal(uniqueId('texto', ['a']), 'texto');
  assert.equal(uniqueId('texto', ['texto', 'texto-2']), 'texto-3');
  assert.equal(clamp(15, 0, 10), 10);
});
