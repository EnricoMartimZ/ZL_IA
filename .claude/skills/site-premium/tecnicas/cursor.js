// Cursor — o mouse entra no mundo da marca, sem tirar o cursor do sistema (ele nunca some):
//   cursor()  um rótulo acompanha o ponteiro e diz o que o clique faz ("Ver a peça", "Arraste",
//             "Limpar"), e os botões marcados puxam o ponteiro como ímã.
//   rastro()  fotos nascem no caminho do mouse e somem atrás dele. Portfólio, obras, pratos.
//   lupa()    segurar pra ampliar: uma lente mostra a foto em tamanho grande onde o dedo está.
//
// <a data-cursor="Ver a peça" data-ima href="…">…</a>      rótulo + ímã
// <div data-cursor="Arraste" data-cursor-forma="mao">…</div>   a forma vira classe (.cursor.mao) pro CSS do site
// import { cursor, rastro, lupa } from './tecnicas/cursor.js';
// cursor();
// rastro(document.querySelector('#obras'), ['img/o1.webp', 'img/o2.webp', …]);
// lupa(document.querySelector('#produto'));                 // <figure id="produto"><img src data-grande="…"></figure>
//
// cursor() e rastro() só existem com mouse (hover: hover) e sem "reduzir movimento": no celular não
// acontece nada, então nenhuma informação pode morar só no rótulo. lupa() funciona com o dedo
// (segurar 160 ms e arrastar).
// Vistos na categoria "cursor" do 21st.dev (intent label, image trail, magnetic) e no hero de tênis
// de Kedhareswer Naidu (hold to zoom); o código é daqui.

import { limitar, semMovimento } from './palco.js';
import { laco, mola } from './fisica.js';

const temMouse = () => matchMedia('(hover: hover) and (pointer: fine)').matches;

export function cursor(opcoes = {}) {
  const o = { ima: '[data-ima]', forca: 0.3, ...opcoes };
  if (!temMouse() || semMovimento()) return null;
  const el = document.createElement('div');
  el.className = 'cursor';
  el.setAttribute('aria-hidden', 'true');
  el.innerHTML = '<span class="cursor-rotulo"></span>';
  document.body.append(el);
  const rotulo = el.firstChild;
  let x = -200, y = -200, vx = 0, vy = 0, ax = -200, ay = -200, sobre = null, puxado = null;

  const acordar = laco(document.body, {
    passo(h) {
      [x, vx] = mola(x, vx, ax, 14, h);
      [y, vy] = mola(y, vy, ay, 14, h);
      return Math.abs(ax - x) + Math.abs(ay - y) > 0.1;
    },
    desenhar() { el.style.transform = `translate(${x.toFixed(1)}px, ${y.toFixed(1)}px)`; },
  });
  addEventListener('pointermove', (e) => {
    if (e.pointerType !== 'mouse') return;
    if (ax < -100) { x = e.clientX; y = e.clientY; }           // primeira vez: nasce no lugar, não voa do canto
    ax = e.clientX; ay = e.clientY;
    const alvo = e.target.closest?.('[data-cursor]') || null;
    if (alvo !== sobre) {
      sobre = alvo;
      el.className = `cursor${alvo ? ' com-rotulo' : ''}${alvo?.dataset.cursorForma ? ` ${alvo.dataset.cursorForma}` : ''}`;
      if (alvo) rotulo.textContent = alvo.dataset.cursor;
    }
    const ima = e.target.closest?.(o.ima) || null;
    if (puxado && puxado !== ima) { puxado.style.translate = ''; puxado = null; }
    if (ima) {
      const r = ima.getBoundingClientRect();
      const dx = e.clientX - (r.left + r.width / 2), dy = e.clientY - (r.top + r.height / 2);
      // o retângulo já inclui o deslocamento: descontar pra não tremer
      const [tx, ty] = (ima.style.translate || '0px 0px').split(' ').map(parseFloat);
      ima.style.translate = `${((dx + (tx || 0)) * o.forca).toFixed(1)}px ${((dy + (ty || 0)) * o.forca).toFixed(1)}px`;
      puxado = ima;
    }
    acordar();
  }, { passive: true });
  document.addEventListener('pointerleave', () => { el.classList.remove('com-rotulo'); sobre = null; });
  return el;
}

export function rastro(el, imagens, opcoes = {}) {
  const o = { passo: 110, quantas: 7, ...opcoes };
  if (!temMouse() || semMovimento() || !imagens?.length) return;
  el.classList.add('rastro');
  const fila = Array.from({ length: o.quantas }, () => {
    const img = new Image();
    img.className = 'rastro-foto';
    img.alt = '';
    img.setAttribute('aria-hidden', 'true');
    el.append(img);
    return img;
  });
  let px = null, py = 0, andou = 0, vez = 0, altura = 1;
  el.addEventListener('pointermove', (e) => {
    if (e.pointerType !== 'mouse') return;
    if (px !== null) andou += Math.hypot(e.clientX - px, e.clientY - py);
    px = e.clientX; py = e.clientY;
    if (andou < o.passo) return;
    andou = 0;
    const r = el.getBoundingClientRect();
    const img = fila[vez % fila.length];
    img.src = imagens[vez % imagens.length];
    vez++;
    img.style.left = `${e.clientX - r.left}px`;
    img.style.top = `${e.clientY - r.top}px`;
    img.style.zIndex = String(++altura);
    img.animate([
      { opacity: 0, transform: `translate(-50%, -50%) scale(.6) rotate(${(Math.random() * 16 - 8).toFixed(1)}deg)` },
      { opacity: 1, transform: 'translate(-50%, -50%) scale(1)', offset: 0.18 },
      { opacity: 1, transform: 'translate(-50%, -50%) scale(1)', offset: 0.6 },
      { opacity: 0, transform: 'translate(-50%, -42%) scale(.92)' },
    ], { duration: 1100, easing: 'cubic-bezier(.2,.7,.1,1)', fill: 'both' });
  }, { passive: true });
  el.addEventListener('pointerleave', () => { px = null; });
}

export function lupa(el, opcoes = {}) {
  const o = { zoom: 2.4, ...opcoes };
  const img = el.querySelector('img');
  if (!img) return;
  el.classList.add('lupa');
  const lente = document.createElement('span');
  lente.className = 'lupa-lente';
  lente.setAttribute('aria-hidden', 'true');
  el.append(lente);
  let ativa = false, espera = 0, x0 = 0, y0 = 0;

  function mover(e) {
    const r = img.getBoundingClientRect();
    const lado = lente.offsetWidth;
    const x = limitar((e.clientX - r.left) / r.width), y = limitar((e.clientY - r.top) / r.height);
    lente.style.left = `${e.clientX - el.getBoundingClientRect().left}px`;
    lente.style.top = `${e.clientY - el.getBoundingClientRect().top}px`;
    lente.style.backgroundSize = `${r.width * o.zoom}px ${r.height * o.zoom}px`;
    lente.style.backgroundPosition = `${-(x * r.width * o.zoom - lado / 2)}px ${-(y * r.height * o.zoom - lado / 2)}px`;
  }
  function ligar(e) {
    ativa = true;
    lente.style.backgroundImage = `url("${img.dataset.grande || img.currentSrc || img.src}")`;
    el.classList.add('ampliando');
    mover(e);
  }
  function desligar() { clearTimeout(espera); ativa = false; el.classList.remove('ampliando'); }

  el.addEventListener('pointerdown', (e) => {
    x0 = e.clientX; y0 = e.clientY;
    if (e.pointerType === 'mouse') { ligar(e); el.setPointerCapture(e.pointerId); }
    else espera = setTimeout(() => ligar(e), 160);          // toque: quem só quer rolar a página não liga a lente
  });
  el.addEventListener('pointermove', (e) => {
    if (ativa) mover(e);
    else if (Math.hypot(e.clientX - x0, e.clientY - y0) > 8) clearTimeout(espera);
  });
  el.addEventListener('touchmove', (e) => { if (ativa) e.preventDefault(); }, { passive: false });
  el.addEventListener('pointerup', desligar);
  el.addEventListener('pointercancel', desligar);
  el.addEventListener('contextmenu', (e) => { if (ativa) e.preventDefault(); });
}
