// Etapa 1.1: o formato do projeto conferido pelo JSON Schema (primeira camada do validateProject).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { validateProject, schema } from '../src/index.js';
import { applyPatch } from '../../fixtures/patch.js';

const motor = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const lerJson = (...partes) => JSON.parse(readFileSync(path.join(motor, ...partes), 'utf8'));

const casos = lerJson('fixtures', 'invalid', 'schema.cases.json');
const exemplo = lerJson('fixtures', casos.base);

const congelar = (valor) => {
  if (valor && typeof valor === 'object') { Object.values(valor).forEach(congelar); Object.freeze(valor); }
  return valor;
};

test('o schema é JSON Schema 2020-12 e recusa campo desconhecido na raiz', () => {
  assert.equal(schema.$schema, 'https://json-schema.org/draft/2020-12/schema');
  assert.equal(schema.additionalProperties, false);
});

test('o exemplo de 4 cenas é válido', () => {
  const resultado = validateProject(exemplo);
  assert.deepEqual(resultado.errors, []);
  assert.equal(resultado.valid, true);
  assert.deepEqual(resultado.warnings, []);
});

test('validar não altera o projeto', () => {
  const copia = congelar(structuredClone(exemplo));
  assert.doesNotThrow(() => validateProject(copia));
  assert.deepEqual(copia, exemplo);
});

for (const caso of casos.cases) {
  test(`recusa: ${caso.name}`, () => {
    const resultado = validateProject(applyPatch(exemplo, caso.ops));
    assert.equal(resultado.valid, false);
    const achou = resultado.errors.some((e) => e.code === caso.expect.code && e.path === caso.expect.path);
    assert.ok(achou, `esperava ${caso.expect.code} em ${caso.expect.path}, veio:\n${JSON.stringify(resultado.errors, null, 2)}`);
  });
}

test('todo problema tem código, caminho e mensagem em português', () => {
  for (const caso of casos.cases) {
    for (const erro of validateProject(applyPatch(exemplo, caso.ops)).errors) {
      assert.match(erro.code, /^SCHEMA_[A-Z_]+$/, caso.name);
      assert.equal(typeof erro.path, 'string', caso.name);
      assert.ok(erro.path === '' || erro.path.startsWith('/'), `${caso.name}: caminho ${erro.path}`);
      assert.ok(erro.message.length > 0, caso.name);
      assert.doesNotMatch(erro.message, /\bmust\b|\bshould\b/i, `${caso.name}: mensagem em inglês: ${erro.message}`);
    }
  }
});

test('um erro só não vira uma lista de problemas repetidos', () => {
  const curva = validateProject(applyPatch(exemplo, [{ op: 'set', path: '/scenes/1/transitionIn/easing', value: 'bounce' }]));
  assert.equal(curva.errors.length, 1, JSON.stringify(curva.errors, null, 2));
  assert.ok(curva.errors[0].hint, 'o problema da curva deveria explicar o que é aceito');

  const forma = validateProject(applyPatch(exemplo, [{ op: 'remove', path: '/scenes/0/layers/1/shape/fill' }]));
  assert.equal(forma.errors.length, 1, JSON.stringify(forma.errors, null, 2));
});

test('o que não é um objeto de projeto é recusado sem quebrar', () => {
  for (const entrada of [null, undefined, 42, 'texto', [], {}]) {
    const resultado = validateProject(entrada);
    assert.equal(resultado.valid, false, `entrada: ${JSON.stringify(entrada)}`);
    assert.ok(resultado.errors.length > 0);
  }
});

test('o exemplo do documento do formato é o mesmo de fixtures/', () => {
  const md = readFileSync(path.join(motor, '..', 'docs', 'creative-engine', 'CREATIVE_PROJECT_SCHEMA.md'), 'utf8');
  const bloco = md.match(/<!-- exemplo:inicio -->\s*```json\n([\s\S]*?)\n```\s*<!-- exemplo:fim -->/);
  assert.ok(bloco, 'o documento perdeu o bloco do exemplo');
  assert.deepEqual(JSON.parse(bloco[1]), exemplo);
});

test('o documento do formato aponta para o arquivo do schema em vez de copiá-lo', () => {
  const md = readFileSync(path.join(motor, '..', 'docs', 'creative-engine', 'CREATIVE_PROJECT_SCHEMA.md'), 'utf8');
  assert.ok(md.includes('creative-engine/core/schema/mazy-creative-project.schema.json'));
  assert.ok(!md.includes('<!-- schema:inicio -->'), 'o schema não pode morar em dois lugares');
});
