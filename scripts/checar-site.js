// Confere um site antes de entregar: erros, texto de exemplo esquecido, SEO, imagens, celular, links.
//
// Uso:
//   node scripts/checar-site.js <pasta-do-site | https://url> [--demo] [--marca marca.json] [--saida relatorio.md]
//
// Pasta: sobe um servidor local temporário. URL: confere o site publicado.
// --demo: site de demonstração (/site-demo) — exige noindex em vez de proibir.
// --marca: identidade da loja (scripts/extrair-marca.js). Erro se o site não usa a cor da marca,
//   aviso se o logo não aparece no topo. Sem a flag, procura <pasta>/../marca/marca.json.
// Sai com código 1 se houver ❌ (erro que bloqueia a entrega).

import { chromium } from 'playwright';
import { readFile, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { servir } from './lib/servir.js';

const argv = process.argv.slice(2);
const alvo = argv.find((a, i) => !a.startsWith('--') && !['--saida', '--marca'].includes(argv[i - 1]));
const ehDemo = argv.includes('--demo');
const saida = argv.includes('--saida') ? argv[argv.indexOf('--saida') + 1] : null;
let arqMarca = argv.includes('--marca') ? argv[argv.indexOf('--marca') + 1] : null;
if (!alvo) {
  console.error('uso: node scripts/checar-site.js <pasta | url> [--demo] [--saida relatorio.md]');
  process.exit(1);
}

// Textos do modelo /site-premium que não podem ir pro ar.
// Busca no texto original (sem as maiúsculas do CSS), palavra inteira.
const EXEMPLOS = [
  'DOMINIO', 'Marca ·', 'MARCA', 'Marca', 'Serviço principal', 'Serviço dois', 'Serviço três', 'Serviço quatro',
  'Serviço cinco', 'Rua Exemplo', 'Cidade/UF', '00000-000', '0000-0000', '00.000.000', '5500000000000',
  'Nome S.', 'Frase real de uma avaliação', 'Descrever a foto', 'TROCAR PELA FOTO', 'Benefício concreto',
  '000 avaliações', 'O que acontece nessa etapa', 'Uma que fale de atendimento', 'NOME-DO-SERVIÇO',
  'Uma frase do que a marca', 'Duas frases', 'Resposta real', 'Etapa um', '{{',
];

const achados = []; // { nivel: 'erro'|'aviso'|'ok', pagina, item, detalhe }

// identidade da loja: o site usa a cor e o logo dela, não um visual genérico
if (!arqMarca && !/^https?:\/\//.test(alvo)) {
  const vizinho = path.join(alvo, '..', 'marca', 'marca.json');
  if (existsSync(vizinho)) arqMarca = vizinho;
}
const marca = arqMarca ? JSON.parse(await readFile(arqMarca, 'utf8')) : null;
function conferirMarca(info, nome) {
  const rgb = (h) => (/^#[0-9a-f]{6}$/i.test(h) ? [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16)) : null);
  const destaque = marca.cores?.destaque;
  if (destaque) {
    const a = rgb(info.accent), b = rgb(destaque);
    if (!a) add('aviso', nome, 'Não deu pra ler a cor de destaque do site (--accent)', `a da marca é ${destaque}`);
    else if (Math.hypot(...a.map((v, i) => v - b[i])) > 40) {
      add(marca.decisoes ? 'aviso' : 'erro', nome, 'O site não usa a cor da marca', `--accent é ${info.accent}, a da marca é ${destaque} (${path.basename(path.dirname(arqMarca))}/marca.md). Se a troca foi de propósito, registrar o motivo em "decisoes" no marca.json`);
    }
  }
  if (marca.decisoes) add('aviso', nome, 'Identidade com decisão registrada', String(marca.decisoes));
  if (marca.logo && !info.logoTopo.length) add('aviso', nome, 'Logo da loja não aparece no topo', `existe em ${marca.logo.arquivo}; nome em texto só se o logo não ler bem`);
}
const site = { contato: null, privacidade: null }; // modo de contato (app.js) e texto da página de privacidade
const add = (nivel, pagina, item, detalhe = '') => achados.push({ nivel, pagina, item, detalhe });

async function checarPagina(browser, url, base, visitadas, fila) {
  const nome = url.replace(base, '/') || '/';
  for (const [disp, vp] of [['desktop', { width: 1440, height: 900 }], ['celular', { width: 390, height: 844 }]]) {
    const ctx = await browser.newContext({ viewport: vp, isMobile: disp === 'celular', hasTouch: disp === 'celular' });
    const page = await ctx.newPage();
    const erros = [];
    const falhas = [];
    let bytes = 0;
    page.on('pageerror', (e) => erros.push(e.message));
    page.on('console', (m) => { if (m.type() === 'error') erros.push(m.text()); });
    const exemplos = new Set();
    page.on('response', async (r) => {
      if (r.url().startsWith(base) && /\/exemplo-|-exemplo\./.test(r.url())) exemplos.add(r.url().replace(base, '/'));
      if (r.status() >= 400) falhas.push(`${r.status()} ${r.url().replace(base, '/')}`);
      const len = Number(r.headers()['content-length'] || 0);
      bytes += len;
    });
    page.on('requestfailed', (r) => {
      const motivo = r.failure()?.errorText || '';
      if (!/ERR_ABORTED/.test(motivo)) falhas.push(`falhou ${r.url().replace(base, '/')} (${motivo})`);
    });

    const t0 = Date.now();
    await page.goto(url, { waitUntil: 'load', timeout: 60000 });
    const tempoLoad = Date.now() - t0;
    await page.waitForTimeout(2500);

    if (disp === 'desktop') {
      const info = await page.evaluate(() => {
        const meta = (sel) => document.querySelector(sel)?.getAttribute('content') || '';
        const jsonld = [...document.querySelectorAll('script[type="application/ld+json"]')].map((s) => {
          try { const j = JSON.parse(s.textContent); return { ok: true, tipos: JSON.stringify(j).match(/"@type":"[^"]+"/g) || [] }; } catch (e) { return { ok: false, erro: e.message }; }
        });
        const imgs = [...document.images].map((i) => ({
          src: i.currentSrc || i.src, alt: i.getAttribute('alt'), decorativa: i.getAttribute('aria-hidden') === 'true',
          lazy: i.loading === 'lazy', topo: i.getBoundingClientRect().top < innerHeight, quebrada: i.complete && i.naturalWidth === 0 && getComputedStyle(i).display !== 'none',
          largura: i.naturalWidth, exibida: i.getBoundingClientRect().width,
        }));
        const links = [...document.querySelectorAll('a[href]')].map((a) => ({ href: a.href, cru: a.getAttribute('href'), blank: a.target === '_blank', rel: a.rel }));
        // texto visível + atributos que aparecem pro usuário/Google
        const textos = [document.body.textContent, document.title, meta('meta[name="description"]'), meta('meta[property="og:title"]'),
          ...[...document.querySelectorAll('script[type="application/ld+json"]')].map((s) => s.textContent),
          ...[...document.images].map((i) => i.alt || ''), document.querySelector('link[rel="canonical"]')?.href || ''].join('\n');
        return {
          lang: document.documentElement.lang, titulo: document.title, desc: meta('meta[name="description"]'),
          robots: meta('meta[name="robots"]'), canonical: document.querySelector('link[rel="canonical"]')?.getAttribute('href') || '',
          ogImg: meta('meta[property="og:image"]'), ogTitulo: meta('meta[property="og:title"]'), viewport: meta('meta[name="viewport"]'),
          favicon: !!document.querySelector('link[rel~="icon"]'), h1: document.querySelectorAll('h1').length,
          jsonld, imgs, links, textos, contato: window.__contato || null, corpo: document.body.textContent,
          accent: getComputedStyle(document.documentElement).getPropertyValue('--accent').trim(),
          logoTopo: [...document.querySelectorAll('header img, .nav img, header svg, .nav svg')].map((i) => i.currentSrc || i.src || 'svg'),
        };
      });

      // SEO básico
      if (!info.lang) add('erro', nome, 'Sem lang no <html>');
      if (!info.viewport) add('erro', nome, 'Sem meta viewport (quebra no celular)');
      if (info.h1 !== 1) add(info.h1 === 0 ? 'erro' : 'aviso', nome, `${info.h1} títulos <h1>`, 'o ideal é exatamente 1 por página');
      const lt = info.titulo.length;
      if (!lt) add('erro', nome, 'Página sem <title>');
      else if (lt < 25 || lt > 65) add('aviso', nome, `Título com ${lt} caracteres`, 'ideal entre 25 e 65 (serviço + cidade + marca)');
      const ld = info.desc.length;
      if (!ld) add('erro', nome, 'Sem meta description');
      else if (ld < 70 || ld > 160) add('aviso', nome, `Description com ${ld} caracteres`, 'ideal entre 70 e 160');
      if (!info.favicon) add('aviso', nome, 'Sem favicon');
      if ((!info.ogImg || !info.ogTitulo) && !/noindex/i.test(info.robots)) add('aviso', nome, 'Sem og:image/og:title', 'o link fica feio no WhatsApp');
      const noindex = /noindex/i.test(info.robots);
      if (ehDemo && !noindex) add('erro', nome, 'Demo sem noindex', 'demo não pode aparecer no Google: <meta name="robots" content="noindex, nofollow">');
      if (!ehDemo && noindex && !/privacidade/.test(nome)) add('erro', nome, 'Página com noindex', 'não vai aparecer no Google');
      if (!ehDemo && !info.canonical) add('aviso', nome, 'Sem link canonical');
      info.jsonld.forEach((j) => {
        if (!j.ok) add('erro', nome, 'JSON-LD inválido', j.erro);
        else if (/aggregateRating/.test(JSON.stringify(j))) add('aviso', nome, 'JSON-LD com aggregateRating', 'avaliação própria em LocalBusiness é contra as regras do Google');
      });
      if (nome === '/' && !ehDemo && info.jsonld.length === 0) add('aviso', nome, 'Sem dados estruturados (JSON-LD)', 'perde endereço/horário no Google');

      // modo de contato: orçamento (B2B) sem sobra de "agendar"; demo nunca coleta dado por formulário
      if (info.contato) {
        site.contato ||= info.contato;
        if (info.contato.modo === 'orcamento') {
          const sobra = info.corpo.match(/[^.\n]{0,40}(\bagend|hora marcada|\bmarcar\b)[^.\n]{0,30}/i);
          if (sobra) add('aviso', nome, 'Texto de agenda no modo orçamento', `"${sobra[0].trim()}" — trocar ou marcar com data-orcamento`);
        }
        if (ehDemo && info.contato.envio === 'formulario' && nome === '/') add('erro', nome, 'Demo com formulário de orçamento ligado', 'demo não coleta dado de quem visita: deixar CONFIG.orcamento.formulario vazio');
      }
      if (/privacidade/.test(nome)) site.privacidade = info.corpo;
      if (nome === '/' && marca) conferirMarca(info, nome);

      // imagens de exemplo do modelo (arquivos exemplo-*), inclusive a de compartilhamento
      if (/exemplo/.test(info.ogImg)) exemplos.add(info.ogImg.replace(/^https?:\/\/[^/]+/, '') + ' (og:image)');
      if (exemplos.size) add('erro', nome, 'Imagem de exemplo do modelo', [...exemplos].join(' · '));

      // texto de exemplo
      const escapar = (t) => t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const sobras = EXEMPLOS.filter((e) => (/^\p{L}+$/u.test(e)
        ? new RegExp(`(^|[^\\p{L}])${escapar(e)}($|[^\\p{L}])`, 'u').test(info.textos) // palavra solta: inteira
        : info.textos.includes(e)));
      if (sobras.length) add('erro', nome, 'Texto de exemplo do modelo', sobras.join(' · '));

      // imagens
      info.imgs.forEach((i) => {
        const arq = i.src.replace(base, '/');
        if (i.quebrada) add('erro', nome, 'Imagem quebrada', arq);
        if (!i.decorativa && !i.alt) add('aviso', nome, 'Imagem sem alt', arq);
        if (!i.topo && !i.lazy && !i.decorativa) add('aviso', nome, 'Imagem abaixo da dobra sem loading="lazy"', arq);
        if (i.largura && i.exibida && i.largura > i.exibida * 2.5 && i.largura > 1600) add('aviso', nome, `Imagem grande demais (${i.largura}px pra ${Math.round(i.exibida)}px)`, arq);
      });

      // links
      for (const l of info.links) {
        if (l.blank && !/noopener|noreferrer/.test(l.rel)) add('aviso', nome, 'Link _blank sem rel="noopener"', l.cru);
        if (/^https:\/\/wa\.me\//.test(l.href) && /wa\.me\/\d*0{6,}/.test(l.href)) add('erro', nome, 'WhatsApp de exemplo', l.cru);
        if (/LINK-DO-|LATITUDE,LONGITUDE|[?&]cid=0\b|instagram\.com\/perfil\b/.test(l.cru)) add('erro', nome, 'Link de exemplo', l.cru);
        if (/^tel:/.test(l.cru) && /0{6,}/.test(l.cru)) add('erro', nome, 'Telefone de exemplo', l.cru);
        if (l.href.startsWith(base)) {
          const limpo = l.href.split('#')[0];
          if (/\.html$|\/$/.test(limpo) && !visitadas.has(limpo)) { visitadas.add(limpo); fila.push(limpo); }
        }
      }

      // peso e tempo
      const mb = bytes / 1048576;
      if (mb > 5) add('aviso', nome, `Página pesada: ${mb.toFixed(1)} MB`, 'comprimir modelo 3D (Draco) e fotos (WebP)');
      if (tempoLoad > 6000) add('aviso', nome, `Demorou ${(tempoLoad / 1000).toFixed(1)} s pra carregar`);
    }

    // painel de agenda/orçamento: abre e cabe na tela
    const painel = await page.evaluate(async () => {
      const b = document.querySelector('[data-abrir-agenda]');
      if (!b) return null;
      b.click();
      const p = document.querySelector('.agenda-painel');
      const dentro = () => {
        const r = p.getBoundingClientRect();
        return document.querySelector('.agenda')?.classList.contains('aberta') && r.left >= -1 && r.right <= innerWidth + 1;
      };
      // espera o painel terminar de deslizar (o hero pesa e atrasa a animação)
      for (let i = 0; p && i < 30 && !dentro(); i++) await new Promise((r) => setTimeout(r, 100));
      const ok = !!p && dentro();
      const vaza = p ? p.scrollWidth > p.clientWidth + 1 : false;
      document.querySelector('[data-fechar-agenda]')?.click();
      return { ok, vaza };
    });
    if (painel && !painel.ok) add('erro', nome, `O painel de ${site.contato?.modo === 'orcamento' ? 'orçamento' : 'agenda'} não abriu (${disp})`);
    if (painel?.vaza) add('aviso', nome, `O painel de contato rola pro lado (${disp})`);

    // celular: rolagem lateral
    if (disp === 'celular') {
      const vaza = await page.evaluate(() => {
        const w = document.documentElement.clientWidth;
        if (document.documentElement.scrollWidth <= w + 1) return [];
        return [...document.querySelectorAll('body *')].filter((el) => {
          const r = el.getBoundingClientRect();
          return r.right > w + 1 && getComputedStyle(el).position !== 'fixed' && r.width > 0;
        }).slice(0, 4).map((el) => el.tagName.toLowerCase() + (el.className ? '.' + String(el.className).split(' ')[0] : ''));
      });
      if (vaza.length) add('erro', nome, 'Rolagem lateral no celular', vaza.join(', '));
    }

    [...new Set(erros)].forEach((e) => add('erro', nome, `Erro no console (${disp})`, e.slice(0, 160)));
    [...new Set(falhas)].forEach((f) => add('erro', nome, `Arquivo não carregou (${disp})`, f));
    await ctx.close();
  }
}

let servidor = null;
let base = alvo;
if (!/^https?:\/\//.test(alvo)) {
  if (!existsSync(path.join(alvo, 'index.html'))) {
    console.error(`não achei ${path.join(alvo, 'index.html')}`);
    process.exit(1);
  }
  ({ srv: servidor, base } = await servir(alvo));
} else if (!base.endsWith('/')) base += '/';

const browser = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
try {
  const visitadas = new Set([base]);
  const fila = [base];
  while (fila.length) await checarPagina(browser, fila.shift(), base, visitadas, fila);

  // arquivos do site
  const pegar = async (p) => { try { const r = await fetch(new URL(p, base)); return r.ok ? r.text() : null; } catch { return null; } };
  const robots = await pegar('robots.txt');
  const sitemap = await pegar('sitemap.xml');
  if (ehDemo) {
    if (!robots || !/Disallow:\s*\/\s*$/m.test(robots)) add('erro', 'robots.txt', 'Demo sem "Disallow: /"', 'robots.txt da demo deve bloquear tudo');
  } else {
    if (!robots) add('aviso', 'robots.txt', 'Sem robots.txt');
    else if (/Disallow:\s*\/\s*$/m.test(robots)) add('erro', 'robots.txt', 'robots.txt bloqueia o site inteiro');
    if (!sitemap) add('aviso', 'sitemap.xml', 'Sem sitemap.xml');
    else {
      const locs = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);
      if (locs.some((l) => l.includes('DOMINIO'))) add('erro', 'sitemap.xml', 'Sitemap com DOMINIO de exemplo');
      const paginas = [...visitadas].map((v) => v.replace(base, '/'));
      const noSitemap = locs.map((l) => { try { return new URL(l).pathname; } catch { return l; } });
      paginas.filter((p) => !/privacidade/.test(p) && !noSitemap.includes(p)).forEach((p) => add('aviso', 'sitemap.xml', 'Página fora do sitemap', p));
    }
  }

  if (site.contato?.envio === 'formulario' && site.privacidade !== null && !/formul/i.test(site.privacidade)) {
    add('aviso', '/privacidade.html', 'Privacidade não fala do formulário de orçamento', 'colar o item comentado no HTML, com o nome do serviço');
  }

  // relatório
  const erros = achados.filter((a) => a.nivel === 'erro');
  const avisos = achados.filter((a) => a.nivel === 'aviso');
  const linhas = [
    `# Checagem do site — ${new Date().toISOString().slice(0, 10)}`,
    '',
    `Alvo: ${alvo}${ehDemo ? ' (demo)' : ''} · páginas: ${[...visitadas].map((v) => v.replace(base, '/')).join(', ')}`,
    '',
    erros.length ? `## ❌ Bloqueia a entrega (${erros.length})` : '## ✅ Nada bloqueando a entrega',
    ...erros.map((a) => `- **${a.pagina}** — ${a.item}${a.detalhe ? `: ${a.detalhe}` : ''}`),
    '',
    avisos.length ? `## ⚠️ Vale corrigir (${avisos.length})` : '## ✅ Sem avisos',
    ...avisos.map((a) => `- **${a.pagina}** — ${a.item}${a.detalhe ? `: ${a.detalhe}` : ''}`),
    '',
    'Não coberto aqui: velocidade real em celular fraco (rode o Lighthouse/PageSpeed Insights no site publicado) e revisão humana do texto.',
  ];
  const relatorio = linhas.join('\n');
  console.log(relatorio);
  if (saida) await writeFile(saida, relatorio + '\n');
  process.exitCode = erros.length ? 1 : 0;
} finally {
  await browser.close();
  servidor?.close();
}
