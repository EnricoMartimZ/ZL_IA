// Cole no navegador do app (javascript_tool) com uma busca do Google Maps aberta.
// Rola a lista e devolve os negócios em JSON: nome, nota, avaliações, categoria, endereço,
// telefone, site e posição na busca. Patrocinados ficam de fora.
// Desde 09/11/2026 o Maps não mostra mais o botão de site na LISTA: o site só aparece no painel
// do lugar. Por isso o script clica em cada celular candidato (nota/avaliações já na lista), espera
// o painel abrir e lê o link `a[data-item-id="authority"]`. Se o painel não abrir, `site_lido` fica
// false naquele item (e o montar-lote.js não afirma "sem site").
// COMO USAR: clicar num lugar muda a URL e o javascript_tool descarta a chamada que ainda está rodando. Por
// isso o script roda solto em segundo plano: a 1ª chamada só devolve "iniciado"; depois repita
// `window.__ler.pronto ? window.__ler.json : window.__ler.progresso` até vir o JSON (leva ~1–2 min).
window.__ler = { pronto: false, progresso: 'rolando a lista', json: null };
(async () => {
try {
const buscaNome = decodeURIComponent((location.pathname.match(/search\/([^/]+)/) || ['', ''])[1]).replace(/\+/g, ' ');
const esperar = (ms) => new Promise((r) => setTimeout(r, ms));
const feed = document.querySelector('[role="feed"]');
let antes = 0;
for (let i = 0; i < 14 && feed; i++) {
  feed.scrollTop = feed.scrollHeight;
  await esperar(1500);
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
  // site direto na lista (layout antigo), se ainda existir
  const site = [...d.querySelectorAll('a[data-value="Website"], a[aria-label*="ebsite"], a[aria-label*="site" i]')].map((x) => x.href).find((h) => h && !/google\.com\/maps/.test(h)) || '';
  const coord = a.href.match(/!3d(-?[\d.]+)!4d(-?[\d.]+)/);
  if (lojas.length >= 25) break;
  lojas.push({
    posicao: lojas.length + 1, nome, nota: nota ? nota[1] : '', avaliacoes: nota ? Number(nota[2].replace(/\./g, '')) : 0,
    categoria: (linha.split('·')[0] || '').trim(), endereco: linha.split('·').slice(1).join(' ').replace(/\s+/g, ' ').trim(),
    telefone: (t.match(/\(\d{2}\)\s?\d{4,5}-\d{4}/) || [''])[0], site, site_lido: !!site,
    lat: coord ? coord[1] : '', lon: coord ? coord[2] : '',
  });
}
// Lê o site no painel do lugar: celular (WhatsApp) com 10+ avaliações, mais os 3 mais avaliados (candidatos a líder
// do nicho, usados na comparação). O resto o montar-lote descarta.
const top3 = new Set([...lojas].sort((a, b) => b.avaliacoes - a.avaliacoes).slice(0, 3).map((l) => l.nome));
for (let i = 0; i < lojas.length; i++) {
  const l = lojas[i];
  const celular = /\(\d{2}\)\s?9\d{4}-\d{4}/.test(l.telefone) && l.avaliacoes >= 10;
  if (l.site_lido || !(celular || top3.has(l.nome))) continue;
  window.__ler.progresso = `lendo ${i + 1}/${lojas.length}`;
  // o Maps troca os elementos da lista a cada abertura de painel: achar o link de novo pelo nome
  // com o painel aberto a lista some: voltar pra lista e rolar até o item reaparecer
  const achar = () => [...document.querySelectorAll('[role="feed"] a.hfpxzc')].find((x) => x.getAttribute('aria-label') === l.nome);
  let alvo = achar();
  for (let k = 0; k < 14 && !alvo; k++) {
    const voltar = document.querySelector('button[aria-label="Voltar"], button[aria-label="Back"]');
    const f = document.querySelector('[role="feed"]');
    if (!f && voltar) voltar.click();
    if (f) f.scrollTop = f.scrollHeight;
    await esperar(1200);
    alvo = achar();
  }
  if (!alvo) continue;
  alvo.click();
  let ok = false;
  for (let k = 0; k < 14; k++) {
    await esperar(500);
    const h = [...document.querySelectorAll('h1')].map((x) => x.innerText.trim());
    const painel = document.querySelector('[data-item-id="address"], [data-item-id^="phone"]');
    if (painel && h.includes(l.nome)) { ok = true; break; }
  }
  if (ok) {
    const w = document.querySelector('a[data-item-id="authority"]');
    l.site = w ? w.href : '';
    l.site_lido = true;
  }
  await esperar(600 + Math.random() * 600);
}
const lido = lojas.filter((l) => l.site_lido).length;
window.__ler.json = JSON.stringify({ busca: buscaNome, data: new Date().toISOString().slice(0, 10), site_na_lista: lido > 0, lojas });
window.__ler.pronto = true;
} catch (e) { window.__ler.progresso = 'erro: ' + e.message; }
})();
'iniciado';
