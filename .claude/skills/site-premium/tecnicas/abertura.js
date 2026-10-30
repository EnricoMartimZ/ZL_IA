// Abertura — a primeira impressão: o logo da empresa se desenha, a porcentagem sobe de verdade (conta
// imagens e fontes) e uma cortina abre o site. Quase todo site premiado tem isso, e é a assinatura
// mais barata de todas. Aparece uma vez por visita e nunca segura a pessoa mais que `maximo`.
//
// No <head>, antes de tudo (evita o site piscar antes da cortina, e se o JS falhar a página aparece):
//   <script>
//     document.documentElement.classList.add('abrindo');
//     setTimeout(() => document.documentElement.classList.remove('abrindo'), 4500);
//   </script>
//
// import { abertura } from './tecnicas/abertura.js';
// await abertura({ logo: '<svg viewBox="0 0 120 40"><path d="…"/></svg>', fundo: '#0c0c0c', tinta: '#fff' });
// iniciarOSite();
//
// O logo vai em SVG com traços (stroke) ou contornos: os dois desenham. Sem SVG, passar `texto`.
// cortina: 'cima' | 'baixo' | 'centro' (o quadro abre do meio pras bordas).

import { semMovimento } from './palco.js';

const CORTINAS = { cima: 'inset(0 0 100% 0)', baixo: 'inset(100% 0 0 0)', centro: 'inset(50% 0 50% 0)' };

export function abertura(opcoes = {}) {
  const o = { logo: '', texto: '', fundo: '#0c0c0c', tinta: '#ffffff', minimo: 1000, maximo: 3500, cortina: 'cima', umaVez: true, ...opcoes };
  const raiz = document.documentElement;
  const liberar = () => raiz.classList.remove('abrindo');

  let jaViu = false;
  try { jaViu = o.umaVez && sessionStorage.getItem('tec-abertura') === '1'; } catch { /* sem storage: mostra */ }
  if (jaViu || semMovimento()) { liberar(); return Promise.resolve(); }

  const capa = document.createElement('div');
  capa.className = 'abertura';
  capa.style.setProperty('--ab-fundo', o.fundo);
  capa.style.setProperty('--ab-tinta', o.tinta);
  capa.setAttribute('aria-hidden', 'true');
  capa.innerHTML = `<div class="abertura-logo">${o.logo || `<b>${o.texto}</b>`}</div><span class="abertura-conta">0</span>`;
  document.body.append(capa);
  liberar();

  const tracos = [...capa.querySelectorAll('svg :is(path, line, polyline, polygon, circle, rect, ellipse)')];
  const comprimentos = tracos.map((t) => { const c = t.getTotalLength?.() || 300; t.style.strokeDasharray = c; t.style.strokeDashoffset = c; return c; });
  const conta = capa.querySelector('.abertura-conta');

  const imagens = [...document.images].filter((i) => !i.complete);
  let feitos = 0;
  const total = imagens.length + 1;
  imagens.forEach((i) => { const ok = () => { feitos++; }; i.addEventListener('load', ok, { once: true }); i.addEventListener('error', ok, { once: true }); });
  (document.fonts?.ready ?? Promise.resolve()).then(() => { feitos++; });

  return new Promise((pronto) => {
    const ini = performance.now();
    let mostrado = 0, fechado = false;
    function fechar() {
      if (fechado) return;
      fechado = true;
      capa.style.clipPath = CORTINAS[o.cortina] || CORTINAS.cima;
      try { sessionStorage.setItem('tec-abertura', '1'); } catch { /* segue */ }
      setTimeout(() => { capa.remove(); pronto(); }, 950);
    }
    // o relógio de reserva não depende de quadros: em aba de fundo o requestAnimationFrame para
    setTimeout(fechar, o.maximo + 500);
    function passo(agora) {
      if (fechado) return;
      const gasto = agora - ini;
      // o relógio puxa o número pra cima junto com o que já carregou: nunca fica parado num 83%
      const real = Math.max(feitos / total, gasto / o.maximo);
      const teto = Math.min(real, gasto / o.minimo);
      mostrado += (Math.min(1, teto) - mostrado) * 0.12;
      conta.textContent = Math.round(mostrado * 100);
      tracos.forEach((t, i) => { t.style.strokeDashoffset = comprimentos[i] * (1 - mostrado); });
      if (mostrado > 0.995) { fechar(); return; }
      requestAnimationFrame(passo);
    }
    requestAnimationFrame(passo);
  });
}
