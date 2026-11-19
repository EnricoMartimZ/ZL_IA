// CLI do Creative Engine: é por aqui que o Claude Code cria, confere, edita e exporta um projeto.
// Saída em português; com --json, sempre { ok, data, errors: [{ code, path, message }] }.
// Códigos de saída: 0 certo · 1 projeto inválido ou comando recusado · 2 uso errado · 3 falta algo na máquina.
import { copyFileSync, existsSync, mkdirSync, readFileSync } from 'node:fs';
import path from 'node:path';
import {
  validateProject, getTimeline, applyCommands, createProject, listTemplates, listPresets, listTransitions,
  COMMAND_TYPES, EASING_NAMES, ANIMATABLE,
} from '../core/src/index.js';
import { openProject, saveProject, checkpoint, saveVersion, listHistory, rollback, missingAssetFiles, projectDir, StorageError, PROJECT_FILE } from '../storage/index.js';
import { brandFromMarca } from '../intelligence/brand/index.js';
import { describeAsset, assetTypesFor } from '../renderer/media/index.js';

class Uso extends Error {}
const usar = (mensagem) => { throw new Uso(mensagem); };
const slug = (texto) => texto.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
const segundos = (quadros, fps) => `${(quadros / fps).toFixed(2).replace('.', ',')} s`;

const AJUDA = `Creative Engine do ZL_IA

  node creative-engine/cli/mazy-creative.js <comando> <pasta-do-projeto> [opções]

Criar e conferir
  new <pasta> [--name "Nome"] [--id slug] [--client slug] [--brand marca.json] [--template motion-ad-9x16]
  validate <pasta>            forma, regras e arquivos de asset
  inspect <pasta>             resumo: cenas, tempos e camadas
  catalog                     modelos, animações, transições, curvas e comandos que existem

Editar
  apply <pasta> --ops <arquivo.json | -> [--dry-run] [--label "o que mudou"]
  asset-add <pasta> <arquivo> [--id slug] [--type image|logo|font] [--provenance client|ai-generated|own] [--alt "texto"]
  brand-import <pasta> <marca.json>

Histórico
  checkpoint <pasta> [--label "texto"]
  version <pasta> --label "aprovada pelo cliente"
  history <pasta>
  rollback <pasta> [--to <id>]     sem --to, volta ao checkpoint mais recente

Ver e exportar
  frame <pasta> --at <quadro> [--out arquivo.png]
  contact-sheet <pasta> [--out arquivo.png]
  critique <pasta>            crítica por regras, com nota
  variations <pasta> [--axis entrada|ritmo] [--count 3] [--seed 1]
  render <pasta> [--out arquivo.mp4] [--range 0-89] [--crf 28]
  edit <pasta> [--port 5177]  abre o editor

Em todos: --json (saída para máquina) e --source claude|cli (quem está gravando; vai para o log).`;

function lerArgs(argv) {
  const flags = {}, posicionais = [];
  const BOOLEANAS = new Set(['json', 'dry-run', 'help', 'no-open']);
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a.startsWith('--')) {
      const nome = a.slice(2);
      if (BOOLEANAS.has(nome)) flags[nome] = true;
      else { if (argv[i + 1] === undefined) usar(`faltou o valor de --${nome}`); flags[nome] = argv[++i]; }
    } else posicionais.push(a);
  }
  return { comando: posicionais[0], args: posicionais.slice(1), flags };
}

const inteiro = (valor, nome) => { const n = Number(valor); if (!Number.isInteger(n)) usar(`--${nome} tem que ser um número inteiro`); return n; };
const pasta = (args) => args[0] ?? usar('faltou a pasta do projeto');
const origem = (flags) => (['claude', 'cli', 'editor'].includes(flags.source ?? 'cli') ? flags.source ?? 'cli' : usar('--source aceita claude ou cli'));

function conferir(dir, project) {
  const v = validateProject(project);
  const faltando = v.valid ? missingAssetFiles(dir, project) : [];
  return { valid: v.valid && faltando.length === 0, errors: [...v.errors, ...faltando], warnings: v.warnings };
}
const listar = (problemas, marca) => problemas.map((p) => `  ${marca} ${p.code} ${p.path || '/'}\n      ${p.message}${p.hint ? `\n      ${p.hint}` : ''}`).join('\n');

function resumo(project) {
  const { fps } = project.composition;
  const linha = getTimeline(project);
  return {
    id: project.project.id, name: project.project.name, clientId: project.clientId, revision: project.project.revision,
    composition: { ...project.composition, seconds: linha.totalFrames / fps },
    assets: project.assets.map(({ id, type, src }) => ({ id, type, src })),
    scenes: project.scenes.map((cena, i) => ({
      id: cena.id, name: cena.name, role: cena.beat?.role ?? null,
      startFrame: linha.scenes[i].startFrame, endFrame: linha.scenes[i].endFrame, durationFrames: cena.durationFrames,
      transitionIn: cena.transitionIn ?? null, background: cena.background ?? null,
      layers: cena.layers.map((l) => ({
        id: l.id, type: l.type, startFrame: l.startFrame, durationFrames: l.durationFrames, box: l.box,
        content: l.type === 'text' ? l.text.content : l.type === 'shape' ? l.shape.kind : (l.image ?? l.logo).assetId,
        animations: (l.animations ?? []).map((a) => `${a.role}:${a.preset}/${a.durationFrames}`),
        keyframes: Object.keys(l.keyframes ?? {}),
      })),
    })),
  };
}

function textoDoResumo(r) {
  const { fps } = r.composition;
  const linhas = [
    `${r.name}  (${r.id} · cliente: ${r.clientId ?? 'próprio negócio'} · revisão ${r.revision})`,
    `${r.composition.width}×${r.composition.height} · ${fps} fps · ${r.composition.durationFrames} quadros = ${segundos(r.composition.durationFrames, fps)} · ${r.assets.length} asset(s)`,
  ];
  for (const c of r.scenes) {
    const t = c.transitionIn ? ` · entra com ${c.transitionIn.type} de ${c.transitionIn.durationFrames}` : '';
    linhas.push('', `▸ ${c.id}${c.role ? ` [${c.role}]` : ''}  quadros ${c.startFrame}–${c.endFrame - 1} (${segundos(c.startFrame, fps)} a ${segundos(c.endFrame, fps)})${t}`);
    for (const l of c.layers) {
      const extra = [...l.animations, ...l.keyframes.map((k) => `kf:${k}`)].join(' ');
      linhas.push(`    ${l.id.padEnd(22)} ${l.type.padEnd(5)} ${String(l.startFrame).padStart(3)}–${String(l.startFrame + l.durationFrames - 1).padEnd(3)}  ${JSON.stringify(l.content).slice(0, 44)}${extra ? `  ${extra}` : ''}`);
    }
  }
  return linhas.join('\n');
}

const COMANDOS = {
  async catalog() {
    const data = { templates: listTemplates(), animations: listPresets(), transitions: listTransitions(), easings: EASING_NAMES, animatable: ANIMATABLE, commands: COMMAND_TYPES };
    const texto = [
      'Modelos de projeto:', ...data.templates.map((t) => `  ${t.id} — ${t.description}`),
      'Animações prontas (role in ou out):', ...data.animations.map((p) => `  ${p.id} — ${p.description}`),
      'Transições entre cenas:', ...data.transitions.map((t) => `  ${t.id} — ${t.description}`),
      `Curvas: ${data.easings.join(', ')}`, `Propriedades com keyframe: ${data.animatable.join(', ')}`, `Comandos do apply: ${data.commands.join(', ')}`,
    ].join('\n');
    return { data, texto };
  },

  async new({ args, flags }) {
    const dir = projectDir(pasta(args));
    if (existsSync(path.join(dir, PROJECT_FILE))) return { codigo: 1, errors: [{ code: 'PROJECT_EXISTS', path: '', message: `Já existe um projeto em ${dir}.` }] };
    const id = flags.id ?? slug(path.basename(dir));
    let brand, notas = [];
    const projeto = createProject({ template: flags.template, id, name: flags.name ?? id, clientId: flags.client ?? null, brand, now: new Date().toISOString() });
    const gravado = saveProject(dir, projeto, { source: origem(flags), label: 'projeto criado' });
    mkdirSync(path.join(dir, 'assets'), { recursive: true });
    if (flags.brand) notas = (await COMANDOS['brand-import']({ args: [dir, flags.brand], flags })).data.notes;
    const { project } = openProject(dir);
    return { data: { dir, revision: project.project.revision, warnings: gravado.warnings, notes: notas }, texto: `Projeto criado em ${dir}\n${textoDoResumo(resumo(project))}${notas.length ? `\n\nSobre a marca:\n${notas.map((n) => `  - ${n}`).join('\n')}` : ''}` };
  },

  async validate({ args }) {
    const { dir, project } = openProject(pasta(args));
    const v = conferir(dir, project);
    const texto = [
      v.valid ? `✓ Projeto válido (${getTimeline(project).totalFrames} quadros).` : `✗ Projeto inválido: ${v.errors.length} erro(s).`,
      v.errors.length ? listar(v.errors, '✗') : '', v.warnings.length ? `Avisos (${v.warnings.length}):\n${listar(v.warnings, '!')}` : '',
    ].filter(Boolean).join('\n');
    return { codigo: v.valid ? 0 : 1, data: { valid: v.valid, warnings: v.warnings }, errors: v.errors, texto };
  },

  async inspect({ args }) {
    const { project } = openProject(pasta(args));
    const data = resumo(project);
    return { data, texto: textoDoResumo(data) };
  },

  async apply({ args, flags }) {
    const { dir, project, revision } = openProject(pasta(args));
    if (!flags.ops) usar('faltou --ops <arquivo.json> (ou - para ler da entrada)');
    let lido;
    try { lido = JSON.parse(readFileSync(flags.ops === '-' ? 0 : flags.ops, 'utf8')); } catch (e) { usar(`não consegui ler os comandos: ${e.message}`); }
    const comandos = Array.isArray(lido) ? lido : lido?.commands;
    const r = applyCommands(project, comandos);
    if (!r.ok) {
      const onde = r.error.index === null ? '' : ` (comando ${r.error.index + 1})`;
      return { codigo: 1, errors: [{ code: r.error.code, path: '', message: r.error.message + onde }, ...(r.error.problems ?? [])], texto: `✗ ${r.error.message}${onde}\n${listar(r.error.problems ?? [], '✗')}\nNada foi alterado.` };
    }
    const mudancas = r.changes.map((c) => `  ${c.type === 'auto' ? '·' : '✓'} ${c.type === 'auto' ? c.target : `${c.type} → ${c.target}`}`).join('\n');
    if (flags['dry-run']) return { data: { dryRun: true, changes: r.changes, durationFrames: r.project.composition.durationFrames }, texto: `Simulação: nada foi gravado.\n${mudancas}\nDuração depois: ${r.project.composition.durationFrames} quadros.` };
    const gravado = saveProject(dir, r.project, { baseRevision: revision, source: origem(flags), label: flags.label ?? `apply: ${r.changes.length} mudança(s)` });
    const faltando = missingAssetFiles(dir, gravado.project);
    return {
      data: { changes: r.changes, revision: gravado.revision, checkpointId: gravado.checkpointId, warnings: [...gravado.warnings, ...faltando] },
      texto: `${mudancas}\nGravado: revisão ${gravado.revision} (para desfazer: rollback --to ${gravado.checkpointId}).${faltando.length ? `\nFaltam arquivos:\n${listar(faltando, '!')}` : ''}${gravado.warnings.length ? `\nAvisos:\n${listar(gravado.warnings, '!')}` : ''}`,
    };
  },

  async 'asset-add'({ args, flags }) {
    const { dir, project, revision } = openProject(pasta(args));
    const arquivo = args[1] ?? usar('faltou o arquivo');
    if (!existsSync(arquivo)) usar(`arquivo não encontrado: ${arquivo}`);
    const tipos = assetTypesFor(arquivo);
    const type = flags.type ?? tipos[0] ?? usar(`não sei que tipo de asset é ${path.extname(arquivo)}: use --type image, logo ou font`);
    if (!tipos.includes(type)) usar(`${path.extname(arquivo)} não serve como ${type}`);
    const ext = path.extname(arquivo).toLowerCase();
    const id = flags.id ?? (slug(path.basename(arquivo, path.extname(arquivo))).replace(/^[^a-z]+/, '') || 'asset');
    const src = `assets/${type === 'font' ? 'fontes/' : ''}${id}${ext}`;
    const asset = { id, type, src, ...describeAsset(arquivo), ...(flags.provenance ? { provenance: flags.provenance } : {}), ...(flags.alt ? { alt: flags.alt } : {}) };
    const r = applyCommands(project, [{ type: 'asset.add', asset }]);
    // o asset recém-chegado ainda não é usado por ninguém: o aviso UNUSED_ASSET é esperado
    if (!r.ok) return { codigo: 1, errors: [{ code: r.error.code, path: '', message: r.error.message }, ...(r.error.problems ?? [])], texto: `✗ ${r.error.message}\n${listar(r.error.problems ?? [], '✗')}` };
    mkdirSync(path.dirname(path.join(dir, src)), { recursive: true });
    copyFileSync(arquivo, path.join(dir, src));
    const gravado = saveProject(dir, r.project, { baseRevision: revision, source: origem(flags), label: `asset ${id}` });
    return { data: { asset, revision: gravado.revision }, texto: `Asset "${id}" (${type}${asset.width ? `, ${asset.width}×${asset.height}` : ''}) copiado para ${src}. Revisão ${gravado.revision}.` };
  },

  async 'brand-import'({ args, flags }) {
    const { dir, project, revision } = openProject(pasta(args));
    const arquivoMarca = args[1] ?? usar('faltou o caminho do marca.json');
    if (!existsSync(arquivoMarca)) usar(`arquivo não encontrado: ${arquivoMarca}`);
    const marca = JSON.parse(readFileSync(arquivoMarca, 'utf8'));
    const comandos = [];
    let logoAssetId = null;
    const logo = marca?.logo?.arquivo ? path.resolve(path.dirname(arquivoMarca), marca.logo.arquivo) : null;
    if (logo && existsSync(logo) && assetTypesFor(logo).includes('logo')) {
      logoAssetId = 'logo-marca';
      const src = `assets/logo-marca${path.extname(logo).toLowerCase()}`;
      mkdirSync(path.join(dir, 'assets'), { recursive: true });
      copyFileSync(logo, path.join(dir, src));
      const asset = { id: logoAssetId, type: 'logo', src, ...describeAsset(logo), provenance: 'client' };
      comandos.push(project.assets.some((a) => a.id === logoAssetId) ? { type: 'asset.update', assetId: logoAssetId, patch: { ...asset, id: undefined } } : { type: 'asset.add', asset });
    }
    const { brand, notes } = brandFromMarca(marca, { source: path.relative(dir, path.resolve(arquivoMarca)).split(path.sep).join('/'), syncedAt: new Date().toISOString(), logoAssetId });
    comandos.push({ type: 'brand.set', brand });
    const r = applyCommands(project, JSON.parse(JSON.stringify(comandos)));
    if (!r.ok) return { codigo: 1, errors: [{ code: r.error.code, path: '', message: r.error.message }, ...(r.error.problems ?? [])], texto: `✗ ${r.error.message}\n${listar(r.error.problems ?? [], '✗')}` };
    const gravado = saveProject(dir, r.project, { baseRevision: revision, source: origem(flags), label: 'marca importada' });
    return { data: { brand, notes, revision: gravado.revision }, texto: `Marca importada (destaque ${brand.colors.accent}, fundo ${brand.colors.background}, texto ${brand.colors.text}). Revisão ${gravado.revision}.\n${notes.map((n) => `  - ${n}`).join('\n')}` };
  },

  async checkpoint({ args, flags }) {
    const meta = checkpoint(pasta(args), { label: flags.label ?? 'checkpoint manual', source: origem(flags) });
    return { data: meta, texto: `Checkpoint ${meta.id} (revisão ${meta.revision}).` };
  },
  async version({ args, flags }) {
    const meta = saveVersion(pasta(args), flags.label ?? usar('faltou --label "nome da versão"'), origem(flags));
    return { data: meta, texto: `Versão ${meta.id} guardada: "${meta.label}".` };
  },
  async history({ args }) {
    const itens = listHistory(pasta(args));
    return { data: itens, texto: itens.length ? itens.map((h) => `${h.kind === 'version' ? '★' : '·'} ${h.id}  ${h.at.slice(0, 19).replace('T', ' ')}  ${h.source.padEnd(6)} ${h.label}`).join('\n') : 'Sem histórico ainda.' };
  },
  async rollback({ args, flags }) {
    const dir = pasta(args);
    const alvo = flags.to ?? listHistory(dir).find((h) => h.kind === 'checkpoint')?.id;
    if (!alvo) return { codigo: 1, errors: [{ code: 'HISTORY_EMPTY', path: '', message: 'Não há checkpoint para voltar.' }] };
    const r = rollback(dir, alvo, origem(flags));
    return { data: r, texto: `Voltei para ${r.restoredFrom}. Revisão ${r.revision}. Para desfazer: rollback --to ${r.undoId}` };
  },

  async frame({ args, flags }) {
    const { renderFrame } = await import('../renderer/export/index.js');
    const r = await renderFrame({ dir: pasta(args), frame: inteiro(flags.at ?? usar('faltou --at <quadro>'), 'at'), output: flags.out });
    return { data: r, texto: `Quadro ${r.frame}: ${r.output}` };
  },
  async 'contact-sheet'({ args, flags }) {
    const { renderContactSheet } = await import('../renderer/export/index.js');
    const r = await renderContactSheet({ dir: pasta(args), output: flags.out });
    return { data: r, texto: `Folha de contato (${r.frames.length} quadros): ${r.output}` };
  },
  async render({ args, flags }) {
    const { renderProject } = await import('../renderer/export/index.js');
    let range;
    if (flags.range) {
      const m = /^(\d+)-(\d+)$/.exec(flags.range) ?? usar('--range tem a forma 0-89');
      range = [Number(m[1]), Number(m[2])];
    }
    let ultimo = -1;
    const r = await renderProject({
      dir: pasta(args), output: flags.out, range, crf: flags.crf === undefined ? undefined : inteiro(flags.crf, 'crf'),
      onProgress: flags.json ? undefined : (feitos, total) => {
        const pct = Math.floor(feitos * 10 / total);
        if (pct !== ultimo) { ultimo = pct; process.stderr.write(`  ${pct * 10}% (${feitos}/${total} quadros)\n`); }
      },
    });
    return { data: r, texto: `✓ ${r.output}\n  ${r.checks.width}×${r.checks.height} · ${r.checks.fps} fps · ${r.checks.frames} quadros · ${segundos(r.checks.frames, r.checks.fps)} · ${r.checks.codec}/${r.checks.pixelFormat}\n  render em ${(r.renderMs / 1000).toFixed(1)} s (${r.msPerFrame} ms por quadro)` };
  },

  async critique({ args }) {
    const { critiqueProject, critiqueText } = await import('../intelligence/critique/index.js');
    const { dir, project } = openProject(pasta(args));
    const data = await critiqueProject({ dir, project });
    return { data, texto: critiqueText(data) };
  },
  async variations({ args, flags }) {
    const { writeVariations } = await import('../intelligence/variations/index.js');
    const r = writeVariations({ dir: pasta(args), axis: flags.axis, count: flags.count === undefined ? undefined : inteiro(flags.count, 'count'), seed: flags.seed === undefined ? undefined : inteiro(flags.seed, 'seed') });
    return { data: r, texto: r.variations.map((v) => `▸ ${v.id}  (${v.axis}: ${v.description})\n    ${v.dir}\n${v.changes.map((c) => `    · ${c}`).join('\n')}`).join('\n') };
  },
  async edit({ args, flags }) {
    const { startEditor } = await import('./server.js');
    const r = await startEditor({ dir: pasta(args), port: flags.port === undefined ? undefined : inteiro(flags.port, 'port') });
    console.log(`Editor aberto em ${r.url}\nProjeto: ${r.dir}\nCtrl+C para fechar.`);
    await new Promise(() => {}); // fica no ar até interromperem
    return {};
  },
};

/** @param {string[]} argv @returns {Promise<number>} código de saída */
export async function main(argv) {
  let json = argv.includes('--json');
  const sair = (codigo, { data = null, errors = [], texto = '' } = {}) => {
    if (json) console.log(JSON.stringify({ ok: codigo === 0, data, errors }, null, 2));
    else if (codigo === 0) { if (texto) console.log(texto); } else console.error(texto || errors.map((e) => `erro: ${e.message}`).join('\n'));
    return codigo;
  };
  try {
    const { comando, args, flags } = lerArgs(argv);
    json = Boolean(flags.json);
    if (!comando || flags.help || comando === 'help') { console.log(AJUDA); return 0; }
    const executar = COMANDOS[comando] ?? usar(`comando desconhecido: ${comando}`);
    const r = await executar({ args, flags });
    return sair(r.codigo ?? 0, r);
  } catch (e) {
    if (e instanceof Uso) return sair(2, { errors: [{ code: 'USAGE', path: '', message: e.message }], texto: `erro: ${e.message}\n\n${AJUDA}` });
    if (e instanceof StorageError) return sair(1, { errors: [{ code: e.code, path: '', message: e.message }, ...(e.problems ?? [])], texto: `erro: ${e.message}${e.problems ? `\n${listar(e.problems, '✗')}` : ''}` });
    if (e?.name === 'RenderError') {
      const codigo = e.code === 'ENVIRONMENT' ? 3 : 1;
      return sair(codigo, { errors: [{ code: e.code, path: '', message: e.message }, ...(e.problems ?? [])], texto: `erro: ${e.message}${e.problems ? `\n${listar(e.problems, '✗')}` : ''}` });
    }
    throw e;
  }
}
