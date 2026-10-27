// Levanta a identidade visual de uma loja antes de construir qualquer coisa pra ela:
// cores (com o papel de cada uma), fontes, logo, frases que a própria loja usa e redes.
//
// Uso:
//   node scripts/extrair-marca.js --site <url> --saida <pasta>
//   node scripts/extrair-marca.js --imagem logo.png --imagem fachada.jpg --saida <pasta>
//   node scripts/extrair-marca.js --site <url> --imagem print-instagram.png --saida <pasta>
//
// --site: abre a página como visitante, mede quanto cada cor aparece (área, texto, botões),
//   recorta o logo, lê as fontes e as frases. --imagem (repetível): logo, print do Instagram,
//   foto da fachada ou do uniforme — tira a paleta da imagem (ImageMagick).
// Saída: marca.json (o que as skills leem), marca.md (resumo + :root sugerido),
//   marca.png (quadro da marca pra mostrar) e assets/ (logo e prints).
// Nunca inventa cor: sem site nem imagem, não há o que extrair.

import { chromium } from 'playwright';
import { execFileSync } from 'node:child_process';
import { mkdir, writeFile, copyFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';

const argv = process.argv.slice(2);
const valores = (flag) => argv.flatMap((a, i) => (a === flag ? [argv[i + 1]] : []));
const site = valores('--site')[0];
const imagens = valores('--imagem');
const saida = valores('--saida')[0];
if ((!site && !imagens.length) || !saida) {
  console.error('uso: node scripts/extrair-marca.js [--site <url>] [--imagem <arquivo>]... --saida <pasta>');
  process.exit(1);
}
const assets = path.join(saida, 'assets');
await mkdir(assets, { recursive: true });

// ---------- cor ----------
const hex = ([r, g, b]) => '#' + [r, g, b].map((v) => Math.round(v).toString(16).padStart(2, '0')).join('');
const rgb = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
const dist = (a, b) => Math.hypot(...a.map((v, i) => v - b[i]));
function hsl([r, g, b]) {
  r /= 255; g /= 255; b /= 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b), l = (max + min) / 2;
  const s = max === min ? 0 : (max - min) / (1 - Math.abs(2 * l - 1));
  return { s, l };
}
const lum = (c) => {
  const [r, g, b] = c.map((v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};
const contraste = (a, b) => { const [x, y] = [lum(a), lum(b)].sort((m, n) => n - m); return (x + 0.05) / (y + 0.05); };
const neutra = (c) => { const { s, l } = hsl(c); return s < 0.18 || l < 0.1 || l > 0.94; };
const mistura = (c, alvo, t) => c.map((v, i) => v + (alvo[i] - v) * t);

// soma pesos em grupos de cores parecidas (o representante é a cor mais pesada do grupo)
function agrupar(lista) {
  const grupos = [];
  for (const it of [...lista].sort((a, b) => b.peso - a.peso)) {
    const g = grupos.find((x) => dist(x.rgb, it.rgb) < 26);
    if (g) { for (const k of Object.keys(it.canais)) g.canais[k] = (g.canais[k] || 0) + it.canais[k]; g.peso += it.peso; }
    else grupos.push({ rgb: it.rgb, peso: it.peso, canais: { ...it.canais } });
  }
  return grupos;
}

function paletaDaImagem(arq) {
  try {
    const out = execFileSync('convert', [arq, '-resize', '200x200>', '-colors', '8', '-format', '%c', 'histogram:info:-'], { encoding: 'utf8' });
    return out.split('\n').map((l) => l.match(/^\s*(\d+):\s*\(([^)]*)\)/)).filter(Boolean).map((m) => {
      const v = m[2].split(',').map((x) => parseFloat(x));
      const alfa = v.length > 3 ? v[3] : 255;
      return { n: Number(m[1]), rgb: v.slice(0, 3), alfa };
    }).filter((x) => x.alfa > 128);
  } catch (e) {
    console.error(`  não consegui ler ${arq} (${e.message.split('\n')[0]})`);
    return [];
  }
}
function fundoDaImagem(arq) {
  try { // pixel do canto: transparente, claro, escuro ou a cor
    const fx = '%[fx:p{1,1}.a] %[fx:int(255*p{1,1}.r)] %[fx:int(255*p{1,1}.g)] %[fx:int(255*p{1,1}.b)]';
    const [a, ...c] = execFileSync('convert', [arq + '[0]', '-alpha', 'on', '-format', fx, 'info:'], { encoding: 'utf8' }).trim().split(' ').map(Number);
    if (a < 0.5) return 'transparente';
    return lum(c) > 0.8 ? 'claro' : lum(c) < 0.05 ? 'escuro' : hex(c);
  } catch { return 'desconhecido'; }
}

const cores = []; // { rgb, peso, canais: {area, texto, botao, logo, imagem} }
const fontes = { titulos: null, corpo: null, google: [] };
let logo = null;
const frases = [];
const redes = {};
const fontesDosDados = [];
let nome = '';

// ---------- site ----------
if (site) {
  const url = /^https?:\/\//.test(site) ? site : `https://${site}`;
  console.log(`abrindo ${url}...`);
  const browser = await chromium.launch();
  try {
    const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
    await page.goto(url, { waitUntil: 'load', timeout: 45000 });
    await page.waitForTimeout(2000);
    await page.screenshot({ path: path.join(assets, 'site-desktop.png') });
    fontesDosDados.push(`site ${url} (${new Date().toISOString().slice(0, 10)})`);

    const dados = await page.evaluate(() => {
      const cv = document.createElement('canvas'); cv.width = cv.height = 1;
      const cx = cv.getContext('2d', { willReadFrequently: true });
      const paraRgb = (c) => { // qualquer formato de cor (rgb, oklch, color()) → [r,g,b,a]
        if (!c || c === 'transparent') return null;
        cx.clearRect(0, 0, 1, 1); cx.fillStyle = '#000'; cx.fillStyle = c; cx.fillRect(0, 0, 1, 1);
        const d = cx.getImageData(0, 0, 1, 1).data;
        return d[3] < 128 ? null : [d[0], d[1], d[2]];
      };
      const altura = Math.min(document.documentElement.scrollHeight, innerHeight * 4);
      const amostras = [];
      const add = (c, canal, peso) => { const v = paraRgb(c); if (v && peso > 0) amostras.push({ rgb: v, canal, peso }); };
      for (const el of [...document.querySelectorAll('body, body *')].slice(0, 4000)) {
        const r = el.getBoundingClientRect();
        if (!r.width || !r.height || r.top > altura) continue;
        const st = getComputedStyle(el);
        if (st.visibility === 'hidden' || st.display === 'none' || Number(st.opacity) < 0.3) continue;
        // botão flutuante de WhatsApp, chat e aviso de cookies não são da marca
        if (el.closest('[href*="wa.me"], [href*="whatsapp"], [class*="whats" i], [id*="whats" i], [class*="float-wa"], [class*="joinchat"], [class*="cookie" i], [id*="cookie" i], [class*="chat-widget"], [id*="chat-widget"]')) continue;
        const area = Math.min(r.width, innerWidth) * Math.min(r.height, altura);
        add(st.backgroundColor, 'area', area);
        const texto = [...el.childNodes].filter((n) => n.nodeType === 3).map((n) => n.textContent.trim()).join('');
        if (texto) add(st.color, 'texto', texto.length * parseFloat(st.fontSize));
        if (el.matches('a, button, [class*="btn"], [class*="button"], [role="button"], input[type="submit"]') && r.width < 600) {
          const peso = Math.sqrt(r.width * r.height) / 10; // botão grande pesa mais que link miúdo
          add(st.backgroundColor, 'botao', peso);
          if (texto) add(st.color, 'botao', peso * 0.3); // só a cor de texto que aparece
          if (parseFloat(st.borderTopWidth) > 0) add(st.borderTopColor, 'botao', peso * 0.3);
        }
      }
      add(getComputedStyle(document.body).backgroundColor, 'area', innerWidth * altura * 0.5);
      // variáveis de cor declaradas no :root
      const variaveis = {};
      for (const sh of document.styleSheets) {
        let regras; try { regras = sh.cssRules; } catch { continue; }
        for (const ru of regras) {
          if (ru.selectorText && /^(:root|html|body)$/.test(ru.selectorText.trim())) {
            for (const p of ru.style) if (p.startsWith('--')) { const v = ru.style.getPropertyValue(p).trim(); if (paraRgb(v) && !/var\(/.test(v)) variaveis[p] = v; }
          }
        }
      }
      // fontes
      const fam = (sel) => { const el = document.querySelector(sel); return el ? getComputedStyle(el).fontFamily.split(',')[0].replace(/["']/g, '').trim() : null; };
      const maior = [...document.querySelectorAll('h1, h2, [class*="title"], [class*="titulo"]')].sort((a, b) => parseFloat(getComputedStyle(b).fontSize) - parseFloat(getComputedStyle(a).fontSize))[0];
      const google = [...document.querySelectorAll('link[href*="fonts.googleapis"]')].flatMap((l) => [...new URL(l.href).searchParams.getAll('family')].map((f) => f.split(':')[0].replace(/\+/g, ' ')));
      // logo: dentro do header/nav ou com "logo" no nome
      const cands = [...document.querySelectorAll('header img, nav img, header svg, nav svg, [class*="logo"] img, [id*="logo"] img, img[src*="logo" i], img[alt*="logo" i], [class*="logo"] svg, a[href="/"] img, a[href="./"] img')]
        .filter((el) => { const r = el.getBoundingClientRect(); return r.width >= 40 && r.height >= 16 && r.top < 400; })
        .sort((a, b) => a.getBoundingClientRect().top - b.getBoundingClientRect().top);
      const lg = cands[0];
      if (lg) lg.setAttribute('data-logo-marca', '1');
      const icones = [...document.querySelectorAll('link[rel~="icon"], link[rel="apple-touch-icon"]')].map((l) => l.href);
      const og = document.querySelector('meta[property="og:image"]')?.content || '';
      const textos = [document.querySelector('h1')?.innerText, ...[...document.querySelectorAll('h2')].slice(0, 6).map((h) => h.innerText),
        document.querySelector('meta[name="description"]')?.content,
        ...[...document.querySelectorAll('p')].map((p) => p.innerText.trim()).filter((t) => t.length > 40 && t.length < 260).slice(0, 4)]
        .filter(Boolean).map((t) => t.replace(/\s+/g, ' ').trim());
      const links = [...document.querySelectorAll('a[href]')].map((a) => a.href);
      return {
        amostras, variaveis, titulo: document.title,
        fontes: { titulos: maior ? getComputedStyle(maior).fontFamily.split(',')[0].replace(/["']/g, '').trim() : fam('h1'), corpo: fam('p') || fam('body'), google },
        logo: lg ? { src: lg.currentSrc || lg.src || null, tag: lg.tagName.toLowerCase(), alt: lg.getAttribute('alt') || '' } : null,
        icones, og, textos,
        redes: {
          instagram: links.find((h) => /instagram\.com\/(?!p\/|reel)/i.test(h)) || '',
          facebook: links.find((h) => /facebook\.com\//i.test(h)) || '',
          whatsapp: links.find((h) => /wa\.me|api\.whatsapp/i.test(h)) || '',
        },
      };
    });

    nome = dados.titulo;
    for (const a of dados.amostras) cores.push({ rgb: a.rgb, peso: a.peso, canais: { [a.canal]: a.peso } });
    Object.assign(fontes, dados.fontes);
    frases.push(...new Set(dados.textos));
    Object.assign(redes, Object.fromEntries(Object.entries(dados.redes).filter(([, v]) => v)));

    // recorte do logo com fundo transparente + arquivo original
    const el = page.locator('[data-logo-marca="1"]').first();
    if (await el.count()) {
      const recorte = path.join(assets, 'logo-recorte.png');
      await el.screenshot({ path: recorte, omitBackground: true });
      logo = { arquivo: 'assets/logo-recorte.png', origem: dados.logo.src || `<${dados.logo.tag}> do site`, alt: dados.logo.alt };
      if (dados.logo.src && !dados.logo.src.startsWith('data:')) {
        try {
          const r = await page.request.get(dados.logo.src);
          if (r.ok()) {
            const ext = (path.extname(new URL(dados.logo.src).pathname) || '.png').slice(0, 5);
            const orig = path.join(assets, 'logo-original' + ext);
            await writeFile(orig, await r.body());
            logo.original = 'assets/logo-original' + ext;
            logo.fundo = /\.svg$/i.test(ext) ? 'transparente (SVG)' : fundoDaImagem(orig);
          }
        } catch { /* fica só o recorte */ }
      }
      for (const c of paletaDaImagem(recorte)) cores.push({ rgb: c.rgb, peso: c.n, canais: { logo: c.n } });
    }
    logo ??= null;
    if (!logo && dados.icones[0]) {
      try {
        const r = await page.request.get(dados.icones[0]);
        if (r.ok()) { const f = path.join(assets, 'icone' + (path.extname(new URL(dados.icones[0]).pathname) || '.png')); await writeFile(f, await r.body()); logo = { arquivo: path.relative(saida, f), origem: dados.icones[0], nota: 'sem logo no topo do site: só o ícone (favicon)' }; }
      } catch { /* sem logo */ }
    }
    if (Object.keys(dados.variaveis).length) fontes.variaveisCss = dados.variaveis;

    await page.setViewportSize({ width: 390, height: 844 });
    await page.waitForTimeout(800);
    await page.screenshot({ path: path.join(assets, 'site-celular.png') });
  } catch (e) {
    console.error(`  não consegui abrir o site: ${e.message.split('\n')[0]}`);
  } finally {
    await browser.close();
  }
}

// ---------- imagens enviadas (logo, print do Instagram, fachada) ----------
for (const arq of imagens) {
  if (!existsSync(arq)) { console.error(`  não achei ${arq}`); continue; }
  const destino = path.join(assets, 'imagem-' + path.basename(arq));
  await copyFile(arq, destino);
  fontesDosDados.push(`imagem ${path.basename(arq)}`);
  for (const c of paletaDaImagem(arq)) cores.push({ rgb: c.rgb, peso: c.n, canais: { imagem: c.n } });
  if (!logo && /logo/i.test(path.basename(arq))) logo = { arquivo: path.relative(saida, destino), origem: arq, fundo: fundoDaImagem(arq) };
}

if (!cores.length) {
  console.error('nenhuma cor encontrada: sem site que abra e sem imagem. Peça prints do Instagram, do logo ou da fachada (--imagem).');
  process.exit(1);
}

// ---------- papéis ----------
const grupos = agrupar(cores);
const total = (canal) => grupos.reduce((s, g) => s + (g.canais[canal] || 0), 0) || 1;
const T = Object.fromEntries(['area', 'texto', 'botao', 'logo', 'imagem'].map((k) => [k, total(k)]));
const parte = (g, k) => (g.canais[k] || 0) / T[k];
const porCanal = (k) => [...grupos].filter((g) => g.canais[k]).sort((a, b) => b.canais[k] - a.canais[k]);

const fundo = (porCanal('area')[0] || porCanal('imagem').find((g) => neutra(g.rgb)) || grupos[0]).rgb;
const texto = (porCanal('texto').find((g) => contraste(g.rgb, fundo) > 3) || { rgb: lum(fundo) > 0.4 ? [17, 17, 17] : [245, 245, 245] }).rgb;
// cor que aparece em vários lugares (logo + botão + fundo) é da marca; a que só aparece num canal pode ser de plugin
const cromaticas = grupos.filter((g) => !neutra(g.rgb)).map((g) => {
  const canais = Object.keys(g.canais).filter((k) => parte(g, k) > 0.01).length;
  const base = 0.3 * parte(g, 'botao') + 0.45 * parte(g, 'logo') + 0.35 * parte(g, 'imagem') + 0.15 * parte(g, 'area') + 0.1 * parte(g, 'texto');
  return { ...g, nota: base * (1 + 0.5 * Math.max(0, canais - 1)) };
}).sort((a, b) => b.nota - a.nota);
// muito escura (marinho, vinho, verde-garrafa) serve de base escura da marca, não de destaque
const escuras = cromaticas.filter((g) => hsl(g.rgb).l < 0.2);
const vivas = cromaticas.filter((g) => hsl(g.rgb).l >= 0.2);
const destaque = (vivas[0] || cromaticas[0])?.rgb || null;
const baseEscura = escuras[0] && escuras[0].rgb !== destaque && escuras[0].nota > 0.05 ? hex(escuras[0].rgb) : null;
const secundarias = vivas.slice(1, 4).filter((g) => g.nota > 0.03 && dist(g.rgb, destaque) > 60).map((g) => hex(g.rgb));

const papel = (g) => Object.entries(g.canais).sort((a, b) => b[1] - a[1]).map(([k]) => ({ area: 'fundo/blocos', texto: 'texto', botao: 'botões/links', logo: 'logo', imagem: 'imagem enviada' })[k]).join(', ');
const todas = grupos.map((g) => ({ hex: hex(g.rgb), uso: papel(g), peso: +(['area', 'texto', 'botao', 'logo', 'imagem'].reduce((s, k) => s + parte(g, k), 0)).toFixed(3) }))
  .sort((a, b) => b.peso - a.peso).slice(0, 10);

// ---------- sugestão pro modelo do site ----------
let sugestao = null;
if (destaque) {
  const claro = lum(fundo) > 0.45;
  const sobre = contraste(destaque, [255, 255, 255]) >= contraste(destaque, [20, 20, 20]) ? '#ffffff' : hex(mistura(destaque, [0, 0, 0], 0.82));
  sugestao = {
    tema: claro ? 'claro' : 'escuro',
    root: {
      '--accent': hex(destaque),
      '--accent-grad': `linear-gradient(100deg, ${hex(mistura(destaque, [255, 255, 255], 0.35))} 0%, ${hex(destaque)} 45%, ${hex(mistura(destaque, [0, 0, 0], 0.18))} 100%)`,
      '--sobre-destaque': sobre,
      ...(claro ? {} : { '--bg': baseEscura ? hex(mistura(rgb(baseEscura), [0, 0, 0], 0.45)) : hex(mistura(fundo, [0, 0, 0], lum(fundo) > 0.08 ? 0.75 : 0)), '--glow': hex(mistura(destaque, [0, 0, 0], 0.7)) }),
    },
    contraste: {
      destaque_no_fundo_escuro: +contraste(destaque, [10, 10, 10]).toFixed(2),
      destaque_no_fundo_claro: +contraste(destaque, [246, 244, 239]).toFixed(2),
      texto_no_botao: +contraste(rgb(sobre), destaque).toFixed(2),
    },
  };
}

const marca = {
  versao: 1, data: new Date().toISOString().slice(0, 10), nome, fontes_dos_dados: fontesDosDados,
  cores: { fundo: hex(fundo), texto: hex(texto), destaque: destaque ? hex(destaque) : null, base_escura: baseEscura, secundarias, todas },
  tipografia: fontes, logo, frases: frases.slice(0, 10), redes, sugestao,
  avisos: [
    ...(!destaque ? ['marca sem cor de destaque clara (só neutros): confirmar com prints do Instagram/fachada antes de escolher'] : []),
    ...(!logo ? ['logo não encontrado: pedir o arquivo ou um print do perfil'] : []),
    ...(logo?.fundo === 'claro' ? ['logo com fundo branco/claro: no tema escuro, usar sobre um cartão claro, ou usar o tema claro'] : []),
    ...(sugestao && sugestao.contraste.destaque_no_fundo_escuro < 3 ? ['a cor da marca some no fundo escuro (contraste < 3): usar o tema claro ou só em botões grandes'] : []),
    ...(sugestao && sugestao.contraste.destaque_no_fundo_claro < 2 ? ['a cor da marca some no fundo claro: no tema claro, usar só em blocos e botões, não em texto'] : []),
  ],
};
await writeFile(path.join(saida, 'marca.json'), JSON.stringify(marca, null, 2) + '\n');

// ---------- quadro da marca (marca.png) ----------
const esc = (t) => String(t).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);
const swatch = (h, rot) => `<div class="sw"><i style="background:${h}"></i><b>${h}</b><span>${esc(rot)}</span></div>`;
const familias = [...new Set([fontes.titulos, fontes.corpo, ...fontes.google].filter(Boolean))];
const quadro = `<!doctype html><html><head><meta charset="utf-8">
${fontes.google.length ? `<link href="https://fonts.googleapis.com/css2?${fontes.google.map((f) => 'family=' + encodeURIComponent(f)).join('&')}&display=swap" rel="stylesheet">` : ''}
<style>body{margin:0;width:1200px;font-family:system-ui,sans-serif;background:#f4f3ef;color:#16161a}
.q{padding:48px 56px}h1{margin:0 0 6px;font-size:30px}.d{color:#6b6b73;font-size:14px;margin-bottom:28px}
.g{display:grid;grid-template-columns:340px 1fr;gap:36px}.logo{background:repeating-conic-gradient(#e7e5df 0 25%,#fff 0 50%) 0/20px 20px;border-radius:14px;display:grid;place-items:center;min-height:200px;padding:24px}
.logo img{max-width:100%;max-height:180px}.sws{display:flex;flex-wrap:wrap;gap:14px}.sw{width:132px;font-size:12px}.sw i{display:block;height:84px;border-radius:12px;border:1px solid rgba(0,0,0,.08);margin-bottom:8px}
.sw b{display:block;font-family:ui-monospace,monospace}.sw span{color:#6b6b73}h2{font-size:13px;letter-spacing:.18em;text-transform:uppercase;color:#6b6b73;margin:28px 0 12px}
.f{font-size:30px;margin:4px 0}.fr{font-size:15px;margin:6px 0;color:#33333a}.av{background:#fff4d6;border-radius:10px;padding:12px 16px;font-size:13px;margin-top:20px}</style></head><body><div class="q">
<h1>${esc(nome || 'Identidade da marca')}</h1><div class="d">${esc(fontesDosDados.join(' · '))}</div>
<div class="g"><div class="logo">${logo ? `<img src="${esc(logo.arquivo)}">` : '<span>logo não encontrado</span>'}</div><div>
<h2>Papéis</h2><div class="sws">${swatch(hex(fundo), 'fundo')}${swatch(hex(texto), 'texto')}${destaque ? swatch(hex(destaque), 'destaque') : ''}${baseEscura ? swatch(baseEscura, 'base escura da marca') : ''}${secundarias.map((h) => swatch(h, 'secundária')).join('')}</div>
<h2>Todas as cores medidas</h2><div class="sws">${todas.slice(0, 8).map((c) => swatch(c.hex, c.uso)).join('')}</div></div></div>
${familias.length ? `<h2>Fontes</h2>${familias.map((f) => `<p class="f" style="font-family:'${esc(f)}'">${esc(f)} · Aa Bb 123</p>`).join('')}` : ''}
${frases.length ? `<h2>Frases da própria loja</h2>${frases.slice(0, 5).map((t) => `<p class="fr">“${esc(t)}”</p>`).join('')}` : ''}
${marca.avisos.length ? `<div class="av">${marca.avisos.map(esc).join('<br>')}</div>` : ''}
</div></body></html>`;
await writeFile(path.join(saida, 'marca.html'), quadro);
{
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1200, height: 800 } });
  await page.goto('file://' + path.resolve(saida, 'marca.html'), { waitUntil: 'load' });
  await page.waitForTimeout(600);
  await page.screenshot({ path: path.join(saida, 'marca.png'), fullPage: true });
  await browser.close();
}

// ---------- marca.md ----------
const md = [
  `# Identidade — ${nome || '(sem nome)'}`, '',
  `Levantado em ${marca.data} de: ${fontesDosDados.join(' · ')}. Quadro visual: \`marca.png\`.`, '',
  '## Cores', '',
  `| Papel | Cor |`, `|---|---|`,
  `| Fundo | \`${marca.cores.fundo}\` |`, `| Texto | \`${marca.cores.texto}\` |`,
  `| **Destaque** | ${destaque ? `\`${marca.cores.destaque}\`` : '**não encontrado**'} |`,
  ...(baseEscura ? [`| Base escura da marca | \`${baseEscura}\` |`] : []),
  ...secundarias.map((h) => `| Secundária | \`${h}\` |`), '',
  'Todas as medidas (uso · peso): ' + todas.map((c) => `\`${c.hex}\` ${c.uso} · ${c.peso}`).join('; '), '',
  '## Logo', '', logo ? `\`${logo.arquivo}\` — de ${logo.origem}${logo.fundo ? ` · fundo: ${logo.fundo}` : ''}${logo.nota ? ` · ${logo.nota}` : ''}` : 'Não encontrado.', '',
  '## Fontes', '', `Títulos: ${fontes.titulos || '—'} · Corpo: ${fontes.corpo || '—'}${fontes.google.length ? ` · Google Fonts: ${fontes.google.join(', ')}` : ''}`, '',
  '## Frases da própria loja (usar no lugar de texto inventado)', '', ...(frases.length ? frases.slice(0, 8).map((t) => `- ${t}`) : ['- nenhuma encontrada']), '',
  '## Redes', '', ...(Object.keys(redes).length ? Object.entries(redes).map(([k, v]) => `- ${k}: ${v}`) : ['- nenhuma no site']), '',
  ...(sugestao ? ['## Sugestão pro modelo do site', '', `Tema: **${sugestao.tema}** · contraste do destaque: ${sugestao.contraste.destaque_no_fundo_escuro} no escuro, ${sugestao.contraste.destaque_no_fundo_claro} no claro · texto no botão: ${sugestao.contraste.texto_no_botao}`, '', '```css', ':root {', ...Object.entries(sugestao.root).map(([k, v]) => `  ${k}: ${v};`), '}', '```', ''] : []),
  ...(marca.avisos.length ? ['## Avisos', '', ...marca.avisos.map((a) => `- ${a}`)] : []),
].join('\n');
await writeFile(path.join(saida, 'marca.md'), md + '\n');

console.log(`destaque ${marca.cores.destaque || '—'} · fundo ${marca.cores.fundo} · texto ${marca.cores.texto} · logo ${logo ? 'sim' : 'não'} · fontes ${familias.join(', ') || '—'}`);
marca.avisos.forEach((a) => console.log('  ⚠ ' + a));
console.log(`→ ${path.join(saida, 'marca.json')} · marca.md · marca.png`);
