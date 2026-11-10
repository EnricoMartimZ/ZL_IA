// Medida — o número como espetáculo, pra quem vende especificação, capacidade e prova.
//   numeros()  um número por tela: gigante no centro, rótulo à esquerda, índice à direita e um anel de
//              marcas girando. A rolagem troca o número e ele conta até o valor. O produto (foto, vídeo,
//              3D) fica atrás, no mesmo quadro.
//   regua()    régua de progresso no topo, na unidade do ofício: a página não anda de 0 a 100 %, anda de
//              32 °C a 22 °C, de 0 a 1.200 km, do térreo ao 18º andar, das 5h40 às 19h.
//
// import { numeros, regua } from './tecnicas/medida.js';
// const ficha = numeros(document.querySelector('#quadro'), { itens: [
//   { rotulo: 'Carga de ruptura', valor: 4200, unidade: 'kgf' },
//   { rotulo: 'Tolerância', valor: 0.02, unidade: 'mm', casas: 2 },
// ]});
// palco(secao, ficha.progresso);
// regua(document.querySelector('#regua'), { de: 32, ate: 22, unidade: '°C' });
//
// Número inventado nunca: cada valor vem do catálogo, do laudo ou da placa da máquina.
// Padrão visto num Site do Dia do Awwwards (produto técnico, uma especificação por tela, régua em
// segmentos no topo) e noutro em que a linha do tempo era o campo de jogo, com as jardas.

import { limitar, suave } from './palco.js';

const formatar = (x, casas = 0) => x.toLocaleString('pt-BR', { minimumFractionDigits: casas, maximumFractionDigits: casas });

export function numeros(quadro, opcoes = {}) {
  const o = { itens: [], marcas: 120, ...opcoes };
  const n = o.itens.length;
  const caixa = document.createElement('div');
  caixa.className = 'num';
  caixa.innerHTML = `
    <svg class="num-anel" viewBox="0 0 200 200" aria-hidden="true"><circle cx="100" cy="100" r="97" pathLength="${o.marcas}"/></svg>
    <span class="num-rotulo" aria-hidden="true"></span>
    <span class="num-valor" aria-hidden="true"><b></b><small></small></span>
    <span class="num-indice" aria-hidden="true"></span>
    <p class="num-leitura" aria-live="polite"></p>`;
  quadro.append(caixa);
  const anel = caixa.querySelector('.num-anel');
  const rotulo = caixa.querySelector('.num-rotulo');
  const valor = caixa.querySelector('.num-valor b');
  const unidade = caixa.querySelector('.num-valor small');
  const indice = caixa.querySelector('.num-indice');
  const leitura = caixa.querySelector('.num-leitura');
  let atual = -1;

  function progresso(p) {
    const x = limitar(p, 0, 0.9999) * n;
    const i = Math.floor(x), t = x - i;
    const item = o.itens[i];
    if (!item) return;
    if (i !== atual) {
      atual = i;
      rotulo.textContent = item.rotulo;
      unidade.textContent = item.unidade || '';
      indice.textContent = String(i + 1).padStart(3, '0');
      leitura.textContent = `${item.rotulo}: ${formatar(item.valor, item.casas)} ${item.unidade || ''}`;
    }
    const de = item.de ?? (i > 0 ? o.itens[i - 1].valor : 0);
    valor.textContent = formatar(de + (item.valor - de) * suave(limitar(t / 0.55)), item.casas);
    caixa.style.setProperty('--t', t.toFixed(3));
    anel.style.transform = `rotate(${(p * 200).toFixed(2)}deg)`;
  }
  progresso(0);
  return { progresso, el: caixa };
}

export function regua(el, opcoes = {}) {
  const o = { de: 0, ate: 100, unidade: '%', casas: 0, marcas: 48, pagina: true, formato: null, ...opcoes };
  el.classList.add('regua');
  el.setAttribute('aria-hidden', 'true');           // é enfeite: quem lê tela já tem a barra de rolagem
  el.innerHTML = `<span class="regua-marcas">${'<i></i>'.repeat(o.marcas)}</span><span class="regua-valor"></span>`;
  const marcas = [...el.querySelectorAll('i')];
  const valor = el.querySelector('.regua-valor');
  let cheias = -1;

  function progresso(p) {
    p = limitar(p);
    const c = Math.round(p * o.marcas);
    if (c !== cheias) { marcas.forEach((m, j) => m.classList.toggle('cheia', j < c)); cheias = c; }
    const x = o.de + (o.ate - o.de) * p;
    valor.textContent = o.formato ? o.formato(x, p) : `${formatar(x, o.casas)} ${o.unidade}`;
  }
  if (o.pagina) {
    let raf = 0;
    const medir = () => {
      raf = 0;
      const total = document.documentElement.scrollHeight - innerHeight;
      progresso(total > 0 ? scrollY / total : 0);
    };
    addEventListener('scroll', () => { if (!raf) raf = requestAnimationFrame(medir); }, { passive: true });
    addEventListener('resize', medir);
    medir();
  } else progresso(0);
  return { progresso };
}
