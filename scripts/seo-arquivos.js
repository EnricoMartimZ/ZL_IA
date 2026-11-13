// Gera os arquivos que os buscadores leem antes das páginas: sitemap.xml, robots.txt e (opcional) llms.txt.
//
// Uso:
//   node scripts/seo-arquivos.js <pasta-do-site> [--dominio dominio.com.br] [--ia permitir|sem-treino|bloquear] [--llms] [--simular]
//
// - sitemap.xml: uma <url> por página .html indexável (pula noindex), com a data em que o arquivo mudou.
// - robots.txt: libera o site, aponta o sitemap e registra a decisão sobre robôs de IA:
//     permitir    todos entram (padrão: é o que deixa a empresa aparecer nas respostas das IAs)
//     sem-treino  busca e leitura a pedido do usuário entram; os robôs de treino ficam fora
//     bloquear    nenhum robô de IA entra (a empresa some das respostas das IAs: só a pedido do cliente)
// - llms.txt (--llms): resumo do site em Markdown. Experimental: nenhum buscador confirmou que usa. Não é fator de posição.
// - --simular: mostra o que escreveria, sem gravar.
//
// Demonstração (/site-demo): não gera nada. A demo fica com noindex, "Disallow: /" e sem sitemap, de propósito.
// Sem --dominio, usa o domínio do canonical da página inicial; se ainda for DOMINIO, mantém e avisa.
// Projeto Next.js não usa este script: lá é app/sitemap.ts e app/robots.ts (.claude/skills/seo-site/stacks.md).

import { readFile, writeFile, readdir, stat } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { ROBOS_IA } from './lib/seo.js';

const argv = process.argv.slice(2);
const valor = (f) => (argv.includes(f) ? argv[argv.indexOf(f) + 1] : null);
const pasta = argv.find((a, i) => !a.startsWith('--') && !['--dominio', '--ia'].includes(argv[i - 1]));
const ia = valor('--ia') || 'permitir';
const simular = argv.includes('--simular');
if (!pasta || !existsSync(path.join(pasta, 'index.html')) || !['permitir', 'sem-treino', 'bloquear'].includes(ia)) {
  console.error('uso: node scripts/seo-arquivos.js <pasta-do-site> [--dominio dominio.com.br] [--ia permitir|sem-treino|bloquear] [--llms] [--simular]');
  process.exit(2);
}

// páginas .html da pasta (até dois níveis), fora as bancadas de técnica e dependências
const PULAR = new Set(['node_modules', 'tecnicas', 'og', '.git', '.vercel']);
async function listar(dir, nivel = 0) {
  const saida = [];
  for (const e of await readdir(dir, { withFileTypes: true })) {
    if (e.isDirectory() && nivel < 2 && !PULAR.has(e.name)) saida.push(...await listar(path.join(dir, e.name), nivel + 1));
    else if (e.isFile() && e.name.endsWith('.html')) saida.push(path.join(dir, e.name));
  }
  return saida;
}
const tag = (html, re) => (html.match(re)?.[1] || '').replace(/\s+/g, ' ').trim();
const paginas = [];
for (const arq of await listar(pasta)) {
  const html = (await readFile(arq, 'utf8')).replace(/<!--[\s\S]*?-->/g, '');
  const rel = path.relative(pasta, arq).split(path.sep).join('/');
  paginas.push({
    rel, caminho: '/' + rel.replace(/(^|\/)index\.html$/, '$1'),
    titulo: tag(html, /<title[^>]*>([\s\S]*?)<\/title>/i),
    desc: tag(html, /<meta[^>]+name=["']description["'][^>]+content=["']([^"']*)["']/i),
    noindex: /<meta[^>]+name=["']robots["'][^>]+content=["'][^"']*noindex/i.test(html),
    canonical: tag(html, /<link[^>]+rel=["']canonical["'][^>]+href=["']([^"']*)["']/i),
    demo: /class=["'][^"']*\bfaixa-demo\b/.test(html) || /<body[^>]+class=["'][^"']*\bdemo\b/.test(html),
    mudou: (await stat(arq)).mtime.toISOString().slice(0, 10),
  });
}
const inicio = paginas.find((p) => p.rel === 'index.html');
if (inicio.demo || paginas.every((p) => p.noindex)) {
  console.log('Demonstração (ou site inteiro com noindex): nada foi gerado.\nA demo fica com noindex, robots.txt "Disallow: /" e sem sitemap, de propósito. Virou cliente? Tirar a faixa e o noindex pelo /site-premium e rodar de novo.');
  process.exit(0);
}

let dominio = (valor('--dominio') || '').replace(/^https?:\/\//, '').replace(/\/$/, '');
if (!dominio) dominio = (inicio.canonical.match(/^https?:\/\/([^/]+)/)?.[1]) || 'DOMINIO';
const base = `https://${dominio}`;
const indexaveis = paginas.filter((p) => !p.noindex).sort((a, b) => a.caminho.length - b.caminho.length || a.caminho.localeCompare(b.caminho));

const sitemap = ['<?xml version="1.0" encoding="UTF-8"?>', '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
  ...indexaveis.map((p) => `  <url><loc>${base}${p.caminho}</loc><lastmod>${p.mudou}</lastmod></url>`), '</urlset>', ''].join('\n');

const treino = ROBOS_IA.filter((r) => r.papel === 'treino').map((r) => r.nome);
const todosIA = ROBOS_IA.filter((r) => r.nome !== 'Bingbot').map((r) => r.nome);
const bloco = (nomes) => [...nomes.map((n) => `User-agent: ${n}`), 'Disallow: /', ''];
const robots = [
  'User-agent: *', 'Allow: /', '',
  ...(ia === 'permitir' ? ['# Robôs de IA: liberados (busca, leitura a pedido do usuário e treino). Decisão registrada no plano de SEO.', ''] : []),
  ...(ia === 'sem-treino' ? ['# Robôs de IA: busca e leitura a pedido do usuário liberadas; treino de modelo bloqueado.', ...bloco(treino)] : []),
  ...(ia === 'bloquear' ? ['# Robôs de IA: todos bloqueados a pedido do cliente (o site não aparece nas respostas das IAs).', ...bloco(todosIA)] : []),
  `Sitemap: ${base}/sitemap.xml`, '',
].join('\n');

const arquivos = { 'sitemap.xml': sitemap, 'robots.txt': robots };
if (argv.includes('--llms')) {
  const nome = inicio.titulo.split(/\s[·|—–-]\s/)[0] || dominio;
  arquivos['llms.txt'] = [`# ${nome}`, '', inicio.desc ? `> ${inicio.desc}` : '', '', '## Páginas', '',
    ...indexaveis.map((p) => `- [${p.titulo || p.caminho}](${base}${p.caminho})${p.desc ? `: ${p.desc}` : ''}`), ''].join('\n');
}

for (const [nome, texto] of Object.entries(arquivos)) {
  if (simular) console.log(`----- ${nome} -----\n${texto}`);
  else { await writeFile(path.join(pasta, nome), texto); console.log(`✔ ${path.join(pasta, nome)}`); }
}
console.log(`${indexaveis.length} página(s) no sitemap${paginas.length - indexaveis.length ? ` · ${paginas.length - indexaveis.length} com noindex ficaram fora` : ''} · robôs de IA: ${ia}`);
if (dominio === 'DOMINIO') console.log('⚠ Sem domínio ainda: ficou DOMINIO. Rodar de novo com --dominio quando o domínio estiver definido (o /publicar-site faz isso).');
if (ia === 'bloquear') console.log('⚠ Com os robôs de IA bloqueados a empresa deixa de poder ser citada por ChatGPT, Perplexity e Claude. Confirmar que é isso que o cliente quer.');
if (arquivos['llms.txt']) console.log('ℹ llms.txt é experimental: nenhum buscador confirmou que usa o arquivo. Conferir o texto antes de publicar.');
