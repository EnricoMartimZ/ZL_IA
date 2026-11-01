// Varal — objetos pendurados que balançam quando o visitante arrasta o trilho ou passa a mão:
// luminárias que acendem, quadros na parede, crachás da equipe que viram, fotos num barbante,
// roupas na arara, ferramentas no painel. O que a loja vende vira a própria navegação.
//
// <div id="lojas">
//   <figure data-nome="Pendente de vidro" data-preco="R$ 210">…desenho ou foto do objeto…</figure>
// </div>
//
// import { varal } from './tecnicas/varal.js';
// varal(document.querySelector('#lojas'), {
//   forma: 'trilho',                         // 'trilho' reto, ou 'corda' que cede no meio
//   acender: true,                           // passar a mão liga (.aceso): a luminária brilha
//   virar: false,                            // tocar vira o objeto (.virado): crachá, cartão, etiqueta
//   aoAtivar: (el, i) => mostrarNome(el),
// });
//
// Cada objeto gira a partir do alto (transform-origin no gancho). A corda precisa de `queda`, em
// fração da altura do quadro. Reduzir movimento mantém o arrasto e tira o balanço.

import { limitar, semMovimento } from './palco.js';
import { laco, balanco, arremesso } from './fisica.js';

export function varal(quadro, opcoes = {}) {
  const o = { forma: 'trilho', queda: 0.07, acender: false, virar: false, aoAtivar: () => {}, ...opcoes };
  quadro.classList.add('varal', `varal-${o.forma}`);
  const itens = [...quadro.children];
  const fita = document.createElement('div');
  fita.className = 'varal-fita';
  itens.forEach((it, i) => {
    it.classList.add('varal-item');
    it.tabIndex = 0;
    if (!it.hasAttribute('role')) it.setAttribute('role', 'button');
    it.setAttribute('aria-label', it.dataset.nome || `Item ${i + 1}`);
    it.dataset.i = i;
    fita.append(it);
  });
  const linha = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  linha.classList.add('varal-linha');
  linha.setAttribute('aria-hidden', 'true');
  quadro.append(linha, fita);

  const parado = semMovimento();
  const ang = itens.map(() => 0), vel = itens.map(() => 0);
  const dedo = arremesso();
  let x = 0, vx = 0, vAntes = 0, W = 1, H = 1, max = 0, centrar = 0, ativo = -1, toque = null, cruzou = -1;

  function cordaY(xTela) {
    if (o.forma !== 'corda') return 0;
    const t = xTela / W * 2 - 1;
    return o.queda * H * (1 - t * t);
  }
  function cordaInclina(xTela) {
    if (o.forma !== 'corda') return 0;
    const t = xTela / W * 2 - 1;
    return Math.atan2(-2 * t * (2 / W) * o.queda * H, 1) * 180 / Math.PI;
  }

  function medir() {
    W = quadro.clientWidth; H = quadro.clientHeight;
    max = Math.max(0, fita.scrollWidth - W);
    centrar = max ? 0 : (W - fita.scrollWidth) / 2;
    x = limitar(x, 0, max);
    linha.setAttribute('viewBox', `0 0 ${W} ${Math.max(H, 1)}`);
    if (o.forma === 'corda') {
      linha.innerHTML = `<path d="M0 0 Q${W / 2} ${2 * o.queda * H} ${W} 0" fill="none"/>`;
    }
    pintar();
  }

  function pintar() {
    fita.style.transform = `translate3d(${(centrar - x).toFixed(2)}px, 0, 0)`;
    itens.forEach((it, i) => {
      const meio = centrar - x + it.offsetLeft + it.offsetWidth / 2;
      it.style.transform = `translateY(${cordaY(meio).toFixed(2)}px) rotate(${(ang[i] + cordaInclina(meio) * 0.5).toFixed(3)}deg)`;
    });
  }

  const acordar = laco(quadro, {
    passo(h) {
      if (!toque?.moveu) {
        x += vx * h;
        vx *= Math.exp(-2.6 * h);
        if (x < 0) { x = 0; vx = 0; } else if (x > max) { x = max; vx = 0; }
        if (Math.abs(vx) < 1) vx = 0;
      }
      // o trilho acelerando empurra cada objeto pro lado contrário, como um cabide no ônibus
      const a = (vx - vAntes) / h;
      vAntes = vx;
      let ocupado = vx !== 0;
      itens.forEach((_, i) => {
        if (parado) { ang[i] = 0; vel[i] = 0; return; }
        vel[i] += a * 0.012 * h;
        [ang[i], vel[i]] = balanco(ang[i], vel[i], 0, 42, 2.4, h);
        if (Math.abs(ang[i]) > 0.02 || Math.abs(vel[i]) > 0.05) ocupado = true;
        else { ang[i] = 0; vel[i] = 0; }
      });
      return ocupado;
    },
    desenhar: pintar,
  });
  new ResizeObserver(medir).observe(quadro);
  medir();

  function ativar(i) {
    if (i === ativo) return;
    ativo = i;
    itens.forEach((it, j) => {
      it.classList.toggle('ativo', j === i);
      if (o.acender) it.classList.toggle('aceso', j === i);
    });
    if (i >= 0) o.aoAtivar(itens[i], i);
  }
  function empurrar(i, forca) {
    vel[i] += limitar(forca, -60, 60);
    acordar();
  }

  quadro.addEventListener('pointerdown', (e) => {
    toque = { id: e.pointerId, x0: e.clientX, y0: e.clientY, x: x, moveu: false, alvo: e.target.closest('.varal-item') };
    dedo.inicio(e.clientX, e.timeStamp);
    vx = 0; vAntes = 0;
  });
  quadro.addEventListener('pointermove', (e) => {
    if (toque && toque.id === e.pointerId) {
      const dx = e.clientX - toque.x0;
      if (!toque.moveu && Math.abs(dx) > 6 && Math.abs(dx) > Math.abs(e.clientY - toque.y0)) {
        toque.moveu = true;
        quadro.setPointerCapture(e.pointerId);
        quadro.classList.add('arrastando');
      }
      if (toque.moveu) {
        const antes = x;
        x = limitar(toque.x - dx, 0, max);
        const v = dedo.mover(e.clientX, e.timeStamp);
        // arrastar balança todo mundo; o peso vem do quanto o trilho andou neste quadro
        itens.forEach((_, i) => { vel[i] += (x - antes) * 0.5; });
        vx = -v;
        pintar();
        acordar();
      }
      return;
    }
    if (e.pointerType !== 'mouse') return;
    const it = e.target.closest('.varal-item');
    if (!it) { cruzou = -1; return; }
    const i = Number(it.dataset.i);
    if (i !== cruzou) { cruzou = i; empurrar(i, e.movementX * 0.9); }
    ativar(i);
  });
  function soltar(e) {
    if (!toque || toque.id !== e.pointerId) return;
    const t = toque;
    toque = null;
    quadro.classList.remove('arrastando');
    if (t.moveu) {
      vx = parado ? 0 : limitar(-dedo.soltar(e.timeStamp), -2400, 2400);
      acordar();
      return;
    }
    if (t.alvo) tocar(t.alvo);
  }
  function tocar(it) {
    const i = Number(it.dataset.i);
    ativar(i);
    empurrar(i, 18);
    if (o.virar) it.classList.toggle('virado');
  }
  quadro.addEventListener('pointerup', soltar);
  quadro.addEventListener('pointercancel', (e) => { if (toque?.id === e.pointerId) { toque = null; quadro.classList.remove('arrastando'); } });
  quadro.addEventListener('pointerleave', (e) => { if (e.pointerType === 'mouse' && !toque) { cruzou = -1; if (o.acender) ativar(-1); } });
  quadro.addEventListener('keydown', (e) => {
    const it = e.target.closest('.varal-item');
    if (!it) return;
    const i = Number(it.dataset.i);
    const d = { ArrowRight: 1, ArrowLeft: -1 }[e.key];
    if (d) { e.preventDefault(); itens[limitar(i + d, 0, itens.length - 1)].focus(); }
    if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); tocar(it); }
  });
  // foco de teclado traz o objeto pra tela
  quadro.addEventListener('focusin', (e) => {
    const it = e.target.closest('.varal-item');
    if (!it) return;
    quadro.scrollLeft = 0;
    x = limitar(it.offsetLeft + it.offsetWidth / 2 - W / 2, 0, max);
    ativar(Number(it.dataset.i));
    pintar();
  });

  return { ativar, medir };
}
