// API local do editor. Atende UMA pasta de projeto: lê, grava com conferência de revisão, vigia o
// arquivo para avisar o editor quando o Claude grava, guarda assets, mostra o histórico e exporta.
import { existsSync, mkdirSync, watch, writeFileSync } from 'node:fs';
import path from 'node:path';
import { validateProject } from '../core/src/index.js';
import { openProject, saveProject, checkpoint, saveVersion, listHistory, rollback, missingAssetFiles, StorageError, PROJECT_FILE } from '../storage/index.js';
import { describeAsset, assetTypesFor } from '../renderer/media/index.js';
import { dentroDe, enviarArquivo } from '../renderer/export/server.js';

const LIMITE_UPLOAD = 60 * 1024 * 1024;
const slug = (texto) => texto.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');

function lerCorpo(req, limite) {
  return new Promise((resolve, reject) => {
    const partes = [];
    let tamanho = 0;
    req.on('data', (parte) => {
      tamanho += parte.length;
      if (tamanho > limite) { reject(Object.assign(new Error('arquivo grande demais'), { status: 413 })); req.destroy(); } else partes.push(parte);
    });
    req.on('end', () => resolve(Buffer.concat(partes)));
    req.on('error', reject);
  });
}

/**
 * @param {{ dir: string }} opcoes
 * @returns {{ handle: (req, res, next?) => void, close: () => void }}
 */
export function createApi({ dir }) {
  const pasta = path.resolve(dir);
  openProject(pasta); // falha cedo se a pasta não tem projeto
  const clientes = new Set();
  const emitir = (evento, dados) => { for (const res of clientes) res.write(`event: ${evento}\ndata: ${JSON.stringify(dados)}\n\n`); };
  let render = null; // { done, total } enquanto exporta

  // Vigia a pasta (não o arquivo: a gravação atômica troca o arquivo por outro).
  let ultimaRevisao = openProject(pasta).revision;
  let espera = null;
  const vigia = watch(pasta, (_, nome) => {
    if (nome !== PROJECT_FILE) return;
    clearTimeout(espera);
    espera = setTimeout(() => {
      try {
        const { revision } = openProject(pasta);
        if (revision !== ultimaRevisao) { ultimaRevisao = revision; emitir('project-changed', { revision }); }
      } catch { /* arquivo no meio de uma troca ou quebrado: o próximo evento resolve */ }
    }, 60);
  });

  const json = (res, status, corpo) => { res.writeHead(status, { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' }); res.end(JSON.stringify(corpo)); };
  const estadoAtual = () => {
    const { project, revision } = openProject(pasta);
    const v = validateProject(project);
    return { project, revision, name: path.basename(pasta), validation: { valid: v.valid, errors: [...v.errors, ...(v.valid ? missingAssetFiles(pasta, project) : [])], warnings: v.warnings } };
  };

  const ROTAS = {
    'GET /api/project': (req, res) => json(res, 200, estadoAtual()),

    'PUT /api/project': async (req, res) => {
      const { baseRevision, project } = JSON.parse((await lerCorpo(req, LIMITE_UPLOAD)).toString('utf8'));
      const r = saveProject(pasta, project, { baseRevision, source: 'editor' });
      ultimaRevisao = r.revision; // gravação do próprio editor: não precisa voltar como aviso
      json(res, 200, { revision: r.revision, project: r.project, warnings: r.warnings });
    },

    'GET /api/events': (req, res) => {
      res.writeHead(200, { 'content-type': 'text/event-stream', 'cache-control': 'no-store', connection: 'keep-alive' });
      res.write(`event: hello\ndata: ${JSON.stringify({ revision: ultimaRevisao, rendering: Boolean(render) })}\n\n`);
      clientes.add(res);
      req.on('close', () => clientes.delete(res));
    },

    'POST /api/assets': async (req, res, url) => {
      const nome = path.basename(url.searchParams.get('name') ?? '');
      const tipos = assetTypesFor(nome);
      const type = url.searchParams.get('type') ?? tipos[0];
      if (!tipos.length || !tipos.includes(type)) return json(res, 422, { code: 'ASSET_TYPE_UNKNOWN', message: `"${nome}" não é imagem, logo nem fonte que o motor aceite.` });
      const dados = await lerCorpo(req, LIMITE_UPLOAD);
      const ext = path.extname(nome).toLowerCase();
      const base = (slug(path.basename(nome, path.extname(nome))).replace(/^[^a-z]+/, '') || 'asset').slice(0, 40);
      const { project } = openProject(pasta);
      const subpasta = type === 'font' ? 'assets/fontes' : 'assets';
      let id = base;
      for (let n = 2; project.assets.some((a) => a.id === id) || existsSync(path.join(pasta, subpasta, `${id}${ext}`)); n++) id = `${base}-${n}`;
      const src = `${subpasta}/${id}${ext}`;
      mkdirSync(path.join(pasta, subpasta), { recursive: true });
      writeFileSync(path.join(pasta, src), dados);
      return json(res, 201, { asset: { id, type, src, name: nome.slice(0, 120), ...describeAsset(path.join(pasta, src)) } });
    },

    'GET /api/history': (req, res) => json(res, 200, { items: listHistory(pasta) }),
    'POST /api/history/checkpoint': async (req, res) => json(res, 201, checkpoint(pasta, { label: JSON.parse((await lerCorpo(req, 1e5)).toString() || '{}').label ?? 'checkpoint do editor', source: 'editor' })),
    'POST /api/history/version': async (req, res) => {
      const { label } = JSON.parse((await lerCorpo(req, 1e5)).toString() || '{}');
      if (!label) return json(res, 422, { code: 'LABEL_MISSING', message: 'A versão precisa de um nome.' });
      return json(res, 201, saveVersion(pasta, label, 'editor'));
    },
    'POST /api/history/rollback': async (req, res) => {
      const { id } = JSON.parse((await lerCorpo(req, 1e5)).toString() || '{}');
      const r = rollback(pasta, id, 'editor');
      ultimaRevisao = r.revision;
      json(res, 200, { ...r, ...estadoAtual() });
    },

    'GET /api/critique': async (req, res) => {
      const { critiqueProject } = await import('../intelligence/critique/index.js');
      const { project } = openProject(pasta);
      json(res, 200, await critiqueProject({ project, dir: pasta }));
    },

    'POST /api/render': async (req, res) => {
      if (render) return json(res, 409, { code: 'RENDER_RUNNING', message: 'Já há uma exportação em andamento.' });
      const corpo = JSON.parse((await lerCorpo(req, 1e5)).toString() || '{}');
      const { renderProject } = await import('../renderer/export/index.js');
      render = { done: 0, total: 0 };
      checkpoint(pasta, { label: 'antes de exportar', source: 'editor' });
      json(res, 202, { started: true });
      renderProject({ dir: pasta, range: corpo.range, onProgress: (done, total) => { render = { done, total }; if (done % 5 === 0 || done === total) emitir('render-progress', render); } })
        .then((r) => emitir('render-done', { output: r.output, file: path.relative(pasta, r.output).split(path.sep).join('/'), frames: r.frames, seconds: r.seconds, renderMs: r.renderMs }))
        .catch((e) => emitir('render-error', { code: e.code ?? 'RENDER_FAILED', message: e.message, problems: e.problems ?? [] }))
        .finally(() => { render = null; });
      return undefined;
    },
  };

  async function handle(req, res, next) {
    const url = new URL(req.url, 'http://127.0.0.1');
    const ehNosso = url.pathname.startsWith('/api/') || url.pathname.startsWith('/project-files/');
    if (!ehNosso) return next ? next() : json(res, 404, { code: 'NOT_FOUND', message: 'rota desconhecida' });
    // só atende quem chega pelo endereço local: uma página de fora não consegue falar com este servidor
    const host = (req.headers.host ?? '').replace(/:\d+$/, '');
    const origem = req.headers.origin;
    if (!['127.0.0.1', 'localhost', '[::1]'].includes(host) || (origem && !/^https?:\/\/(127\.0\.0\.1|localhost|\[::1\])(:\d+)?$/.test(origem))) {
      return json(res, 403, { code: 'FORBIDDEN', message: 'este servidor só atende o endereço local' });
    }
    if (url.pathname.startsWith('/project-files/')) {
      if (req.method !== 'GET') return json(res, 405, { code: 'METHOD', message: 'só leitura' });
      const resto = url.pathname.slice('/project-files/'.length);
      // do projeto, o editor só precisa das imagens, fontes e vídeos exportados
      return enviarArquivo(res, /^(assets|renders)\//.test(resto) ? dentroDe(pasta, resto) : null);
    }
    const rota = ROTAS[`${req.method} ${url.pathname}`];
    if (!rota) return json(res, 404, { code: 'NOT_FOUND', message: 'rota desconhecida' });
    try {
      return await rota(req, res, url);
    } catch (e) {
      if (e instanceof StorageError) {
        const status = e.code === 'CONFLICT' ? 409 : e.code === 'INVALID' ? 422 : e.code.endsWith('NOT_FOUND') ? 404 : 400;
        return json(res, status, { code: e.code, message: e.message, currentRevision: e.currentRevision, problems: e.problems });
      }
      if (e instanceof SyntaxError) return json(res, 400, { code: 'BAD_JSON', message: 'corpo da requisição não é JSON válido' });
      return json(res, e.status ?? 500, { code: 'SERVER_ERROR', message: e.message });
    }
  }

  return { handle, close() { clearTimeout(espera); vigia.close(); for (const res of clientes) res.end(); clientes.clear(); } };
}
