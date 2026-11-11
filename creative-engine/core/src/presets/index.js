// Animation Presets e transições. Um preset não grava keyframes: ele modifica, na hora de
// desenhar, o valor que a camada já tem (ADR-009). Transição faz o mesmo com a cena inteira.
import { resolveEasing } from '../interpolation/index.js';

/** Sentido do movimento: `up` quer dizer que a coisa sobe. */
export const DIRECTIONS = { up: [0, -1], down: [0, 1], left: [-1, 0], right: [1, 0] };

export const PRESET_DEFAULTS = { slideDistance: 80, scaleFrom: 0.8, easingIn: 'ease-out-cubic', easingOut: 'ease-in-cubic', easingTransition: 'ease-in-out' };

const PRESETS = [
  { id: 'fade', description: 'Aparece (in) ou some (out) pela opacidade.', params: [] },
  { id: 'slide', description: 'Desliza até o lugar (in) ou para fora dele (out). direction é o sentido do movimento.', params: ['direction', 'distance'] },
  { id: 'scale', description: 'Cresce até o tamanho (in) ou encolhe a partir dele (out). scale é a escala de partida ou de chegada.', params: ['scale'] },
];
const TRANSITIONS = [
  { id: 'fade', description: 'A cena nova aparece por cima da anterior.', params: [] },
  { id: 'slide', description: 'A cena nova empurra a anterior. direction é o sentido do movimento.', params: ['direction'] },
  { id: 'wipe', description: 'A cena nova é revelada por uma cortina. direction é o sentido da cortina.', params: ['direction'] },
];

export const listPresets = () => PRESETS.map((p) => ({ ...p, roles: ['in', 'out'] }));
export const listTransitions = () => TRANSITIONS.map((t) => ({ ...t }));

const limitar = (t) => (t <= 0 ? 0 : t >= 1 ? 1 : t);

/**
 * Progresso de uma animação pronta no quadro local da camada: 0 = estado de partida, 1 = de chegada.
 * Entrada começa em 0 no primeiro quadro; saída chega a 1 no último quadro da camada.
 */
export function animationProgress(animation, layerDuration, frame) {
  const atraso = animation.delayFrames ?? 0;
  const d = animation.durationFrames;
  if (animation.role === 'in') return limitar((frame - atraso) / d);
  const inicio = layerDuration - atraso - d;
  return limitar((frame - inicio + 1) / d);
}

/**
 * O que as animações prontas de uma camada fazem com ela num quadro.
 * @returns {{ dx: number, dy: number, scale: number, opacity: number }} deslocamento somado; escala e opacidade multiplicadas
 */
export function animationModifiers(animations, layerDuration, frame) {
  const m = { dx: 0, dy: 0, scale: 1, opacity: 1 };
  for (const a of animations ?? []) {
    const entra = a.role === 'in';
    const p = resolveEasing(a.easing, entra ? PRESET_DEFAULTS.easingIn : PRESET_DEFAULTS.easingOut)(animationProgress(a, layerDuration, frame));
    const falta = entra ? 1 - p : p; // quanto a camada está longe do estado normal
    if (a.preset === 'fade') m.opacity *= 1 - falta;
    else if (a.preset === 'slide') {
      const [vx, vy] = DIRECTIONS[a.params?.direction ?? 'up'];
      const distancia = (a.params?.distance ?? PRESET_DEFAULTS.slideDistance) * falta * (entra ? -1 : 1);
      m.dx += vx * distancia;
      m.dy += vy * distancia;
    } else if (a.preset === 'scale') {
      const alvo = a.params?.scale ?? PRESET_DEFAULTS.scaleFrom;
      m.scale *= 1 + (alvo - 1) * falta;
    }
  }
  return m;
}

/**
 * Progresso da transição no quadro local da cena que entra. Nunca chega a 0 nem a 1 dentro da
 * sobreposição: nenhum quadro é gasto com a cena nova invisível ou com a antiga já coberta.
 */
export const transitionProgress = (durationFrames, localFrame) => (localFrame + 1) / (durationFrames + 1);

const PARADO = { x: 0, y: 0, opacity: 1, clip: null };

/**
 * Efeito da transição nas duas cenas: como fica o contêiner da que entra e o da que sai.
 * clip é o quanto se corta de cada lado, em pixels.
 */
export function transitionContainers(transition, localFrame, width, height) {
  const p = resolveEasing(transition.easing, PRESET_DEFAULTS.easingTransition)(transitionProgress(transition.durationFrames, localFrame));
  const [vx, vy] = DIRECTIONS[transition.direction ?? 'left'];
  if (transition.type === 'fade') return { incoming: { ...PARADO, opacity: limitar(p) }, outgoing: { ...PARADO } };
  if (transition.type === 'slide') {
    return {
      incoming: { ...PARADO, x: -vx * width * (1 - p), y: -vy * height * (1 - p) },
      outgoing: { ...PARADO, x: vx * width * p, y: vy * height * p },
    };
  }
  // wipe: a cortina anda no sentido de direction; o que ela ainda não alcançou fica cortado
  const falta = 1 - limitar(p);
  const clip = { top: 0, right: 0, bottom: 0, left: 0 };
  if (vx < 0) clip.left = width * falta; else if (vx > 0) clip.right = width * falta;
  else if (vy < 0) clip.top = height * falta; else clip.bottom = height * falta;
  return { incoming: { ...PARADO, clip }, outgoing: { ...PARADO } };
}
