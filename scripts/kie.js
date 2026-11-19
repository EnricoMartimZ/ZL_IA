// Gera imagem, vídeo ou vídeo com fala (lip sync) pela API do kie.ai — o mesmo motor
// do Open Higgsfield AI. Sobe os arquivos locais, cria a tarefa, espera e baixa o resultado.
//
// Uso:
//   node --env-file=.env scripts/kie.js <modelo> --input '<json>' --out <arquivo> [--dry-run]
//
// No JSON de --input, qualquer valor que comece com "@" é um arquivo local: o script sobe
// pro kie.ai e troca pelo link (links de upload expiram em 24h). Listas também funcionam.
//
// Exemplos:
//   node --env-file=.env scripts/kie.js nano-banana-edit \
//     --input '{"prompt":"...","image_input":["@dados/foto-celular.jpg"],"aspect_ratio":"4:5"}' \
//     --out marketing/fotos/produto-01.jpg
//
//   node --env-file=.env scripts/kie.js bytedance/seedance-2-fast \
//     --input '{"prompt":"...","first_frame_url":"@marketing/fotos/produto-01.jpg","aspect_ratio":"9:16","duration":5}' \
//     --out marketing/videos/produto-01.mp4
//
// Modelos e campos de cada um: .claude/skills/foto-produto/modelos.md

import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';

const BASE = 'https://api.kie.ai';

function lerArgs(argv) {
  const args = { dryRun: false };
  const resto = [];
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--input') args.input = argv[++i];
    else if (a === '--out') args.out = argv[++i];
    else if (a === '--dry-run') args.dryRun = true;
    else if (a === '--timeout') args.timeout = Number(argv[++i]);
    else resto.push(a);
  }
  args.modelo = resto[0];
  return args;
}

function sair(msg) {
  console.error(`erro: ${msg}`);
  process.exit(1);
}

async function api(caminho, opcoes = {}) {
  const resp = await fetch(`${BASE}${caminho}`, {
    ...opcoes,
    headers: { Authorization: `Bearer ${process.env.KIE_API_KEY}`, ...(opcoes.headers || {}) },
  });
  const texto = await resp.text();
  let json;
  try {
    json = JSON.parse(texto);
  } catch {
    throw new Error(`kie.ai (${resp.status}) em ${caminho}: ${texto.slice(0, 200)}`);
  }
  if (!resp.ok || (json.code && json.code !== 200)) {
    throw new Error(`kie.ai (${json.code || resp.status}) em ${caminho}: ${json.msg || texto.slice(0, 200)}`);
  }
  return json.data;
}

async function subir(arquivo, dryRun) {
  if (!existsSync(arquivo)) throw new Error(`arquivo não encontrado: ${arquivo}`);
  if (dryRun) {
    console.log(`[dry-run] upload ${arquivo}`);
    return `https://DRYRUN/${path.basename(arquivo)}`;
  }
  const form = new FormData();
  form.append('file', new Blob([await readFile(arquivo)]), path.basename(arquivo));
  form.append('uploadPath', 'zl_ia');
  form.append('fileName', path.basename(arquivo));
  const data = await api('/api/v1/file-stream-upload', { method: 'POST', body: form });
  const url = data?.fileUrl || data?.downloadUrl || data?.url;
  if (!url) throw new Error(`upload de ${arquivo} não devolveu link`);
  console.log(`upload: ${arquivo}`);
  return url;
}

// Troca "@caminho" por link público, em qualquer nível do JSON.
async function resolverArquivos(valor, dryRun) {
  if (typeof valor === 'string' && valor.startsWith('@')) return subir(valor.slice(1), dryRun);
  if (Array.isArray(valor)) return Promise.all(valor.map((v) => resolverArquivos(v, dryRun)));
  if (valor && typeof valor === 'object') {
    const saida = {};
    for (const [k, v] of Object.entries(valor)) saida[k] = await resolverArquivos(v, dryRun);
    return saida;
  }
  return valor;
}

function urlsDoResultado(data) {
  if (Array.isArray(data.resultUrls) && data.resultUrls.length) return data.resultUrls;
  if (data.response?.resultUrls?.length) return data.response.resultUrls;
  if (typeof data.resultJson === 'string') {
    try {
      const r = JSON.parse(data.resultJson);
      return r.resultUrls || r.urls || [];
    } catch {
      return [];
    }
  }
  return [];
}

async function esperar(taskId, timeoutSeg) {
  const fim = Date.now() + timeoutSeg * 1000;
  while (Date.now() < fim) {
    await new Promise((r) => setTimeout(r, 4000));
    let data;
    try {
      data = await api(`/api/v1/jobs/recordInfo?taskId=${encodeURIComponent(taskId)}`);
    } catch (e) {
      console.warn(`  consulta falhou, tentando de novo: ${e.message}`);
      continue;
    }
    const estado = String(data?.state || '').toLowerCase();
    if (estado === 'success') return data;
    if (estado === 'fail' || estado === 'error') throw new Error(`geração falhou: ${data.failMsg || 'sem detalhe'}`);
    process.stdout.write('.');
  }
  throw new Error(`não terminou em ${timeoutSeg}s — tarefa ${taskId} (consulte de novo depois)`);
}

const args = lerArgs(process.argv.slice(2));
if (!args.modelo || !args.input || !args.out) {
  sair("uso: node --env-file=.env scripts/kie.js <modelo> --input '<json>' --out <arquivo> [--dry-run]");
}
if (!process.env.KIE_API_KEY && !args.dryRun) sair('KIE_API_KEY não está no .env (veja o .env.example)');

let input;
try {
  input = JSON.parse(args.input);
} catch (e) {
  sair(`--input não é JSON válido: ${e.message}`);
}

try {
  input = await resolverArquivos(input, args.dryRun);
  const corpo = { model: args.modelo, input };

  if (args.dryRun) {
    console.log(`[dry-run] POST ${BASE}/api/v1/jobs/createTask ${JSON.stringify(corpo)}`);
    console.log(`[dry-run] salvaria em ${args.out}`);
    process.exit(0);
  }

  const { taskId } = await api('/api/v1/jobs/createTask', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(corpo),
  });
  console.log(`tarefa ${taskId} (${args.modelo}) — esperando`);

  const ehVideo = /video|seedance|kling|wan|sora|veo|omnihuman|avatar|infinitalk|lip-sync/i.test(args.modelo);
  const data = await esperar(taskId, args.timeout || (ehVideo ? 1800 : 300));
  const urls = urlsDoResultado(data);
  if (!urls.length) throw new Error(`terminou sem link de resultado: ${JSON.stringify(data).slice(0, 300)}`);

  await mkdir(path.dirname(path.resolve(args.out)), { recursive: true });
  const ext = path.extname(args.out);
  for (let i = 0; i < urls.length; i++) {
    const destino = i === 0 ? args.out : args.out.replace(new RegExp(`${ext}$`), `-${i + 1}${ext}`);
    const bytes = Buffer.from(await (await fetch(urls[i])).arrayBuffer());
    await writeFile(destino, bytes);
    console.log(`\nsalvo: ${destino}`);
  }
} catch (e) {
  sair(e.message);
}
