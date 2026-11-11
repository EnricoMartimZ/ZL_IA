// Importação da marca (marca.json → brand) e conferência de consistência.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { brandFromMarca, brandConsistency } from '../brand/index.js';
import { createProject, validateProject } from '../../core/src/index.js';
import { applyPatch } from '../../fixtures/patch.js';

const motor = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const exemplo = JSON.parse(readFileSync(path.join(motor, 'fixtures/projects/motion-ad-4-scenes/project.mazy.json'), 'utf8'));
// no formato que o scripts/extrair-marca.js grava
const marca = {
  versao: 1, nome: 'cliente de exemplo',
  cores: { fundo: '#f6f4ef', texto: '#14181f', destaque: '#e4572e', base_escura: '#14181f', secundarias: ['#2e4057', 'azul'], todas: [] },
  tipografia: { titulos: 'Archivo', corpo: 'Inter', google: ['Archivo'] },
  logo: { arquivo: 'assets/logo-recorte.png', fundo: 'claro' },
};

test('marca.json vira um bloco brand que o formato aceita', () => {
  const { brand, notes } = brandFromMarca(marca, { source: '../../marca/marca.json', syncedAt: '2026-11-11T12:00:00Z', logoAssetId: 'logo-marca' });
  assert.deepEqual(brand.colors, { background: '#F6F4EF', text: '#14181F', accent: '#E4572E', darkBase: '#14181F', secondary: ['#2E4057'] });
  assert.deepEqual(brand.fonts, { heading: { family: 'Archivo' }, body: { family: 'Inter' } });
  assert.deepEqual(brand.logos, { primary: 'logo-marca' });
  assert.ok(notes.some((n) => n.includes('fundo claro')));
  const projeto = createProject({ id: 'teste-marca', name: 'Teste', clientId: 'cliente-exemplo', brand, now: '2026-11-11T12:00:00Z' });
  projeto.assets.push({ id: 'logo-marca', type: 'logo', src: 'assets/logo.png' });
  assert.deepEqual(validateProject(projeto).errors, []);
});

test('marca incompleta: preenche com padrão e avisa o que faltou', () => {
  const { brand, notes } = brandFromMarca({ cores: { fundo: '#fff', texto: null, destaque: null }, tipografia: { titulos: null, corpo: '' }, logo: null }, { syncedAt: '2026-11-11T12:00:00Z' });
  assert.deepEqual(brand.colors, { background: '#FFFFFF', text: '#111111', accent: '#111111' });
  assert.equal(brand.fonts.heading.family, 'sans-serif');
  assert.deepEqual(brand.logos, {});
  assert.equal(brand.source, null);
  for (const trecho of ['cor de texto', 'cor de destaque', 'fonte de títulos', 'não traz logo']) assert.ok(notes.some((n) => n.includes(trecho)), trecho);
  assert.doesNotThrow(() => brandFromMarca(undefined, { syncedAt: '2026-11-11T12:00:00Z' }));
});

test('consistência: branco, preto e as cores da marca passam; cor de fora é apontada', () => {
  assert.deepEqual(brandConsistency(exemplo), []);
  const fora = applyPatch(exemplo, [
    { op: 'set', path: '/scenes/2/layers/0/text/color', value: '#00FF00' },
    { op: 'set', path: '/scenes/0/layers/1/shape/fill', value: '#E4572E80' },
  ]);
  assert.deepEqual(brandConsistency(fora), [{ code: 'COLOR_NOT_IN_BRAND', path: '/scenes/2/layers/0/text/color', message: 'A cor #00FF00 não é da marca.' }]);
});
