// Timeline Engine: onde cada cena começa e termina, contando as sobreposições das transições.

/**
 * @typedef {object} TimelineScene
 * @property {string} sceneId
 * @property {number} index
 * @property {number} startFrame  primeiro quadro da cena, no tempo do vídeo
 * @property {number} endFrame    quadro seguinte ao último da cena
 * @property {number} overlapIn   quadros em que a cena divide a tela com a anterior
 */

/** Sobreposição de entrada de uma cena: a duração da transição, ou 0 (corte seco e primeira cena). */
export const overlapIn = (scene, index) => (index > 0 && scene.transitionIn ? scene.transitionIn.durationFrames : 0);

/**
 * @param {{ scenes: Array<{ id: string, durationFrames: number, transitionIn?: { durationFrames: number } }> }} project
 * @returns {{ totalFrames: number, scenes: TimelineScene[] }}
 */
export function getTimeline(project) {
  const scenes = [];
  project.scenes.forEach((scene, index) => {
    const overlap = overlapIn(scene, index);
    const startFrame = index === 0 ? 0 : scenes[index - 1].endFrame - overlap;
    scenes.push({ sceneId: scene.id, index, startFrame, endFrame: startFrame + scene.durationFrames, overlapIn: overlap });
  });
  return { totalFrames: scenes.length ? scenes[scenes.length - 1].endFrame : 0, scenes };
}

/** Cenas vivas num quadro, na ordem do vídeo (durante uma transição são duas). */
export function scenesAtFrame(timeline, frame) {
  return timeline.scenes.filter((s) => frame >= s.startFrame && frame < s.endFrame);
}
