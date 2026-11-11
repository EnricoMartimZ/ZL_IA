// Etapa 7.1: crítica por regras. Cada regra tem um projeto que a dispara; o exemplo tem nota estável.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { critiqueProject, critiqueText, contrast, DIMENSIONS } from '../critique/index.js';
import { applyPatch } from '../../fixtures/patch.js';

const motor = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const dir = path.join(motor, 'fixtures/projects/motion-ad-4-scenes');
const exemplo = JSON.parse(readFileSync(path.join(dir, 'project.mazy.json'), 'utf8'));
const semMedir = (project) => critiqueProject({ project, measure: false });
const codigos = (c, severidade) => c.findings.filter((f) => !severidade || f.severity === severidade).map((f) => f.code);
const com = async (ops) => semMedir(applyPatch(exemplo, ops));
const cabe = async () => [];

test('contraste do WCAG', () => {
  assert.equal(Math.round(contrast('#FFFFFF', '#000000')), 21);
  assert.equal(contrast('#777777', '#777777'), 1);
  assert.ok(Math.abs(contrast('#FFFFFF', '#E4572E') - 3.6) < 0.15);
  assert.equal(Object.values(DIMENSIONS).reduce((a, b) => a + b, 0), 1);
});

test('o exemplo tem nota e achados estáveis', async () => {
  const a = await critiqueProject({ project: exemplo, dir, measure: cabe });
  const b = await critiqueProject({ project: exemplo, dir, measure: cabe });
  assert.deepEqual(a, b);
  assert.equal(a.score, 98);
  assert.equal(a.measured, true);
  assert.deepEqual(codigos(a).sort(), ['COLORS_IN_BRAND', 'CONTRAST_NOT_MEASURED', 'CONTRAST_NOT_MEASURED', 'EMPTY_START', 'HOOK_AT_FRAME_0']);
  assert.deepEqual(codigos(a, 'critical'), []);
  assert.deepEqual(codigos(a, 'warning'), []);
  assert.match(critiqueText(a), /Crítica por regras: 98\/100/);
  assert.match(critiqueText(a), /Legibilidade: 94\/100/);
});

const CASOS = [
  ['texto pequeno', 'TEXT_TOO_SMALL', 'critical', [{ op: 'set', path: '/scenes/0/layers/3/text/fontSize', value: 20 }]],
  ['contraste baixo', 'LOW_CONTRAST', 'critical', [{ op: 'set', path: '/scenes/1/layers/1/text/color', value: '#E8E4DC' }]],
  ['texto fora da área segura', 'TEXT_OUTSIDE_SAFE_AREA', 'warning', [{ op: 'set', path: '/scenes/1/layers/1/box/y', value: 1500 }]],
  ['pouco tempo para ler', 'READING_TIME', 'warning', [{ op: 'set', path: '/scenes/1/layers/1/text/content', value: 'Armação e lentes prontas em uma hora com garantia de um ano na loja' }]],
  ['linha longa em fonte grande', 'LINE_TOO_LONG', 'info', [{ op: 'set', path: '/scenes/1/layers/1/text/content', value: 'Armação mais lentes prontas em uma hora' }]],
  ['pisca rápido demais', 'FLASH_HAZARD', 'critical', [{ op: 'set', path: '/scenes/2/layers/0/keyframes/opacity', value: [0, 3, 6, 9, 12, 15, 18, 21].map((frame, i) => ({ frame, value: i % 2 })) }]],
  ['texto demais na cena', 'TOO_MUCH_TEXT', 'warning', [{ op: 'set', path: '/scenes/2/layers/1/text/content', value: 'em todas as armações de grau e de sol da loja inteira só esta semana' }]],
  ['cor fora da marca', 'COLOR_NOT_IN_BRAND', 'warning', [{ op: 'set', path: '/scenes/2/layers/1/text/color', value: '#00FF00' }]],
  ['sem logo', 'NO_LOGO', 'warning', [{ op: 'remove', path: '/scenes/3/layers/0' }]],
  ['logo pequeno', 'LOGO_TOO_SMALL', 'warning', [{ op: 'set', path: '/scenes/3/layers/0/box/width', value: 120 }]],
  ['fonte sem arquivo', 'FONT_WITHOUT_FILE', 'info', [{ op: 'remove', path: '/brand/fonts/body/assetId' }]],
  ['abre sem gancho', 'HOOK_NOT_AT_FRAME_0', 'critical', [{ op: 'set', path: '/scenes/0/layers/0/startFrame', value: 10 }, { op: 'set', path: '/scenes/0/layers/0/durationFrames', value: 86 }, { op: 'remove', path: '/scenes/0/layers/0/keyframes' }, { op: 'set', path: '/scenes/0/layers/2/startFrame', value: 10 }, { op: 'set', path: '/scenes/0/layers/2/durationFrames', value: 86 }]],
  ['trecho parado', 'STATIC_STRETCH', 'warning', [{ op: 'set', path: '/scenes/3/durationFrames', value: 300 }, { op: 'set', path: '/composition/durationFrames', value: 624 }]],
  ['cena curta demais', 'SCENE_TOO_SHORT', 'warning', [{ op: 'set', path: '/scenes/0/durationFrames', value: 30 }, { op: 'set', path: '/composition/durationFrames', value: 384 }, { op: 'set', path: '/scenes/0/layers', value: [] }, { op: 'set', path: '/scenes/0/background', value: 'brand.accent' }]],
  ['primeira cena não é gancho', 'NO_HOOK_BEAT', 'warning', [{ op: 'set', path: '/scenes/0/beat/role', value: 'product' }]],
  ['sem chamada no fim', 'NO_CTA', 'critical', [{ op: 'set', path: '/scenes/3/beat/role', value: 'other' }]],
  ['chamada do briefing ausente', 'BRIEF_CTA_MISSING', 'warning', [{ op: 'set', path: '/project/brief/callToAction', value: 'Agende pelo site' }]],
  ['duração incomum', 'DURATION_UNUSUAL', 'info', [{ op: 'set', path: '/scenes', value: [{ id: 'unica', name: 'Única', durationFrames: 90, background: 'brand.accent', beat: { role: 'cta' }, layers: [] }] }, { op: 'set', path: '/composition/durationFrames', value: 90 }]],
  ['imagem menor que a caixa', 'IMAGE_LOW_RES', 'warning', [{ op: 'set', path: '/assets/1/width', value: 300 }, { op: 'set', path: '/assets/1/height', value: 300 }]],
];
for (const [nome, codigo, severidade, ops] of CASOS) {
  test(`dispara ${codigo}: ${nome}`, async () => {
    const c = await com(ops);
    assert.ok(c.findings.some((f) => f.code === codigo && f.severity === severidade), `esperava ${codigo} (${severidade}), veio: ${JSON.stringify(c.findings.map((f) => `${f.code}/${f.severity}`))}`);
    assert.ok(!codigos(await semMedir(exemplo)).includes(codigo), 'e o exemplo sem o defeito não dispara');
  });
}

test('texto sobre cor chapada é medido; sobre foto, fica para o olhar', async () => {
  const ok = await semMedir(exemplo);
  assert.ok(!ok.findings.some((f) => f.code === 'LOW_CONTRAST'));
  assert.deepEqual(ok.findings.filter((f) => f.code === 'CONTRAST_NOT_MEASURED').map((f) => f.layerId), ['gancho-titulo', 'gancho-apoio']);
  // "Só até sexta" está sobre a etiqueta escura, não sobre o laranja da cena: branco passa
  assert.ok(!ok.findings.some((f) => f.layerId === 'oferta-prazo'));
});

test('medição no navegador: texto que não cabe e texto que quebrou', async () => {
  const medidas = async () => [
    { layerId: 'oferta-numero', boxWidth: 952, boxHeight: 300, textWidth: 952, textHeight: 480, lines: 2, expectedLines: 1, wrapped: true, overflow: true },
    { layerId: 'produto-titulo', boxWidth: 952, boxHeight: 200, textWidth: 952, textHeight: 190, lines: 3, expectedLines: 2, wrapped: true, overflow: false },
  ];
  const c = await critiqueProject({ project: exemplo, dir, measure: medidas });
  assert.deepEqual(c.findings.filter((f) => f.code === 'TEXT_OVERFLOW').map((f) => [f.layerId, f.severity]), [['oferta-numero', 'critical']]);
  assert.deepEqual(c.findings.filter((f) => f.code === 'TEXT_WRAPPED').map((f) => [f.layerId, f.severity]), [['produto-titulo', 'warning']]);
  const sem = await semMedir(exemplo);
  assert.equal(sem.measured, false);
  assert.ok(codigos(sem).includes('TEXT_NOT_MEASURED'));
  const falhou = await critiqueProject({ project: exemplo, dir, measure: async () => { throw new Error('sem navegador'); } });
  assert.ok(falhou.findings.some((f) => f.code === 'TEXT_NOT_MEASURED' && f.message.includes('sem navegador')));
});

test('projeto inválido: a crítica para nos erros de validação', async () => {
  const c = await com([{ op: 'set', path: '/composition/durationFrames', value: 451 }]);
  assert.deepEqual(codigos(c), ['DURATION_MISMATCH']);
  assert.equal(c.dimensions.tecnica.score, 70);
});

test('arquivo de asset que falta é crítico', async () => {
  const c = await critiqueProject({ project: exemplo, dir: path.join(motor, 'fixtures'), measure: false });
  assert.equal(c.findings.filter((f) => f.code === 'ASSET_FILE_MISSING').length, exemplo.assets.length);
  assert.equal(c.dimensions.tecnica.score, 0);
});
