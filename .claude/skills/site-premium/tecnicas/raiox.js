// Raio-X — a foto do produto ou do equipamento por fora; uma lente que segue o mouse (ou o dedo)
// mostra por dentro, e pontos "+" abrem fichas técnicas. Um botão liga o raio-X na tela toda.
// Serve pra quem vende o que não se vê: ar-condicionado (serpentina, filtro), máquinas, motores,
// fechaduras, painéis elétricos, colchões, calçados, eletrônicos, carro (funilaria × mecânica).
//
// import { raiox } from './tecnicas/raiox.js';
// raiox(document.querySelector('#produto'), {
//   fora: 'img/split-fora.webp', dentro: 'img/split-dentro.webp',   // MESMO enquadramento nas duas
//   pontos: [{ x: 32, y: 40, titulo: 'Filtro', texto: 'Higienizado a cada visita' }],  // x/y em % da imagem
// });
// Com palco: raiox(..., { rolagem: true }) e palco(secao, r.progresso) abre o raio-X com a rolagem.

import { semMovimento } from './palco.js';

export function raiox(quadro, opcoes = {}) {
  const o = { raio: 150, rotulo: 'Raio-X', pontos: [], rolagem: false, ...opcoes };
  quadro.classList.add('raiox');
  quadro.innerHTML = `
    <img class="raiox-fora" src="${o.fora}" alt="${o.alt || ''}">
    <img class="raiox-dentro" src="${o.dentro}" alt="" aria-hidden="true">
    <div class="raiox-varredura" aria-hidden="true"></div>
    <button class="raiox-botao" type="button" aria-pressed="false"><span></span>${o.rotulo}</button>`;
  const dentro = quadro.querySelector('.raiox-dentro');
  const botao = quadro.querySelector('.raiox-botao');
  // o quadro assume a proporção da foto: assim os pontos (% da imagem) caem no lugar certo em qualquer tela
  const fora = quadro.querySelector('.raiox-fora');
  const proporcao = () => {
    if (o.proporcao === false || !fora.naturalWidth) return;
    quadro.style.aspectRatio = `${fora.naturalWidth} / ${fora.naturalHeight}`;
    quadro.style.height = 'auto';
  };
  if (fora.complete) proporcao(); else fora.addEventListener('load', proporcao);

  o.pontos.forEach((pt, i) => {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'raiox-ponto';
    b.style.left = `${pt.x}%`;
    b.style.top = `${pt.y}%`;
    b.setAttribute('aria-label', pt.titulo);
    b.innerHTML = `<span class="raiox-mais">+</span><span class="raiox-ficha"><b>${String(i + 1).padStart(2, '0')} · ${pt.titulo}</b>${pt.texto || ''}</span>`;
    b.addEventListener('click', (e) => {
      e.stopPropagation();
      const aberto = b.classList.toggle('aberto');
      quadro.querySelectorAll('.raiox-ponto.aberto').forEach((x) => x !== b && x.classList.remove('aberto'));
      if (aberto) alvo.x = (pt.x / 100) * quadro.clientWidth, alvo.y = (pt.y / 100) * quadro.clientHeight, alvo.r = Math.max(alvo.r, o.raio);
    });
    quadro.appendChild(b);
  });

  const atual = { x: 0, y: 0, r: 0 };
  const alvo = { x: 0, y: 0, r: 0 };
  let total = false;
  const diagonal = () => Math.hypot(quadro.clientWidth, quadro.clientHeight);

  quadro.addEventListener('pointermove', (e) => {
    const r = quadro.getBoundingClientRect();
    alvo.x = e.clientX - r.left; alvo.y = e.clientY - r.top;
    if (!total && !o.rolagem) alvo.r = o.raio;
  });
  quadro.addEventListener('pointerleave', () => { if (!total && !o.rolagem) alvo.r = 0; });
  botao.addEventListener('click', (e) => {
    e.stopPropagation();
    total = !total;
    botao.setAttribute('aria-pressed', String(total));
    quadro.classList.toggle('raiox-total', total);
    alvo.r = total ? diagonal() : 0;
    if (total) { alvo.x = quadro.clientWidth / 2; alvo.y = quadro.clientHeight / 2; }
  });

  const parado = semMovimento();
  function desenhar() {
    requestAnimationFrame(desenhar);
    const k = parado ? 1 : 0.14;
    for (const c of ['x', 'y', 'r']) atual[c] += (alvo[c] - atual[c]) * k;
    dentro.style.clipPath = `circle(${atual.r.toFixed(1)}px at ${atual.x.toFixed(1)}px ${atual.y.toFixed(1)}px)`;
    quadro.style.setProperty('--lx', `${atual.x}px`);
    quadro.style.setProperty('--ly', `${atual.y}px`);
    quadro.style.setProperty('--lr', `${atual.r}px`);
  }
  requestAnimationFrame(desenhar);

  return {
    progresso(p) {
      if (!o.rolagem || total) return;
      alvo.x = quadro.clientWidth / 2; alvo.y = quadro.clientHeight / 2;
      alvo.r = p * diagonal() * 0.55;
    },
  };
}
