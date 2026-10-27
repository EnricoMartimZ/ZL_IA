// Audita o site de prospects (empresas que ainda não são clientes): mede o quanto ele está velho,
// quebrado no celular, inseguro ou sem caminho pra contato, tira print do desktop e do celular
// e devolve uma nota de oportunidade com os motivos — o gancho da abordagem.
//
// Uso:
//   node scripts/auditar-site.js <url | lista.txt | lista.csv> --saida <pasta> [--sem-print]
//
// Lista: uma URL por linha (.txt) ou um CSV com coluna "site" (e opcionalmente "empresa").
// Saída na pasta: auditoria.csv, auditoria.json e prints/<dominio>-desktop.png / -celular.png
// Só faz o que um visitante faria: abre a página inicial. Uma empresa por vez, sem login, sem formulário.

import { chromium } from 'playwright';
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';

const argv = process.argv.slice(2);
const entrada = argv.find((a, i) => !a.startsWith('--') && argv[i - 1] !== '--saida');
const saida = argv.includes('--saida') ? argv[argv.indexOf('--saida') + 1] : null;
const comPrint = !argv.includes('--sem-print');
if (!entrada || !saida) {
  console.error('uso: node scripts/auditar-site.js <url | lista.txt | lista.csv> --saida <pasta> [--sem-print]');
  process.exit(1);
}
const ANO = new Date().getFullYear();

// ---------- ler a lista ----------
function lerCsv(texto) {
  const linhas = texto.split(/\r?\n/).filter((l) => l.trim());
  const sep = (linhas[0].match(/;/g) || []).length > (linhas[0].match(/,/g) || []).length ? ';' : ',';
  const campos = (l) => l.split(sep).map((c) => c.trim().replace(/^"|"$/g, ''));
  const cab = campos(linhas[0]).map((c) => c.toLowerCase());
  const iSite = cab.findIndex((c) => /site|url|website/.test(c));
  const iNome = cab.findIndex((c) => /empresa|nome|razao|fantasia/.test(c));
  if (iSite < 0) throw new Error('CSV sem coluna "site"');
  return linhas.slice(1).map((l) => { const c = campos(l); return { empresa: iNome >= 0 ? c[iNome] : '', site: c[iSite] }; });
}
let alvos;
if (existsSync(entrada)) {
  const texto = await readFile(entrada, 'utf8');
  alvos = entrada.endsWith('.csv') ? lerCsv(texto) : texto.split(/\r?\n/).map((s) => s.trim()).filter(Boolean).map((site) => ({ empresa: '', site }));
} else {
  alvos = [{ empresa: '', site: entrada }];
}
const normalizar = (u) => (u ? (/^https?:\/\//i.test(u) ? u : `https://${u}`) : '');
const dominio = (u) => { try { return new URL(normalizar(u)).hostname.replace(/^www\./, ''); } catch { return u.replace(/\W+/g, '-'); } };

// ---------- auditar um site ----------
async function auditar(browser, alvo) {
  const r = { empresa: alvo.empresa, site: alvo.site, dominio: dominio(alvo.site), status: '', https: false, nota: 0, motivos: [], sinais: {} };
  const motivo = (pontos, texto) => { r.nota += pontos; r.motivos.push(texto); };
  if (!alvo.site) {
    r.status = 'sem site';
    motivo(60, 'não tem site');
    return r;
  }

  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, ignoreHTTPSErrors: true, userAgent: 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124 Safari/537.36' });
  const page = await ctx.newPage();
  let bytes = 0, erroCert = false, resp = null, url = normalizar(alvo.site);
  page.on('response', (res) => { bytes += Number(res.headers()['content-length'] || 0); });
  const t0 = Date.now();
  try {
    resp = await page.goto(url, { waitUntil: 'load', timeout: 30000 });
  } catch (e) {
    if (/CERT|SSL/i.test(e.message)) erroCert = true;
    try {
      url = url.replace(/^https:/, 'http:');
      resp = await page.goto(url, { waitUntil: 'load', timeout: 30000 });
    } catch (e2) {
      r.status = /ERR_NAME_NOT_RESOLVED|ENOTFOUND/.test(e2.message) ? 'domínio não existe' : 'fora do ar';
      motivo(55, r.status === 'domínio não existe' ? 'o domínio do site não existe mais' : 'site fora do ar');
      await ctx.close();
      return r;
    }
  }
  const tempo = (Date.now() - t0) / 1000;
  await page.waitForTimeout(1500);
  const final = page.url();
  r.status = String(resp?.status() || '');
  r.https = final.startsWith('https:') && !erroCert;
  r.sinais.url_final = final;
  r.sinais.tempo_s = Number(tempo.toFixed(1));
  r.sinais.peso_mb = Number((bytes / 1048576).toFixed(1));
  r.sinais.ultima_modificacao = resp?.headers()['last-modified'] || '';
  if (resp && resp.status() >= 400) motivo(40, `página inicial responde erro ${resp.status()}`);

  const info = await page.evaluate((ANO) => {
    const texto = document.body?.innerText || '';
    const anos = [...texto.matchAll(/(?:©|copyright|\(c\)|todos os direitos)[^\n]{0,40}?((?:19|20)\d{2})(?:\s*[-–]\s*((?:19|20)\d{2}))?/gi)]
      .map((m) => Number(m[2] || m[1])).filter((a) => a <= ANO);
    const meta = (s) => document.querySelector(s)?.getAttribute('content') || '';
    const links = [...document.querySelectorAll('a[href]')].map((a) => a.href);
    const achar = (re) => links.find((h) => re.test(h)) || '';
    const tabelasLayout = [...document.querySelectorAll('table')].filter((t) => t.getBoundingClientRect().width > innerWidth * 0.6 && t.querySelectorAll('td').length > 3).length;
    let jsonld = [];
    document.querySelectorAll('script[type="application/ld+json"]').forEach((s) => { try { jsonld.push(...(JSON.stringify(JSON.parse(s.textContent)).match(/"@type":"[^"]+"/g) || [])); } catch { /* inválido */ } });
    return {
      titulo: document.title.trim(),
      descricao: meta('meta[name="description"]'),
      viewport: meta('meta[name="viewport"]'),
      gerador: meta('meta[name="generator"]'),
      og: !!meta('meta[property="og:image"]'),
      jsonld: [...new Set(jsonld)].join(' '),
      anoCopyright: anos.length ? Math.max(...anos) : null,
      jquery: window.jQuery?.fn?.jquery || '',
      flash: !!document.querySelector('object[type*="flash"], embed[src*=".swf"], object[data*=".swf"]'),
      tagsVelhas: document.querySelectorAll('font, center, marquee, frameset, frame').length,
      tabelasLayout,
      h1: document.querySelectorAll('h1').length,
      whatsapp: achar(/wa\.me|api\.whatsapp|whatsapp\.com\/send/i),
      telefone: achar(/^tel:/i),
      email: achar(/^mailto:/i),
      formulario: !!document.querySelector('form input[type="email"], form textarea, form input[name*="mail" i]'),
      instagram: achar(/instagram\.com\/(?!p\/|reel)/i),
      facebook: achar(/facebook\.com\/(?!sharer)/i),
      linkedin: achar(/linkedin\.com\/(company|in)\//i),
      imagensQuebradas: [...document.images].filter((i) => i.complete && i.naturalWidth === 0 && i.getBoundingClientRect().width > 0).length,
      palavras: texto.split(/\s+/).filter(Boolean).length,
    };
  }, ANO);
  Object.assign(r.sinais, info);

  // ---------- celular ----------
  const cel = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, deviceScaleFactor: 2, ignoreHTTPSErrors: true });
  const pc = await cel.newPage();
  let celular = { vaza: false, fonte: 16 };
  try {
    await pc.goto(final, { waitUntil: 'load', timeout: 30000 });
    await pc.waitForTimeout(1200);
    celular = await pc.evaluate(() => ({
      vaza: document.documentElement.scrollWidth > document.documentElement.clientWidth + 8,
      largura: document.documentElement.scrollWidth,
      fonte: parseFloat(getComputedStyle(document.querySelector('p, li, td, span, div') || document.body).fontSize) || 16,
    }));
  } catch { /* o desktop já foi auditado; segue */ }
  r.sinais.celular_rola_de_lado = celular.vaza;
  r.sinais.celular_fonte_px = celular.fonte;

  // ---------- nota de oportunidade (quanto pior o site, maior) ----------
  if (!r.https) motivo(20, erroCert ? 'certificado de segurança com erro (navegador avisa "não seguro")' : 'sem HTTPS: o navegador mostra "não seguro"');
  if (!info.viewport) motivo(18, 'não foi feito pra celular (sem meta viewport)');
  if (celular.vaza) motivo(14, `no celular a página rola pro lado (${celular.largura}px de largura)`);
  else if (celular.fonte < 12) motivo(8, `no celular a letra fica minúscula (${celular.fonte}px)`);
  if (info.anoCopyright && ANO - info.anoCopyright >= 3) motivo(Math.min(15, (ANO - info.anoCopyright) * 2), `rodapé com © ${info.anoCopyright} (${ANO - info.anoCopyright} anos sem atualizar)`);
  if (info.flash) motivo(15, 'usa Flash (não funciona em nenhum navegador atual)');
  if (info.tagsVelhas > 3 || info.tabelasLayout > 0) motivo(8, 'código de site dos anos 2000 (layout em tabela / tags antigas)');
  const jq = info.jquery.split('.').map(Number);
  if (info.jquery && jq[0] < 3) motivo(5, `bibliotecas antigas (jQuery ${info.jquery})`);
  const wp = info.gerador.match(/WordPress\s+(\d+)\.(\d+)/i);
  if (wp && Number(wp[1]) < 6) motivo(6, `WordPress desatualizado (${wp[1]}.${wp[2]})`);
  if (tempo > 6) motivo(Math.min(12, Math.round(tempo)), `demora ${tempo.toFixed(1)} s pra abrir`);
  if (r.sinais.peso_mb > 6) motivo(5, `página pesada (${r.sinais.peso_mb} MB)`);
  if (!info.whatsapp && !info.formulario) motivo(12, 'sem WhatsApp nem formulário: o comprador não tem como pedir orçamento pelo site');
  else if (!info.whatsapp) motivo(4, 'sem botão de WhatsApp');
  if (!info.descricao) motivo(4, 'sem descrição pro Google');
  if (!info.titulo || /^(home|início|inicio|untitled|sem título|página inicial)$/i.test(info.titulo)) motivo(5, `título da página genérico ("${info.titulo || 'vazio'}")`);
  if (!info.og) motivo(3, 'link sem imagem quando compartilhado no WhatsApp/LinkedIn');
  if (info.imagensQuebradas > 0) motivo(6, `${info.imagensQuebradas} imagem(ns) quebrada(s)`);
  if (info.palavras < 120) motivo(5, 'quase sem texto (o Google não tem o que mostrar)');
  r.nota = Math.min(100, r.nota);

  if (comPrint) {
    await mkdir(path.join(saida, 'prints'), { recursive: true });
    await page.screenshot({ path: path.join(saida, 'prints', `${r.dominio}-desktop.png`) }).catch(() => {});
    await pc.screenshot({ path: path.join(saida, 'prints', `${r.dominio}-celular.png`) }).catch(() => {});
  }
  await ctx.close();
  await cel.close();
  return r;
}

// ---------- rodar ----------
await mkdir(saida, { recursive: true });
const browser = await chromium.launch();
const resultados = [];
try {
  for (const [i, alvo] of alvos.entries()) {
    process.stdout.write(`[${i + 1}/${alvos.length}] ${alvo.empresa || alvo.site || '(sem site)'} ... `);
    let r;
    try {
      r = await auditar(browser, alvo);
    } catch (e) {
      r = { empresa: alvo.empresa, site: alvo.site, dominio: dominio(alvo.site), status: 'erro', nota: 0, motivos: [`não deu pra auditar: ${e.message.slice(0, 80)}`], sinais: {} };
    }
    resultados.push(r);
    console.log(`nota ${r.nota}${r.motivos.length ? ` — ${r.motivos.slice(0, 2).join('; ')}` : ''}`);
  }
} finally {
  await browser.close();
}

resultados.sort((a, b) => b.nota - a.nota);
await writeFile(path.join(saida, 'auditoria.json'), JSON.stringify(resultados, null, 2));
const esc = (v) => `"${String(v ?? '').replace(/"/g, '""')}"`;
const colunas = ['nota', 'empresa', 'site', 'status', 'https', 'motivos', 'whatsapp', 'formulario', 'instagram', 'facebook', 'linkedin', 'ano_copyright', 'tempo_s'];
const linhas = resultados.map((r) => [r.nota, r.empresa, r.site, r.status, r.https ? 'sim' : 'não', r.motivos.join(' | '), r.sinais.whatsapp ? 'sim' : 'não',
  r.sinais.formulario ? 'sim' : 'não', r.sinais.instagram || '', r.sinais.facebook || '', r.sinais.linkedin || '', r.sinais.anoCopyright || '', r.sinais.tempo_s ?? ''].map(esc).join(';'));
await writeFile(path.join(saida, 'auditoria.csv'), '﻿' + [colunas.join(';'), ...linhas].join('\n') + '\n');
console.log(`\n${resultados.length} site(s) auditado(s) → ${path.join(saida, 'auditoria.csv')}${comPrint ? ` e prints/` : ''}`);
