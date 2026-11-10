// Profundidade — os itens em fila pro fundo da tela; a rolagem traz o próximo pra frente, em foco,
// enquanto os de trás ficam menores e desfocados e o da frente passa pela câmera e some.
//   modo 'fila'   passarela: um atrás do outro, alternando os lados      (looks, modelos de carro, pratos, obras)
//   modo 'tunel'  os cartões saem de um túnel em espiral rumo à câmera   (portfólio, linha do tempo, cases)
//
// <div class="fila" id="looks">
//   <figure data-fila data-nome="Look 21">…</figure>
//   <figure data-fila data-nome="Look 22">…</figure>
// </div>
// import { fila } from './tecnicas/profundidade.js';
// const f = fila(document.querySelector('#looks'), { modo: 'fila' });
// palco(secao, f.progresso);          // a rolagem anda pela fila; sem palco: setas, arrasto e f.ir(i)
//
// Material: itens recortados (sem fundo) dão a ilusão de profundidade; foto retangular também serve,
// como cartão. 5 a 12 itens. Só o item em foco recebe clique e Tab.
// Vista no Runway Lookbook e no Tumble Deck, de Kedhareswer Naidu, e no Perspective Tunnel, de
// Daiwiik Harihar (21st.dev); o código é daqui, sem 3D de verdade: escala, deslocamento e desfoque.

import { limitar, semMovimento } from './palco.js';
import { laco, mola } from './fisica.js';

export function fila(el, opcoes = {}) {
  const o = { modo: 'fila', aoMudar: () => {}, ...opcoes };
  const parado = semMovimento();
  el.classList.add('fila');
  el.tabIndex = 0;
  el.setAttribute('role', 'group');
  el.setAttribute('aria-roledescription', 'carrossel');
  const itens = [...el.querySelectorAll('[data-fila]')];
  const n = itens.length;
  const legenda = document.createElement('p');
  legenda.className = 'fila-legenda';
  legenda.setAttribute('aria-live', 'polite');
  el.append(legenda);
  const tunel = o.modo === 'tunel';
  let W = 0, H = 0, a = 0, v = 0, alvo = 0, atual = -1;

  function pintar() {
    itens.forEach((it, i) => {
      const d = i - a;                                   // 0 = em foco · > 0 lá atrás · < 0 já passou
      if (d < -1.15 || d > 5.5) { it.style.visibility = 'hidden'; return; }
      const lado = i % 2 ? 1 : -1;
      const ang = i * 2.39996;                           // ângulo de ouro: espalha sem repetir
      let x, y, esc, op, borrao;
      if (d >= 0) {
        esc = 1 / (1 + d * 0.42);
        op = limitar(1.15 - d * 0.22);
        borrao = Math.min(8, Math.round(d * 2.6));
        x = tunel ? Math.cos(ang) * (1 - esc) * 0.46 : lado * (1 - esc) * 0.34;
        y = tunel ? Math.sin(ang) * (1 - esc) * 0.3 : -(1 - esc) * 0.16;
      } else {
        const k = -d;
        esc = 1 + k * (tunel ? 2.4 : 0.9);
        op = limitar(1 - k * 1.25);
        borrao = Math.round(k * 6);
        x = tunel ? Math.cos(ang) * k * 0.6 : -lado * k * 0.32;
        y = tunel ? Math.sin(ang) * k * 0.4 : k * 0.08;
      }
      it.style.visibility = '';
      it.style.opacity = op.toFixed(3);
      it.style.zIndex = String(d >= 0 ? 100 - Math.round(d * 10) : 200);
      it.style.transform = `translate(${(x * W).toFixed(1)}px, ${(y * H).toFixed(1)}px) scale(${esc.toFixed(3)})`;
      if (it._borrao !== borrao) { it._borrao = borrao; it.style.filter = borrao ? `blur(${borrao}px)` : ''; }
      it.inert = Math.abs(d) > 0.5;
    });
    const i = limitar(Math.round(a), 0, n - 1);
    if (i !== atual) {
      atual = i;
      legenda.textContent = itens[i]?.dataset.nome || '';
      itens.forEach((it, j) => it.classList.toggle('em-foco', j === i));
      o.aoMudar(i, itens[i]);
    }
  }
  const acordar = laco(el, {
    passo(h) {
      [a, v] = mola(a, v, alvo, 6, h);
      if (Math.abs(alvo - a) < 0.001 && Math.abs(v) < 0.01) { a = alvo; v = 0; return false; }
      return true;
    },
    desenhar: pintar,
  });
  function ir(x) {
    alvo = limitar(x, 0, n - 1);
    if (parado) { a = alvo; pintar(); } else acordar();
  }

  el.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowRight' || e.key === 'ArrowDown') { ir(Math.round(alvo) + 1); e.preventDefault(); }
    else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') { ir(Math.round(alvo) - 1); e.preventDefault(); }
  });
  let x0 = null;
  el.addEventListener('pointerdown', (e) => { x0 = e.clientX; });
  el.addEventListener('pointerup', (e) => {
    if (x0 === null) return;
    const dx = e.clientX - x0;
    x0 = null;
    if (Math.abs(dx) > 40) ir(Math.round(alvo) + (dx < 0 ? 1 : -1));
  });
  new ResizeObserver(() => { const r = el.getBoundingClientRect(); W = r.width; H = r.height; pintar(); }).observe(el);

  return {
    ir,
    proxima: () => ir(Math.round(alvo) + 1),
    anterior: () => ir(Math.round(alvo) - 1),
    progresso: (p) => ir(limitar(p) * (n - 1)),
    get atual() { return atual; },
  };
}
