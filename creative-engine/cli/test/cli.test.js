// CLI: códigos de saída, formato do --json e o fluxo criar → editar → desfazer.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdtempSync, rmSync, cpSync, writeFileSync, readFileSync, existsSync, mkdirSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const motor = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const cli = path.join(motor, 'cli', 'mazy-creative.js');
const exemploDir = path.join(motor, 'fixtures/projects/motion-ad-4-scenes');
const rodar = (args, opcoes = {}) => {
  const r = spawnSync(process.execPath, [cli, ...args], { encoding: 'utf8', ...opcoes });
  return { codigo: r.status, saida: r.stdout, erro: r.stderr, json: () => JSON.parse(r.stdout) };
};
const pastaNova = (t) => { const d = mkdtempSync(path.join(tmpdir(), 'mazy-cli-')); t.after(() => rmSync(d, { recursive: true, force: true })); return d; };
const copiaDoExemplo = (t) => { const d = pastaNova(t); cpSync(exemploDir, d, { recursive: true }); return d; };

test('sem comando mostra a ajuda; comando desconhecido e falta de argumento são uso errado (2)', () => {
  assert.equal(rodar([]).codigo, 0);
  assert.match(rodar(['--help']).saida, /Creative Engine do MazyOS/);
  assert.equal(rodar(['explodir', 'x']).codigo, 2);
  assert.equal(rodar(['validate']).codigo, 2);
  const j = rodar(['apply', exemploDir, '--json']);
  assert.equal(j.codigo, 2);
  assert.deepEqual(Object.keys(j.json()), ['ok', 'data', 'errors']);
  assert.equal(j.json().errors[0].code, 'USAGE');
});

test('validate: 0 no exemplo, 1 em projeto inválido, com código e caminho no --json', (t) => {
  const ok = rodar(['validate', exemploDir, '--json']);
  assert.equal(ok.codigo, 0);
  assert.deepEqual(ok.json(), { ok: true, data: { valid: true, warnings: [] }, errors: [] });
  assert.match(rodar(['validate', exemploDir]).saida, /✓ Projeto válido \(450 quadros\)/);

  const dir = copiaDoExemplo(t);
  const projeto = JSON.parse(readFileSync(path.join(dir, 'project.mazy.json'), 'utf8'));
  projeto.scenes[0].layers[0].type = 'video';
  writeFileSync(path.join(dir, 'project.mazy.json'), JSON.stringify(projeto));
  const ruim = rodar(['validate', dir, '--json']);
  assert.equal(ruim.codigo, 1);
  assert.equal(ruim.json().ok, false);
  assert.ok(ruim.json().errors.some((e) => e.code === 'SCHEMA_ENUM' && e.path === '/scenes/0/layers/0/type'));
  assert.match(rodar(['validate', dir]).erro, /SCHEMA_ENUM \/scenes\/0\/layers\/0\/type/);

  assert.equal(rodar(['validate', pastaNova(t), '--json']).json().errors[0].code, 'PROJECT_NOT_FOUND');
});

test('validate aponta arquivo de asset que falta', (t) => {
  const dir = copiaDoExemplo(t);
  rmSync(path.join(dir, 'assets', 'logo-claro.svg'));
  const r = rodar(['validate', dir, '--json']);
  assert.equal(r.codigo, 1);
  assert.deepEqual(r.json().errors.map((e) => e.code), ['ASSET_FILE_MISSING']);
});

test('inspect mostra cenas, inícios e camadas', () => {
  const texto = rodar(['inspect', exemploDir]).saida;
  assert.match(texto, /1080×1920 · 30 fps · 450 quadros = 15,00 s/);
  assert.match(texto, /▸ cena-produto \[product\]  quadros 84–215 .* entra com fade de 12/);
  assert.match(texto, /oferta-numero\s+text\s+6–131\s+"20% OFF"\s+in:scale\/14 in:fade\/8 kf:scale/);
  const j = rodar(['inspect', exemploDir, '--json']).json().data;
  assert.deepEqual(j.scenes.map((s) => s.startFrame), [0, 84, 204, 324]);
  assert.equal(j.scenes[0].layers.length, 4);
});

test('catalog lista o que existe', () => {
  const j = rodar(['catalog', '--json']).json().data;
  assert.deepEqual(j.animations.map((a) => a.id), ['fade', 'slide', 'scale']);
  assert.ok(j.commands.includes('layer.update'));
  assert.equal(j.templates[0].id, 'motion-ad-9x16');
});

test('new cria um projeto válido e não sobrescreve um que existe', (t) => {
  const dir = path.join(pastaNova(t), 'criativos', 'Oferta de Verão');
  const r = rodar(['new', dir, '--name', 'Oferta de verão', '--client', 'cliente-exemplo', '--json']);
  assert.equal(r.codigo, 0, r.erro);
  const projeto = JSON.parse(readFileSync(path.join(dir, 'project.mazy.json'), 'utf8'));
  assert.equal(projeto.project.id, 'oferta-de-verao');
  assert.equal(projeto.project.name, 'Oferta de verão');
  assert.equal(projeto.clientId, 'cliente-exemplo');
  assert.ok(existsSync(path.join(dir, 'assets')));
  assert.equal(rodar(['validate', dir]).codigo, 0);
  assert.equal(rodar(['new', dir, '--json']).json().errors[0].code, 'PROJECT_EXISTS');
});

test('apply: simula, grava com checkpoint, recusa comando ruim sem alterar, e rollback desfaz', (t) => {
  const dir = copiaDoExemplo(t);
  const ops = path.join(dir, 'ops.json');
  writeFileSync(ops, JSON.stringify([
    { type: 'layer.update', layerId: 'oferta-numero', patch: { text: { content: '30% OFF' } } },
    { type: 'scene.update', sceneId: 'cena-chamada', patch: { durationFrames: 156 } },
  ]));
  const nome = () => JSON.parse(readFileSync(path.join(dir, 'project.mazy.json'), 'utf8')).scenes[2].layers[0].text.content;

  const simulado = rodar(['apply', dir, '--ops', ops, '--dry-run']);
  assert.equal(simulado.codigo, 0);
  assert.match(simulado.saida, /Simulação: nada foi gravado/);
  assert.match(simulado.saida, /duração total: 450 → 480 quadros/);
  assert.equal(nome(), '20% OFF');

  const aplicado = rodar(['apply', dir, '--ops', ops, '--source', 'claude', '--label', 'oferta de 30', '--json']);
  assert.equal(aplicado.codigo, 0, aplicado.erro);
  const dados = aplicado.json().data;
  assert.equal(dados.revision, 2);
  assert.equal(nome(), '30% OFF');
  assert.equal(rodar(['validate', dir]).codigo, 0);

  const historia = rodar(['history', dir, '--json']).json().data;
  assert.deepEqual([historia[0].kind, historia[0].source, historia[0].label, historia[0].revision], ['checkpoint', 'claude', 'oferta de 30', 1]);

  writeFileSync(ops, JSON.stringify([{ type: 'layer.update', layerId: 'oferta-numero', patch: { text: { content: 'X' } } }, { type: 'layer.remove', layerId: 'nao-existe' }]));
  const recusado = rodar(['apply', dir, '--ops', ops, '--json']);
  assert.equal(recusado.codigo, 1);
  assert.equal(recusado.json().errors[0].code, 'LAYER_NOT_FOUND');
  assert.equal(nome(), '30% OFF', 'nada mudou');

  const entrada = rodar(['apply', dir, '--ops', '-', '--json'], { input: JSON.stringify({ commands: [{ type: 'export.update', patch: { crf: 28 } }] }) });
  assert.equal(entrada.codigo, 0, entrada.erro);

  const volta = rodar(['rollback', dir, '--to', dados.checkpointId]);
  assert.equal(volta.codigo, 0);
  assert.equal(nome(), '20% OFF');
  assert.equal(rodar(['version', dir, '--label', 'aprovada pelo cliente']).codigo, 0);
  assert.equal(rodar(['version', dir]).codigo, 2);
  assert.match(rodar(['history', dir]).saida, /★ .* aprovada pelo cliente/);
});

test('asset-add copia o arquivo, mede e registra', (t) => {
  const dir = copiaDoExemplo(t);
  const r = rodar(['asset-add', dir, path.join(exemploDir, 'assets', 'foto-armacao.jpg'), '--id', 'foto-vitrine', '--provenance', 'client', '--json']);
  assert.equal(r.codigo, 0, r.erro);
  const { asset } = r.json().data;
  assert.deepEqual([asset.id, asset.type, asset.src, asset.width, asset.height, asset.provenance], ['foto-vitrine', 'image', 'assets/foto-vitrine.jpg', 800, 800, 'client']);
  assert.ok(existsSync(path.join(dir, 'assets', 'foto-vitrine.jpg')));
  assert.equal(rodar(['validate', dir]).codigo, 0);
  assert.equal(rodar(['asset-add', dir, cli]).codigo, 2, 'extensão que não é asset');
  assert.equal(rodar(['asset-add', dir, path.join(exemploDir, 'assets', 'foto-armacao.jpg'), '--id', 'foto-vitrine']).codigo, 1, 'id repetido');
});

test('brand-import traz cores, fontes e o logo do marca.json', (t) => {
  const dir = path.join(pastaNova(t), 'criativo');
  const marcaDir = path.join(pastaNova(t), 'marca');
  mkdirSync(path.join(marcaDir, 'assets'), { recursive: true });
  cpSync(path.join(exemploDir, 'assets', 'logo-escuro.svg'), path.join(marcaDir, 'assets', 'logo-recorte.svg'));
  writeFileSync(path.join(marcaDir, 'marca.json'), JSON.stringify({
    cores: { fundo: '#f6f4ef', texto: '#14181f', destaque: '#e4572e', base_escura: '#14181f', secundarias: [] },
    tipografia: { titulos: 'Archivo', corpo: 'Inter', google: [] }, logo: { arquivo: 'assets/logo-recorte.svg', fundo: 'claro' },
  }));
  const criado = rodar(['new', dir, '--brand', path.join(marcaDir, 'marca.json'), '--json']);
  assert.equal(criado.codigo, 0, criado.erro + criado.saida);
  const projeto = JSON.parse(readFileSync(path.join(dir, 'project.mazy.json'), 'utf8'));
  assert.equal(projeto.brand.colors.accent, '#E4572E');
  assert.equal(projeto.brand.fonts.heading.family, 'Archivo');
  assert.equal(projeto.brand.logos.primary, 'logo-marca');
  assert.ok(existsSync(path.join(dir, 'assets', 'logo-marca.svg')));
  assert.match(projeto.brand.source, /marca\.json$/);
  assert.ok(criado.json().data.notes.some((n) => n.includes('fundo claro')));
  assert.equal(rodar(['validate', dir]).codigo, 0);
});

test('critique e variations pela CLI', (t) => {
  const dir = copiaDoExemplo(t);
  const critica = rodar(['critique', dir, '--json']);
  assert.equal(critica.codigo, 0, critica.erro);
  const c = critica.json().data;
  assert.equal(typeof c.score, 'number');
  assert.deepEqual(Object.keys(c.dimensions), ['legibilidade', 'mensagem', 'marca', 'ritmo', 'tecnica']);
  assert.match(rodar(['critique', dir]).saida, /Crítica por regras: \d+\/100/);

  const v = rodar(['variations', dir, '--axis', 'ritmo', '--count', '2', '--seed', '5', '--json']);
  assert.equal(v.codigo, 0, v.erro);
  const { variations } = v.json().data;
  assert.equal(variations.length, 2);
  for (const item of variations) assert.equal(rodar(['validate', item.dir]).codigo, 0, item.id);
  assert.deepEqual(rodar(['variations', dir, '--axis', 'ritmo', '--count', '2', '--seed', '5', '--json']).json().data.variations.map((x) => x.id), variations.map((x) => x.id));
  assert.equal(rodar(['variations', dir, '--count', 'dois']).codigo, 2);
});

test('frame grava um PNG do quadro pedido; quadro fora do vídeo é recusado', (t) => {
  const dir = copiaDoExemplo(t);
  const r = rodar(['frame', dir, '--at', '120', '--json']);
  assert.equal(r.codigo, 0, r.erro);
  assert.ok(existsSync(path.join(dir, 'renders', 'frame-000120.png')));
  assert.equal(rodar(['frame', dir, '--at', '9999', '--json']).json().errors[0].code, 'BAD_RANGE');
  assert.equal(rodar(['frame', dir]).codigo, 2);
});

test('Node antigo recebe a mensagem certa e código 3', { skip: existsSync('/usr/bin/node') ? false : 'pulado: não há outro Node na máquina para comparar' }, () => {
  const versao = spawnSync('/usr/bin/node', ['-v'], { encoding: 'utf8' }).stdout.trim();
  const [maior, menor] = versao.slice(1).split('.').map(Number);
  if ((maior === 20 && menor >= 19) || (maior === 22 && menor >= 12) || maior > 22) return; // este Node serve: nada a provar
  const r = spawnSync('/usr/bin/node', [cli, 'validate', exemploDir], { encoding: 'utf8' });
  assert.equal(r.status, 3);
  assert.match(r.stderr, /pede Node \^20\.19 ou >=22\.12/);
});
