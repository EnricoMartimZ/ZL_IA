// Carta — figurinha colecionável: inclina seguindo o dedo, a película holográfica corre por cima e,
// se tiver verso, vira com um toque. Pra tudo que é "um de cada": pessoa da equipe, prato da casa,
// carro do estoque, lote, corte, troféu, obra entregue.
//
// <div class="carta" id="c1">
//   <div class="carta-frente">…foto, nome, número…</div>
//   <div class="carta-verso">…a ficha: dados, história, botão…</div>     ← opcional
// </div>
// import { carta } from './tecnicas/carta.js';
// document.querySelectorAll('.carta').forEach((c) => carta(c));
//
// O brilho é só CSS (mix-blend-mode) guiado por --mx/--my: sem WebGL, sem imagem extra.
// Reduzir movimento: a carta não inclina e vira sem girar. Teclado: Enter ou Espaço vira.
// Vista num Site do Dia do Awwwards (site de atleta, com cartas de jogador douradas).

import { semMovimento } from './palco.js';
import { laco, mola, balanco } from './fisica.js';

export function carta(el, opcoes = {}) {
  const o = { inclinacao: 13, ...opcoes };
  const parado = semMovimento();
  el.classList.add('carta');
  let giro = el.querySelector('.carta-giro');
  if (!giro) {
    giro = document.createElement('div');
    giro.className = 'carta-giro';
    giro.append(...el.childNodes);
    el.append(giro);
  }
  const frente = giro.querySelector('.carta-frente');
  const verso = giro.querySelector('.carta-verso');
  if (frente && !frente.querySelector('.carta-brilho')) frente.insertAdjacentHTML('beforeend', '<span class="carta-brilho" aria-hidden="true"></span>');

  let rx = 0, ry = 0, vx = 0, vy = 0, ax = 0, ay = 0, vira = 0, vv = 0, virada = false;
  const acordar = laco(el, {
    passo(h) {
      [rx, vx] = mola(rx, vx, ax, 9, h);
      [ry, vy] = mola(ry, vy, ay, 9, h);
      [vira, vv] = balanco(vira, vv, virada ? 180 : 0, 90, 13, h);
      return Math.abs(ax - rx) + Math.abs(ay - ry) + Math.abs((virada ? 180 : 0) - vira) + Math.abs(vv) > 0.02;
    },
    desenhar() { giro.style.transform = `rotateX(${rx.toFixed(2)}deg) rotateY(${(ry + vira).toFixed(2)}deg)`; },
  });

  if (!parado) {
    el.addEventListener('pointermove', (e) => {
      const r = el.getBoundingClientRect();
      const px = (e.clientX - r.left) / r.width, py = (e.clientY - r.top) / r.height;
      ay = (px - 0.5) * 2 * o.inclinacao * (virada ? -1 : 1);
      ax = -(py - 0.5) * 2 * o.inclinacao;
      el.style.setProperty('--mx', `${(px * 100).toFixed(1)}%`);
      el.style.setProperty('--my', `${(py * 100).toFixed(1)}%`);
      el.classList.add('viva');
      acordar();
    });
    const largar = () => { ax = ay = 0; el.classList.remove('viva'); acordar(); };
    el.addEventListener('pointerleave', largar);
    el.addEventListener('pointercancel', largar);
  }

  function virar(para = !virada) {
    if (!verso) return;
    virada = para;
    el.classList.toggle('virada', virada);
    el.setAttribute('aria-pressed', String(virada));
    if (parado) { vira = virada ? 180 : 0; giro.style.transform = `rotateY(${vira}deg)`; } else acordar();
  }
  if (verso) {
    el.tabIndex = 0;
    el.setAttribute('role', 'button');
    el.setAttribute('aria-pressed', 'false');
    el.addEventListener('click', (e) => { if (!e.target.closest('a, button')) virar(); });
    el.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { virar(); e.preventDefault(); } });
  }
  return { virar };
}
