// API local do editor: gravação com revisão, avisos, assets, histórico e limites de acesso.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { mkdtempSync, rmSync, cpSync, readFileSync, existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { createApi } from '../api.js';
import { openProject, saveProject } from '../../storage/index.js';

const motor = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const exemploDir = path.join(motor, 'fixtures/projects/motion-ad-4-scenes');

async function subir(t) {
  const dir = mkdtempSync(path.join(tmpdir(), 'mazy-api-'));
  cpSync(exemploDir, dir, { recursive: true });
  const api = createApi({ dir });
  const servidor = createServer((req, res) => api.handle(req, res));
  await new Promise((ok) => servidor.listen(0, '127.0.0.1', ok));
  t.after(async () => { api.close(); servidor.closeAllConnections(); await new Promise((ok) => servidor.close(ok)); rmSync(dir, { recursive: true, force: true }); });
  const base = `http://127.0.0.1:${servidor.address().port}`;
  const pedir = async (metodo, caminho, corpo, cabecalhos = {}) => {
    const r = await fetch(base + caminho, { method: metodo, body: corpo === undefined ? undefined : (Buffer.isBuffer(corpo) ? corpo : JSON.stringify(corpo)), headers: cabecalhos });
    return { status: r.status, json: await r.json().catch(() => null) };
  };
  return { dir, base, pedir };
}

test('abre o projeto com revisão e validação', async (t) => {
  const { pedir } = await subir(t);
  const r = await pedir('GET', '/api/project');
  assert.equal(r.status, 200);
  assert.equal(r.json.revision, 1);
  assert.deepEqual(r.json.validation, { valid: true, errors: [], warnings: [] });
  assert.equal(r.json.project.project.id, 'oferta-armacoes-9x16');
});

test('grava com a revisão certa; revisão velha é 409; projeto inválido é 422', async (t) => {
  const { pedir, dir } = await subir(t);
  const { project } = (await pedir('GET', '/api/project')).json;
  project.project.name = 'Pelo editor';
  const ok = await pedir('PUT', '/api/project', { project, baseRevision: 1 });
  assert.deepEqual([ok.status, ok.json.revision], [200, 2]);
  assert.equal(openProject(dir).project.project.name, 'Pelo editor');
  const velho = await pedir('PUT', '/api/project', { project, baseRevision: 1 });
  assert.deepEqual([velho.status, velho.json.code, velho.json.currentRevision], [409, 'CONFLICT', 2]);
  project.composition.fps = 31;
  const ruim = await pedir('PUT', '/api/project', { project, baseRevision: 2 });
  assert.deepEqual([ruim.status, ruim.json.code, ruim.json.problems[0].path], [422, 'INVALID', '/composition/fps']);
  assert.equal(openProject(dir).revision, 2);
  assert.equal((await pedir('PUT', '/api/project', Buffer.from('{ não é json'))).status, 400);
});

test('avisa quando outro grava no disco, e não quando é o próprio editor', async (t) => {
  const { base, dir, pedir } = await subir(t);
  const controle = new AbortController();
  t.after(() => controle.abort());
  const resposta = await fetch(`${base}/api/events`, { signal: controle.signal });
  const leitor = resposta.body.getReader();
  const eventos = [];
  (async () => {
    const dec = new TextDecoder(); let resto = '';
    try {
      for (;;) {
        const { value, done } = await leitor.read(); if (done) break;
        resto += dec.decode(value);
        let i;
        while ((i = resto.indexOf('\n\n')) >= 0) {
          const bloco = resto.slice(0, i); resto = resto.slice(i + 2);
          eventos.push({ nome: /event: (.*)/.exec(bloco)[1], dados: JSON.parse(/data: (.*)/.exec(bloco)[1]) });
        }
      }
    } catch { /* conexão encerrada no fim do teste */ }
  })();
  const esperar = async (cond) => { for (let i = 0; i < 100 && !cond(); i++) await new Promise((ok) => setTimeout(ok, 30)); };
  await esperar(() => eventos.length >= 1);
  assert.equal(eventos[0].nome, 'hello');

  const { project } = openProject(dir);
  await pedir('PUT', '/api/project', { project, baseRevision: 1 }); // o editor gravando
  await new Promise((ok) => setTimeout(ok, 250));
  assert.equal(eventos.filter((e) => e.nome === 'project-changed').length, 0);

  saveProject(dir, openProject(dir).project, { baseRevision: 2, source: 'claude' }); // o Claude gravando
  await esperar(() => eventos.some((e) => e.nome === 'project-changed'));
  assert.deepEqual(eventos.find((e) => e.nome === 'project-changed').dados, { revision: 3 });
});

test('recebe um arquivo, guarda em assets/ com id único e devolve as medidas', async (t) => {
  const { pedir, dir } = await subir(t);
  const foto = readFileSync(path.join(exemploDir, 'assets', 'foto-armacao.jpg'));
  const r = await pedir('POST', '/api/assets?name=Foto%20da%20Vitrine.JPG', foto, { 'content-type': 'application/octet-stream' });
  assert.equal(r.status, 201);
  assert.deepEqual([r.json.asset.id, r.json.asset.type, r.json.asset.src, r.json.asset.width, r.json.asset.height], ['foto-da-vitrine', 'image', 'assets/foto-da-vitrine.jpg', 800, 800]);
  assert.ok(existsSync(path.join(dir, 'assets', 'foto-da-vitrine.jpg')));
  const repetido = await pedir('POST', '/api/assets?name=Foto%20da%20Vitrine.JPG', foto);
  assert.equal(repetido.json.asset.id, 'foto-da-vitrine-2');
  const existente = await pedir('POST', '/api/assets?name=foto-rosto.jpg', foto);
  assert.equal(existente.json.asset.id, 'foto-rosto-2', 'não sobrescreve arquivo que já existe');
  assert.equal((await pedir('POST', '/api/assets?name=planilha.csv', Buffer.from('a;b'))).status, 422);
  const fuga = await pedir('POST', '/api/assets?name=..%2F..%2Ffora.png', foto);
  assert.equal(fuga.json.asset.src, 'assets/fora.png', 'o nome nunca leva para fora da pasta');
});

test('histórico: ponto, versão e voltar', async (t) => {
  const { pedir, dir } = await subir(t);
  assert.equal((await pedir('POST', '/api/history/version', { label: 'aprovada' })).status, 201);
  assert.equal((await pedir('POST', '/api/history/version', {})).status, 422);
  const { project } = openProject(dir);
  project.project.name = 'Mudou';
  await pedir('PUT', '/api/project', { project, baseRevision: 1 });
  const lista = (await pedir('GET', '/api/history')).json.items;
  const versao = lista.find((h) => h.kind === 'version');
  const volta = await pedir('POST', '/api/history/rollback', { id: versao.id });
  assert.equal(volta.status, 200);
  assert.equal(volta.json.project.project.name, 'Oferta de armações — anúncio vertical');
  assert.equal(volta.json.revision, 3);
  assert.equal((await pedir('POST', '/api/history/rollback', { id: 'nao-existe' })).status, 404);
  assert.equal((await pedir('POST', '/api/history/checkpoint', { label: 'ponto' })).status, 201);
});

test('só entrega assets e renders do projeto, e só para o endereço local', async (t) => {
  const { pedir, base } = await subir(t);
  const status = async (caminho, opcoes) => (await fetch(base + caminho, opcoes)).status;
  assert.equal(await status('/project-files/assets/logo-claro.svg'), 200);
  assert.equal(await status('/project-files/project.mazy.json'), 404, 'o arquivo do projeto só sai pela API');
  assert.equal(await status('/project-files/.history/log.jsonl'), 404);
  assert.equal(await status('/project-files/assets/%2e%2e/%2e%2e/%2e%2e/etc/passwd'), 404);
  assert.equal(await status('/project-files/assets/logo-claro.svg', { method: 'DELETE' }), 405);
  assert.equal((await pedir('GET', '/api/nao-existe')).status, 404);
  assert.equal((await pedir('GET', '/outra-coisa')).status, 404);
  assert.equal(await status('/api/project', { headers: { origin: 'https://site-de-fora.example' } }), 403);
  assert.equal(await status('/api/project', { headers: { origin: 'http://127.0.0.1:5177' } }), 200);
});
