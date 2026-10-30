// Arrastar — duas formas de pôr as coisas na mão do visitante:
//   faixa()  fileira horizontal com inércia: obras, cases, cardápio, modelos, depoimentos
//   mesa()   objetos soltos sobre um fundo, que dá pra pegar e mover: fotos, amostras, cartões, receitas
//
// import { faixa, mesa } from './tecnicas/arrastar.js';
// const f = faixa(document.querySelector('#obras'));   // cada filho é um cartão
// palco(secao, f.progresso);                           // opcional: a rolagem também anda a fileira
// mesa(document.querySelector('#album'));              // data-x, data-y (%) e data-r (graus) fixam a posição
//
// Na mesa, o dedo em cima de um objeto move o objeto: deixar espaço entre eles pra página rolar.

import { limitar, quandoVisivel, semMovimento } from './palco.js';

export function faixa(el, opcoes = {}) {
  const o = { atrito: 0.94, ...opcoes };
  el.classList.add('faixa');
  const trilho = document.createElement('div');
  trilho.className = 'faixa-trilho';
  trilho.append(...el.children);
  el.append(trilho);
  el.tabIndex = 0;

  const parado = semMovimento();
  let x = 0, alvo = 0, vel = 0, ini = null, ultimo = 0, moveu = 0;
  const maximo = () => Math.max(0, trilho.scrollWidth - el.clientWidth);

  el.addEventListener('pointerdown', (e) => { ini = e.pointerId; ultimo = e.clientX; moveu = 0; vel = 0; });
  el.addEventListener('pointermove', (e) => {
    if (e.pointerId !== ini) return;
    const dx = e.clientX - ultimo;
    ultimo = e.clientX;
    moveu += Math.abs(dx);
    if (moveu > 6 && !el.hasPointerCapture(e.pointerId)) { el.setPointerCapture(e.pointerId); el.classList.add('arrastando'); }
    alvo = limitar(alvo - dx, 0, maximo());
    vel = -dx;
  });
  const soltar = () => { ini = null; el.classList.remove('arrastando'); };
  el.addEventListener('pointerup', soltar);
  el.addEventListener('pointercancel', soltar);
  // arrastar por cima de um link não pode abrir o link
  el.addEventListener('click', (e) => { if (moveu > 6) { e.preventDefault(); e.stopPropagation(); } }, true);
  el.addEventListener('keydown', (e) => {
    const d = { ArrowRight: 1, ArrowLeft: -1 }[e.key];
    if (!d) return;
    e.preventDefault();
    alvo = limitar(alvo + d * el.clientWidth * 0.6, 0, maximo());
  });

  let vivo = true, id = 0;
  function desenhar() {
    if (!vivo) return;
    id = requestAnimationFrame(desenhar);
    if (ini === null && !parado) {
      alvo = limitar(alvo + vel, 0, maximo());
      vel *= o.atrito;
    }
    x += (alvo - x) * (parado ? 1 : 0.16);
    trilho.style.transform = `translate3d(${-x.toFixed(2)}px, 0, 0)`;
    el.style.setProperty('--faixa', (x / (maximo() || 1)).toFixed(4));
  }
  id = requestAnimationFrame(desenhar);
  quandoVisivel(el, (v) => {
    if (v && !vivo) { vivo = true; id = requestAnimationFrame(desenhar); }
    if (!v) { vivo = false; cancelAnimationFrame(id); }
  });

  return { progresso(p) { if (ini === null) { alvo = p * maximo(); vel = 0; } } };
}

export function mesa(el) {
  el.classList.add('mesa');
  const itens = [...el.children];
  let topo = itens.length;
  // sorteio fixo (proporção áurea): a mesa nasce igual em toda visita e em toda largura
  const giro = (i) => ((i * 0.61803398875) % 1) * 2 - 1;
  const lado = Math.ceil(Math.sqrt(itens.length));
  itens.forEach((it, i) => {
    it.classList.add('mesa-item');
    const cx = (i % lado + 0.5) / lado, cy = (Math.floor(i / lado) + 0.5) / Math.ceil(itens.length / lado);
    // clamp: a mesma posição em % não deixa o objeto sair pela borda numa tela estreita
    const meiaL = it.offsetWidth / 2, meiaA = it.offsetHeight / 2;
    it.style.left = `clamp(${meiaL}px, ${it.dataset.x ?? (cx * 100 + giro(i + 3) * 8).toFixed(1)}%, calc(100% - ${meiaL}px))`;
    it.style.top = `clamp(${meiaA}px, ${it.dataset.y ?? (cy * 100 + giro(i + 7) * 8).toFixed(1)}%, calc(100% - ${meiaA}px))`;
    it.dataset.giro = it.dataset.r ?? (giro(i) * 8).toFixed(1);
    it.dataset.dx = 0; it.dataset.dy = 0;
    posicionar(it);

    let antes = null;
    it.addEventListener('pointerdown', (e) => {
      it.setPointerCapture(e.pointerId);
      antes = { x: e.clientX, y: e.clientY };
      it.style.zIndex = ++topo;
      it.classList.add('pega');
    });
    it.addEventListener('pointermove', (e) => {
      if (!antes) return;
      it.dataset.dx = Number(it.dataset.dx) + e.clientX - antes.x;
      it.dataset.dy = Number(it.dataset.dy) + e.clientY - antes.y;
      it.dataset.giro = limitar(Number(it.dataset.giro) + (e.clientX - antes.x) * 0.05, -14, 14);
      antes = { x: e.clientX, y: e.clientY };
      posicionar(it);
    });
    const soltar = () => { antes = null; it.classList.remove('pega'); };
    it.addEventListener('pointerup', soltar);
    it.addEventListener('pointercancel', soltar);
  });

  function posicionar(it) {
    const { dx, dy, giro: g } = it.dataset;
    it.style.transform = `translate(calc(-50% + ${dx}px), calc(-50% + ${dy}px)) rotate(${g}deg)`;
  }
}
