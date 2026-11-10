// Lista viva — a lista do que a empresa faz à esquerda e uma cena à direita que se monta pro item
// apontado: a xícara desliza, o café é servido, a anterior tomba e cai. Cardápio, serviços, linhas de
// produto, planos, etapas. A lista deixa de ser texto e vira demonstração.
//
// <div class="lista" id="servicos">
//   <ul>
//     <li><a data-item href="servico-polimento.html">Polimento <small>a partir de R$ …</small></a></li>
//     <li><a data-item href="servico-vitrificacao.html">Vitrificação</a></li>
//   </ul>
//   <div class="lista-cenas">
//     <figure data-cena>…foto, vídeo curto, SVG animado…</figure>
//     <figure data-cena>…</figure>
//   </div>
// </div>
// import { lista } from './tecnicas/lista.js';
// lista(document.querySelector('#servicos'), { aoTrocar: (i, item, cena) => { … } });
//
// A cena ativa ganha .ativa e a anterior .saindo enquanto sai: a coreografia é CSS do site (a padrão
// entra girando da direita e a antiga cai). Pra servir, encher, acender: animar dentro de
// [data-cena].ativa com animation-delay. Combina com troca.js (aoTrocar → t.ir(i, evento)).
// Mouse: apontar troca. Toque: o primeiro toque escolhe, o segundo segue o link. Teclado: setas.
// No celular a cena vai pra cima da lista (CSS) e continua valendo.
// Mecânica vista no Coffee Pour Menu, de Aakash Mehra (21st.dev); o código é daqui.

export function lista(el, opcoes = {}) {
  const o = { atraso: 90, auto: 0, inicial: 0, aoTrocar: () => {}, ...opcoes };
  el.classList.add('lista');
  const itens = [...el.querySelectorAll('[data-item]')];
  const cenas = [...el.querySelectorAll('[data-cena]')];
  let atual = -1, espera = 0, relogio = 0;

  function ir(i, evento) {
    i = ((i % itens.length) + itens.length) % itens.length;
    if (i === atual) return;
    const antes = atual;
    atual = i;
    itens.forEach((it, j) => { it.classList.toggle('ativo', j === i); if (j === i) it.setAttribute('aria-current', 'true'); else it.removeAttribute('aria-current'); });
    cenas.forEach((c, j) => { c.classList.toggle('ativa', j === i); c.classList.toggle('saindo', j === antes); c.setAttribute('aria-hidden', String(j !== i)); });
    if (antes >= 0 && cenas[antes]) setTimeout(() => { if (atual !== antes) cenas[antes].classList.remove('saindo'); }, 900);
    el.style.setProperty('--lista-i', i);
    o.aoTrocar(i, itens[i], cenas[i], evento);
  }
  const assumir = () => { clearInterval(relogio); relogio = 0; };     // autoplay para de vez quando a pessoa age

  itens.forEach((it, i) => {
    it.addEventListener('pointerenter', (e) => {
      if (e.pointerType !== 'mouse') return;
      clearTimeout(espera);
      espera = setTimeout(() => { assumir(); ir(i, e); }, o.atraso);     // intenção: passar por cima não troca
    });
    it.addEventListener('pointerleave', () => clearTimeout(espera));
    it.addEventListener('focus', () => { assumir(); ir(i); });
    it.addEventListener('click', (e) => { if (atual !== i) { e.preventDefault(); assumir(); ir(i, e); } });
  });
  el.addEventListener('keydown', (e) => {
    const d = e.key === 'ArrowDown' ? 1 : e.key === 'ArrowUp' ? -1 : 0;
    if (!d || !itens.includes(document.activeElement)) return;
    e.preventDefault();
    itens[(atual + d + itens.length) % itens.length].focus();
  });

  ir(o.inicial);
  if (o.auto && !matchMedia('(prefers-reduced-motion: reduce)').matches) relogio = setInterval(() => { if (!document.hidden) ir(atual + 1); }, o.auto);
  return { ir, get atual() { return atual; } };
}
