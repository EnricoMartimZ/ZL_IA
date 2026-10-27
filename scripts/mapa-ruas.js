// Baixa as ruas reais em volta de uma loja (OpenStreetMap), calcula um caminho de carro até ela
// e salva o mapa.json que a seção "Onde fica" do /site-premium anima.
//
// Uso:
//   node scripts/mapa-ruas.js --loja -22.9056,-47.0608 --saida clientes/<Nome>/site/mapa.json
//        [--raio 900] [--de -22.9101,-47.0655]
//
// --loja: latitude,longitude da porta da loja (Google Maps: botão direito no ponto → copiar coordenadas)
// --raio: metros em volta da loja (padrão 900 — o suficiente pra preencher a caixa do mapa)
// --de:   de onde o carro sai (padrão: escolhe sozinho um ponto numa avenida a uns 400–550 m)
// --fonte: auto (padrão) | osm (pula o Overpass)
//
// Dados: © OpenStreetMap contributors (ODbL) — o crédito tem que aparecer no site.
// Fonte: Overpass API; se estiver lotada, a API oficial do OSM (uso leve, uma consulta por loja).

import { writeFile, mkdir } from 'node:fs/promises';
import path from 'node:path';

const argv = process.argv.slice(2);
const arg = (n, padrao) => (argv.includes(`--${n}`) ? argv[argv.indexOf(`--${n}`) + 1] : padrao);
const coord = (s) => {
  const m = String(s || '').split(',').map(Number);
  return m.length === 2 && m.every(Number.isFinite) ? m : null;
};

const loja = coord(arg('loja'));
const de = coord(arg('de'));
const raio = Number(arg('raio', 900));
const saida = arg('saida');
if (!loja || !saida) {
  console.error('uso: node scripts/mapa-ruas.js --loja <lat,lon> --saida <mapa.json> [--raio 900] [--de <lat,lon>]');
  process.exit(1);
}

const AGENTE = 'MazyOS-site-premium/1.0 (mapa de loja)';
const CLASSE = {
  motorway: 'p', trunk: 'p', primary: 'p', motorway_link: 'p', trunk_link: 'p', primary_link: 'p',
  secondary: 's', tertiary: 's', secondary_link: 's', tertiary_link: 's',
  residential: 'l', unclassified: 'l', living_street: 'l',
  service: 'v',
};
const esperar = (ms) => new Promise((r) => setTimeout(r, ms));

// ---------- projeção: metros em volta da loja (x pra leste, y pra baixo) ----------
const [lat0, lon0] = loja;
const kx = Math.cos((lat0 * Math.PI) / 180) * 111320;
const ky = 110540;
const projetar = (lat, lon) => [(lon - lon0) * kx, -(lat - lat0) * ky];

// ---------- baixar ----------
async function viaOverpass() {
  const filtro = Object.keys(CLASSE).join('|');
  const q = `[out:json][timeout:40];way(around:${Math.round(raio * 1.2)},${lat0},${lon0})["highway"~"^(${filtro})$"];(._;>;);out body;`;
  for (let tentativa = 0; tentativa < 3; tentativa++) {
    try {
      const r = await fetch('https://overpass-api.de/api/interpreter', {
        method: 'POST',
        headers: { 'User-Agent': AGENTE, 'Content-Type': 'application/x-www-form-urlencoded' },
        body: `data=${encodeURIComponent(q)}`,
        signal: AbortSignal.timeout(45000),
      });
      if (r.ok) {
        const j = await r.json();
        const nos = new Map();
        const vias = [];
        for (const e of j.elements) {
          if (e.type === 'node') nos.set(e.id, [e.lat, e.lon]);
          else if (e.type === 'way') vias.push({ refs: e.nodes, tags: e.tags || {} });
        }
        return { nos, vias, fonte: 'Overpass API' };
      }
      console.warn(`  Overpass respondeu ${r.status}, tentando de novo...`);
    } catch (e) {
      console.warn(`  Overpass falhou (${e.message}), tentando de novo...`);
    }
    await esperar(2000 * 2 ** tentativa);
  }
  return null;
}

async function viaApiOsm() {
  const dLat = (raio * 1.2) / ky;
  const dLon = (raio * 1.2) / kx;
  const nos = new Map();
  const vias = new Map();
  // a API oficial limita a área e o número de pontos: se recusar, divide em 4 e tenta de novo
  async function baixar(b, nivel = 0) {
    const url = `https://api.openstreetmap.org/api/0.6/map?bbox=${b.map((v) => v.toFixed(6)).join(',')}`;
    const r = await fetch(url, { headers: { 'User-Agent': AGENTE }, signal: AbortSignal.timeout(60000) });
    if (r.status === 400 && nivel < 3) {
      const [w, s, e, n] = b;
      const mx = (w + e) / 2, my = (s + n) / 2;
      for (const q of [[w, s, mx, my], [mx, s, e, my], [w, my, mx, n], [mx, my, e, n]]) await baixar(q, nivel + 1);
      return;
    }
    if (!r.ok) throw new Error(`API do OSM respondeu ${r.status}`);
    const xml = await r.text();
    for (const m of xml.matchAll(/<node id="(\d+)"[^>]*?lat="([-\d.]+)" lon="([-\d.]+)"/g)) nos.set(Number(m[1]), [Number(m[2]), Number(m[3])]);
    for (const m of xml.matchAll(/<way id="(\d+)"[^>]*>([\s\S]*?)<\/way>/g)) {
      const tags = {};
      for (const t of m[2].matchAll(/<tag k="([^"]+)" v="([^"]*)"/g)) tags[t[1]] = t[2].replace(/&quot;/g, '"').replace(/&amp;/g, '&').replace(/&#39;/g, "'");
      if (!CLASSE[tags.highway]) continue;
      vias.set(m[1], { refs: [...m[2].matchAll(/<nd ref="(\d+)"/g)].map((x) => Number(x[1])), tags });
    }
  }
  await baixar([lon0 - dLon, lat0 - dLat, lon0 + dLon, lat0 + dLat]);
  return { nos, vias: [...vias.values()], fonte: 'API do OpenStreetMap' };
}

console.log(`baixando ruas num raio de ${raio} m de ${lat0}, ${lon0}...`);
const fonte = arg('fonte', 'auto'); // auto | overpass | osm
const dados = (fonte !== 'osm' && (await viaOverpass())) || (await viaApiOsm());
console.log(`  ${dados.vias.length} vias (${dados.fonte})`);
if (!dados.vias.length) {
  console.error('erro: nenhuma rua encontrada — conferir as coordenadas (lat,lon, nessa ordem)');
  process.exit(1);
}

// ---------- grafo pra rota ----------
const pos = new Map(); // id → [x, y]
const vizinhos = new Map(); // id → [[id, dist]]
const classeNo = new Map(); // id → melhor classe que passa nele
const ordem = { p: 0, s: 1, l: 2, v: 3 };
const ligar = (a, b, d) => {
  if (!vizinhos.has(a)) vizinhos.set(a, []);
  vizinhos.get(a).push([b, d]);
};
for (const v of dados.vias) {
  const c = CLASSE[v.tags.highway];
  if (v.tags.access === 'private' || v.tags.access === 'no') continue;
  for (let i = 0; i < v.refs.length; i++) {
    const ll = dados.nos.get(v.refs[i]);
    if (!ll) continue;
    pos.set(v.refs[i], projetar(...ll));
    if (!classeNo.has(v.refs[i]) || ordem[c] < ordem[classeNo.get(v.refs[i])]) classeNo.set(v.refs[i], c);
    if (i === 0 || c === 'v') continue; // rua de serviço não entra na rota (estacionamentos, vielas)
    const ant = v.refs[i - 1];
    if (!pos.has(ant)) continue;
    const [ax, ay] = pos.get(ant), [bx, by] = pos.get(v.refs[i]);
    const d = Math.hypot(bx - ax, by - ay);
    ligar(ant, v.refs[i], d);
    ligar(v.refs[i], ant, d);
  }
}
const distOrigem = (id) => Math.hypot(...pos.get(id));
const maisPerto = (x, y, filtro = () => true) => {
  let melhor = null, dm = Infinity;
  for (const id of vizinhos.keys()) {
    if (!filtro(id)) continue;
    const [px, py] = pos.get(id);
    const d = Math.hypot(px - x, py - y);
    if (d < dm) { dm = d; melhor = id; }
  }
  return [melhor, dm];
};

const [noLoja, dLoja] = maisPerto(0, 0);
if (!noLoja) {
  console.error('erro: nenhuma rua com acesso de carro perto da loja');
  process.exit(1);
}
if (dLoja > 120) console.warn(`aviso: a rua mais próxima está a ${Math.round(dLoja)} m da loja — conferir a coordenada`);

// Dijkstra a partir da loja (grafo não dirigido: a animação é ilustrativa, ignora mão única)
const dist = new Map([[noLoja, 0]]);
const prev = new Map();
const fila = [[0, noLoja]];
const subir = (i) => { while (i > 0) { const p = (i - 1) >> 1; if (fila[p][0] <= fila[i][0]) break; [fila[p], fila[i]] = [fila[i], fila[p]]; i = p; } };
const descer = (i) => {
  for (;;) {
    const l = 2 * i + 1, r = l + 1;
    let m = i;
    if (l < fila.length && fila[l][0] < fila[m][0]) m = l;
    if (r < fila.length && fila[r][0] < fila[m][0]) m = r;
    if (m === i) break;
    [fila[m], fila[i]] = [fila[i], fila[m]];
    i = m;
  }
};
while (fila.length) {
  const [d, u] = fila[0];
  const ultimo = fila.pop();
  if (fila.length) { fila[0] = ultimo; descer(0); }
  if (d > dist.get(u)) continue;
  for (const [v, w] of vizinhos.get(u) || []) {
    const nd = d + w;
    if (nd < (dist.get(v) ?? Infinity)) {
      dist.set(v, nd);
      prev.set(v, u);
      fila.push([nd, v]);
      subir(fila.length - 1);
    }
  }
}

// ponto de partida
let noInicio;
if (de) {
  [noInicio] = maisPerto(...projetar(...de), (id) => dist.has(id));
} else {
  // numa avenida (ou rua coletora), a 400–550 m em linha reta, com caminho com curvas mas sem rodeio
  const candidatos = [...dist.keys()].filter((id) => {
    const r = distOrigem(id);
    return r > Math.min(380, raio * 0.55) && r < Math.min(560, raio * 0.85) && dist.get(id) < r * 1.8;
  });
  const nota = (id) => dist.get(id) * (classeNo.get(id) === 'p' ? 1.25 : classeNo.get(id) === 's' ? 1.1 : 1);
  noInicio = candidatos.sort((a, b) => nota(b) - nota(a))[0];
}
if (!noInicio) {
  console.error('erro: não achei um ponto de partida ligado à loja pelas ruas — passar --de lat,lon ou aumentar --raio');
  process.exit(1);
}

const rota = [];
for (let id = noInicio; id !== undefined; id = prev.get(id)) rota.push(pos.get(id));
if (dLoja > 3) rota.push([0, 0]);
const comprimento = rota.reduce((s, p, i) => (i ? s + Math.hypot(p[0] - rota[i - 1][0], p[1] - rota[i - 1][1]) : 0), 0);

// ---------- ruas pra desenhar ----------
function simplificar(pts, tol) { // Douglas-Peucker
  if (pts.length < 3) return pts;
  const [ax, ay] = pts[0], [bx, by] = pts[pts.length - 1];
  const len = Math.hypot(bx - ax, by - ay) || 1;
  let dm = 0, im = 0;
  for (let i = 1; i < pts.length - 1; i++) {
    const d = Math.abs((by - ay) * pts[i][0] - (bx - ax) * pts[i][1] + bx * ay - by * ax) / len;
    if (d > dm) { dm = d; im = i; }
  }
  if (dm <= tol) return [pts[0], pts[pts.length - 1]];
  return [...simplificar(pts.slice(0, im + 1), tol).slice(0, -1), ...simplificar(pts.slice(im), tol)];
}
const limite = raio * 1.15;
const ruas = [];
for (const v of dados.vias) {
  const c = CLASSE[v.tags.highway];
  let trecho = [];
  const fechar = () => {
    if (trecho.length > 1) {
      const r = { c, p: simplificar(trecho, 1.5).map(([x, y]) => [Math.round(x), Math.round(y)]) };
      if ((c === 'p' || c === 's') && v.tags.name) r.n = v.tags.name;
      ruas.push(r);
    }
    trecho = [];
  };
  for (const ref of v.refs) {
    const ll = dados.nos.get(ref);
    if (!ll) { fechar(); continue; }
    const p = projetar(...ll);
    if (Math.hypot(...p) > limite) fechar();
    else trecho.push(p);
  }
  fechar();
}

const nomeRuaInicio = dados.vias.find((v) => v.refs.includes(noInicio) && v.tags.name)?.tags.name || '';
const mapa = {
  versao: 1,
  loja: { lat: lat0, lon: lon0 },
  raio,
  ruas,
  rota: simplificar(rota, 1).map(([x, y]) => [Math.round(x), Math.round(y)]),
  distancia: Math.round(comprimento),
  saida: nomeRuaInicio,
  credito: '© OpenStreetMap contributors',
};
await mkdir(path.dirname(path.resolve(saida)), { recursive: true });
await writeFile(saida, JSON.stringify(mapa));
const kb = Math.round(JSON.stringify(mapa).length / 1024);
console.log(`ok: ${ruas.length} trechos de rua, rota de ${mapa.distancia} m saindo de "${nomeRuaInicio || 'rua sem nome'}" → ${saida} (${kb} KB)`);
