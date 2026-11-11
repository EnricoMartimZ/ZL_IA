// Etapa 1.2: regras que cruzam campos (segunda camada do validateProject).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { validateProject } from '../src/index.js';
import { applyPatch } from '../../fixtures/patch.js';

const motor = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const lerJson = (...p) => JSON.parse(readFileSync(path.join(motor, ...p), 'utf8'));
const casos = lerJson('fixtures', 'invalid', 'semantic.cases.json');
const exemplo = lerJson('fixtures', casos.base);

test('o exemplo passa nas regras sem erro e sem aviso', () => {
  assert.deepEqual(validateProject(exemplo), { valid: true, errors: [], warnings: [] });
});

for (const caso of casos.cases) {
  test(`${caso.level === 'error' ? 'erro' : 'aviso'}: ${caso.name}`, () => {
    const r = validateProject(applyPatch(exemplo, caso.ops));
    const lista = caso.level === 'error' ? r.errors : r.warnings;
    assert.ok(lista.some((p) => p.code === caso.expect.code && p.path === caso.expect.path),
      `esperava ${caso.expect.code} em ${caso.expect.path}, veio:\n${JSON.stringify(r, null, 2)}`);
    if (caso.level === 'error') assert.equal(r.valid, false);
    else assert.equal(r.valid, true, `aviso não pode invalidar: ${JSON.stringify(r.errors)}`);
  });
}

test('toda regra do documento do formato tem pelo menos um caso', () => {
  const md = readFileSync(path.join(motor, '..', 'docs', 'creative-engine', 'CREATIVE_PROJECT_SCHEMA.md'), 'utf8');
  const secao = md.slice(md.indexOf('## 3. Regras que o schema não expressa'), md.indexOf('## 4. Versões do formato'));
  const codigos = [...secao.matchAll(/^\| `([A-Z_]+)` \|/gm)].map((m) => m[1]);
  assert.ok(codigos.length >= 18, `achei só ${codigos.length} códigos no documento`);
  const cobertos = new Set(casos.cases.map((c) => c.expect.code));
  const semCaso = codigos.filter((c) => !cobertos.has(c) && c !== 'ASSET_FILE_MISSING'); // essa é do armazenamento
  assert.deepEqual(semCaso, []);
});

test('projeto com forma errada não chega nas regras', () => {
  const r = validateProject(applyPatch(exemplo, [{ op: 'set', path: '/extra', value: 1 }, { op: 'set', path: '/composition/durationFrames', value: 451 }]));
  assert.ok(r.errors.every((e) => e.code.startsWith('SCHEMA_')));
});
