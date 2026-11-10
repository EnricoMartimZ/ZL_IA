// Roda — os produtos numa roda grande cujo centro fica abaixo da tela. O do meio em foco; os vizinhos
// inclinados, menores e desfocados; a frase da marca correndo em curva no sentido contrário; o disco
// de fundo tomando a cor de cada item. Gira com o dedo, com as setas ou pela rolagem (palco).
//
// import { roda } from './tecnicas/roda.js';
// const r = roda(document.querySelector('#potes'), {
//   itens: [{ nome: 'Geleia de laranja', detalhe: '240 g', cor: '#7a2230', img: 'img/laranja.png' }, …],
//   frase: 'plantamos · colhemos · conservamos · ',
//   aoAbrir: (item) => abrirFicha(item),           // toque no item do centro
// });
// palco(secao, r.progresso);                        // opcional: a rolagem gira a roda
//
// Material: foto do produto recortada (PNG/WebP sem fundo), todas na mesma luz e do mesmo ângulo.
// 5 a 12 itens. `html` no lugar de `img` aceita SVG ou qualquer marcação.
// Vista num Site do Dia do Awwwards (potes de conserva em 3D) e em duas peças do 21st.dev (prato em
// órbita, carrossel em arco). Aqui é DOM e CSS, sem WebGL: roda em qualquer celular.

import { limitar, semMovimento } from './palco.js';
import { laco, mola, arremesso } from './fisica.js';

let serie = 0;

export function roda(el, opcoes = {}) {
  const o = { itens: [], frase: '', infinita: true, altura: 0.44, rotulo: 'Produtos', aoMudar: () => {}, aoAbrir: null, ...opcoes };
  const n = o.itens.length;
  const id = `roda-${++serie}`;
  const parado = semMovimento();
  el.classList.add('roda');
  el.innerHTML = `
    <div class="roda-disco" aria-hidden="true">${o.frase ? `<svg viewBox="0 0 1000 1000"><path id="${id}" d="M500 500 m-455 0 a455 455 0 1 1 910 0 a455 455 0 1 1 -910 0" fill="none"/><text><textPath href="#${id}">${o.frase.repeat(Math.ceil(110 / Math.max(6, o.frase.length)))}</textPath></text></svg>` : ''}</div>
    <div class="roda-pista" role="group" aria-roledescription="carrossel" aria-label="${o.rotulo}" tabindex="0"></div>
    <p class="roda-legenda" aria-live="polite"></p>`;
  const disco = el.querySelector('.roda-disco');
  const frase = disco.querySelector('svg');
  const pista = el.querySelector('.roda-pista');
  const legenda = el.querySelector('.roda-legenda');
  const botoes = o.itens.map((item, i) => {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'roda-item';
    b.tabIndex = -1;
    b.setAttribute('aria-label', item.nome || `Item ${i + 1}`);
    b.innerHTML = item.html || `<img src="${item.img}" alt="" draggable="false">`;
    pista.append(b);
    return b;
  });

  let W = 0, H = 0, R = 0, lado = 0, passo = 0.4;   // passo em radianos entre dois itens
  let a = 0, v = 0, alvo = 0, atual = -1, pegando = false;
  const volta = (d) => (o.infinita ? ((d % n) + n + n / 2) % n - n / 2 : d);
  const indice = (x) => ((Math.round(x) % n) + n) % n;

  function medir() {
    const r = el.getBoundingClientRect();
    W = r.width; H = r.height;
    lado = limitar(W * 0.26, 132, 340);
    R = Math.max(W * 0.72, 560);
    passo = (lado * 1.5) / R;
    el.style.setProperty('--roda-item', `${lado}px`);
    const rd = R - lado * 0.08;
    Object.assign(disco.style, { width: `${rd * 2}px`, height: `${rd * 2}px`, left: `${W / 2 - rd}px`, top: `${H * o.altura + R - rd}px` });
    pintar();
  }

  function pintar() {
    const cx = W / 2, cy = H * o.altura + R;
    botoes.forEach((b, i) => {
      const d = volta(i - a);
      const longe = Math.abs(d);
      if (longe > 3.3) { b.style.visibility = 'hidden'; return; }
      const ang = d * passo;
      const perto = 1 - limitar(longe);
      b.style.visibility = '';
      b.style.zIndex = String(100 - Math.round(longe * 10));
      b.style.transform = `translate(${(cx + R * Math.sin(ang)).toFixed(1)}px, ${(cy - R * Math.cos(ang)).toFixed(1)}px) rotate(${(ang * 0.9).toFixed(4)}rad) scale(${(0.74 + 0.26 * perto).toFixed(3)})`;
      const borrao = Math.round(limitar(longe - 0.35, 0, 2) * 3);     // muda em degraus: filtro custa caro
      if (b._borrao !== borrao) { b._borrao = borrao; b.style.filter = borrao ? `blur(${borrao}px)` : ''; }
    });
    const base = Math.floor(a), f = a - base;
    const c0 = o.itens[indice(base)]?.cor, c1 = o.itens[indice(base + 1)]?.cor;
    if (c0 && c1) disco.style.background = `color-mix(in oklab, ${c0} ${((1 - f) * 100).toFixed(1)}%, ${c1})`;
    if (frase) frase.style.transform = `rotate(${(-a * passo * 57.2958 * 0.8).toFixed(2)}deg)`;
    const i = indice(a);
    if (i !== atual) {
      atual = i;
      const item = o.itens[i];
      legenda.innerHTML = `<b>${item.nome || ''}</b>${item.detalhe ? `<span>${item.detalhe}</span>` : ''}`;
      botoes.forEach((b, j) => b.classList.toggle('no-centro', j === i));
      o.aoMudar(item, i);
    }
  }

  const acordar = laco(el, {
    passo(h) {
      if (pegando) return false;
      [a, v] = mola(a, v, alvo, 7, h);
      if (Math.abs(alvo - a) < 0.001 && Math.abs(v) < 0.01) { a = alvo; v = 0; return false; }
      return true;
    },
    desenhar: pintar,
  });
  function ir(x) {
    alvo = o.infinita ? x : limitar(x, 0, n - 1);
    if (parado) { a = alvo; v = 0; pintar(); } else acordar();
  }

  // dedo: só vira arrasto depois de 6 px e se andou mais de lado que de pé (a página continua rolando)
  const dedo = arremesso();
  let x0 = 0, y0 = 0, a0 = 0, arrastou = false;
  pista.addEventListener('pointerdown', (e) => { x0 = e.clientX; y0 = e.clientY; a0 = a; arrastou = false; pegando = false; dedo.inicio(e.clientX, e.timeStamp); pista._baixo = true; });
  pista.addEventListener('pointermove', (e) => {
    if (!pista._baixo) return;
    const dx = e.clientX - x0, dy = e.clientY - y0;
    if (!arrastou) {
      if (Math.abs(dx) < 6 || Math.abs(dx) < Math.abs(dy)) return;
      arrastou = true; pegando = true;
      pista.setPointerCapture(e.pointerId);
      pista.classList.add('pegando');
    }
    dedo.mover(e.clientX, e.timeStamp);
    a = a0 - dx / (R * passo);
    if (!o.infinita) a = limitar(a, -0.35, n - 0.65);
    pintar();
  });
  const soltar = (e) => {
    if (!pista._baixo) return;
    pista._baixo = false;
    if (!arrastou) return;
    pegando = false;
    pista.classList.remove('pegando');
    const impulso = -dedo.soltar(e.timeStamp) / (R * passo);     // itens por segundo
    v = impulso;
    ir(Math.round(a + impulso * 0.22));
  };
  pista.addEventListener('pointerup', soltar);
  pista.addEventListener('pointercancel', soltar);
  botoes.forEach((b, i) => b.addEventListener('click', (e) => {
    if (arrastou) { e.preventDefault(); return; }
    const d = volta(i - Math.round(alvo));
    if (d === 0) o.aoAbrir?.(o.itens[i], i, b);
    else ir(Math.round(alvo) + d);
  }));
  pista.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowRight') { ir(Math.round(alvo) + 1); e.preventDefault(); }
    else if (e.key === 'ArrowLeft') { ir(Math.round(alvo) - 1); e.preventDefault(); }
    else if (e.key === 'Enter' || e.key === ' ') { o.aoAbrir?.(o.itens[atual], atual, botoes[atual]); e.preventDefault(); }
  });

  new ResizeObserver(medir).observe(el);
  medir();
  return {
    ir,
    proxima: () => ir(Math.round(alvo) + 1),
    anterior: () => ir(Math.round(alvo) - 1),
    progresso: (p) => ir(limitar(p) * (n - 1)),
    get atual() { return atual; },
  };
}
