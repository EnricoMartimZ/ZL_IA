// Controle — o visitante arrasta um valor e o site responde: termostato, conta de luz, metragem da
// parede, número de convidados, tamanho do lote. A cena muda (aoMudar) e o link do WhatsApp já sai
// com o número escolhido, então a brincadeira vira o pedido de orçamento.
//
// import { controle } from './tecnicas/controle.js';
// controle(document.querySelector('#conta'), {
//   de: 100, ate: 2000, passo: 50, valor: 450, rotulo: 'Sua conta de luz',
//   formato: (v) => `R$ ${v.toLocaleString('pt-BR')}`,
//   aoMudar: (v, t) => cena.progresso(t),      // t vai de 0 a 1
//   link: document.querySelector('#pedir'),
//   whatsapp: { numero: '5519999999999', mensagem: (v, texto) => `Oi! Minha conta de luz é ${texto}. Quanto eu economizaria?` },
// });
//
// forma: 'reta' (padrão) é um <input range> de verdade: teclado e leitor de tela funcionam sozinhos.
// forma: 'dial' desenha um mostrador redondo (termostato, volume) com o mesmo comportamento.

import { limitar } from './palco.js';

const ABERTURA = 270;

export function controle(alvo, opcoes = {}) {
  const o = { de: 0, ate: 100, passo: 1, valor: null, forma: 'reta', rotulo: '', formato: (v) => v.toLocaleString('pt-BR'), aoMudar: () => {}, link: null, whatsapp: null, ...opcoes };
  const inicial = o.valor ?? (o.de + o.ate) / 2;
  alvo.classList.add('ctl', `ctl-${o.forma}`);
  const encaixar = (v) => limitar(Math.round((v - o.de) / o.passo) * o.passo + o.de, Math.min(o.de, o.ate), Math.max(o.de, o.ate));
  let valor = encaixar(inicial);

  function avisar() {
    const t = (valor - o.de) / (o.ate - o.de);
    const texto = o.formato(valor);
    alvo.style.setProperty('--t', t.toFixed(4));
    alvo.querySelector('.ctl-valor').textContent = texto;
    if (o.link && o.whatsapp) o.link.href = `https://wa.me/${o.whatsapp.numero}?text=${encodeURIComponent(o.whatsapp.mensagem(valor, texto))}`;
    o.aoMudar(valor, t);
  }

  if (o.forma === 'dial') {
    alvo.innerHTML = `
      <div class="ctl-mostrador" role="slider" tabindex="0" aria-label="${o.rotulo}" aria-valuemin="${Math.min(o.de, o.ate)}" aria-valuemax="${Math.max(o.de, o.ate)}">
        <svg viewBox="0 0 200 200" aria-hidden="true">
          <circle class="ctl-fundo" cx="100" cy="100" r="86" pathLength="360" stroke-dasharray="${ABERTURA} 360" transform="rotate(135 100 100)"/>
          <circle class="ctl-feito" cx="100" cy="100" r="86" pathLength="360" stroke-dasharray="0 360" transform="rotate(135 100 100)"/>
          <circle class="ctl-pino" cx="100" cy="14" r="9"/>
        </svg>
        <span class="ctl-miolo"><small class="ctl-rotulo">${o.rotulo}</small><b class="ctl-valor"></b></span>
      </div>`;
    const m = alvo.querySelector('.ctl-mostrador');
    const feito = alvo.querySelector('.ctl-feito');
    const pino = alvo.querySelector('.ctl-pino');
    const aoMudarDial = o.aoMudar;
    o.aoMudar = (v, t) => {
      feito.setAttribute('stroke-dasharray', `${t * ABERTURA} 360`);
      pino.setAttribute('transform', `rotate(${-135 + t * ABERTURA} 100 100)`);
      m.setAttribute('aria-valuenow', v);
      m.setAttribute('aria-valuetext', o.formato(v));
      aoMudarDial(v, t);
    };
    const mover = (e) => {
      const r = m.getBoundingClientRect();
      // ângulo a partir do topo, em graus, de -180 a 180; o fim do curso não pula de um lado pro outro
      const ang = Math.atan2(e.clientX - (r.left + r.width / 2), -(e.clientY - (r.top + r.height / 2))) * 180 / Math.PI;
      const t = limitar((ang + ABERTURA / 2) / ABERTURA);
      valor = encaixar(o.de + t * (o.ate - o.de));
      avisar();
    };
    m.addEventListener('pointerdown', (e) => { m.setPointerCapture(e.pointerId); mover(e); });
    m.addEventListener('pointermove', (e) => { if (m.hasPointerCapture(e.pointerId)) mover(e); });
    m.addEventListener('keydown', (e) => {
      const d = { ArrowRight: 1, ArrowUp: 1, ArrowLeft: -1, ArrowDown: -1 }[e.key];
      if (!d) return;
      e.preventDefault();
      valor = encaixar(valor + d * o.passo * Math.sign(o.ate - o.de));
      avisar();
    });
  } else {
    alvo.innerHTML = `
      <label>
        <span class="ctl-rotulo">${o.rotulo}</span>
        <b class="ctl-valor"></b>
        <input type="range" min="${Math.min(o.de, o.ate)}" max="${Math.max(o.de, o.ate)}" step="${o.passo}" value="${valor}" dir="${o.ate < o.de ? 'rtl' : 'ltr'}">
      </label>`;
    alvo.querySelector('input').addEventListener('input', (e) => { valor = encaixar(Number(e.target.value)); avisar(); });
  }
  avisar();

  return {
    get valor() { return valor; },
    definir(v) { valor = encaixar(v); const i = alvo.querySelector('input'); if (i) i.value = valor; avisar(); },
  };
}
