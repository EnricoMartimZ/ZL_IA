// Vinhetas — uma página de quadrinhos lida pela rolagem: a câmera vai de vinheta em vinheta, cada uma
// se abre e os balões entram; no fim ela se afasta e mostra a página inteira. A marca vira personagem.
// Serve pra cerveja artesanal, hamburgueria, bar, sorveteria, escola, brinquedos, pet, qualquer
// marca com humor e uma história boa de contar. A arte é da marca ou gerada por IA (rotular).
//
// <section class="palco" data-telas="7">
//   <div class="palco-quadro" id="hq">
//     <div class="hq-pagina" data-pagina>                  ← largura e grade definidas no CSS do site
//       <figure data-vinheta data-de="esquerda"><img …><p class="hq-balao">Fala</p></figure>
//       <figure data-vinheta data-de="cima">…</figure>
//     </div>
//   </div>
// </section>
//
// import { vinhetas } from './tecnicas/vinhetas.js';
// palco(secao, vinhetas(document.querySelector('#hq')).progresso);
//
// data-de: esquerda | direita | cima | baixo (de onde a vinheta se abre).

import { local, suave } from './palco.js';

const lerp = (a, b, t) => a + (b - a) * t;

export function vinhetas(quadro, opcoes = {}) {
  const o = { folga: 0.92, fim: 0.86, ...opcoes };
  const pagina = quadro.querySelector('[data-pagina]');
  const quadros = [...pagina.querySelectorAll('[data-vinheta]')];
  quadro.classList.add('hq');
  quadros.forEach((v) => v.classList.add(`hq-de-${v.dataset.de || 'esquerda'}`));

  let W = 1, H = 1, cams = [], geral = { x: 0, y: 0, s: 1 };
  const enquadrar = (x, y, w, h) => {
    const s = Math.min(W / w, H / h) * o.folga;
    return { x: W / 2 - (x + w / 2) * s, y: H / 2 - (y + h / 2) * s, s };
  };
  function medir() {
    W = quadro.clientWidth; H = quadro.clientHeight;
    cams = quadros.map((v) => enquadrar(v.offsetLeft, v.offsetTop, v.offsetWidth, v.offsetHeight));
    geral = enquadrar(0, 0, pagina.offsetWidth, pagina.offsetHeight);
  }
  new ResizeObserver(() => { medir(); aplicar(ultimo); }).observe(quadro);
  medir();

  let ultimo = 0;
  function aplicar(p) {
    ultimo = p;
    const n = quadros.length;
    const t = local(p, 0, o.fim) * n;
    const i = Math.min(Math.floor(t), n - 1);
    const f = t - i;
    const mov = i < n - 1 ? suave(local(f, 0.62, 1)) : 0;
    const a = cams[i], b = cams[Math.min(i + 1, n - 1)];
    const fora = suave(local(p, o.fim, 1));
    const cam = {
      x: lerp(lerp(a.x, b.x, mov), geral.x, fora),
      y: lerp(lerp(a.y, b.y, mov), geral.y, fora),
      s: lerp(lerp(a.s, b.s, mov), geral.s, fora),
    };
    pagina.style.transform = `translate(${cam.x.toFixed(2)}px, ${cam.y.toFixed(2)}px) scale(${cam.s.toFixed(4)})`;
    quadro.classList.toggle('hq-guiada', fora < 0.5); // lendo uma vinheta, as vizinhas apagam
    quadros.forEach((v, j) => {
      v.classList.toggle('foco', j === i + (mov > 0.5 ? 1 : 0));
      v.classList.toggle('aberta', j <= i || (j === i + 1 && f > 0.5)); // abre antes de a câmera chegar nela
      v.classList.toggle('falou', j < i || (j === i && f > 0.22));
      v.style.setProperty('--dentro', (j < i ? 1 : j === i ? f : 0).toFixed(3));
    });
  }
  aplicar(0);

  return { progresso: aplicar };
}
