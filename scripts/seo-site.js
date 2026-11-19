// Auditoria de SEO e GEO de um site: o que o Google, o Bing e os buscadores de IA conseguem ler nele.
//
// Uso:
//   node scripts/seo-site.js <pasta-do-site | https://url> [--plano plano.json] [--demo] [--psi]
//                            [--externos] [--max 40] [--saida SEO.md] [--json auditoria.json]
//
// Pasta: sobe um servidor local temporário (site estático ou pasta de build: out/, dist/, build/).
// URL: lê o site publicado, ou o servidor de desenvolvimento (http://localhost:3000).
// --plano: palavras-chave por página (clientes/<Nome>/seo/plano.json) — confere se cada página cumpre.
// --demo: demonstração do /site-demo. noindex e robots bloqueado são de propósito: aqui eles são EXIGIDOS.
//         (Também é detectado sozinho pela faixa de demonstração.)
// --psi: teste real no PageSpeed Insights (só site publicado; chave opcional em PAGESPEED_API_KEY).
// --externos: confere também os links pra fora do site.
// Sai com código 1 se houver achado crítico.
//
// Fronteira: o checar-site.js é a trava de entrega dos sites do ZL_IA (texto de exemplo, console,
// painel de contato, cor da marca). Este aqui serve pra qualquer site e vai fundo em busca.

import { chromium } from 'playwright';
import { readFile, writeFile, readdir } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { servir } from './lib/servir.js';
import { normalizar, palavras, termos, contemBusca, ROBOS_IA, lerRobots, roboPode } from './lib/seo.js';

const argv = process.argv.slice(2);
const COM_VALOR = ['--plano', '--saida', '--json', '--max'];
const valor = (f) => (argv.includes(f) ? argv[argv.indexOf(f) + 1] : null);
let alvo = argv.find((a, i) => !a.startsWith('--') && !COM_VALOR.includes(argv[i - 1]));
let ehDemo = argv.includes('--demo');
const MAX = Number(valor('--max') || 40);
if (!alvo) {
  console.error('uso: node scripts/seo-site.js <pasta | url> [--plano plano.json] [--demo] [--psi] [--externos] [--saida SEO.md] [--json auditoria.json]');
  process.exit(2);
}
const ehUrl = /^https?:\/\//.test(alvo);

// ---------- de que é feito o projeto ----------
let stack = ehUrl ? 'site no ar (lido pela URL)' : 'site estático';
if (!ehUrl && !existsSync(path.join(alvo, 'index.html'))) {
  let deps = {};
  try { const p = JSON.parse(await readFile(path.join(alvo, 'package.json'), 'utf8')); deps = { ...p.dependencies, ...p.devDependencies }; } catch {}
  const nome = deps.next ? 'Next.js' : deps.astro ? 'Astro' : deps.vite ? `Vite${deps.react ? ' + React' : ''}` : deps['react-scripts'] ? 'Create React App' : deps.react ? 'React' : null;
  const build = ['out', 'dist', 'build'].find((d) => existsSync(path.join(alvo, d, 'index.html')));
  if (build) {
    stack = `${nome || 'projeto com build'} (lendo a pasta ${build}/)`;
    alvo = path.join(alvo, build);
  } else {
    console.error(nome
      ? `Projeto ${nome} sem pasta de build com index.html. Duas saídas:\n`
        + `  1. subir o projeto (npm run dev, ou npm run build && npm start) e auditar o endereço: node scripts/seo-site.js http://localhost:3000\n`
        + `  2. gerar o build estático e auditar a pasta (out/, dist/ ou build/)\n`
        + 'Onde cada coisa de SEO mora nessa stack: .claude/skills/seo-site/stacks.md'
      : `não achei ${path.join(alvo, 'index.html')} nem um package.json de projeto conhecido`);
    process.exit(2);
  }
}

const plano = valor('--plano') ? JSON.parse(await readFile(valor('--plano'), 'utf8')) : null;

// ---------- achados ----------
const GRAV = ['critico', 'alto', 'medio', 'baixo'];
const ROTULO = { critico: 'Crítico', alto: 'Alto', medio: 'Médio', baixo: 'Baixo' };
const achados = []; // { grav, area, pagina, item, detalhe, base }
// base: 'hipótese' = faz sentido pra IA, sem comprovação pública; 'experimental' = recurso ainda sem adoção confirmada
const add = (grav, area, pagina, item, detalhe = '', base = '') => achados.push({ grav, area, pagina, item, detalhe, base });

const caminhoDe = (u) => { try { const x = new URL(u); return (x.pathname.replace(/\/index\.html$/, '/') || '/') + x.search; } catch { return u; } };
const semBarra = (p) => (p.length > 1 ? p.replace(/\/$/, '') : p);
const mesmoCaminho = (a, b) => semBarra(a.replace(/\.html$/, '')) === semBarra(b.replace(/\.html$/, ''));
const pegar = async (u, opc = {}) => {
  try { return await fetch(u, { redirect: 'follow', signal: AbortSignal.timeout(20000), ...opc }); } catch { return null; }
};

// ---------- ler uma página ----------
const MEDIR = () => {
  window.__lcp = 0; window.__cls = 0;
  try {
    new PerformanceObserver((l) => { for (const e of l.getEntries()) window.__lcp = e.startTime; }).observe({ type: 'largest-contentful-paint', buffered: true });
    new PerformanceObserver((l) => { for (const e of l.getEntries()) if (!e.hadRecentInput) window.__cls += e.value; }).observe({ type: 'layout-shift', buffered: true });
  } catch {}
};

const COLETAR = () => {
  const meta = (sel) => document.querySelector(sel)?.getAttribute('content')?.trim() || '';
  const corpo = document.body.cloneNode(true);
  corpo.querySelectorAll('script, style, noscript, template, svg').forEach((e) => e.remove());
  const texto = corpo.textContent.replace(/\s+/g, ' ').trim();
  const nomeDe = (el) => (el.getAttribute('aria-label') || el.innerText || el.textContent || el.getAttribute('title')
    || [...el.querySelectorAll('img[alt]')].map((i) => i.alt).join(' ') || '').replace(/\s+/g, ' ').trim();
  return {
    titulo: document.title.trim(), desc: meta('meta[name="description"]'), robots: meta('meta[name="robots"]'),
    canonical: document.querySelector('link[rel="canonical"]')?.getAttribute('href') || '',
    lang: document.documentElement.lang, viewport: meta('meta[name="viewport"]'),
    og: { title: meta('meta[property="og:title"]'), description: meta('meta[property="og:description"]'), image: meta('meta[property="og:image"]'), url: meta('meta[property="og:url"]'), type: meta('meta[property="og:type"]') },
    twitter: meta('meta[name="twitter:card"]'),
    titulos: [...document.querySelectorAll('h1, h2, h3, h4, h5, h6')].map((h) => ({ nivel: Number(h.tagName[1]), texto: h.textContent.replace(/\s+/g, ' ').trim() })),
    texto, inicio: (document.body.innerText || texto).replace(/\s+/g, ' ').trim().slice(0, 1500),
    links: [...document.querySelectorAll('a[href]')].map((a) => ({ href: a.href, cru: a.getAttribute('href'), texto: nomeDe(a), rel: a.rel })),
    imgs: [...document.images].map((i) => ({
      src: i.currentSrc || i.src, alt: i.getAttribute('alt'),
      decorativa: i.getAttribute('aria-hidden') === 'true' || i.getAttribute('role') === 'presentation',
      medidas: i.hasAttribute('width') && i.hasAttribute('height'), natural: i.naturalWidth,
      quebrada: i.complete && i.naturalWidth === 0 && getComputedStyle(i).display !== 'none',
    })),
    jsonld: [...document.querySelectorAll('script[type="application/ld+json"]')].map((s) => s.textContent),
    semantica: { main: !!document.querySelector('main'), nav: !!document.querySelector('nav'), header: !!document.querySelector('header'), footer: !!document.querySelector('footer') },
    semNome: [...document.querySelectorAll('button, a[href]')].filter((e) => !nomeDe(e)).length,
    semRotulo: [...document.querySelectorAll('input:not([type=hidden]):not([type=submit]):not([type=button]), select, textarea')]
      .filter((e) => !e.labels?.length && !e.getAttribute('aria-label') && !e.getAttribute('aria-labelledby')).length,
    vazaLateral: document.documentElement.scrollWidth > document.documentElement.clientWidth + 1,
    faixaDemo: !!document.querySelector('.faixa-demo') || document.body.classList.contains('demo'),
    perguntasVisiveis: [...document.querySelectorAll('summary, h2, h3, h4, dt')].filter((e) => /\?\s*$/.test(e.textContent.trim())).length,
    lcp: Math.round(window.__lcp || 0), cls: Number((window.__cls || 0).toFixed(3)),
  };
};

const textoCru = (html) => html.replace(/<(script|style|noscript|template|svg)[\s\S]*?<\/\1>/gi, ' ').replace(/<!--[\s\S]*?-->/g, ' ')
  .replace(/<[^>]+>/g, ' ').replace(/&[a-z#0-9]+;/gi, ' ').replace(/\s+/g, ' ').trim();

async function lerPagina(browser, url, base) {
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
  await ctx.addInitScript(MEDIR);
  const page = await ctx.newPage();
  const recursos = new Map(); // url → { bytes, tipo, status }
  let bytes = 0;
  page.on('response', (r) => {
    const n = Number(r.headers()['content-length'] || 0);
    bytes += n;
    recursos.set(r.url(), { bytes: n, tipo: r.headers()['content-type'] || '', status: r.status() });
  });
  const p = { url, caminho: caminhoDe(url), status: 0, erro: '' };
  try {
    const t0 = Date.now();
    const resp = await page.goto(url, { waitUntil: 'load', timeout: 60000 });
    p.status = resp?.status() || 0;
    p.xRobots = resp?.headers()['x-robots-tag'] || '';
    p.final = page.url();
    p.carga = Date.now() - t0;
    await page.waitForTimeout(2000);
    Object.assign(p, await page.evaluate(COLETAR));
    p.bytes = bytes;
    p.pedidos = recursos.size;
    p.imgs.forEach((i) => { const r = recursos.get(i.src); i.bytes = r?.bytes || 0; i.tipo = r?.tipo || ''; });
    p.falhas = [...recursos].filter(([u, r]) => r.status >= 400 && u.startsWith(base)).map(([u, r]) => `${r.status} ${caminhoDe(u)}`);
    const cru = await pegar(url);
    p.palavrasCruas = cru?.ok ? palavras(textoCru(await cru.text())).length : null;
  } catch (e) {
    p.erro = e.message.split('\n')[0];
  }
  await ctx.close();
  return p;
}

// ---------- dados estruturados ----------
function nos(obj, saida = []) {
  if (Array.isArray(obj)) obj.forEach((o) => nos(o, saida));
  else if (obj && typeof obj === 'object') {
    if (obj['@type']) saida.push(obj);
    Object.values(obj).forEach((v) => nos(v, saida));
  }
  return saida;
}
const tipoDe = (n) => [].concat(n['@type']).join('/');

function conferirSchema(p) {
  p.schema = [];
  const txt = ` ${normalizar(p.texto)} `;
  const digitos = p.texto.replace(/\D/g, '');
  for (const bruto of p.jsonld) {
    let j;
    try { j = JSON.parse(bruto); } catch (e) { add('alto', 'Dados estruturados', p.caminho, 'JSON-LD inválido (os buscadores ignoram o bloco inteiro)', e.message); continue; }
    for (const n of nos(j)) {
      const tipo = tipoDe(n);
      if (!/^(PostalAddress|GeoCoordinates|OpeningHoursSpecification|Question|Answer|ListItem|Offer|City|ImageObject|ContactPoint)$/.test(tipo)) p.schema.push(tipo);
      if (n.aggregateRating || n.review) {
        if (n.address || /LocalBusiness|Organization/.test(tipo)) add('alto', 'Dados estruturados', p.caminho, 'Nota ou avaliação do próprio negócio no JSON-LD', `${tipo}: o Google não aceita avaliação que a empresa publica sobre ela mesma (pode gerar ação manual)`);
      }
      if (n.address && typeof n.address === 'object') { // negócio com endereço
        p.negocio ||= { nome: n.name, cidade: n.address.addressLocality, tipo };
        const falta = ['name', 'telephone', 'url', 'image'].filter((c) => !n[c]).concat(['streetAddress', 'addressLocality', 'addressRegion', 'postalCode'].filter((c) => !n.address[c]));
        if (!n.openingHoursSpecification && !n.openingHours) falta.push('horário');
        if (!n.geo) falta.push('geo');
        if (falta.length) add('medio', 'SEO local', p.caminho, `Dados do negócio incompletos no JSON-LD (${tipo})`, `falta: ${falta.join(', ')}`);
        if (n.geo && Number(n.geo.latitude) === 0 && Number(n.geo.longitude) === 0) add('alto', 'SEO local', p.caminho, 'Coordenadas 0,0 no JSON-LD', 'pôr a latitude e a longitude da porta do negócio');
        if (tipo === 'LocalBusiness') add('baixo', 'SEO local', p.caminho, 'Tipo genérico LocalBusiness', 'usar o tipo mais específico do schema.org (Optician, AutoRepair, Dentist, Restaurant...)');
        const tel = String(n.telephone || '').replace(/\D/g, '').slice(-8);
        if (tel && !digitos.includes(tel)) add('alto', 'Dados estruturados', p.caminho, 'Telefone do JSON-LD não aparece na página', 'dado estruturado tem que repetir o que o visitante vê');
        const rua = normalizar(n.address.streetAddress || '');
        if (rua && !txt.includes(` ${rua} `)) add('medio', 'Dados estruturados', p.caminho, 'Endereço do JSON-LD não aparece igual no texto da página', n.address.streetAddress);
        if (n.name && !txt.includes(` ${normalizar(n.name)} `)) add('medio', 'Dados estruturados', p.caminho, 'Nome do JSON-LD não aparece no texto da página', n.name);
        if (!n.sameAs) add('baixo', 'GEO', p.caminho, 'Negócio sem "sameAs" no JSON-LD', 'ligar ao perfil do Google, Instagram e outros perfis oficiais ajuda a identificar a empresa como uma entidade só', 'hipótese');
      }
      if (tipo === 'FAQPage') {
        const fora = [].concat(n.mainEntity || []).map((q) => q?.name).filter((q) => q && !txt.includes(` ${normalizar(q)} `));
        p.faq = [].concat(n.mainEntity || []).length;
        if (fora.length) add('alto', 'Dados estruturados', p.caminho, 'Pergunta do FAQPage não aparece na página', fora.slice(0, 3).join(' · '));
      }
      if (n.offers?.price && !digitos.includes(String(n.offers.price).replace(/\D/g, ''))) add('medio', 'Dados estruturados', p.caminho, `Preço do JSON-LD (${n.offers.price}) não aparece na página`, tipo);
      if (/Article|BlogPosting/.test(tipo)) {
        const falta = ['author', 'datePublished', 'headline'].filter((c) => !n[c]);
        if (falta.length) add('baixo', 'GEO', p.caminho, `Artigo sem ${falta.join(', ')} no JSON-LD`, 'autoria e data ajudam a julgar se o conteúdo é confiável e atual', 'hipótese');
      }
    }
  }
}

// ---------- conferência por página ----------
const ANCORA_VAGA = new Set(['clique aqui', 'saiba mais', 'aqui', 'veja mais', 'leia mais', 'ver mais', 'link', 'acesse', 'mais']);
const NOME_GENERICO = /^(img|image|imagem|foto|photo|dsc|dscn|pxl|screenshot|captura|captura de tela|whatsapp image|untitled|sem titulo|download|unnamed)?[ _-]*[\d ()_-]*$/i;
const VAGO = ['qualidade e excelencia', 'solucoes inovadoras', 'solucoes completas', 'referencia no mercado', 'lider de mercado', 'melhor da regiao',
  'ha anos no mercado', 'atendimento diferenciado', 'profissionais altamente qualificados', 'compromisso com a qualidade', 'excelencia em'];

function conferirPagina(p, base) {
  const pg = p.caminho;
  const privacidade = /privacidade|politica|termos/.test(pg);
  p.noindex = /noindex/i.test(p.robots) || /noindex/i.test(p.xRobots || '');
  p.indexavel = !p.noindex && p.status === 200;
  p.palavras = palavras(p.texto).length;

  // indexação
  if (ehDemo) {
    if (!p.noindex) add('critico', 'Indexação', pg, 'Demonstração sem noindex', 'a demo não pode aparecer no Google: <meta name="robots" content="noindex, nofollow">');
  } else if (p.noindex && !privacidade) {
    add(pg === '/' ? 'critico' : 'alto', 'Indexação', pg, 'Página com noindex', `não entra no Google nem no Bing (${p.xRobots ? 'cabeçalho X-Robots-Tag' : 'meta robots'}: ${p.xRobots || p.robots}). Se for de propósito (página de obrigado, área interna), tirar do sitemap e seguir`);
  }

  // metadados
  if (!p.titulo) add('critico', 'Metadados', pg, 'Página sem <title>');
  else if (p.titulo.length < 30 || p.titulo.length > 60) add('medio', 'Metadados', pg, `Title com ${p.titulo.length} caracteres`, `ideal de 30 a 60 (acima disso o Google corta): "${p.titulo}"`);
  if (!p.desc) add('alto', 'Metadados', pg, 'Sem meta description');
  else if (p.desc.length < 70 || p.desc.length > 160) add('medio', 'Metadados', pg, `Description com ${p.desc.length} caracteres`, 'ideal de 70 a 160');
  if (!p.lang) add('medio', 'Metadados', pg, 'Sem lang no <html>', 'lang="pt-BR"');
  if (!ehDemo && p.indexavel) {
    const falta = ['title', 'description', 'image', 'url'].filter((c) => !p.og[c]);
    if (falta.length) add('medio', 'Compartilhamento', pg, `Open Graph incompleto (falta og:${falta.join(', og:')})`, 'é a prévia do link no WhatsApp, no Instagram e no LinkedIn');
    else if (!/^https?:\/\//.test(p.og.image)) add('medio', 'Compartilhamento', pg, 'og:image com caminho relativo', 'tem que ser o endereço completo, com https://');
    if (!p.twitter) add('baixo', 'Compartilhamento', pg, 'Sem twitter:card', '<meta name="twitter:card" content="summary_large_image">');
  }

  // canonical
  if (!ehDemo && p.indexavel) {
    if (!p.canonical) add('alto', 'Canonical', pg, 'Sem link canonical', 'sem ele, variações do endereço (com www, com ?utm) competem entre si');
    else if (/DOMINIO/.test(p.canonical)) add('alto', 'Canonical', pg, 'Canonical com o domínio de exemplo', 'trocar DOMINIO pelo domínio real (o /publicar-site faz isso antes do deploy)');
    else {
      let c; try { c = new URL(p.canonical, p.url); } catch {}
      if (!c) add('alto', 'Canonical', pg, 'Canonical inválido', p.canonical);
      else if (!mesmoCaminho(caminhoDe(c.href), pg)) add('alto', 'Canonical', pg, 'Canonical aponta pra outra página', `${p.canonical}: o Google tende a tirar esta página do índice`);
      else if (ehUrl && c.host !== new URL(base).host) add('alto', 'Canonical', pg, 'Canonical aponta pra outro domínio', p.canonical);
      else p.dominio = c.origin;
    }
  }

  // títulos
  const h1 = p.titulos.filter((t) => t.nivel === 1);
  if (!h1.length) add('alto', 'Títulos', pg, 'Página sem <h1>');
  else if (h1.length > 1) add('medio', 'Títulos', pg, `${h1.length} títulos <h1>`, h1.map((t) => `"${t.texto}"`).join(' · '));
  if (p.titulos.some((t) => !t.texto)) add('medio', 'Títulos', pg, 'Título vazio (<h2>, <h3>... sem texto)');
  const salto = p.titulos.find((t, i) => i > 0 && t.nivel > p.titulos[i - 1].nivel + 1);
  if (salto) add('baixo', 'Títulos', pg, 'Hierarquia de títulos pula nível', `"${salto.texto}" é h${salto.nivel} logo depois de um h${p.titulos[p.titulos.indexOf(salto) - 1].nivel}`);

  // conteúdo
  if (p.indexavel && !privacidade && p.palavras < (pg === '/' ? 150 : 200)) add('medio', 'Conteúdo', pg, `Conteúdo raso: ${p.palavras} palavras`, 'pouco texto pra responder a busca; dizer o que é, pra quem, quanto, como funciona e onde');
  if (p.palavrasCruas !== null && p.palavras > 100 && p.palavrasCruas < p.palavras * 0.5) {
    add('alto', 'Rastreamento', pg, 'O texto só aparece depois do JavaScript', `${p.palavrasCruas} palavras no HTML que o servidor entrega contra ${p.palavras} na tela. O Google costuma renderizar; buscadores de IA em geral leem só o HTML. Saída: gerar a página no servidor ou no build (SSG/SSR)`);
  }
  const vagas = VAGO.filter((v) => normalizar(p.texto).includes(v));
  if (vagas.length) add('baixo', 'GEO', pg, 'Frases vagas que qualquer concorrente poderia assinar', `${vagas.join(' · ')}: trocar por fato com número, nome ou data`, 'hipótese');

  // links
  const internos = p.links.filter((l) => l.href.startsWith(base) && !/^(#|mailto:|tel:|javascript:)/.test(l.cru));
  p.internos = internos.map((l) => l.href.split('#')[0]);
  p.externos = p.links.filter((l) => /^https?:/.test(l.href) && !l.href.startsWith(base)).map((l) => l.href);
  const vagos = internos.filter((l) => ANCORA_VAGA.has(normalizar(l.texto)));
  if (vagos.length) add('baixo', 'Links', pg, 'Link interno com texto genérico', `${vagos.length} ("${vagos[0].texto}"): o texto do link diz ao buscador do que a outra página trata`);
  if (p.semNome) add('medio', 'Acessibilidade', pg, 'Link ou botão sem nome', `${p.semNome}: ícone sozinho precisa de aria-label; leitor de tela e buscador não sabem o que ele faz`);
  if (p.semRotulo) add('medio', 'Acessibilidade', pg, 'Campo de formulário sem rótulo', `${p.semRotulo}: <label> ou aria-label`);

  // endereço da página
  const u = decodeURIComponent(pg);
  const feio = [/[A-Z]/.test(u) && 'maiúscula', /_/.test(u) && 'underline', /\s/.test(u) && 'espaço', /[^\x00-\x7f]/.test(u) && 'acento', u.length > 75 && 'muito longo', /\?/.test(u) && 'parâmetro (?)'].filter(Boolean);
  if (feio.length) add('baixo', 'URLs', pg, `Endereço com ${feio.join(', ')}`, 'curto, minúsculo, com hífen: /lentes-multifocais');

  // imagens
  const semAlt = p.imgs.filter((i) => !i.decorativa && i.alt === null);
  if (semAlt.length) add('medio', 'Imagens', pg, 'Imagem sem alt', `${semAlt.length}: ` + semAlt.slice(0, 3).map((i) => caminhoDe(i.src)).join(' · '));
  const quebradas = p.imgs.filter((i) => i.quebrada);
  if (quebradas.length) add('alto', 'Imagens', pg, 'Imagem quebrada', `${quebradas.length}: ` + quebradas.slice(0, 3).map((i) => caminhoDe(i.src)).join(' · '));
  const pesadas = p.imgs.filter((i) => i.bytes > 500000 || (i.bytes > 200000 && /jpe?g|png/.test(i.tipo)));
  if (pesadas.length) add('medio', 'Imagens', pg, 'Imagem pesada', `${pesadas.length}: ` + pesadas.slice(0, 3).map((i) => `${caminhoDe(i.src)} (${Math.round(i.bytes / 1024)} kB)`).join(' · ') + ': WebP ou AVIF, na largura em que aparece');
  const genericas = p.imgs.filter((i) => !/^data:/.test(i.src) && NOME_GENERICO.test(decodeURIComponent(i.src.split('/').pop().split('?')[0].replace(/\.\w+$/, ''))));
  if (genericas.length) add('baixo', 'Imagens', pg, 'Imagem com nome de arquivo genérico', `${genericas.length} (${genericas[0].src.split('/').pop()}): nome descritivo (fachada-otica-centro.webp)`);
  const semMedida = p.imgs.filter((i) => !i.medidas && !/^data:/.test(i.src));
  if (semMedida.length) add('baixo', 'Imagens', pg, 'Imagem sem width e height no HTML', 'evita a página pular enquanto carrega (CLS)');

  // celular e semântica
  if (!p.viewport) add('alto', 'Celular', pg, 'Sem meta viewport', 'a página abre encolhida no celular');
  if (p.vazaLateral) add('alto', 'Celular', pg, 'Rolagem lateral em tela de 390 px');
  const semTag = Object.entries(p.semantica).filter(([, v]) => !v).map(([k]) => `<${k}>`);
  if (semTag.length) add('baixo', 'HTML semântico', pg, `Sem ${semTag.join(', ')}`, 'as marcas de estrutura dizem à máquina o que é conteúdo e o que é menu ou rodapé');

  // arquivos que não carregam
  if (p.falhas?.length) add('alto', 'Links', pg, 'Arquivo da página não carrega', p.falhas.slice(0, 4).join(' · '));

  // desempenho de laboratório
  if (p.lcp > 4000) add('medio', 'Desempenho', pg, `Maior elemento da tela levou ${(p.lcp / 1000).toFixed(1)} s (LCP, medição local)`, 'meta do Google: até 2,5 s no celular');
  if (p.cls > 0.1) add('medio', 'Desempenho', pg, `A página pula enquanto carrega (CLS ${p.cls}, medição local)`, 'meta: até 0,1');
  if (p.bytes > 3 * 1048576) add('medio', 'Desempenho', pg, `Página pesada: ${(p.bytes / 1048576).toFixed(1)} MB`);

  if (!ehDemo) conferirSchema(p); else p.schema = [];
}

// ---------- rodar ----------
let servidor = null;
let base = alvo;
if (!ehUrl) ({ srv: servidor, base } = await servir(alvo));
else if (!base.endsWith('/')) base = new URL(base).pathname === '/' ? base + '/' : base;
const origem = new URL(base).origin + '/';

const browser = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
const paginas = [];
let robotsTxt = null, sitemapXml = null, llms = null, psi = null;
const extras = []; // notas do que só existe em site publicado
try {
  // robots, sitemap, llms.txt
  const texto = async (arq) => { const r = await pegar(new URL(arq, origem)); return r?.ok && !/text\/html/.test(r.headers.get('content-type') || '') ? r.text() : null; };
  robotsTxt = await texto('robots.txt');
  llms = await texto('llms.txt');
  const robots = lerRobots(robotsTxt || '');
  sitemapXml = await texto('sitemap.xml');
  if (!sitemapXml && robots.sitemaps[0] && ehUrl) { const r = await pegar(robots.sitemaps[0]); sitemapXml = r?.ok ? await r.text() : null; }
  const locs = sitemapXml ? [...sitemapXml.matchAll(/<loc>\s*([^<\s]+)\s*<\/loc>/g)].map((m) => m[1]) : [];
  const caminhosSitemap = locs.map((l) => caminhoDe(l.replace('DOMINIO', 'x.invalid')));

  // rastrear: página inicial, links internos, sitemap e (pasta local) os .html soltos na raiz
  const vistas = new Set([base]);
  const fila = [base];
  const entra = (u) => { const limpo = u.split('#')[0]; if (!vistas.has(limpo) && vistas.size < MAX) { vistas.add(limpo); fila.push(limpo); } };
  caminhosSitemap.forEach((c) => { if (!c.endsWith('.xml')) entra(new URL(c.replace(/^\//, ''), origem).href); });
  if (!ehUrl) for (const f of await readdir(alvo)) if (f.endsWith('.html') && f !== 'index.html') entra(new URL(f, origem).href);
  while (fila.length) {
    const p = await lerPagina(browser, fila.shift(), origem);
    paginas.push(p);
    if (p.erro || !p.texto) continue;
    p.links.filter((l) => l.href.startsWith(origem) && /(\.html?|\/|\/[^./?#]+)(\?[^#]*)?$/.test(l.href.split('#')[0])).forEach((l) => entra(l.href));
  }

  const lidas = paginas.filter((p) => !p.erro && p.status === 200 && p.titulo !== undefined);
  if (!ehDemo && lidas.length && lidas.every((p) => p.faixaDemo)) ehDemo = true; // demo detectada pela faixa
  for (const p of paginas) {
    if (p.erro) add(p.url === base ? 'critico' : 'alto', 'Rastreamento', p.caminho, 'A página não abriu', p.erro);
    else if (p.status !== 200) add(p.url === base ? 'critico' : 'alto', 'Links', p.caminho, `Página responde ${p.status}`, caminhosSitemap.some((c) => mesmoCaminho(c, p.caminho)) ? 'está no sitemap' : 'há link interno apontando pra ela');
    else conferirPagina(p, origem);
  }
  const index = lidas.filter((p) => p.indexavel);

  // ---------- entre páginas ----------
  const repetidos = (campo, rotulo) => {
    const grupos = new Map();
    index.forEach((p) => { if (p[campo]) grupos.set(p[campo], [...(grupos.get(p[campo]) || []), p.caminho]); });
    for (const [v, ps] of grupos) if (ps.length > 1) add('alto', 'Metadados', ps.join(', '), `${rotulo} repetido em ${ps.length} páginas`, `"${v}": cada página precisa do seu, senão elas disputam a mesma busca`);
  };
  repetidos('titulo', 'Title');
  repetidos('desc', 'Description');

  const telhas = (t) => { const w = palavras(t); const s = new Set(); for (let i = 0; i + 5 <= w.length; i++) s.add(w.slice(i, i + 5).join(' ')); return s; };
  const conj = index.map((p) => [p, telhas(p.texto)]).filter(([, s]) => s.size > 40);
  for (let i = 0; i < conj.length; i++) for (let k = i + 1; k < conj.length; k++) {
    const [a, sa] = conj[i], [b, sb] = conj[k];
    let comum = 0; for (const x of sa) if (sb.has(x)) comum++;
    const igual = comum / (sa.size + sb.size - comum);
    if (igual > 0.8) add('alto', 'Conteúdo duplicado', `${a.caminho}, ${b.caminho}`, `Duas páginas com ${Math.round(igual * 100)}% do texto igual`, 'reescrever uma delas ou juntar as duas (canonical ou redirecionamento 301)');
  }

  // links internos: órfãs e quebrados
  const chegam = new Map();
  lidas.forEach((p) => p.internos.forEach((h) => { const c = caminhoDe(h); if (!mesmoCaminho(c, p.caminho)) chegam.set(semBarra(c.replace(/\.html$/, '')), (chegam.get(semBarra(c.replace(/\.html$/, ''))) || 0) + 1); }));
  index.filter((p) => p.url !== base && !chegam.get(semBarra(p.caminho.replace(/\.html$/, '')))).forEach((p) => add('medio', 'Links', p.caminho, 'Página sem nenhum link interno apontando pra ela', 'página órfã: o buscador chega mal e ela não recebe força das outras'));
  const conhecidas = new Set(paginas.map((p) => p.url.split('#')[0]));
  const outros = [...new Set(lidas.flatMap((p) => p.internos))].filter((h) => !conhecidas.has(h));
  for (const h of outros.slice(0, 80)) {
    const r = await pegar(h, { method: 'HEAD' });
    if (!r || r.status >= 400) add('alto', 'Links', lidas.filter((p) => p.internos.includes(h)).map((p) => p.caminho).join(', '), 'Link interno quebrado', `${caminhoDe(h)} responde ${r?.status || 'nada'}`);
  }
  if (argv.includes('--externos')) {
    for (const h of [...new Set(lidas.flatMap((p) => p.externos))].filter((h) => !/wa\.me|whatsapp\.com|fonts\.g/.test(h)).slice(0, 60)) {
      const r = await pegar(h, { method: 'GET', headers: { 'User-Agent': 'Mozilla/5.0 (verificador de links)' } });
      if (!r || r.status === 404 || r.status === 410) add('medio', 'Links', lidas.filter((p) => p.externos.includes(h)).map((p) => p.caminho).join(', '), 'Link externo quebrado', `${h} responde ${r?.status || 'nada'}`);
    }
  }

  // ---------- robots, sitemap, robôs de IA ----------
  const tabelaIA = ROBOS_IA.map((r) => ({ ...r, ...roboPode(robots, r.nome, '/') }));
  if (ehDemo) {
    if (!robotsTxt || roboPode(robots, 'Googlebot', '/').permitido) add('critico', 'Indexação', 'robots.txt', 'Demonstração sem robots.txt bloqueando tudo', 'User-agent: * / Disallow: /');
    if (sitemapXml) add('medio', 'Indexação', 'sitemap.xml', 'Demonstração com sitemap.xml', 'apagar: demo não é pra ser achada');
  } else {
    if (!robotsTxt) add('medio', 'Indexação', 'robots.txt', 'Sem robots.txt', 'gerar com node scripts/seo-arquivos.js');
    else {
      if (!roboPode(robots, 'Googlebot', '/').permitido) add('critico', 'Indexação', 'robots.txt', 'robots.txt bloqueia o Google no site inteiro');
      if (!roboPode(robots, 'Bingbot', '/').permitido) add('alto', 'Indexação', 'robots.txt', 'robots.txt bloqueia o Bing', 'fora do Bing e do Copilot');
      if (!robots.sitemaps.length) add('baixo', 'Indexação', 'robots.txt', 'robots.txt não aponta o sitemap', 'Sitemap: https://dominio/sitemap.xml');
      const buscaFora = tabelaIA.filter((r) => r.papel !== 'treino' && r.nome !== 'Bingbot' && !r.permitido);
      if (buscaFora.length) add('alto', 'GEO', 'robots.txt', 'Buscadores de IA bloqueados no robots.txt', `${buscaFora.map((r) => r.nome).join(', ')}: sem ler o site, eles não têm como citá-lo. Se foi decisão do cliente, registrar no plano`);
      else if (tabelaIA.every((r) => r.grupo !== 'próprio')) add('baixo', 'GEO', 'robots.txt', 'Política pra robôs de IA não foi decidida', 'hoje todos entram pela regra geral. Decidir com o cliente: liberar tudo, liberar só a busca (sem treino) ou bloquear — e registrar', 'hipótese');
    }
    if (!sitemapXml) add('alto', 'Indexação', 'sitemap.xml', 'Sem sitemap.xml', 'gerar com node scripts/seo-arquivos.js');
    else {
      if (locs.some((l) => l.includes('DOMINIO'))) add('alto', 'Indexação', 'sitemap.xml', 'Sitemap com o domínio de exemplo', 'trocar DOMINIO pelo domínio real');
      index.filter((p) => !/privacidade|politica|termos/.test(p.caminho) && !caminhosSitemap.some((c) => mesmoCaminho(c, p.caminho)))
        .forEach((p) => add('medio', 'Indexação', 'sitemap.xml', 'Página indexável fora do sitemap', p.caminho));
      lidas.filter((p) => p.noindex && caminhosSitemap.some((c) => mesmoCaminho(c, p.caminho)))
        .forEach((p) => add('medio', 'Indexação', 'sitemap.xml', 'Página com noindex dentro do sitemap', p.caminho));
    }
    const inicio = lidas.find((p) => p.url === base);
    if (inicio && !inicio.schema.length) add('alto', 'Dados estruturados', '/', 'Página inicial sem dados estruturados (JSON-LD)', 'o tipo do negócio, com endereço, telefone e horário, é o que o Google e os buscadores de IA usam pra saber quem é a empresa');
    if (inicio && !lidas.some((p) => p.negocio)) add('medio', 'SEO local', '/', 'Nenhuma página declara o negócio com endereço', 'negócio que atende numa cidade ganha com LocalBusiness (tipo específico), endereço, área atendida e horário. Só online: Organization já resolve');
    if (index.length > 1 && !lidas.some((p) => p.faq || p.perguntasVisiveis)) add('baixo', 'GEO', 'site', 'Nenhuma pergunta respondida no site', 'perguntas reais dos clientes, respondidas em duas ou três frases, são o formato que busca por voz e IA mais reaproveitam', 'hipótese');
  }

  // a primeira dobra diz quem é e onde?
  const negocio = plano?.negocio || lidas.find((p) => p.negocio)?.negocio;
  const inicio = lidas.find((p) => p.url === base);
  if (inicio && negocio?.nome) {
    const comeco = ` ${normalizar(inicio.inicio)} `;
    const falta = [!comeco.includes(` ${normalizar(negocio.nome)} `) && 'o nome', negocio.cidade && !comeco.includes(` ${normalizar(negocio.cidade)} `) && 'a cidade'].filter(Boolean);
    if (falta.length) add('medio', 'GEO', '/', `O começo da página inicial não diz ${falta.join(' nem ')} em texto`, 'uma frase clara logo no topo ("<empresa> é uma <o que é> em <cidade> que <o que faz>") é a definição que a busca e a IA copiam', 'hipótese');
  }

  // ---------- plano de palavras-chave ----------
  const linhasPlano = [];
  if (plano?.paginas) {
    const donos = new Map();
    for (const pp of plano.paginas) {
      const cam = pp.pagina === 'index.html' || pp.pagina === '/' ? '/' : '/' + String(pp.pagina).replace(/^\//, '');
      const p = lidas.find((x) => mesmoCaminho(x.caminho, cam));
      const k = normalizar(pp.principal);
      if (donos.has(k)) add('alto', 'Palavras-chave', `${donos.get(k)}, ${cam}`, 'Duas páginas disputam a mesma palavra principal', `"${pp.principal}": cada busca tem uma página dona`);
      else donos.set(k, cam);
      if (!p) { add('alto', 'Palavras-chave', cam, 'Página do plano não existe no site', `era a dona de "${pp.principal}"`); linhasPlano.push({ cam, pp, ok: ['—', '—', '—'] }); continue; }
      p.noPlano = true;
      const noTitle = contemBusca(p.titulo, pp.principal);
      const h1 = p.titulos.find((t) => t.nivel === 1)?.texto || '';
      const noTopo = contemBusca(`${h1} ${p.inicio.split(' ').slice(0, 120).join(' ')}`, pp.principal);
      const naDesc = contemBusca(p.desc, pp.principal);
      if (!noTitle) add('alto', 'Palavras-chave', cam, 'A palavra principal não está no title', `"${pp.principal}" × "${p.titulo}"`);
      if (!noTopo) add('medio', 'Palavras-chave', cam, 'A palavra principal não aparece no h1 nem no começo do texto', `"${pp.principal}": o h1 pode ser criativo, desde que a linha de apoio logo abaixo diga o serviço e a cidade`);
      if (!naDesc) add('baixo', 'Palavras-chave', cam, 'A palavra principal não está na description', `"${pp.principal}"`);
      const frase = normalizar(pp.principal);
      const vezes = normalizar(p.texto).split(frase).length - 1;
      if (vezes >= 5 && (vezes * frase.split(' ').length) / p.palavras > 0.03) add('medio', 'Palavras-chave', cam, `Palavra principal repetida ${vezes} vezes`, 'repetição forçada (keyword stuffing) piora a leitura e pode ser lida como spam: variar e escrever natural');
      if (!ehDemo && pp.title && pp.title !== p.titulo) add('baixo', 'Palavras-chave', cam, 'Title diferente do plano', `plano: "${pp.title}" · site: "${p.titulo}"`);
      if (!ehDemo && pp.description && pp.description !== p.desc) add('baixo', 'Palavras-chave', cam, 'Description diferente do plano');
      linhasPlano.push({ cam, pp, ok: [noTitle, noTopo, naDesc].map((v) => (v ? 'sim' : 'não')) });
    }
    index.filter((p) => !p.noPlano && !/privacidade|politica|termos/.test(p.caminho)).forEach((p) => add('baixo', 'Palavras-chave', p.caminho, 'Página fora do plano de palavras-chave', 'decidir qual busca ela responde ou tirar do índice'));
  }

  // ---------- só em site publicado ----------
  if (ehUrl && !/localhost|127\.0\.0\.1/.test(base)) {
    const u = new URL(base);
    if (u.protocol === 'http:') add('alto', 'Segurança', '/', 'Site sem HTTPS', 'o navegador avisa "não seguro" e o Google prefere a versão segura');
    else {
      const r = await pegar(base.replace('https://', 'http://'), { redirect: 'manual' });
      if (r && r.status === 200) add('medio', 'Redirecionamentos', '/', 'A versão http:// abre sem redirecionar pra https://');
    }
    const outro = u.host.startsWith('www.') ? u.host.slice(4) : `www.${u.host}`;
    const r = await pegar(`${u.protocol}//${outro}/`, { redirect: 'manual' });
    if (r?.status === 200) add('medio', 'Redirecionamentos', '/', `${outro} abre sem redirecionar pra ${u.host}`, 'duas versões do mesmo site no ar: escolher uma e redirecionar a outra (301)');
    else extras.push(`${outro}: ${r ? `responde ${r.status}${r.headers.get('location') ? ` → ${r.headers.get('location')}` : ''}` : 'não responde'}`);
    const nada = await pegar(new URL(`pagina-que-nao-existe-${Date.now()}`, origem));
    if (nada?.status === 200) add('medio', 'Redirecionamentos', '/', 'Endereço que não existe responde 200', 'página de erro tem que responder 404, senão o Google indexa endereço vazio');
    if (argv.includes('--psi')) {
      const chave = process.env.PAGESPEED_API_KEY ? `&key=${process.env.PAGESPEED_API_KEY}` : '';
      const r2 = await pegar(`https://www.googleapis.com/pagespeedonline/v5/runPagespeed?url=${encodeURIComponent(base)}&strategy=mobile&category=performance&category=seo&category=accessibility${chave}`, { signal: AbortSignal.timeout(120000) });
      if (r2?.ok) {
        const j = await r2.json();
        const cat = j.lighthouseResult?.categories || {};
        const aud = j.lighthouseResult?.audits || {};
        const campo = j.loadingExperience?.metrics;
        psi = {
          notas: Object.fromEntries(Object.entries(cat).map(([k, v]) => [k, Math.round((v.score || 0) * 100)])),
          lcp: aud['largest-contentful-paint']?.displayValue, cls: aud['cumulative-layout-shift']?.displayValue, tbt: aud['total-blocking-time']?.displayValue,
          campo: campo ? { lcp: campo.LARGEST_CONTENTFUL_PAINT_MS?.percentile, inp: campo.INTERACTION_TO_NEXT_PAINT?.percentile, cls: campo.CUMULATIVE_LAYOUT_SHIFT_SCORE?.percentile, geral: j.loadingExperience.overall_category } : null,
        };
        if (psi.notas.performance < 50) add('alto', 'Desempenho', '/', `PageSpeed no celular: ${psi.notas.performance} de 100`, `LCP ${psi.lcp} · CLS ${psi.cls} · bloqueio ${psi.tbt}`);
        else if (psi.notas.performance < 90) add('medio', 'Desempenho', '/', `PageSpeed no celular: ${psi.notas.performance} de 100`, `LCP ${psi.lcp} · CLS ${psi.cls} · bloqueio ${psi.tbt}`);
      } else psi = { erro: `respondeu ${r2?.status || 'nada'}${r2?.status === 429 ? ' (limite sem chave: criar uma chave gratuita e pôr em PAGESPEED_API_KEY no .env)' : ''}` };
    }
  } else if (argv.includes('--psi')) psi = { erro: 'só mede site publicado (passar a URL)' };

  // ---------- relatório ----------
  achados.sort((a, b) => GRAV.indexOf(a.grav) - GRAV.indexOf(b.grav));
  const agrupar = (lista) => {
    const g = new Map();
    lista.forEach((a) => { const k = `${a.area}|${a.item}`; g.set(k, [...(g.get(k) || []), a]); });
    return [...g.values()].map((as) => {
      const a = as[0];
      const pags = [...new Set(as.map((x) => x.pagina))];
      const onde = pags.length > 4 ? `${pags.slice(0, 4).join(', ')} e mais ${pags.length - 4}` : pags.join(', ');
      const det = [...new Set(as.map((x) => x.detalhe).filter(Boolean))].slice(0, 2).join(' | ');
      return `- **${a.area}** · ${a.item} — ${onde}${det ? `. ${det}` : ''}${a.base ? ` _(${a.base})_` : ''}`;
    });
  };
  const cont = Object.fromEntries(GRAV.map((g) => [g, agrupar(achados.filter((a) => a.grav === g)).length]));
  const cel = (t) => String(t ?? '').replace(/\|/g, '/').replace(/\s+/g, ' ');
  const L = [
    `# Auditoria de SEO e GEO — ${new Date().toISOString().slice(0, 10)}`,
    '',
    `- **Alvo:** ${alvo}${ehDemo ? ' — **demonstração**: noindex e robots bloqueado são de propósito e ficam' : ''}`,
    `- **Tipo:** ${stack}`,
    `- **Páginas lidas:** ${paginas.length}${paginas.length >= MAX ? ` (limite de ${MAX}; aumentar com --max)` : ''}`,
    `- **Resultado:** ${cont.critico} crítico · ${cont.alto} alto · ${cont.medio} médio · ${cont.baixo} baixo`,
    '',
    'Como ler: **Crítico** impede o site de ser lido, indexado ou de funcionar. **Alto** custa posição ou clique. **Médio** vale corrigir nesta rodada. **Baixo** é acabamento.',
    'Achado marcado _(hipótese)_ é boa prática pra buscadores de IA sem comprovação pública de efeito; _(experimental)_ é recurso que ainda não tem adoção confirmada.',
    '',
  ];
  for (const g of GRAV) {
    const lista = achados.filter((a) => a.grav === g);
    L.push(`## ${ROTULO[g]} (${cont[g]})`, ...(lista.length ? agrupar(lista) : ['- nada']), '');
  }
  L.push('## Páginas', '', '| Página | Title | Description | H1 | Palavras | Dados estruturados | Indexável |', '|---|---|---|---|---|---|---|');
  for (const p of lidas) {
    L.push(`| ${p.caminho} | ${cel(p.titulo)} (${p.titulo.length}) | ${p.desc ? `${cel(p.desc)} (${p.desc.length})` : '—'} | ${cel(p.titulos.find((t) => t.nivel === 1)?.texto) || '—'} | ${p.palavras} | ${[...new Set(p.schema)].join(', ') || '—'} | ${p.indexavel ? 'sim' : 'não'} |`);
  }
  L.push('', '## Estrutura de títulos', '');
  for (const p of lidas) {
    L.push(`**${p.caminho}**`, ...p.titulos.slice(0, 14).map((t) => `${'  '.repeat(t.nivel - 1)}- h${t.nivel}: ${t.texto || '(vazio)'}`), ...(p.titulos.length > 14 ? [`  - … mais ${p.titulos.length - 14}`] : []), '');
  }
  if (linhasPlano.length) {
    L.push('## Palavras-chave por página (plano)', '', '| Página | Principal | Secundárias | No title | No h1 ou no começo | Na description |', '|---|---|---|---|---|---|');
    linhasPlano.forEach(({ cam, pp, ok }) => L.push(`| ${cam} | ${cel(pp.principal)} | ${cel((pp.secundarias || []).join(', ')) || '—'} | ${ok[0]} | ${ok[1]} | ${ok[2]} |`));
    L.push('');
  }
  L.push('## GEO: o que um buscador de IA encontra', '');
  if (ehDemo) L.push('- Demonstração: fica fora de todos os buscadores de propósito. Nada a abrir aqui.');
  else {
    const n = lidas.find((p) => p.negocio)?.negocio;
    L.push(`- **Entidade:** ${n ? `${n.nome || 'sem nome'} · ${n.tipo}${n.cidade ? ` · ${n.cidade}` : ''}` : 'nenhuma página declara o negócio em dado estruturado'}`);
    L.push(`- **Perguntas respondidas:** ${lidas.reduce((s, p) => s + (p.perguntasVisiveis || 0), 0)} visíveis no site · FAQPage em ${lidas.filter((p) => p.faq).length} página(s)`);
    const js = lidas.filter((p) => p.palavrasCruas !== null && p.palavras > 100 && p.palavrasCruas < p.palavras * 0.5).length;
    L.push(`- **Texto no HTML que o servidor entrega:** ${js ? `${js} página(s) dependem de JavaScript pra mostrar o texto` : 'sim, em todas as páginas lidas'}`);
    L.push(`- **llms.txt:** ${llms ? 'existe' : 'não existe'} _(experimental: nenhum buscador confirmou que usa o arquivo; não é fator de posição. Fazer só se custar pouco)_`);
    L.push('', '| Robô | De quem | Papel | Entra no site? | Regra |', '|---|---|---|---|---|');
    tabelaIA.forEach((r) => L.push(`| ${r.nome} | ${r.de} | ${r.papel} | ${r.permitido ? 'sim' : '**não**'} | ${r.grupo === 'próprio' ? 'própria' : r.grupo === '*' ? 'geral (*)' : 'sem robots.txt'} |`));
    L.push('', 'Entrar no site não garante citação: nenhuma técnica garante que uma IA cite uma empresa.');
  }
  L.push('', '## Desempenho', '', '| Página | LCP (lab) | CLS (lab) | Peso | Pedidos |', '|---|---|---|---|---|');
  lidas.forEach((p) => L.push(`| ${p.caminho} | ${p.lcp ? `${(p.lcp / 1000).toFixed(1)} s` : 'não medido'} | ${p.cls} | ${(p.bytes / 1024).toFixed(0)} kB | ${p.pedidos} |`));
  L.push('', 'Medição de laboratório: Chromium neste computador, em tela de celular, **sem** simular rede 4G nem aparelho fraco. Serve pra comparar antes e depois, não é a nota do Google.');
  if (psi?.erro) L.push(`PageSpeed Insights: ${psi.erro}.`);
  else if (psi) {
    L.push('', `**PageSpeed Insights (teste real do Google, celular):** desempenho ${psi.notas.performance} · SEO ${psi.notas.seo} · acessibilidade ${psi.notas.accessibility} · LCP ${psi.lcp} · CLS ${psi.cls} · bloqueio ${psi.tbt}`);
    L.push(psi.campo ? `**Dados de visitantes reais (CrUX, 28 dias):** LCP ${psi.campo.lcp} ms · INP ${psi.campo.inp ?? '—'} ms · CLS ${(psi.campo.cls ?? 0) / 100} · situação: ${psi.campo.geral}` : 'Dados de visitantes reais (Core Web Vitals de campo): o site ainda não tem visitas suficientes no relatório do Chrome.');
  }
  L.push('', '## Não medido aqui', '',
    '- Se o site **está indexado** e em que posição aparece: só o Search Console e o Bing Webmaster Tools dizem.',
    `- Core Web Vitals reais (de visitantes): PageSpeed Insights${psi && !psi.erro ? ' (acima)' : ' (rodar com --psi no site publicado)'} e Search Console.`,
    '- Validade dos dados estruturados pro Google: Teste de resultados avançados (search.google.com/test/rich-results) e validator.schema.org.',
    '- Se alguma IA cita a empresa: testar as perguntas do plano no ChatGPT, no Gemini e no Perplexity e anotar o resultado com a data.',
    '- Qualidade do texto e se ele é verdadeiro: revisão humana.',
    ...(argv.includes('--externos') ? [] : ['- Links pra fora do site (rodar com --externos).']),
    ...extras.map((e) => `- ${e}`));

  const relatorio = L.join('\n');
  console.log(relatorio);
  if (valor('--saida')) await writeFile(valor('--saida'), relatorio + '\n');
  if (valor('--json')) {
    await writeFile(valor('--json'), JSON.stringify({ data: new Date().toISOString(), alvo, demo: ehDemo, stack, contagem: cont, achados,
      paginas: lidas.map((p) => ({ caminho: p.caminho, title: p.titulo, description: p.desc, h1: p.titulos.filter((t) => t.nivel === 1).map((t) => t.texto), titulos: p.titulos, palavras: p.palavras, indexavel: p.indexavel, canonical: p.canonical, schema: [...new Set(p.schema)], lcp: p.lcp, cls: p.cls, bytes: p.bytes })),
      robosIA: tabelaIA, llms: !!llms, psi }, null, 2) + '\n');
  }
  process.exitCode = cont.critico ? 1 : 0;
} finally {
  await browser.close();
  servidor?.close();
}
