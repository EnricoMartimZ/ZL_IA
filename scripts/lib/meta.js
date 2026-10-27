// Funções comuns dos scripts de postagem na Meta (Instagram e Facebook).

import { readdir, readFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';

const VERSAO = process.env.META_GRAPH_VERSION || 'v21.0';

export function lerArgs(argv) {
  const args = { dryRun: false };
  const resto = [];
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === '--dry-run') args.dryRun = true;
    else if (argv[i] === '--slug') args.slug = argv[++i];
    else resto.push(argv[i]);
  }
  args.pasta = resto[0];
  return args;
}

export function exigirEnv(nomes, dryRun) {
  const faltando = nomes.filter((n) => !process.env[n]);
  if (faltando.length && !dryRun) {
    throw new Error(`faltam no .env: ${faltando.join(', ')} (veja o .env.example)`);
  }
}

// Pasta do conteúdo: marketing/conteudo/<slug>-<YYYY-MM-DD>
export function slugDaPasta(pasta) {
  return path.basename(path.resolve(pasta)).replace(/-\d{4}-\d{2}-\d{2}$/, '');
}

export async function listarSlides(pasta) {
  const dir = path.join(pasta, 'instagram');
  if (!existsSync(dir)) throw new Error(`não achei ${dir}`);
  const slides = (await readdir(dir)).filter((f) => /^slide-\d+\.png$/.test(f)).sort();
  if (slides.length === 0) throw new Error(`nenhum slide-XX.png em ${dir}`);
  if (slides.length > 10) throw new Error(`${slides.length} slides — o limite do carrossel é 10`);
  return slides;
}

// URLs públicas: o /aprovar-post copia os PNGs pra <SITE_URL>/img/posts/<slug>/
export function urlsPublicas(slug, slides) {
  const base = (process.env.SITE_URL || 'https://SITE_URL').replace(/\/$/, '');
  return slides.map((s) => `${base}/img/posts/${slug}/${s}`);
}

export async function lerLegenda(pasta) {
  const arq = path.join(pasta, 'legenda.md');
  if (!existsSync(arq)) throw new Error(`não achei ${arq}`);
  let texto = await readFile(arq, 'utf8');
  texto = texto.replace(/^---\n[\s\S]*?\n---\n/, '').trim();
  return texto;
}

export async function graph(caminho, params, { dryRun, metodo = 'POST' } = {}) {
  const url = `https://graph.facebook.com/${VERSAO}/${caminho}`;
  if (dryRun) {
    console.log(`[dry-run] ${metodo} ${url}`, JSON.stringify(params));
    return { id: `DRYRUN_${caminho.replace(/\W/g, '_')}`, status_code: 'FINISHED' };
  }
  const corpo = new URLSearchParams({ ...params, access_token: process.env.META_PAGE_ACCESS_TOKEN });
  const resp =
    metodo === 'GET'
      ? await fetch(`${url}?${corpo}`)
      : await fetch(url, { method: 'POST', body: corpo });
  const json = await resp.json();
  if (!resp.ok || json.error) {
    throw new Error(`Meta API (${resp.status}) em ${caminho}: ${json.error?.message || JSON.stringify(json)}`);
  }
  return json;
}

export async function rodar(main) {
  try {
    await main();
  } catch (e) {
    console.error(`erro: ${e.message}`);
    process.exit(1);
  }
}
