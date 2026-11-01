// Física — as contas que dão peso ao que o visitante pega na tela. Base de esteira, varal, folha e
// placar, e de qualquer peça nova que precise reagir ao dedo.
//
// import { mola, balanco, laco, arremesso, voar } from './tecnicas/fisica.js';
// const acordar = laco(quadro, {
//   passo: (h) => { [x, v] = mola(x, v, alvo, 6, h); return Math.abs(alvo - x) > 0.01; },   // true = ainda se mexendo
//   desenhar: () => { el.style.transform = `translateX(${x}px)`; },
// });
// acordar();   // chamar sempre que algo mudar
//
// As regras que separam peça premiada de animação comum estão aqui de propósito:
// - o laço só roda enquanto algo se mexe, e para fora da tela (bateria);
// - o tempo é dividido em passos de ~17 ms: a mola não explode em celular lento;
// - o arremesso usa média da velocidade, e segurar parado antes de soltar cancela o impulso.
// Contas de mola, sub-passos e arremesso aprendidas no código aberto (MIT) de DHxWhy e de
// Kedhareswer Naidu no 21st.dev.

import { quandoVisivel } from './palco.js';

// Chega sem passar do ponto. w maior = mais rápida (5 calmo, 16 responde na hora).
export function mola(x, v, alvo, w, h) {
  const nv = v + (w * w * (alvo - x) - 2 * w * v) * h;
  return [x + nv * h, nv];
}

// Passa do ponto e volta: k é a rigidez, c o freio. Pêndulo, prato levantando, objeto pendurado.
export function balanco(x, v, alvo, k, c, h) {
  const nv = v + (k * (alvo - x) - c * v) * h;
  return [x + nv * h, nv];
}

export function laco(el, { passo, desenhar = () => {} }) {
  let raf = 0, ultimo = 0, visivel = true;
  function quadro(agora) {
    raf = 0;
    if (!visivel) { ultimo = 0; return; }
    const dt = ultimo ? Math.min((agora - ultimo) / 1000, 0.25) : 1 / 60;
    ultimo = agora;
    const n = Math.max(1, Math.ceil(dt / 0.017));
    let ocupado = false;
    for (let i = 0; i < n; i++) ocupado = passo(dt / n) || ocupado;
    desenhar();
    if (ocupado) raf = requestAnimationFrame(quadro);
    else ultimo = 0;
  }
  const acordar = () => {
    if (raf || !visivel) return;
    ultimo = 0;
    raf = requestAnimationFrame(quadro);
  };
  quandoVisivel(el, (v) => {
    visivel = v;
    if (v) acordar();
    else if (raf) { cancelAnimationFrame(raf); raf = 0; ultimo = 0; }
  });
  return acordar;
}

// Mede a velocidade do dedo. inicio(x, t) no pointerdown, mover(x, t) no pointermove e, ao soltar,
// soltar(t) devolve px/s (t é o event.timeStamp).
export function arremesso() {
  let v = 0, x = 0, t = 0;
  return {
    inicio(px, tempo) { v = 0; x = px; t = tempo; },
    mover(px, tempo) {
      const agora = (px - x) / Math.max(1, tempo - t);
      v = v * 0.6 + agora * 0.4;
      x = px; t = tempo;
      return v * 1000;
    },
    soltar: (tempo) => v * 1000 * Math.exp(-Math.max(0, tempo - t) / 70),
  };
}

// O elemento nasce em `de` (um DOMRect, ex: o prato na esteira) e voa em arco até onde ele já está
// no layout. Liga a miniatura à ficha aberta: sem isso, parece que abriu outra coisa.
export function voar(el, de, { duracao = 680 } = {}) {
  const para = el.getBoundingClientRect();
  if (!de || !de.width || !para.width) return null;
  const sx = de.width / para.width, sy = de.height / para.height;
  const dx = de.left + de.width / 2 - (para.left + para.width / 2);
  const dy = de.top + de.height / 2 - (para.top + para.height / 2);
  const sobe = Math.min(120, Math.abs(dy) * 0.3 + 40);
  return el.animate([
    { transform: `translate(${dx}px, ${dy}px) scale(${sx}, ${sy})` },
    { transform: `translate(${dx * 0.42}px, ${dy * 0.42 - sobe}px) scale(${((sx + 1) / 2) * 1.05}, ${((sy + 1) / 2) * 1.05}) rotate(${dx > 0 ? -6 : 6}deg)`, offset: 0.5 },
    { transform: 'none' },
  ], { duration: duracao, easing: 'cubic-bezier(.22,.85,.3,1)' });
}
