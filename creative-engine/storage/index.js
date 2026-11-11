// Armazenamento: a pasta do projeto no disco. Gravação atômica, revisão que detecta edição
// simultânea e histórico (checkpoints automáticos e versões com nome) em .history/.
import { existsSync, mkdirSync, readFileSync, readdirSync, renameSync, rmSync, statSync, writeFileSync, appendFileSync } from 'node:fs';
import path from 'node:path';
import { validateProject, migrateProject } from '../core/src/index.js';

export const PROJECT_FILE = 'project.mazy.json';
export const CHECKPOINT_LIMIT = 30;

export class StorageError extends Error {
  /** @param {string} code @param {string} message @param {object} [detalhes] */
  constructor(code, message, detalhes = {}) { super(message); this.name = 'StorageError'; this.code = code; Object.assign(this, detalhes); }
}

/** Aceita a pasta do projeto ou o caminho do project.mazy.json. */
export function projectDir(alvo) {
  const absoluto = path.resolve(alvo);
  return absoluto.endsWith('.json') ? path.dirname(absoluto) : absoluto;
}
const arquivoDoProjeto = (dir) => path.join(dir, PROJECT_FILE);
const historia = (dir, ...partes) => path.join(dir, '.history', ...partes);
const agora = () => new Date().toISOString();
const slug = (texto) => String(texto ?? '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')
  .replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 40) || 'sem-nome';

function gravarAtomico(arquivo, texto) {
  mkdirSync(path.dirname(arquivo), { recursive: true });
  const temporario = `${arquivo}.${process.pid}.tmp`;
  writeFileSync(temporario, texto);
  renameSync(temporario, arquivo); // no mesmo disco, a troca é de uma vez: nunca fica arquivo pela metade
}

function registrar(dir, entrada) {
  mkdirSync(historia(dir), { recursive: true });
  appendFileSync(historia(dir, 'log.jsonl'), `${JSON.stringify({ at: agora(), ...entrada })}\n`);
}

/** Arquivos de asset que o projeto cita e que não existem na pasta. */
export function missingAssetFiles(dir, project) {
  return project.assets
    .map((a, i) => ({ a, i }))
    .filter(({ a }) => !existsSync(path.join(dir, a.src)))
    .map(({ a, i }) => ({ code: 'ASSET_FILE_MISSING', path: `/assets/${i}/src`, message: `O arquivo "${a.src}" do asset "${a.id}" não existe na pasta do projeto.` }));
}

/**
 * Abre o projeto de uma pasta.
 * @returns {{ dir: string, project: any, revision: number }}
 */
export function openProject(alvo) {
  const dir = projectDir(alvo);
  const arquivo = arquivoDoProjeto(dir);
  if (!existsSync(arquivo)) throw new StorageError('PROJECT_NOT_FOUND', `Não há ${PROJECT_FILE} em ${dir}.`);
  let project;
  try { project = JSON.parse(readFileSync(arquivo, 'utf8')); } catch (e) {
    throw new StorageError('PROJECT_UNREADABLE', `${PROJECT_FILE} não é um JSON válido: ${e.message}`);
  }
  const versao = migrateProject(project);
  if (!versao.ok) throw new StorageError(versao.code, versao.message);
  return { dir, project, revision: Number.isInteger(project?.project?.revision) ? project.project.revision : 0 };
}

function revisaoNoDisco(dir) {
  if (!existsSync(arquivoDoProjeto(dir))) return 0;
  try { return openProject(dir).revision; } catch { return 0; }
}

function proximoNumero(dir) {
  let maior = 0;
  for (const tipo of ['checkpoints', 'versions']) {
    if (!existsSync(historia(dir, tipo))) continue;
    for (const nome of readdirSync(historia(dir, tipo))) maior = Math.max(maior, Number.parseInt(nome, 10) || 0);
  }
  return maior + 1;
}

function fotografar(dir, tipo, { label, source }) {
  const arquivo = arquivoDoProjeto(dir);
  if (!existsSync(arquivo)) throw new StorageError('PROJECT_NOT_FOUND', `Não há ${PROJECT_FILE} em ${dir}.`);
  const texto = readFileSync(arquivo, 'utf8');
  let revision = 0;
  try { revision = JSON.parse(texto).project.revision ?? 0; } catch { /* fotografa mesmo assim: é o que está no disco */ }
  const id = `${String(proximoNumero(dir)).padStart(6, '0')}-r${revision}-${slug(label)}`;
  const meta = { id, kind: tipo === 'versions' ? 'version' : 'checkpoint', label: label ?? '', source: source ?? 'cli', at: agora(), revision };
  gravarAtomico(historia(dir, tipo, `${id}.json`), `${JSON.stringify({ meta, content: texto })}\n`);
  if (tipo === 'checkpoints') {
    const todos = readdirSync(historia(dir, 'checkpoints')).filter((n) => n.endsWith('.json')).sort();
    for (const velho of todos.slice(0, Math.max(0, todos.length - CHECKPOINT_LIMIT))) rmSync(historia(dir, 'checkpoints', velho));
  }
  registrar(dir, { action: meta.kind, id, label: meta.label, source: meta.source, revision });
  return meta;
}

/** Cópia automática do estado atual. Fica num anel: passou de 30, a mais antiga sai. */
export const checkpoint = (alvo, opcoes = {}) => fotografar(projectDir(alvo), 'checkpoints', opcoes);

/** Cópia com nome ("aprovada pelo cliente"). Não é descartada sozinha. */
export const saveVersion = (alvo, label, source = 'cli') => fotografar(projectDir(alvo), 'versions', { label, source });

/** Checkpoints e versões, do mais novo para o mais antigo. */
export function listHistory(alvo) {
  const dir = projectDir(alvo);
  const itens = [];
  for (const tipo of ['checkpoints', 'versions']) {
    if (!existsSync(historia(dir, tipo))) continue;
    for (const nome of readdirSync(historia(dir, tipo)).filter((n) => n.endsWith('.json'))) {
      try { itens.push(JSON.parse(readFileSync(historia(dir, tipo, nome), 'utf8')).meta); } catch { /* arquivo estranho na pasta: ignora */ }
    }
  }
  return itens.sort((a, b) => b.id.localeCompare(a.id));
}

/**
 * Grava o projeto. Confere a revisão, valida, fotografa o estado anterior e troca o arquivo de uma vez.
 * @param {string} alvo
 * @param {any} project
 * @param {{ baseRevision?: number, source?: 'claude' | 'editor' | 'cli', label?: string, checkpoint?: boolean }} [opcoes]
 *   baseRevision: a revisão que quem grava tinha lido. Se o disco já passou dela, é conflito.
 * @returns {{ revision: number, project: any, warnings: any[], checkpointId: string | null }}
 */
export function saveProject(alvo, project, opcoes = {}) {
  const dir = projectDir(alvo);
  const { baseRevision, source = 'cli', label = '' } = opcoes;
  const noDisco = revisaoNoDisco(dir);
  if (baseRevision !== undefined && baseRevision !== noDisco) {
    throw new StorageError('CONFLICT', `O projeto mudou no disco (revisão ${noDisco}; você partiu da ${baseRevision}). Abra de novo antes de gravar.`, { currentRevision: noDisco });
  }
  const novo = structuredClone(project);
  novo.project.revision = noDisco + 1;
  novo.project.updatedAt = agora();
  const validacao = validateProject(novo);
  if (!validacao.valid) throw new StorageError('INVALID', 'O projeto é inválido e não foi gravado.', { problems: validacao.errors });

  const existe = existsSync(arquivoDoProjeto(dir));
  const fazerCheckpoint = opcoes.checkpoint ?? (source !== 'editor');
  const foto = existe && fazerCheckpoint ? checkpoint(dir, { label: label || `antes de gravar (${source})`, source }) : null;
  gravarAtomico(arquivoDoProjeto(dir), `${JSON.stringify(novo, null, 2)}\n`);
  registrar(dir, { action: 'save', source, label, revision: novo.project.revision });
  return { revision: novo.project.revision, project: novo, warnings: validacao.warnings, checkpointId: foto?.id ?? null };
}

/**
 * Volta o projeto a um checkpoint ou versão. Antes, fotografa o estado atual: dá para desfazer.
 * @returns {{ revision: number, restoredFrom: string, undoId: string }}
 */
export function rollback(alvo, id, source = 'cli') {
  const dir = projectDir(alvo);
  const item = listHistory(dir).find((h) => h.id === id);
  if (!item) throw new StorageError('HISTORY_NOT_FOUND', `Não há checkpoint nem versão "${id}".`);
  const pasta = item.kind === 'version' ? 'versions' : 'checkpoints';
  const { content } = JSON.parse(readFileSync(historia(dir, pasta, `${id}.json`), 'utf8'));
  let project;
  try { project = JSON.parse(content); } catch { throw new StorageError('HISTORY_UNREADABLE', `O conteúdo de "${id}" não é um JSON válido.`); }
  const undo = checkpoint(dir, { label: `antes de voltar para ${id}`, source });
  const noDisco = revisaoNoDisco(dir);
  project.project.revision = noDisco + 1; // a revisão sempre cresce: quem está com o projeto aberto percebe a troca
  project.project.updatedAt = agora();
  gravarAtomico(arquivoDoProjeto(dir), `${JSON.stringify(project, null, 2)}\n`);
  registrar(dir, { action: 'rollback', id, source, revision: project.project.revision });
  return { revision: project.project.revision, restoredFrom: id, undoId: undo.id };
}

/** Linhas do log, da mais antiga para a mais nova. */
export function readLog(alvo) {
  const arquivo = historia(projectDir(alvo), 'log.jsonl');
  if (!existsSync(arquivo)) return [];
  return readFileSync(arquivo, 'utf8').split('\n').filter(Boolean).map((l) => JSON.parse(l));
}

/** Hora da última alteração do arquivo do projeto, para quem vigia o disco. */
export const projectMtime = (alvo) => statSync(arquivoDoProjeto(projectDir(alvo))).mtimeMs;
