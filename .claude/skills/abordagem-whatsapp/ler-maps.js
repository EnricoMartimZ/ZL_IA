// Cole no navegador do app (javascript_tool) com uma busca do Google Maps aberta.
// Rola a lista e devolve os negócios em JSON: nome, nota, avaliações, categoria, endereço,
// telefone, site e posição na busca. Patrocinados ficam de fora.
const feed = document.querySelector('[role="feed"]');
let antes = 0;
for (let i = 0; i < 14 && feed; i++) {
  feed.scrollTop = feed.scrollHeight;
  await new Promise((r) => setTimeout(r, 1500));
  const n = document.querySelectorAll('[role="feed"] a[href*="/maps/place/"]').length;
  if (n >= 25 || (n === antes && i > 3)) break;
  antes = n;
}
const vistos = new Set();
const lojas = [];
for (const d of document.querySelectorAll('[role="feed"] > div')) {
  const a = d.querySelector('a[aria-label][href*="/maps/place/"]');
  if (!a) continue;
  const nome = a.getAttribute('aria-label');
  const t = d.innerText;
  if (vistos.has(nome) || /Patrocinado/.test(t)) continue;
  vistos.add(nome);
  const nota = t.match(/(\d,\d)\s*\(([\d.]+)\)/);
  const linha = t.split('\n').map((s) => s.trim()).find((s) => s.includes('·') && !/Aberto|Fechado|Fecha|Abre/.test(s)) || '';
  const site = [...d.querySelectorAll('a[data-value="Website"], a[aria-label*="ebsite"], a[aria-label*="site" i]')].map((x) => x.href).find((h) => h && !/google\.com\/maps/.test(h)) || '';
  const coord = a.href.match(/!3d(-?[\d.]+)!4d(-?[\d.]+)/);
  if (lojas.length >= 25) break;
  lojas.push({
    posicao: lojas.length + 1, nome, nota: nota ? nota[1] : '', avaliacoes: nota ? Number(nota[2].replace(/\./g, '')) : 0,
    categoria: (linha.split('·')[0] || '').trim(), endereco: linha.split('·').slice(1).join(' ').replace(/\s+/g, ' ').trim(),
    telefone: (t.match(/\(\d{2}\)\s?\d{4,5}-\d{4}/) || [''])[0], site,
    lat: coord ? coord[1] : '', lon: coord ? coord[2] : '',
  });
}
JSON.stringify({ busca: decodeURIComponent((location.pathname.match(/search\/([^/]+)/) || ['', ''])[1]).replace(/\+/g, ' '), data: new Date().toISOString().slice(0, 10), lojas });
