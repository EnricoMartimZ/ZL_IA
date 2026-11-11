// Utilidades do editor.

export const clamp = (n, min, max) => Math.max(min, Math.min(max, n));

/** Id novo que ainda não existe na lista: base, base-2, base-3... */
export function uniqueId(base, usados) {
  const tem = new Set(usados);
  if (!tem.has(base)) return base;
  let n = 2;
  while (tem.has(`${base}-${n}`)) n++;
  return `${base}-${n}`;
}

export const allLayerIds = (project) => project.scenes.flatMap((s) => s.layers.map((l) => l.id));
export const findLayer = (project, layerId) => {
  for (const scene of project.scenes) {
    const index = scene.layers.findIndex((l) => l.id === layerId);
    if (index >= 0) return { scene, layer: scene.layers[index], index };
  }
  return null;
};

/**
 * Arrasto com o ponteiro. Devolve o onPointerDown.
 * @param {{ start?: (e) => any, move: (dx: number, dy: number, e, contexto) => void, end?: (e, contexto, moveu: boolean) => void }} acoes
 *   dx e dy são em pixels de tela, contados do ponto em que o arrasto começou.
 */
export function dragHandler({ start, move, end }) {
  return (e) => {
    if (e.button !== 0) return;
    e.preventDefault();
    e.stopPropagation();
    const alvo = e.currentTarget;
    const x0 = e.clientX, y0 = e.clientY;
    const contexto = start ? start(e) : undefined;
    if (contexto === false) return;
    let moveu = false;
    alvo.setPointerCapture?.(e.pointerId);
    const aoMover = (ev) => {
      const dx = ev.clientX - x0, dy = ev.clientY - y0;
      if (!moveu && Math.abs(dx) + Math.abs(dy) < 3) return; // clique não é arrasto
      moveu = true;
      move(dx, dy, ev, contexto);
    };
    const aoSoltar = (ev) => {
      alvo.removeEventListener('pointermove', aoMover);
      alvo.removeEventListener('pointerup', aoSoltar);
      alvo.removeEventListener('pointercancel', aoSoltar);
      alvo.releasePointerCapture?.(ev.pointerId);
      end?.(ev, contexto, moveu);
    };
    alvo.addEventListener('pointermove', aoMover);
    alvo.addEventListener('pointerup', aoSoltar);
    alvo.addEventListener('pointercancel', aoSoltar);
  };
}

export const seconds = (frames, fps) => `${(frames / fps).toFixed(2).replace('.', ',')} s`;
