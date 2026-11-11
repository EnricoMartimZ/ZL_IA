// Estado do editor: o projeto em memória, a seleção, o quadro atual e o desfazer/refazer.
// Toda alteração passa pelos comandos do Core. Este arquivo não usa DOM nem React: roda em teste.
import { applyCommands, getTimeline } from '../../../core/src/index.js';

export const HISTORY_LIMIT = 100;

/**
 * @param {{ project: any, revision: number }} inicial
 */
export function createStore({ project, revision }) {
  let estado = {
    project, revision,          // revision: a que está no disco e de onde este estado partiu
    dirty: false,               // há alteração ainda não gravada
    past: [], future: [],       // fotografias do projeto para desfazer e refazer
    selection: null,            // { sceneId, layerId } | { sceneId } | null
    frame: 0,
    error: null,                // último comando recusado: { code, message, problems }
    gesture: null,              // arrasto em andamento: o projeto de antes dele
  };
  const ouvintes = new Set();
  const avisar = () => ouvintes.forEach((f) => f());
  const mudar = (parte) => { estado = { ...estado, ...parte }; avisar(); };
  const total = (p) => getTimeline(p).totalFrames;
  const limitarQuadro = (p, f) => Math.max(0, Math.min(total(p) - 1, f));
  const selecaoValida = (p, s) => {
    if (!s) return null;
    const cena = p.scenes.find((c) => c.id === s.sceneId);
    if (!cena) return null;
    if (s.layerId && !cena.layers.some((l) => l.id === s.layerId)) {
      const outra = p.scenes.find((c) => c.layers.some((l) => l.id === s.layerId)); // a camada pode ter mudado de cena
      return outra ? { sceneId: outra.id, layerId: s.layerId } : { sceneId: cena.id };
    }
    return s;
  };
  const trocarProjeto = (p, resto) => mudar({ project: p, frame: limitarQuadro(p, estado.frame), selection: selecaoValida(p, estado.selection), ...resto });

  return {
    getState: () => estado,
    subscribe(f) { ouvintes.add(f); return () => ouvintes.delete(f); },

    /** Aplica comandos e guarda o estado anterior para desfazer. Devolve o erro, se houver. */
    dispatch(commands) {
      const r = applyCommands(estado.project, commands);
      if (!r.ok) { mudar({ error: r.error }); return r.error; }
      trocarProjeto(r.project, { past: [...estado.past, estado.project].slice(-HISTORY_LIMIT), future: [], dirty: true, error: null, gesture: null });
      return null;
    },

    // Gesto (arrastar, girar): várias atualizações contam como UMA alteração no desfazer.
    beginGesture() { if (!estado.gesture) mudar({ gesture: estado.project }); },
    /** Aplica os comandos sobre o projeto de ANTES do gesto (não acumula). */
    updateGesture(commands) {
      const base = estado.gesture ?? estado.project;
      const r = applyCommands(base, commands);
      if (!r.ok) { mudar({ error: r.error }); return r.error; }
      trocarProjeto(r.project, { gesture: base, error: null });
      return null;
    },
    commitGesture() {
      const base = estado.gesture;
      if (!base) return;
      if (base === estado.project) { mudar({ gesture: null }); return; }
      mudar({ past: [...estado.past, base].slice(-HISTORY_LIMIT), future: [], dirty: true, gesture: null });
    },
    cancelGesture() { if (estado.gesture) trocarProjeto(estado.gesture, { gesture: null, error: null }); },

    undo() {
      if (!estado.past.length) return;
      const anterior = estado.past[estado.past.length - 1];
      trocarProjeto(anterior, { past: estado.past.slice(0, -1), future: [estado.project, ...estado.future], dirty: true, error: null });
    },
    redo() {
      if (!estado.future.length) return;
      const [proximo, ...resto] = estado.future;
      trocarProjeto(proximo, { past: [...estado.past, estado.project], future: resto, dirty: true, error: null });
    },

    select(selection) { mudar({ selection: selecaoValida(estado.project, selection) }); },
    setFrame(frame) { const f = limitarQuadro(estado.project, Math.round(frame)); if (f !== estado.frame) mudar({ frame: f }); },
    clearError() { if (estado.error) mudar({ error: null }); },

    /** O servidor gravou: a revisão do disco agora é esta. */
    /** `gravado` é o projeto que foi enviado: se o estado já andou depois disso, continua pendente. */
    markSaved(revision, gravado) { mudar({ revision, dirty: gravado !== undefined && estado.project !== gravado }); },
    /** Carrega o que está no disco (abrir, recarregar depois de edição externa, rollback). Zera o desfazer. */
    load(novo, revision) { trocarProjeto(novo, { revision, dirty: false, past: [], future: [], error: null, gesture: null }); },
  };
}

/** Em que cena cai um quadro do vídeo (durante uma transição, a que está entrando). */
export function sceneAtFrame(project, frame) {
  const { scenes } = getTimeline(project);
  const vivas = scenes.filter((s) => frame >= s.startFrame && frame < s.endFrame);
  return vivas.length ? vivas[vivas.length - 1] : scenes[scenes.length - 1];
}
