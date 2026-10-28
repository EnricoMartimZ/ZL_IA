// Texto — títulos que entram palavra por palavra (ou letra por letra), rótulos técnicos que se
// "decodificam" como num painel, e números que contam até o valor real.
//
// <h2 data-dividir="palavras">O ar certo, no lugar certo.</h2>   ← .visto quando entra na tela
// <span data-embaralhar>SISTEMA · 12.000 BTU</span>
// <b data-contar="582" data-casas="0">0</b>
//
// import { texto } from './tecnicas/texto.js';
// texto();   // procura os atributos na página inteira

import { semMovimento } from './palco.js';

const CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789#%/<>_';

export function dividir(el, modo = 'palavras') {
  const original = el.textContent.trim();
  el.setAttribute('aria-label', original);
  const partes = modo === 'letras' ? [...original] : original.split(/(\s+)/);
  let i = 0;
  el.innerHTML = partes.map((parte) => {
    if (/^\s+$/.test(parte)) return parte === ' ' || modo !== 'letras' ? ' ' : parte;
    if (modo === 'letras' && parte === ' ') return ' ';
    return `<span class="t-corte" aria-hidden="true"><span style="--i:${i++}">${parte}</span></span>`;
  }).join('');
  return el;
}

export function embaralhar(el, { duracao = 900 } = {}) {
  const final = el.textContent;
  if (semMovimento()) return;
  const inicio = performance.now();
  const passo = (agora) => {
    const t = Math.min(1, (agora - inicio) / duracao);
    const fixos = Math.floor(t * final.length);
    el.textContent = [...final].map((c, i) => (i < fixos || c === ' ' || c === '·' ? c : CHARS[(Math.random() * CHARS.length) | 0])).join('');
    if (t < 1) requestAnimationFrame(passo);
  };
  requestAnimationFrame(passo);
}

export function contar(el, { duracao = 1400 } = {}) {
  const alvo = Number(el.dataset.contar);
  const casas = Number(el.dataset.casas || 0);
  const fmt = (v) => v.toLocaleString('pt-BR', { minimumFractionDigits: casas, maximumFractionDigits: casas });
  if (semMovimento()) { el.textContent = fmt(alvo); return; }
  const inicio = performance.now();
  const passo = (agora) => {
    const t = Math.min(1, (agora - inicio) / duracao);
    el.textContent = fmt(alvo * (1 - (1 - t) ** 3));
    if (t < 1) requestAnimationFrame(passo);
  };
  requestAnimationFrame(passo);
}

export function texto(raiz = document) {
  raiz.querySelectorAll('[data-dividir]').forEach((el) => dividir(el, el.dataset.dividir || 'palavras'));
  const io = new IntersectionObserver((entradas) => {
    for (const e of entradas) {
      if (!e.isIntersecting) continue;
      const el = e.target;
      el.classList.add('visto');
      if (el.hasAttribute('data-embaralhar')) embaralhar(el);
      if (el.hasAttribute('data-contar')) contar(el);
      io.unobserve(el);
    }
  }, { threshold: 0.35 });
  raiz.querySelectorAll('[data-dividir], [data-embaralhar], [data-contar], [data-revelar]').forEach((el) => io.observe(el));
}
