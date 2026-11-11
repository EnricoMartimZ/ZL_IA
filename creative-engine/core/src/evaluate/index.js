// evaluateFrame: projeto + quadro → estado do quadro. É o contrato entre o Core e o Renderer:
// aqui se resolve tempo, curva, preset, transição, cor da marca e caminho de asset. Quem desenha
// só aplica o que recebe.
import { getTimeline, scenesAtFrame } from '../timeline/index.js';
import { trackValue } from '../keyframes/index.js';
import { animationModifiers, transitionContainers } from '../presets/index.js';

const arredondar = (n) => Math.round(n * 10000) / 10000;
const PARADO = { x: 0, y: 0, opacity: 1, clip: null };

/** Troca brand.accent e afins pela cor da marca. Cor literal passa direto. */
export function resolveColor(brand, color) {
  if (color === undefined || !color.startsWith('brand.')) return color;
  const [, papel, indice] = color.split('.');
  return papel === 'secondary' ? brand.colors.secondary[Number(indice)] : brand.colors[papel];
}

/** Troca brand.heading e brand.body pela família; devolve também o asset do arquivo da fonte. */
export function resolveFont(brand, fontFamily) {
  const fonte = fontFamily === 'brand.heading' ? brand.fonts.heading
    : fontFamily === 'brand.body' ? brand.fonts.body
      : [brand.fonts.heading, brand.fonts.body].find((f) => f.family === fontFamily);
  return { family: fonte?.family ?? fontFamily, assetId: fonte?.assetId ?? null };
}

function conteudo(project, assets, layer) {
  const { brand } = project;
  if (layer.type === 'text') {
    const t = layer.text;
    const fonte = resolveFont(brand, t.fontFamily);
    return {
      content: t.content, fontFamily: fonte.family, fontAssetId: fonte.assetId, fontSize: t.fontSize,
      fontWeight: t.fontWeight ?? 400, lineHeight: t.lineHeight ?? 1.1, letterSpacing: t.letterSpacing ?? 0,
      color: resolveColor(brand, t.color), align: t.align ?? 'left', verticalAlign: t.verticalAlign ?? 'top',
      uppercase: t.uppercase ?? false,
    };
  }
  if (layer.type === 'image') {
    const i = layer.image;
    return { assetId: i.assetId, src: assets.get(i.assetId)?.src ?? null, fit: i.fit ?? 'cover', focusX: i.focusX ?? 0.5, focusY: i.focusY ?? 0.5, borderRadius: i.borderRadius ?? 0 };
  }
  if (layer.type === 'logo') return { assetId: layer.logo.assetId, src: assets.get(layer.logo.assetId)?.src ?? null };
  const s = layer.shape;
  return {
    kind: s.kind, fill: resolveColor(brand, s.fill) ?? null,
    stroke: s.stroke ? { color: resolveColor(brand, s.stroke.color), width: s.stroke.width } : null,
    borderRadius: s.borderRadius ?? 0,
  };
}

/** Estado de uma camada num quadro local da cena, ou null se ela não está na tela. */
export function evaluateLayer(project, assets, layer, sceneFrame) {
  const f = sceneFrame - layer.startFrame;
  if (layer.visible === false || f < 0 || f >= layer.durationFrames) return null;
  const k = layer.keyframes ?? {};
  const valor = (prop, base) => (k[prop] ? trackValue(k[prop], f) : base);
  const m = animationModifiers(layer.animations, layer.durationFrames, f);
  const t = layer.transform ?? {};
  return {
    layerId: layer.id, type: layer.type,
    x: arredondar(valor('x', layer.box.x) + m.dx),
    y: arredondar(valor('y', layer.box.y) + m.dy),
    width: layer.box.width, height: layer.box.height,
    scale: arredondar(valor('scale', t.scale ?? 1) * m.scale),
    rotation: arredondar(valor('rotation', t.rotation ?? 0)),
    anchorX: t.anchorX ?? 0.5, anchorY: t.anchorY ?? 0.5,
    opacity: arredondar(Math.min(1, Math.max(0, valor('opacity', layer.opacity ?? 1) * m.opacity))),
    content: conteudo(project, assets, layer),
  };
}

const arredondarContainer = (c) => ({
  x: arredondar(c.x), y: arredondar(c.y), opacity: arredondar(c.opacity),
  clip: c.clip && { top: arredondar(c.clip.top), right: arredondar(c.clip.right), bottom: arredondar(c.clip.bottom), left: arredondar(c.clip.left) },
});

/**
 * O que está na tela num quadro. O projeto tem que ser válido (validateProject) e não é alterado.
 * @param {any} project
 * @param {number} frame 0 ≤ frame < duração total
 */
export function evaluateFrame(project, frame) {
  const timeline = getTimeline(project);
  if (!Number.isInteger(frame) || frame < 0 || frame >= timeline.totalFrames) {
    throw new RangeError(`quadro ${frame} fora do vídeo (0 a ${timeline.totalFrames - 1})`);
  }
  const { composition, brand } = project;
  const assets = new Map(project.assets.map((a) => [a.id, a]));
  const vivas = scenesAtFrame(timeline, frame);

  const scenes = vivas.map((entrada, n) => {
    const cena = project.scenes[entrada.index];
    const localFrame = frame - entrada.startFrame;
    let container = PARADO;
    const proxima = vivas[n + 1]; // se existe, esta cena está saindo
    if (proxima) {
      const t = project.scenes[proxima.index].transitionIn;
      container = transitionContainers(t, frame - proxima.startFrame, composition.width, composition.height).outgoing;
    } else if (n > 0) {
      container = transitionContainers(cena.transitionIn, localFrame, composition.width, composition.height).incoming;
    }
    return {
      sceneId: cena.id, localFrame,
      background: resolveColor(brand, cena.background) ?? null,
      container: arredondarContainer(container),
      layers: cena.layers.map((l) => evaluateLayer(project, assets, l, localFrame)).filter(Boolean),
    };
  });

  return {
    frame, timeSeconds: arredondar(frame / composition.fps),
    width: composition.width, height: composition.height,
    background: resolveColor(brand, composition.background),
    scenes,
  };
}
