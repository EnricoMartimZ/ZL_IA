// Keyframe Engine: valor de uma trilha num quadro (quadro contado do início da camada).
import { lerp, resolveEasing } from '../interpolation/index.js';

/** Propriedades que aceitam trilha de keyframes. */
export const ANIMATABLE = ['x', 'y', 'scale', 'rotation', 'opacity'];

/**
 * Antes do primeiro ponto vale o primeiro valor; depois do último, o último. Entre dois pontos,
 * interpola com a curva do ponto da esquerda (linear se ele não tiver curva).
 * @param {Array<{ frame: number, value: number, easing?: any }>} track
 * @param {number} frame
 */
export function trackValue(track, frame) {
  if (frame <= track[0].frame) return track[0].value;
  const ultimo = track[track.length - 1];
  if (frame >= ultimo.frame) return ultimo.value;
  let i = 0;
  while (track[i + 1].frame <= frame) i++;
  const a = track[i], b = track[i + 1];
  const t = (frame - a.frame) / (b.frame - a.frame);
  return lerp(a.value, b.value, resolveEasing(a.easing, 'linear')(t));
}
