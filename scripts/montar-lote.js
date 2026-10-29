// Monta um lote de abordagem curta por WhatsApp a partir das buscas do Google Maps
// (.claude/skills/abordagem-whatsapp/ler-maps.js): escolhe quem dá pra abordar, compara com o líder
// do nicho, audita os sites próprios e escreve uma mensagem diferente pra cada loja, com o fato
// que ela mesma pode conferir.
//
// Uso:
//   node scripts/montar-lote.js <pasta-da-prospeccao> [--max 20] [--sem-auditoria] [--cidade "Santa Bárbara d'Oeste"] [--so-site]
//   --cidade: cidade/região que aparece na apresentação (padrão Campinas)
//   --so-site: só entra quem não tem site ou tem site ruim (avaliações e nota viram apoio, não motivo)
//
// Lê <pasta>/buscas/*.json e gera:
//   lote.md (pra aprovar no chat) · fila.json (o que o envio usa) · lote.csv (planilha)
// Só entra quem tem celular (WhatsApp) e pelo menos um ponto fraco verificável.

import { readFile, writeFile, readdir } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import path from 'node:path';

const argv = process.argv.slice(2);
const pasta = argv.find((a, i) => !a.startsWith('--') && !['--max', '--cidade'].includes(argv[i - 1]));
const max = Number(argv.includes('--max') ? argv[argv.indexOf('--max') + 1] : 20);
const auditar = !argv.includes('--sem-auditoria');
const cidade = argv.includes('--cidade') ? argv[argv.indexOf('--cidade') + 1] : 'Campinas';
const soSite = argv.includes('--so-site');
if (!pasta || !existsSync(path.join(pasta, 'buscas'))) {
  console.error('uso: node scripts/montar-lote.js <pasta-com-buscas/> [--max 20] [--sem-auditoria]');
  process.exit(1);
}

// redes e franquias: decisão fora da loja, não compram de freelancer
const REDES = /\b(petz|cobasi|gassi|99 [óo]ticas|[óo]ticas carol|[óo]ticas diniz|chilli beans|sunglass|atacad[ãa]o|bosch car service|alliancemk|smart ?fit|bluefit|o botic[áa]rio)\b/i;
const num = (s) => Number(String(s).replace(',', '.')) || 0;
const curto = (nome) => nome.split(/\s[|\-–]\s|\s\|/)[0].replace(/\s+(com[ée]rcio|ltda|me|eireli)\b.*$/i, '').replace(/\s+(em\s+)?(campinas|sp|santa b[áa]rbara( d.?oeste)?|sbo|americana|nova odessa|sumar[ée]|piracicaba|limeira)$/i, '').split(/\s+/).slice(0, 4).join(' ').trim();
const km = (a, b) => Math.hypot((a.lat - b.lat) * 111, (a.lon - b.lon) * 111 * Math.cos(a.lat * Math.PI / 180));

// celular = DDD + 9 + 8 dígitos (fixo não recebe WhatsApp). O endereço às vezes traz "Whats (19) 9..."
function whatsapp(...textos) {
  for (const t of textos) {
    const d = String(t || '').replace(/\D/g, '');
    if (d.length === 11 && d[2] === '9') return '55' + d;
    if (d.length === 13 && d.startsWith('55') && d[4] === '9') return d;
  }
  return '';
}
function tipoLink(u) {
  if (!u) return 'nenhum';
  if (/instagram\.com/i.test(u)) return 'instagram';
  if (/facebook\.com/i.test(u)) return 'facebook';
  if (/linktr\.ee|linkbio|bio\.link/i.test(u)) return 'linktree';
  if (/wa\.me|api\.whatsapp|whatsapp\.com/i.test(u)) return 'whatsapp';
  if (/4ucar|minhaautoagenda|webnode|wixsite|ueniweb|business\.site|lovable\.app|g\.page/i.test(u)) return 'pagina-generica';
  return 'site';
}
const ROTULO = { instagram: 'o site no perfil de vocês no Google é só o Instagram', facebook: 'o site no perfil de vocês no Google é só uma página do Facebook', linktree: 'o link no perfil de vocês no Google é um Linktree', whatsapp: 'o link de site no perfil de vocês no Google só abre o WhatsApp', 'pagina-generica': 'o site no perfil de vocês no Google é uma página genérica, sem a cara de vocês', nenhum: 'o perfil de vocês no Google não tem site' };

// ---------- ler buscas ----------
const buscas = [];
for (const f of (await readdir(path.join(pasta, 'buscas'))).filter((f) => f.endsWith('.json'))) {
  const b = JSON.parse(await readFile(path.join(pasta, 'buscas', f), 'utf8'));
  // ler-maps.js devolve `lojas` (objetos); buscas antigas vêm em `L` (listas)
  if (!b.L) b.L = (b.lojas || []).map((o) => [o.posicao, o.nome, o.nota, o.avaliacoes, o.categoria, o.endereco || '', o.telefone, o.site, o.lat, o.lon]);
  const lojas = b.L.map(([posicao, nome, nota, avaliacoes, categoria, endereco, telefone, site, lat, lon]) =>
    ({ posicao, nome, nota, avaliacoes: Number(avaliacoes) || 0, categoria, endereco: endereco.trim(), telefone, site, lat, lon, busca: b.busca }));
  // a lista só mostra o botão "site" em alguns nichos; sem isso, não dá pra afirmar "não tem site"
  const mostraSite = b.site_na_lista !== false && lojas.some((l) => l.site);
  buscas.push({ busca: b.busca, nicho: f.replace('.json', ''), lojas, mostraSite });
}

// link encurtado (bit.ly...) no perfil: seguir até o destino pra não chamar de "site fora do ar" um link de WhatsApp
async function destino(u) {
  for (let i = 0; i < 5; i++) {
    try {
      const r = await fetch(u, { redirect: 'manual', signal: AbortSignal.timeout(10000) });
      const loc = r.headers.get('location');
      if (!loc || r.status < 300 || r.status >= 400) return u;
      u = new URL(loc, u).href;
    } catch { return u; }
  }
  return u;
}
for (const b of buscas) for (const l of b.lojas) if (/bit\.ly|tinyurl|cutt\.ly|encurtador|abre\.ai|l\.ead\.me/i.test(l.site)) l.site = await destino(l.site);

const median = (v) => { const s = v.filter((x) => !Number.isNaN(x)).sort((a, b) => a - b); return s[Math.floor(s.length / 2)] || 0; };

// ---------- candidatos ----------
const candidatos = [];
for (const b of buscas) {
  // longe demais da busca (outra cidade) não entra nem como candidato nem como líder
  const meio = { lat: median(b.lojas.map((l) => +l.lat)), lon: median(b.lojas.map((l) => +l.lon)) };
  const perto = b.lojas.filter((l) => !l.lat || km({ lat: +l.lat, lon: +l.lon }, meio) < 40);
  // o líder de comparação é o maior negócio local, não uma rede gigante
  const lider = perto.filter((l) => l.avaliacoes > 0 && !REDES.test(l.nome)).sort((x, y) => y.avaliacoes - x.avaliacoes)[0];
  for (const l of perto) {
    const wa = whatsapp(l.telefone, l.endereco);
    if (!wa || l.avaliacoes < 10 || l.avaliacoes > 1500 || REDES.test(l.nome) || l === lider) continue;
    const link = tipoLink(l.site);
    const fracos = [];
    if (b.mostraSite && link !== 'site') fracos.push({ tipo: 'link', peso: link === 'nenhum' ? 30 : 22, fato: ROTULO[link] });
    if (lider && l.avaliacoes < lider.avaliacoes * 0.2) fracos.push({ tipo: 'avaliacoes', peso: 18, fato: `${l.avaliacoes} avaliações no Google, contra ${lider.avaliacoes} da ${curto(lider.nome)}` });
    if (lider && num(l.nota) <= 4.5 && num(lider.nota) >= 4.8) fracos.push({ tipo: 'nota', peso: 15, fato: `nota ${l.nota}, contra ${lider.nota} da ${curto(lider.nome)}` });
    candidatos.push({ ...l, nicho: b.nicho, whatsapp: wa, link, fracos, lider: lider && { nome: curto(lider.nome), avaliacoes: lider.avaliacoes, nota: lider.nota, temSite: b.mostraSite && tipoLink(lider.site) === 'site', antes: lider.posicao < l.posicao } });
  }
}

// motivo da auditoria → frase que cabe em "Abri ... e <frase>"
function fraseSite(m) {
  if (/não existe|fora do ar/.test(m)) return 'ele não abre';
  if (/404/.test(m)) return 'ele mostra erro 404';
  if (/manutenção/.test(m)) return 'ele mostra uma página de manutenção';
  if (/não seguro/.test(m)) return 'o navegador avisa que ele é "não seguro"';
  if (/rola pro lado/.test(m)) return 'a página fica mais larga que a tela e o texto sai cortado na lateral';
  if (/não feito pra celular/.test(m)) return 'ele não se ajusta à tela do celular';
  if (/minúscula/.test(m)) return 'a letra fica pequena demais pra ler';
  return m.replace(/^o /, '');
}

// ---------- auditar os sites próprios (site ruim também é ponto fraco) ----------
const comSite = candidatos.filter((c) => c.link === 'site');
if (auditar && comSite.length) {
  const csv = path.join(pasta, 'sites.csv');
  await writeFile(csv, 'empresa;site\n' + comSite.map((c) => `${c.nome.replace(/;/g, ',')};${c.site}`).join('\n') + '\n');
  console.log(`auditando ${comSite.length} sites...`);
  execFileSync('node', [path.join(path.dirname(new URL(import.meta.url).pathname), 'auditar-site.js'), csv, '--saida', pasta], { stdio: ['ignore', 'ignore', 'inherit'] });
  const aud = JSON.parse(await readFile(path.join(pasta, 'auditoria.json'), 'utf8'));
  for (const c of comSite) {
    const a = aud.find((x) => x.empresa === c.nome.replace(/;/g, ','));
    if (!a) continue;
    c.auditoria = { nota: a.nota, motivos: a.motivos };
    const forte = a.motivos.find((m) => /não existe|fora do ar|404|não seguro|rola pro lado|não feito pra celular|minúscula|manutenção/.test(m));
    if (a.nota >= 25 && forte) c.fracos.push({ tipo: 'site', peso: 25, fato: fraseSite(forte) });
  }
}

// ---------- mensagem (modelo diferente conforme o ponto fraco, com variação) ----------
const ABERTURAS = [
  `Oi, tudo bem? Aqui é o Enrico, trabalho com marketing com IA pra negócios de ${cidade}.`,
  `Oi! Sou o Enrico, faço marketing com IA pra negócios de ${cidade}.`,
  `Oi, tudo certo? Enrico aqui, trabalho com presença online de negócios em ${cidade}.`,
];
const FECHOS = [
  'Posso te mostrar em 5 minutos como virar esse jogo?',
  'Quer que eu te mostre, em 5 minutos, o que dá pra fazer?',
  'Te explico rapidinho como resolver?',
];
const SAIDA = 'Se não fizer sentido, é só falar que não mando mais.';
function mensagem(c, i) {
  const f = [...c.fracos].filter((x) => !soSite || x.tipo === 'link' || x.tipo === 'site').sort((a, b) => b.peso - a.peso)[0];
  const loja = curto(c.nome);
  const ab = ABERTURAS[i % ABERTURAS.length];
  const fe = FECHOS[(i + 1) % FECHOS.length];
  const L = c.lider;
  let meio;
  if (f.tipo === 'link') {
    meio = `Pesquisei "${c.busca}" no Google: a ${L.nome} aparece com ${L.avaliacoes} avaliações${L.temSite ? ' e site próprio' : ''}. A ${loja} tem ${c.avaliacoes} avaliações e nota ${c.nota}, mas ${f.fato}. Quem compara pelo celular acaba fechando com quem mostra mais.`;
  } else if (f.tipo === 'site') {
    meio = `Abri pelo celular o site da ${loja} que está no Google: ${f.fato}. Enquanto isso, a ${L.nome} aparece na busca "${c.busca}" com ${L.avaliacoes} avaliações. Esse detalhe faz o cliente ir pra outro lugar.`;
  } else if (f.tipo === 'nota') {
    meio = `Vi a ${loja} no Google: ${f.fato}. Na lista do Google o cliente compara as estrelas lado a lado, e quem tem nota maior leva.`;
  } else {
    // "ótimo sinal" só quando a nota é boa mesmo: o dono sabe que 4,2 não é
    const elogio = num(c.nota) >= 4.7 ? `nota ${c.nota}, ótimo sinal. Só que são` : `nota ${c.nota} e`;
    meio = `Vi a ${loja} no Google: ${elogio} ${f.fato}${L.antes ? `, que aparece antes na busca "${c.busca}"` : ''}. No Google, quem tem mais avaliação aparece primeiro e fica com o cliente.`;
  }
  return `${ab}\n\n${meio}\n\n${fe} ${SAIDA}`;
}

// ---------- escolher o lote: os melhores de cada nicho, misturados ----------
const pontuados = candidatos.filter((c) => c.fracos.length && (!soSite || c.fracos.some((f) => f.tipo === 'link' || f.tipo === 'site'))).map((c) => ({
  ...c, pontos: c.fracos.reduce((s, f) => s + f.peso, 0) + Math.min(20, Math.log10(c.avaliacoes + 1) * 8),
}));
const porNicho = Object.groupBy(pontuados.sort((a, b) => b.pontos - a.pontos), (c) => c.nicho);
const lote = [];
for (let rodada = 0; lote.length < max && rodada < 10; rodada++) {
  for (const n of Object.keys(porNicho)) if (porNicho[n][rodada] && lote.length < max) lote.push(porNicho[n][rodada]);
}
lote.forEach((c, i) => { c.mensagem = mensagem(c, i); c.id = `${c.nicho}-${c.whatsapp.slice(-4)}`; c.status = 'aguardando aprovação'; });

const fila = { criado: new Date().toISOString(), regras: { max_por_dia: 20, intervalo_min_s: 120, intervalo_max_s: 300 }, itens: lote.map((c) => ({
  id: c.id, loja: c.nome, nicho: c.nicho, whatsapp: c.whatsapp, nota: c.nota, avaliacoes: c.avaliacoes, endereco: c.endereco,
  pontos_fracos: c.fracos.map((f) => f.fato), lider: c.lider, auditoria: c.auditoria || null, mensagem: c.mensagem, status: c.status, enviado_em: null,
})) };
await writeFile(path.join(pasta, 'fila.json'), JSON.stringify(fila, null, 2) + '\n');

const md = [`# Lote de abordagem — ${new Date().toISOString().slice(0, 10)}`, '',
  `${candidatos.length} lojas com celular, ${pontuados.length} com ponto fraco verificável; ${lote.length} no lote (os melhores de cada nicho).`, '',
  '| # | Loja | Nicho | Google | Ponto fraco | WhatsApp |', '|---|---|---|---|---|---|',
  ...lote.map((c, i) => `| ${i + 1} | ${curto(c.nome)} | ${c.nicho} | ${c.nota} (${c.avaliacoes}) | ${c.fracos.map((f) => f.fato).join('; ')} | +${c.whatsapp} |`), '',
  '## Mensagens', '', ...lote.flatMap((c, i) => [`### ${i + 1}. ${c.nome}`, '', '```', c.mensagem, '```', ''])].join('\n');
await writeFile(path.join(pasta, 'lote.md'), md + '\n');
const cols = ['id', 'nome', 'nicho', 'nota', 'avaliacoes', 'whatsapp', 'endereco', 'pontos_fracos', 'lider', 'status'];
await writeFile(path.join(pasta, 'lote.csv'), '﻿' + [cols.join(';'), ...lote.map((c) => [c.id, c.nome, c.nicho, c.nota, c.avaliacoes, c.whatsapp, c.endereco, c.fracos.map((f) => f.fato).join(' | '), c.lider?.nome, c.status].map((v) => `"${String(v ?? '').replace(/"/g, '""')}"`).join(';'))].join('\n') + '\n');
console.log(`${candidatos.length} com celular · ${pontuados.length} com ponto fraco · ${lote.length} no lote → ${path.join(pasta, 'lote.md')}`);
