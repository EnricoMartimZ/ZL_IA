// Fluxo — linhas finas correndo num campo de corrente, com "temperatura": quente é rápido e caótico,
// frio é calmo e alinhado. A rolagem leva de um estado ao outro (canvas 2D, leve até no celular).
// Serve pra ar, vento, água, calor, rota, tráfego: climatização, ventilação, piscina, transporte,
// energia, irrigação, lavanderia industrial...
//
// import { fluxo } from './tecnicas/fluxo.js';
// const f = fluxo(document.querySelector('#quadro'), {
//   quente: ['#ff5a1f', '#ffb347'], frio: ['#7fd8ff', '#eaf8ff'], fundo: '#05080c',
//   origem: { x: 0.5, y: 0.12, largura: 0.5 },   // de onde o ar sai (frações da tela); sem isso, entra pela esquerda
//   direcao: Math.PI / 2,                          // pra onde corre (radianos): 0 → direita, π/2 → baixo
// });
// palco(secao, f.progresso);   // p = 0 calor · p = 1 conforto

import { quandoVisivel, semMovimento } from './palco.js';

const hex = (h) => { const v = parseInt(h.replace('#', ''), 16); return [(v >> 16) & 255, (v >> 8) & 255, v & 255]; };
const mistura = (a, b, t) => a.map((x, i) => Math.round(x + (b[i] - x) * t));

export function fluxo(quadro, opcoes = {}) {
  const o = {
    quantidade: innerWidth < 760 ? 900 : 2400,
    quente: ['#ff5a1f', '#ffb347'],
    frio: ['#7fd8ff', '#eaf8ff'],
    fundo: '#05080c',
    rastro: 0.04,      // quanto o rastro some por quadro (menor = rastro mais longo)
    velocidade: 1,
    direcao: 0,
    origem: null,
    espessura: 1.2,
    ...opcoes,
  };
  const canvas = document.createElement('canvas');
  canvas.className = 'tec-canvas';
  quadro.prepend(canvas);
  const ctx = canvas.getContext('2d');
  const dpr = Math.min(devicePixelRatio, innerWidth < 760 ? 1.5 : 2);
  let W = 0, H = 0;
  const cores = { q: o.quente.map(hex), f: o.frio.map(hex) };
  const fundo = hex(o.fundo);

  function ajustar() {
    W = quadro.clientWidth; H = quadro.clientHeight;
    canvas.width = W * dpr; canvas.height = H * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.fillStyle = o.fundo;
    ctx.fillRect(0, 0, W, H);
  }
  new ResizeObserver(ajustar).observe(quadro);
  ajustar();

  const P = Array.from({ length: o.quantidade }, () => nascer({}, true));
  function nascer(p, inicio = false) {
    if (o.origem) {
      p.x = (o.origem.x + (Math.random() - 0.5) * o.origem.largura) * W;
      p.y = o.origem.y * H + (inicio ? Math.random() * H * 0.9 : 0);
    } else {
      // renasce espalhada (a linha entra suave pelo alfa); só uma parte vem da borda de entrada
      const daBorda = !inicio && Math.random() < 0.25;
      const ax = Math.cos(o.direcao), ay = Math.sin(o.direcao);
      p.x = daBorda ? (ax >= 0 ? -10 : W + 10) : Math.random() * W;
      p.y = daBorda && Math.abs(ay) > 0.7 ? (ay > 0 ? -10 : H + 10) : Math.random() * H;
    }
    p.vida = 0;
    p.max = 160 + Math.random() * 320;
    p.j = Math.random(); // variação de cor e velocidade por linha
    return p;
  }

  let temp = 0, alvo = 0, tempo = 0;
  // campo: ângulo em cada ponto. Turbulência cai conforme esfria.
  function angulo(x, y, turb) {
    const a = Math.sin(x * 0.0042 + tempo * 0.35) * Math.cos(y * 0.0051 - tempo * 0.22)
      + 0.55 * Math.sin((x + y) * 0.0023 + tempo * 0.5)
      + 0.35 * Math.cos(x * 0.011 - y * 0.007 + tempo * 0.9);
    return o.direcao + a * turb;
  }

  let ligado = true, vivo = true;
  const parar = quandoVisivel(quadro, (v) => { ligado = v; });
  const parado = semMovimento();

  function quadroDeAnimacao() {
    if (!vivo) return;
    requestAnimationFrame(quadroDeAnimacao);
    if (!ligado) return;
    temp += (alvo - temp) * 0.06;
    tempo += parado ? 0 : 0.016;
    const turb = 1.9 - 1.6 * temp;              // caótico → laminar
    const vel = (2.6 - 1.1 * temp) * o.velocidade;
    ctx.fillStyle = `rgba(${fundo[0]},${fundo[1]},${fundo[2]},${o.rastro})`;
    ctx.fillRect(0, 0, W, H);
    ctx.lineWidth = o.espessura;
    ctx.lineCap = 'round';
    for (const p of P) {
      const a = angulo(p.x, p.y, turb);
      const v = vel * (0.6 + p.j * 0.8);
      const nx = p.x + Math.cos(a) * v;
      const ny = p.y + Math.sin(a) * v;
      const c = mistura(cores.q[p.j > 0.5 ? 1 : 0], cores.f[p.j > 0.5 ? 1 : 0], Math.min(1, Math.max(0, temp + (p.j - 0.5) * 0.25)));
      const alfa = Math.sin(Math.PI * Math.min(1, p.vida / p.max)) * 0.9;
      ctx.strokeStyle = `rgba(${c[0]},${c[1]},${c[2]},${alfa.toFixed(3)})`;
      ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineTo(nx, ny); ctx.stroke();
      p.x = nx; p.y = ny; p.vida++;
      if (p.vida > p.max || p.x > W + 20 || p.x < -60 || p.y > H + 20 || p.y < -20) nascer(p);
    }
  }
  requestAnimationFrame(quadroDeAnimacao);

  return {
    progresso(p) { alvo = p; },
    destruir() { vivo = false; parar(); canvas.remove(); },
  };
}
