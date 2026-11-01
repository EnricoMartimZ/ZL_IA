// Placar — dois mostradores mecânicos, pros números e avisos terem peso de máquina:
//   odometro()  tambores numerados: só o último gira e os outros vão no vácuo, como no carro.
//               1.099 → 1.100 rola três tambores de uma vez. Km rodados, obras, entregas, clientes.
//   palhetas()  quadro de aeroporto: cada letra passa pelo alfabeto até parar. Rotas, horários,
//               saídas do dia, ofertas. Transportadora, rodoviária, oficina, estacionamento, bar.
//
// import { odometro, palhetas } from './tecnicas/placar.js';
// const km = odometro(document.querySelector('#km'), { valor: 1284, casas: 6 });
// km.definir(1285);
// palhetas(document.querySelector('#rota'), { texto: 'CAMPINAS  14H30', largura: 18 });
//
// Quem lê tela recebe o número final no aria-label. Reduzir movimento troca sem animar.
// Ideia dos tambores vista no Mechanical Odometer, de Ciprian Titire (21st.dev); o código é daqui.

import { semMovimento, quandoVisivel } from './palco.js';
import { laco, mola } from './fisica.js';

export function odometro(el, opcoes = {}) {
  const o = { valor: 0, casas: 6, de: 0, separar: true, ...opcoes };
  el.classList.add('odometro');
  const casas = Math.max(o.casas, String(Math.floor(o.valor)).length);
  el.innerHTML = Array.from({ length: casas }, (_, i) => {
    const p = casas - 1 - i;
    const ponto = o.separar && p > 0 && p % 3 === 0 ? '<i class="odo-ponto">.</i>' : '';
    return `<span class="odo-tambor" aria-hidden="true"><span class="odo-fita">${[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 0].map((d) => `<b>${d}</b>`).join('')}</span></span>${ponto}`;
  }).join('');
  const fitas = [...el.querySelectorAll('.odo-fita')].reverse();
  const parado = semMovimento();
  let x = o.de, v = 0, alvo = o.valor;

  function pintar() {
    let vaiUm = 0;
    fitas.forEach((f, p) => {
      const pot = 10 ** p;
      const inteiro = Math.floor(x / pot) % 10;
      // o tambor de baixo arrasta o de cima só no último décimo da volta, como a engrenagem real
      const resto = (x % pot) / pot;
      vaiUm = p === 0 ? (x % 1) : Math.max(0, (resto - 0.9) * 10);
      f.style.transform = `translateY(${(-(inteiro + vaiUm) * 100 / 11).toFixed(3)}%)`;
    });
  }
  const acordar = laco(el, {
    passo(h) {
      [x, v] = mola(x, v, alvo, 2.6, h);
      if (Math.abs(alvo - x) < 0.002 && Math.abs(v) < 0.01) { x = alvo; v = 0; return false; }
      return true;
    },
    desenhar: pintar,
  });
  function definir(n) {
    alvo = n;
    el.setAttribute('aria-label', n.toLocaleString('pt-BR'));
    if (parado) { x = n; pintar(); return; }
    acordar();
  }
  el.setAttribute('role', 'img');
  pintar();
  let chegou = false;
  // começa a contar quando entra na tela, que é quando alguém vê
  quandoVisivel(el, (visivel) => { if (visivel && !chegou) { chegou = true; definir(o.valor); } });
  el.setAttribute('aria-label', o.valor.toLocaleString('pt-BR'));
  return { definir };
}

const ALFABETO = ' ABCDEFGHIJKLMNOPQRSTUVWXYZÇÃÕÉÁÍÓÚ0123456789:.,-/';

export function palhetas(el, opcoes = {}) {
  const o = { texto: '', largura: null, passo: 55, ...opcoes };
  const n = o.largura ?? o.texto.length;
  el.classList.add('palhetas');
  el.setAttribute('role', 'img');
  el.innerHTML = Array.from({ length: n }, () => '<span class="pa" aria-hidden="true"><b> </b><i></i></span>').join('');
  const cel = [...el.children].map((c) => ({ el: c, letra: c.firstElementChild, aba: c.lastElementChild, atual: ' ' }));
  const parado = semMovimento();
  let id = 0;

  function trocar(c, novo) {
    c.aba.textContent = c.atual;
    c.el.classList.remove('vira');
    void c.el.offsetWidth;
    c.el.classList.add('vira');
    c.letra.textContent = novo;
    c.atual = novo;
  }
  function definir(texto) {
    const t = texto.toUpperCase().padEnd(n, ' ').slice(0, n);
    el.setAttribute('aria-label', texto);
    if (parado) { cel.forEach((c, i) => { c.letra.textContent = t[i]; c.atual = t[i]; }); return; }
    const meu = ++id;
    cel.forEach((c, i) => {
      const fim = ALFABETO.includes(t[i]) ? t[i] : ' ';
      // cada coluna parte num instante diferente: é isso que dá o som visual de cascata
      setTimeout(function gira() {
        if (meu !== id || c.atual === fim) return;
        const prox = ALFABETO[(ALFABETO.indexOf(c.atual) + 1) % ALFABETO.length];
        trocar(c, prox);
        setTimeout(gira, o.passo);
      }, i * 34);
    });
  }
  quandoVisivel(el, (v) => { if (v && !el.dataset.foi) { el.dataset.foi = '1'; definir(o.texto); } });
  el.setAttribute('aria-label', o.texto);
  return { definir };
}
