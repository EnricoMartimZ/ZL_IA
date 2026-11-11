// Etapa 7.3: variações por eixo, com semente.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, readFileSync, rmSync, cpSync, existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { generateVariations, writeVariations, AXES } from '../variations/index.js';
import { validateProject, getTimeline } from '../../core/src/index.js';

const motor = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const dir = path.join(motor, 'fixtures/projects/motion-ad-4-scenes');
const exemplo = JSON.parse(readFileSync(path.join(dir, 'project.mazy.json'), 'utf8'));
const congelar = (v) => { if (v && typeof v === 'object') { Object.values(v).forEach(congelar); Object.freeze(v); } return v; };
const textos = (p) => p.scenes.flatMap((s) => s.layers).filter((l) => l.type === 'text').map((l) => l.text.content);

for (const axis of AXES) {
  test(`eixo ${axis}: mesma semente, mesmas variantes; todas válidas, com a mesma duração e os mesmos textos`, () => {
    const base = congelar(structuredClone(exemplo));
    const a = generateVariations(base, { axis, count: 3, seed: 7 });
    const b = generateVariations(base, { axis, count: 3, seed: 7 });
    assert.deepEqual(a, b);
    assert.equal(a.length, 3);
    assert.equal(new Set(a.map((v) => v.id)).size, 3, 'variantes diferentes entre si');
    assert.deepEqual(base, exemplo, 'o original não muda');
    for (const v of a) {
      assert.deepEqual(validateProject(v.project).errors, [], v.id);
      assert.equal(getTimeline(v.project).totalFrames, 450, v.id);
      assert.deepEqual(textos(v.project), textos(exemplo), v.id);
      assert.deepEqual(v.project.scenes.map((s) => s.durationFrames), exemplo.scenes.map((s) => s.durationFrames), v.id);
      assert.ok(v.changes.length > 0 && v.divergence > 0 && v.divergence <= 100, v.id);
      assert.notDeepEqual(v.project.scenes, exemplo.scenes, v.id);
      assert.equal(v.project.project.id, `oferta-armacoes-9x16-${v.id}`);
    }
  });
}

test('semente diferente muda a ordem; count limita', () => {
  const ordens = new Set([1, 2, 3, 4, 5, 6].map((seed) => generateVariations(exemplo, { axis: 'entrada', count: 4, seed }).map((v) => v.id).join(',')));
  assert.ok(ordens.size > 1);
  assert.equal(generateVariations(exemplo, { axis: 'ritmo', count: 1 }).length, 1);
  assert.throws(() => generateVariations(exemplo, { axis: 'cores' }), /eixo desconhecido/);
});

test('a lista de mudanças bate com a diferença real entre os arquivos', () => {
  for (const v of generateVariations(exemplo, { axis: 'ritmo', count: 2, seed: 3 })) {
    const antes = new Map(exemplo.scenes.flatMap((s) => s.layers).map((l) => [l.id, JSON.stringify(l.animations ?? [])]));
    const mudaram = v.project.scenes.flatMap((s) => s.layers).filter((l) => JSON.stringify(l.animations ?? []) !== antes.get(l.id)).map((l) => l.id).sort();
    assert.deepEqual(v.changes.map((c) => c.split(':')[0]).sort(), mudaram, v.id);
    // fora das animações, nada muda
    const semAnim = (p) => p.scenes.map((s) => s.layers.map(({ animations, ...resto }) => resto));
    assert.deepEqual(semAnim(v.project), semAnim(exemplo));
  }
});

test('entrada: quem não tinha entrada continua sem; saída é preservada', () => {
  const [v] = generateVariations(exemplo, { axis: 'entrada', count: 1, seed: 2 });
  const camada = (p, id) => p.scenes.flatMap((s) => s.layers).find((l) => l.id === id);
  assert.deepEqual(camada(v.project, 'gancho-titulo').animations, camada(exemplo, 'gancho-titulo').animations, 'só tinha saída');
  assert.equal(camada(v.project, 'gancho-foto').animations, undefined);
  assert.ok(camada(v.project, 'produto-foto').animations.every((a) => a.delayFrames === 6), 'o atraso da entrada é mantido');
});

test('writeVariations grava projetos irmãos com os assets', (t) => {
  const pasta = mkdtempSync(path.join(tmpdir(), 'mazy-var-'));
  t.after(() => rmSync(pasta, { recursive: true, force: true }));
  cpSync(dir, pasta, { recursive: true });
  const r = writeVariations({ dir: pasta, axis: 'entrada', count: 2, seed: 1 });
  assert.equal(r.variations.length, 2);
  for (const v of r.variations) {
    assert.equal(v.dir, path.join(pasta, 'variantes', v.id));
    const projeto = JSON.parse(readFileSync(path.join(v.dir, 'project.mazy.json'), 'utf8'));
    assert.deepEqual(validateProject(projeto).errors, []);
    assert.ok(existsSync(path.join(v.dir, 'assets', 'logo-claro.svg')));
  }
  assert.equal(JSON.parse(readFileSync(path.join(pasta, 'project.mazy.json'), 'utf8')).project.revision, 1, 'o original fica como estava');
});
