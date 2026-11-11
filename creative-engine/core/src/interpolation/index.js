// Interpolation Engine: curvas de aceleração. Toda curva recebe o progresso de 0 a 1 e devolve
// o progresso "curvado" (que pode passar de 1 nas curvas com ultrapassagem, como ease-out-back).

// As cinco primeiras são as da especificação de CSS; as outras são de uso comum na web.
export const NAMED_EASINGS = {
  'ease-in': [0.42, 0, 1, 1],
  'ease-out': [0, 0, 0.58, 1],
  'ease-in-out': [0.42, 0, 0.58, 1],
  'ease-in-cubic': [0.32, 0, 0.67, 0],
  'ease-out-cubic': [0.33, 1, 0.68, 1],
  'ease-in-out-cubic': [0.65, 0, 0.35, 1],
  'ease-out-expo': [0.16, 1, 0.3, 1],
  'ease-out-back': [0.34, 1.56, 0.64, 1],
};

export const EASING_NAMES = ['linear', 'hold', ...Object.keys(NAMED_EASINGS)];

const limitar = (t) => (t <= 0 ? 0 : t >= 1 ? 1 : t);

/** Bézier cúbica de (0,0) a (1,1) com pontos de controle (x1,y1) e (x2,y2). Devolve y para um x. */
export function cubicBezier(x1, y1, x2, y2) {
  const cx = 3 * x1, bx = 3 * (x2 - x1) - cx, ax = 1 - cx - bx;
  const cy = 3 * y1, by = 3 * (y2 - y1) - cy, ay = 1 - cy - by;
  const xEm = (t) => ((ax * t + bx) * t + cx) * t;
  const yEm = (t) => ((ay * t + by) * t + cy) * t;
  const inclinacao = (t) => (3 * ax * t + 2 * bx) * t + cx;
  return (x) => {
    if (x <= 0) return 0;
    if (x >= 1) return 1;
    let t = x;
    for (let i = 0; i < 8; i++) { // Newton: rápido quando a curva é bem comportada
      const erro = xEm(t) - x;
      if (Math.abs(erro) < 1e-7) return yEm(t);
      const d = inclinacao(t);
      if (Math.abs(d) < 1e-6) break;
      t -= erro / d;
    }
    let baixo = 0, alto = 1; // bisseção: sempre chega
    t = x;
    for (let i = 0; i < 50; i++) {
      const erro = xEm(t) - x;
      if (Math.abs(erro) < 1e-7) break;
      if (erro > 0) alto = t; else baixo = t;
      t = (baixo + alto) / 2;
    }
    return yEm(t);
  };
}

const cache = new Map();

/**
 * Transforma o campo `easing` do projeto numa função.
 * @param {string | { type: 'cubicBezier', x1: number, y1: number, x2: number, y2: number } | undefined} easing
 * @param {string} [padrao] nome usado quando o campo falta
 * @returns {(t: number) => number}
 */
export function resolveEasing(easing, padrao = 'linear') {
  const e = easing ?? padrao;
  if (e === 'linear') return limitar;
  if (e === 'hold') return (t) => (t >= 1 ? 1 : 0);
  const pontos = typeof e === 'string' ? NAMED_EASINGS[e] : [e.x1, e.y1, e.x2, e.y2];
  if (!pontos) throw new Error(`curva desconhecida: ${JSON.stringify(e)}`);
  const chave = pontos.join(',');
  if (!cache.has(chave)) cache.set(chave, cubicBezier(...pontos));
  return cache.get(chave);
}

export const lerp = (a, b, t) => a + (b - a) * t;
