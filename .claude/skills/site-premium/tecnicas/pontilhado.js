// Pontilhado — o nome da marca, enorme, impresso em pontos de retícula e cortado pela borda de baixo.
// Os pontos abrem caminho em volta do dedo e voltam com mola, e esquentam de cor quando se afastam.
// Assinatura de rodapé barata e memorável: serve em qualquer site, e combina com gráfica, jornal,
// quadrinho e tudo que vem de impressão.
//
// import { pontilhado } from './tecnicas/pontilhado.js';
// pontilhado(document.querySelector('#assinatura'), {
//   texto: 'marca', fonte: '800 100px "Inter Tight"', tinta: '#e7e2d6', quente: '#ff7a2f', corte: 0.22,
// });
//
// O quadro precisa de altura definida e `aria-label` com o nome: o canvas é decoração.
// `corte` é quanto da altura das letras fica pra fora, embaixo. Reduzir movimento deixa só os pontos.

import { limitar, semMovimento } from './palco.js';
import { laco } from './fisica.js';

const hex = (h) => { const v = parseInt(h.replace('#', ''), 16); return [(v >> 16) & 255, (v >> 8) & 255, v & 255]; };

export async function pontilhado(quadro, opcoes = {}) {
  const o = { texto: '', fonte: '800 100px system-ui', tinta: '#e7e2d6', quente: '#ff7a2f', corte: 0.2, malha: innerWidth < 760 ? 5 : 6, raio: 0.16, ...opcoes };
  const canvas = document.createElement('canvas');
  canvas.className = 'tec-canvas';
  canvas.setAttribute('aria-hidden', 'true');
  quadro.prepend(canvas);
  await document.fonts?.ready;
  const ctx = canvas.getContext('2d');
  const dpr = Math.min(devicePixelRatio || 1, 2);
  const frio = hex(o.tinta), calor = hex(o.quente);
  const parado = semMovimento();
  let W = 0, H = 0, P = [], mx = -1e4, my = -1e4, dentro = false;

  function medir() {
    W = quadro.clientWidth; H = quadro.clientHeight;
    if (!W || !H) return;
    canvas.width = W * dpr; canvas.height = H * dpr;
    // mede a palavra e estica até ocupar a largura inteira
    const m = document.createElement('canvas').getContext('2d');
    m.font = o.fonte;
    const base = parseFloat(o.fonte.match(/(\d+(?:\.\d+)?)px/)[1]);
    const mede = m.measureText(o.texto);
    const tam = base * (W * 1.04) / mede.width;
    const altura = (mede.actualBoundingBoxAscent * tam) / base;
    const fora = document.createElement('canvas');
    fora.width = W; fora.height = H;
    const f = fora.getContext('2d', { willReadFrequently: true });
    f.font = o.fonte.replace(/\d+(\.\d+)?px/, `${tam}px`);
    f.textBaseline = 'alphabetic';
    f.fillStyle = '#000';
    f.fillText(o.texto, -W * 0.02, H + altura * o.corte);
    const d = f.getImageData(0, 0, W, H).data;
    P = [];
    const g = o.malha;
    for (let y = 0, l = 0; y < H; y += g, l++) {
      for (let x = (l % 2) * g / 2; x < W; x += g) {
        // o ponto cresce com o quanto de letra tem embaixo dele: é o que faz parecer retícula
        const a = d[(Math.floor(y) * W + Math.floor(x)) * 4 + 3];
        if (a < 40) continue;
        P.push({ x0: x, y0: y, x, y, vx: 0, vy: 0, r: (g * 0.42) * (0.55 + 0.45 * a / 255) });
      }
    }
    desenhar();
  }

  function desenhar() {
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, W, H);
    // agrupar por cor: trocar fillStyle a cada ponto é o que pesa no canvas
    const faixas = 6;
    for (let k = 0; k < faixas; k++) {
      const t = k / (faixas - 1);
      ctx.fillStyle = `rgb(${frio.map((c, i) => Math.round(c + (calor[i] - c) * t)).join(' ')})`;
      ctx.beginPath();
      for (const p of P) {
        const d = Math.hypot(p.x - p.x0, p.y - p.y0);
        if (Math.min(faixas - 1, Math.floor(d / 4)) !== k) continue;
        ctx.moveTo(p.x + p.r, p.y);
        ctx.arc(p.x, p.y, p.r, 0, 6.2832);
      }
      ctx.fill();
    }
  }

  const acordar = laco(quadro, {
    passo(h) {
      const alcance = W * o.raio;
      let ocupado = false;
      for (const p of P) {
        let ax = (p.x0 - p.x) * 90 - p.vx * 12, ay = (p.y0 - p.y) * 90 - p.vy * 12;
        if (dentro) {
          const dx = p.x - mx, dy = p.y - my, d = Math.hypot(dx, dy);
          if (d < alcance && d > 0.1) { const f = (1 - d / alcance) ** 2 * 5200; ax += dx / d * f; ay += dy / d * f; }
        }
        p.vx += ax * h; p.vy += ay * h;
        p.x += p.vx * h; p.y += p.vy * h;
        if (Math.abs(p.vx) + Math.abs(p.vy) > 0.5 || Math.abs(p.x - p.x0) + Math.abs(p.y - p.y0) > 0.3) ocupado = true;
        else { p.x = p.x0; p.y = p.y0; p.vx = 0; p.vy = 0; }
      }
      return ocupado;
    },
    desenhar,
  });
  new ResizeObserver(medir).observe(quadro);
  medir();

  if (!parado) {
    quadro.addEventListener('pointermove', (e) => {
      const r = quadro.getBoundingClientRect();
      mx = limitar(e.clientX - r.left, -50, W + 50); my = e.clientY - r.top; dentro = true;
      acordar();
    });
    quadro.addEventListener('pointerleave', () => { dentro = false; acordar(); });
  }
  return { medir };
}
