// Vigia: confere de uma vez se os sites dos clientes estão no ar, quando o certificado e o domínio vencem
// e quais demos passaram da data de sair do ar. Só lê: não muda nada em lugar nenhum.
//
// node scripts/vigia.js            usa clientes/_sites.json (local)
// node scripts/vigia.js <arquivo>
//
// Formato de cada linha:
//   { "nome": "<cliente>", "tipo": "cliente" | "demo", "url": "https://...", "dominio": "exemplo.com.br", "remover_ate": "AAAA-MM-DD" }
// `dominio` e `remover_ate` são opcionais. Sai com código 1 se tiver alerta.

import { readFileSync, existsSync } from 'node:fs';
import { connect } from 'node:tls';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const raiz = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const AVISO_DIAS = 30;
const dias = (data) => Math.ceil((new Date(data) - Date.now()) / 864e5);

async function noAr(url) {
  const c = new AbortController();
  const t = setTimeout(() => c.abort(), 15000);
  try {
    const r = await fetch(url, { redirect: 'follow', signal: c.signal, headers: { 'user-agent': 'vigia-mazyos' } });
    return { ok: r.ok, status: r.status };
  } catch (e) {
    return { ok: false, status: e.name === 'AbortError' ? 'demorou demais' : (e.cause?.code || e.message) };
  } finally { clearTimeout(t); }
}

const certificado = (url) => new Promise((ok) => {
  const { hostname } = new URL(url);
  const s = connect({ host: hostname, port: 443, servername: hostname, timeout: 10000 }, () => {
    const fim = s.getPeerCertificate()?.valid_to;
    s.end();
    ok(fim ? dias(fim) : null);
  });
  s.on('error', () => ok(null));
  s.on('timeout', () => { s.destroy(); ok(null); });
});

// .br responde no Registro.br; os outros passam pelo diretório público
async function dominioVence(dominio) {
  const url = dominio.endsWith('.br') ? `https://rdap.registro.br/domain/${dominio}` : `https://rdap.org/domain/${dominio}`;
  try {
    const r = await fetch(url, { signal: AbortSignal.timeout(10000) });
    if (r.status === 404) return { livre: true };
    const d = await r.json();
    const fim = d.events?.find((e) => e.eventAction === 'expiration')?.eventDate;
    return { dias: fim ? dias(fim) : null };
  } catch { return { dias: null }; }
}

async function conferir(s) {
  const alertas = [];
  const partes = [];
  if (s.tipo === 'demo' && s.remover_ate) {
    const f = dias(s.remover_ate);
    if (f < 0) alertas.push(`remover: passou da data (${s.remover_ate})`);
    else if (f <= 7) alertas.push(`remover até ${s.remover_ate} (faltam ${f} dias)`);
    else partes.push(`sai em ${f} dias`);
  }
  if (s.url) {
    const r = await noAr(s.url);
    if (r.ok) partes.push('no ar');
    else if (s.tipo === 'cliente') alertas.push(`FORA DO AR (${r.status})`);
    else partes.push(`fora do ar (${r.status})`);
    if (r.ok && s.url.startsWith('https')) {
      const c = await certificado(s.url);
      if (c !== null && c <= 14) alertas.push(`certificado vence em ${c} dias`);
    }
  }
  if (s.dominio) {
    const d = await dominioVence(s.dominio);
    if (d.livre) alertas.push(`domínio ${s.dominio} não está registrado`);
    else if (d.dias === null) partes.push('domínio sem data');
    else if (d.dias <= AVISO_DIAS) alertas.push(`domínio vence em ${d.dias} dias`);
    else partes.push(`domínio ok (${d.dias} dias)`);
  }
  return { ...s, alertas, partes };
}

const arquivo = process.argv[2] || path.join(raiz, 'clientes', '_sites.json');
if (!existsSync(arquivo)) {
  console.error(`Falta a lista: ${arquivo}`);
  process.exit(1);
}
const sites = JSON.parse(readFileSync(arquivo, 'utf8'));
const res = await Promise.all(sites.map(conferir));
for (const r of res.filter((x) => x.alertas.length)) console.log(`⚠ ${r.nome} (${r.tipo}): ${r.alertas.join(' · ')}`);
for (const r of res.filter((x) => !x.alertas.length)) console.log(`✓ ${r.nome} (${r.tipo}): ${r.partes.join(' · ') || 'ok'}`);
process.exitCode = res.some((x) => x.alertas.length) ? 1 : 0;
