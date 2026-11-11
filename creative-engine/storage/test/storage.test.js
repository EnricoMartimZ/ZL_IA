// Etapa 4.2: pasta do projeto, revisão, checkpoints, versões e rollback.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, readFileSync, writeFileSync, readdirSync, existsSync, mkdirSync, rmSync, cpSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { openProject, saveProject, checkpoint, saveVersion, listHistory, rollback, readLog, missingAssetFiles, projectDir, StorageError, CHECKPOINT_LIMIT, PROJECT_FILE } from '../index.js';

const motor = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const origem = path.join(motor, 'fixtures/projects/motion-ad-4-scenes');
const exemplo = JSON.parse(readFileSync(path.join(origem, PROJECT_FILE), 'utf8'));

// cada teste trabalha numa pasta temporária: nunca em clientes/ nem em marketing/
const pastaNova = (t) => {
  const dir = mkdtempSync(path.join(tmpdir(), 'mazy-storage-'));
  t.after(() => rmSync(dir, { recursive: true, force: true }));
  return dir;
};
const comProjeto = (t) => { const dir = pastaNova(t); cpSync(path.join(origem, PROJECT_FILE), path.join(dir, PROJECT_FILE)); return dir; };
const codigo = (fn) => { try { fn(); } catch (e) { assert.ok(e instanceof StorageError, String(e)); return e; } return assert.fail('deveria ter falhado'); };

test('abre pela pasta ou pelo arquivo; pasta sem projeto e JSON quebrado dão erro com código', (t) => {
  const dir = comProjeto(t);
  assert.equal(openProject(dir).revision, 1);
  assert.equal(openProject(path.join(dir, PROJECT_FILE)).dir, dir);
  assert.equal(projectDir(path.join(dir, PROJECT_FILE)), dir);
  assert.equal(codigo(() => openProject(pastaNova(t))).code, 'PROJECT_NOT_FOUND');
  writeFileSync(path.join(dir, PROJECT_FILE), '{ quebrado');
  assert.equal(codigo(() => openProject(dir)).code, 'PROJECT_UNREADABLE');
  writeFileSync(path.join(dir, PROJECT_FILE), JSON.stringify({ ...exemplo, schemaVersion: '1.4.0' }));
  assert.equal(codigo(() => openProject(dir)).code, 'VERSION_NEWER');
});

test('gravar sobe a revisão, atualiza a data, faz checkpoint do estado anterior e registra no log', (t) => {
  const dir = comProjeto(t);
  const { project } = openProject(dir);
  project.project.name = 'Nome novo';
  const r = saveProject(dir, project, { baseRevision: 1, source: 'claude', label: 'troca de nome' });
  assert.equal(r.revision, 2);
  const lido = openProject(dir);
  assert.equal(lido.project.project.name, 'Nome novo');
  assert.equal(lido.revision, 2);
  assert.notEqual(lido.project.project.updatedAt, exemplo.project.updatedAt);
  assert.equal(project.project.revision, 1, 'o objeto de quem chamou não é alterado');
  const historia = listHistory(dir);
  assert.equal(historia.length, 1);
  assert.deepEqual([historia[0].kind, historia[0].revision, historia[0].source, historia[0].label], ['checkpoint', 1, 'claude', 'troca de nome']);
  assert.equal(r.checkpointId, historia[0].id);
  assert.deepEqual(readLog(dir).map((l) => l.action), ['checkpoint', 'save']);
  assert.ok(readLog(dir).every((l) => typeof l.at === 'string' && l.source === 'claude'));
  assert.deepEqual(readdirSync(dir).filter((n) => n.endsWith('.tmp')), [], 'não sobra arquivo temporário');
});

test('gravar com revisão velha é conflito, e o disco fica como estava', (t) => {
  const dir = comProjeto(t);
  const { project } = openProject(dir);
  saveProject(dir, project, { baseRevision: 1, source: 'claude' });
  const antes = readFileSync(path.join(dir, PROJECT_FILE), 'utf8');
  const erro = codigo(() => saveProject(dir, { ...project, project: { ...project.project, name: 'Editor' } }, { baseRevision: 1, source: 'editor' }));
  assert.equal(erro.code, 'CONFLICT');
  assert.equal(erro.currentRevision, 2);
  assert.equal(readFileSync(path.join(dir, PROJECT_FILE), 'utf8'), antes);
});

test('projeto inválido não é gravado', (t) => {
  const dir = comProjeto(t);
  const { project } = openProject(dir);
  project.composition.fps = 29;
  const erro = codigo(() => saveProject(dir, project, { baseRevision: 1 }));
  assert.equal(erro.code, 'INVALID');
  assert.equal(erro.problems[0].path, '/composition/fps');
  assert.equal(openProject(dir).revision, 1);
  assert.equal(listHistory(dir).length, 0, 'nem checkpoint foi feito');
});

test('o editor grava sem checkpoint automático; a primeira gravação cria a pasta', (t) => {
  const dir = comProjeto(t);
  const { project } = openProject(dir);
  assert.equal(saveProject(dir, project, { baseRevision: 1, source: 'editor' }).checkpointId, null);
  assert.equal(listHistory(dir).length, 0);
  const nova = path.join(pastaNova(t), 'criativos', 'novo');
  const r = saveProject(nova, exemplo, { source: 'cli' });
  assert.equal(r.revision, 1);
  assert.ok(existsSync(path.join(nova, PROJECT_FILE)));
});

test('o anel de checkpoints descarta o mais antigo ao passar do limite; versão não é descartada', (t) => {
  const dir = comProjeto(t);
  saveVersion(dir, 'aprovada pelo cliente');
  const ids = [];
  for (let i = 0; i < CHECKPOINT_LIMIT + 3; i++) ids.push(checkpoint(dir, { label: `ponto ${i}`, source: 'cli' }).id);
  const historia = listHistory(dir);
  const pontos = historia.filter((h) => h.kind === 'checkpoint');
  assert.equal(pontos.length, CHECKPOINT_LIMIT);
  assert.ok(!pontos.some((h) => h.id === ids[0]), 'o mais antigo saiu');
  assert.equal(pontos[0].id, ids.at(-1), 'o mais novo vem primeiro');
  assert.equal(historia.filter((h) => h.kind === 'version').length, 1);
  assert.equal(historia.find((h) => h.kind === 'version').label, 'aprovada pelo cliente');
});

test('rollback volta ao estado certo e dá para desfazer', (t) => {
  const dir = comProjeto(t);
  const a = openProject(dir).project;
  a.project.name = 'Estado B';
  const gravado = saveProject(dir, a, { baseRevision: 1, source: 'claude' }); // checkpoint guarda o estado A (revisão 1)
  const volta = rollback(dir, gravado.checkpointId, 'cli');
  const depois = openProject(dir);
  assert.equal(depois.project.project.name, exemplo.project.name, 'voltou ao estado A');
  assert.equal(depois.revision, 3, 'a revisão continua crescendo');
  assert.equal(volta.restoredFrom, gravado.checkpointId);
  rollback(dir, volta.undoId, 'cli'); // desfaz o rollback
  assert.equal(openProject(dir).project.project.name, 'Estado B');
  assert.equal(openProject(dir).revision, 4);
  assert.equal(codigo(() => rollback(dir, 'nao-existe')).code, 'HISTORY_NOT_FOUND');
  assert.deepEqual(readLog(dir).map((l) => l.action).filter((x) => x === 'rollback').length, 2);
});

test('arquivos de asset que faltam são apontados', (t) => {
  const dir = comProjeto(t);
  assert.equal(missingAssetFiles(dir, exemplo).length, exemplo.assets.length);
  assert.deepEqual(missingAssetFiles(origem, exemplo), [], 'o exemplo do motor tem todos os arquivos');
  mkdirSync(path.join(dir, 'assets'), { recursive: true });
  writeFileSync(path.join(dir, 'assets', 'foto-rosto.jpg'), 'x');
  const faltam = missingAssetFiles(dir, exemplo);
  assert.equal(faltam.length, exemplo.assets.length - 1);
  assert.deepEqual([faltam[0].code, faltam[0].path], ['ASSET_FILE_MISSING', '/assets/1/src']);
});
