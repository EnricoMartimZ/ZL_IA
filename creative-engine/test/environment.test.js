// Guardas do esqueleto: ambiente, dependências aprovadas e estrutura de pastas.
// Rodar: npm --prefix creative-engine test
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync, statSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const motor = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const raiz = path.join(motor, '..');
const lerJson = (arquivo) => JSON.parse(readFileSync(arquivo, 'utf8'));

// O que o Vite 8 pede (ADR-002). Mudou aqui, mudar também no package.json do motor.
const NODE_EXIGIDO = '^20.19.0 || >=22.12.0';
const nodeServe = (versao) => {
  const [maior, menor] = versao.split('.').map(Number);
  return (maior === 20 && menor >= 19) || (maior === 22 && menor >= 12) || maior > 22;
};

// Lista aprovada na arquitetura, seção 9. Dependência nova entra aqui junto com a decisão que a justifica.
const DEPENDENCIAS_APROVADAS = ['ajv'];
const DEV_APROVADAS = ['react', 'react-dom', 'vite', '@vitejs/plugin-react', 'typescript'];

// Primeiro e segundo nível da arquitetura, seção 4. As subpastas nascem na etapa que as usa.
const PASTAS = [
  'core/schema', 'core/src', 'core/test',
  'renderer/stage', 'renderer/export', 'renderer/adapters', 'renderer/media', 'renderer/test',
  'storage',
  'intelligence/critique', 'intelligence/variations', 'intelligence/brand',
  'cli', 'editor', 'fixtures', 'test',
];

test('a regra de versão do Node aceita e recusa o que deve', () => {
  for (const v of ['20.19.0', '20.20.1', '22.12.0', '22.22.2', '24.0.0']) assert.ok(nodeServe(v), `${v} deveria servir`);
  for (const v of ['12.22.9', '18.20.8', '20.18.3', '21.7.0', '22.11.0']) assert.ok(!nodeServe(v), `${v} não deveria servir`);
});

test('o Node que está rodando serve para o motor', () => {
  assert.ok(nodeServe(process.versions.node),
    `Node ${process.versions.node} não serve: o motor pede ${NODE_EXIGIDO}. Use o Node 22 do nvm.`);
});

test('o package.json do motor é um pacote à parte, ESM, privado e sem build', () => {
  const pacote = lerJson(path.join(motor, 'package.json'));
  assert.equal(pacote.private, true);
  assert.equal(pacote.type, 'module');
  assert.equal(pacote.engines?.node, NODE_EXIGIDO);
  assert.equal(pacote.scripts?.test, 'node --test');
  assert.equal(pacote.scripts?.build, undefined, 'o motor não tem etapa de build (ADR-003)');
});

test('o motor só tem dependência que foi aprovada', () => {
  const pacote = lerJson(path.join(motor, 'package.json'));
  const fora = (obj, lista) => Object.keys(obj ?? {}).filter((nome) => !lista.includes(nome));
  assert.deepEqual(fora(pacote.dependencies, DEPENDENCIAS_APROVADAS), []);
  assert.deepEqual(fora(pacote.devDependencies, DEV_APROVADAS), []);
});

test('a raiz do MazyOS continua com uma dependência só e sem workspaces', () => {
  const pacote = lerJson(path.join(raiz, 'package.json'));
  assert.deepEqual(Object.keys(pacote.dependencies ?? {}), ['playwright']);
  assert.deepEqual(Object.keys(pacote.devDependencies ?? {}), []);
  assert.equal(pacote.workspaces, undefined);
});

test('as pastas da arquitetura existem', () => {
  const faltando = PASTAS.filter((p) => !(existsSync(path.join(motor, p)) && statSync(path.join(motor, p)).isDirectory()));
  assert.deepEqual(faltando, []);
});

test('a trava de sigilo barra criativo de cliente e do próprio negócio', async () => {
  const { pastaLocal } = await import('../../scripts/checar-clientes.js');
  for (const f of [
    'marketing/criativos/exemplo/project.mazy.json',
    'marketing/criativos/exemplo/assets/foto.jpg',
    'clientes/exemplo/criativos/oferta/project.mazy.json',
    'vendas/funil.md',
    '.env',
  ]) assert.ok(pastaLocal(f), `${f} deveria ser barrado`);
  for (const f of [
    'marketing/README.md',
    'marketing/criativos-ideias.md',
    'creative-engine/fixtures/projects/motion-ad-4-scenes/project.mazy.json',
    'docs/creative-engine/CREATIVE_PROJECT_SCHEMA.md',
    '.env.example',
  ]) assert.ok(!pastaLocal(f), `${f} não deveria ser barrado`);
});

test('criativos do próprio negócio ficam fora do Git (ADR-010)', () => {
  // git check-ignore sai com 0 quando o caminho é ignorado e com 1 quando não é
  const ignorado = (caminho) => {
    try { execFileSync('git', ['check-ignore', '-q', caminho], { cwd: raiz }); return true; } catch { return false; }
  };
  assert.ok(ignorado('marketing/criativos/exemplo/project.mazy.json'), 'marketing/criativos/ deveria estar no .gitignore');
  assert.ok(!ignorado('marketing/README.md'), 'o resto de marketing/ continua versionado');
  assert.ok(!ignorado('creative-engine/package.json'), 'o motor é versionado');
});
