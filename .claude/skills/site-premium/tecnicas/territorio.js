// Território — um mapa que o visitante explora: arrasta, aproxima e toca nos pontos. O site deixa de ser
// lista e vira lugar. Serve pra loteamento (cada lote com seu estado), condomínio, rede de lojas,
// fazenda, turismo, escola, área de atendimento, obras entregues na cidade.
//
// import { territorio } from './tecnicas/territorio.js';
// const t = territorio(document.querySelector('#mapa'), {
//   mapa: 'img/planta.webp',           // imagem, ou um '<svg>…</svg>' escrito direto
//   largura: 2400, altura: 1600,       // tamanho do mundo em px
//   inicio: { x: 50, y: 45, zoom: 1.3 },
//   pontos: [{ id: 'q1', x: 32, y: 41, titulo: 'Quadra 1', texto: '12 lotes de 250 m²', classe: 'livre', link: { href: '…', rotulo: 'Quero este' } }],
// });
// Com palco: palco(secao, t.progresso) vira um passeio de ponto em ponto conforme a rolagem.
//
// O quadro precisa de altura definida e, no celular, deve deixar uma faixa da página de fora
// (78svh, por exemplo): o dedo em cima do mapa move o mapa, não a página.

import { limitar, quandoVisivel, semMovimento } from './palco.js';

export function territorio(quadro, opcoes = {}) {
  const o = { mapa: '', largura: 2400, altura: 1600, pontos: [], zoomMax: 4, zoomPasseio: 2, inicio: null, roda: false, aoAbrir: () => {}, ...opcoes };
  quadro.classList.add('territorio');
  quadro.innerHTML = `
    <div class="terr-mundo"></div>
    <div class="terr-botoes"><button type="button" aria-label="Aproximar">+</button><button type="button" aria-label="Afastar">−</button></div>
    <aside class="terr-ficha" aria-live="polite" hidden></aside>`;
  const mundo = quadro.querySelector('.terr-mundo');
  const ficha = quadro.querySelector('.terr-ficha');
  mundo.style.width = `${o.largura}px`;
  mundo.style.height = `${o.altura}px`;
  if (o.mapa.trim().startsWith('<')) mundo.innerHTML = o.mapa;
  else mundo.innerHTML = `<img src="${o.mapa}" alt="${o.alt || ''}" draggable="false">`;

  const cam = { x: o.largura / 2, y: o.altura / 2, s: 1 };
  const alvo = { ...cam };
  let W = 1, H = 1, minimo = 1;
  const parado = semMovimento();

  function prender() {
    alvo.s = limitar(alvo.s, minimo, o.zoomMax);
    const mx = W / 2 / alvo.s, my = H / 2 / alvo.s;
    alvo.x = limitar(alvo.x, mx, o.largura - mx);
    alvo.y = limitar(alvo.y, my, o.altura - my);
  }
  function medir() {
    W = quadro.clientWidth; H = quadro.clientHeight;
    minimo = Math.max(W / o.largura, H / o.altura);
    prender();
  }
  new ResizeObserver(medir).observe(quadro);
  medir();
  if (o.inicio) { alvo.x = o.inicio.x / 100 * o.largura; alvo.y = o.inicio.y / 100 * o.altura; alvo.s = minimo * (o.inicio.zoom || 1); prender(); }
  Object.assign(cam, alvo);

  function abrir(pt) {
    ficha.hidden = false;
    ficha.innerHTML = `<button class="terr-fechar" type="button" aria-label="Fechar">×</button><b>${pt.titulo}</b>${pt.texto ? `<p>${pt.texto}</p>` : ''}${pt.link ? `<a href="${pt.link.href}">${pt.link.rotulo}</a>` : ''}`;
    ficha.querySelector('.terr-fechar').addEventListener('click', fechar);
    quadro.querySelectorAll('.terr-ponto.aberto').forEach((b) => b.classList.remove('aberto'));
    quadro.querySelector(`[data-ponto="${pt.id}"]`)?.classList.add('aberto');
    o.aoAbrir(pt);
  }
  function fechar() {
    ficha.hidden = true;
    quadro.querySelectorAll('.terr-ponto.aberto').forEach((b) => b.classList.remove('aberto'));
  }
  function irPara(id, zoom = o.zoomPasseio) {
    const pt = o.pontos.find((x) => x.id === id);
    if (!pt) return;
    alvo.x = pt.x / 100 * o.largura;
    alvo.y = pt.y / 100 * o.altura;
    alvo.s = Math.max(alvo.s, minimo * zoom);
    prender();
    abrir(pt);
  }

  o.pontos.forEach((pt) => {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = `terr-ponto ${pt.classe || ''}`;
    b.dataset.ponto = pt.id;
    b.style.left = `${pt.x}%`;
    b.style.top = `${pt.y}%`;
    b.setAttribute('aria-label', pt.titulo);
    b.innerHTML = `<i></i><span>${pt.titulo}</span>`;
    b.addEventListener('click', () => irPara(pt.id));
    mundo.appendChild(b);
  });

  // arrastar: um dedo move, dois aproximam; só prende o ponteiro depois de andar, senão o toque no ponto vira arrasto
  const dedos = new Map();
  let vel = { x: 0, y: 0 }, moveu = 0, distancia = 0;
  quadro.addEventListener('pointerdown', (e) => {
    if (e.target.closest('.terr-botoes, .terr-ficha')) return;
    dedos.set(e.pointerId, { x: e.clientX, y: e.clientY });
    moveu = 0; vel = { x: 0, y: 0 };
    if (dedos.size === 2) { const [a, b] = [...dedos.values()]; distancia = Math.hypot(a.x - b.x, a.y - b.y); }
  });
  quadro.addEventListener('pointermove', (e) => {
    const d = dedos.get(e.pointerId);
    if (!d) return;
    const dx = e.clientX - d.x, dy = e.clientY - d.y;
    d.x = e.clientX; d.y = e.clientY;
    if (dedos.size === 2) {
      const [a, b] = [...dedos.values()];
      const nova = Math.hypot(a.x - b.x, a.y - b.y);
      alvo.s *= nova / (distancia || nova);
      distancia = nova;
    } else {
      moveu += Math.abs(dx) + Math.abs(dy);
      if (moveu > 6 && !quadro.hasPointerCapture(e.pointerId)) { quadro.setPointerCapture(e.pointerId); quadro.classList.add('arrastando'); }
      alvo.x -= dx / alvo.s; alvo.y -= dy / alvo.s;
      vel = { x: -dx / alvo.s, y: -dy / alvo.s };
    }
    prender();
  });
  const soltar = (e) => { dedos.delete(e.pointerId); if (!dedos.size) quadro.classList.remove('arrastando'); };
  quadro.addEventListener('pointerup', soltar);
  quadro.addEventListener('pointercancel', soltar);

  quadro.addEventListener('wheel', (e) => {
    if (!o.roda && !e.ctrlKey) return; // a rodinha continua rolando a página; pinça no trackpad vem como ctrlKey
    e.preventDefault();
    alvo.s *= Math.exp(-e.deltaY * 0.0016);
    prender();
  }, { passive: false });
  const [mais, menos] = quadro.querySelectorAll('.terr-botoes button');
  mais.addEventListener('click', () => { alvo.s *= 1.5; prender(); });
  menos.addEventListener('click', () => { alvo.s /= 1.5; prender(); });

  let vivo = true, id = 0;
  function desenhar() {
    if (!vivo) return;
    id = requestAnimationFrame(desenhar);
    if (!dedos.size && !parado) {
      alvo.x += vel.x; alvo.y += vel.y;
      vel.x *= 0.92; vel.y *= 0.92;
      if (Math.abs(vel.x) + Math.abs(vel.y) > 0.01) prender();
    }
    const k = parado ? 1 : 0.15;
    cam.x += (alvo.x - cam.x) * k; cam.y += (alvo.y - cam.y) * k; cam.s += (alvo.s - cam.s) * k;
    mundo.style.transform = `translate(${(W / 2 - cam.x * cam.s).toFixed(2)}px, ${(H / 2 - cam.y * cam.s).toFixed(2)}px) scale(${cam.s.toFixed(4)})`;
    mundo.style.setProperty('--s', cam.s.toFixed(4));
  }
  id = requestAnimationFrame(desenhar);
  quandoVisivel(quadro, (v) => {
    if (v && !vivo) { vivo = true; id = requestAnimationFrame(desenhar); }
    if (!v) { vivo = false; cancelAnimationFrame(id); }
  });

  let aberto = -1;
  return {
    irPara,
    fechar,
    progresso(p) {
      const n = o.pontos.length;
      if (n < 2) return;
      const t = p * (n - 1), i = Math.min(Math.floor(t), n - 2), f = t - i;
      const a = o.pontos[i], b = o.pontos[i + 1];
      alvo.x = (a.x + (b.x - a.x) * f) / 100 * o.largura;
      alvo.y = (a.y + (b.y - a.y) * f) / 100 * o.altura;
      alvo.s = minimo * o.zoomPasseio;
      prender();
      const perto = Math.round(t);
      if (perto !== aberto && Math.abs(t - perto) < 0.18) { aberto = perto; abrir(o.pontos[perto]); }
    },
  };
}
