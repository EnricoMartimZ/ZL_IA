// Comandos de edição: a única porta de alteração de um projeto. O editor e o Claude usam o mesmo
// vocabulário. applyCommands aplica a lista inteira numa cópia e só devolve se o resultado for
// válido: ou muda tudo, ou não muda nada.
import { getTimeline } from '../timeline/index.js';
import { validateProject } from '../validation/index.js';
import { ANIMATABLE } from '../keyframes/index.js';

class Recusa extends Error {
  constructor(code, message) { super(message); this.code = code; }
}
const recusar = (code, message) => { throw new Recusa(code, message); };
const ehObjeto = (v) => v !== null && typeof v === 'object' && !Array.isArray(v);

/** Mescla em profundidade. Lista substitui; null apaga a chave (JSON Merge Patch). */
export function mergePatch(alvo, patch) {
  if (!ehObjeto(patch)) return structuredClone(patch);
  const saida = ehObjeto(alvo) ? alvo : {};
  for (const [chave, valor] of Object.entries(patch)) {
    if (valor === null) delete saida[chave];
    else saida[chave] = ehObjeto(valor) ? mergePatch(saida[chave], valor) : structuredClone(valor);
  }
  return saida;
}

const exigir = (comando, ...campos) => {
  for (const c of campos) if (comando[c] === undefined) recusar('COMMAND_MISSING_FIELD', `O comando ${comando.type} precisa de "${c}".`);
};
const proibir = (patch, campos, tipo) => {
  if (!ehObjeto(patch)) recusar('COMMAND_BAD_PATCH', `O patch de ${tipo} tem que ser um objeto.`);
  for (const c of campos) if (c in patch) recusar('COMMAND_FIELD_NOT_PATCHABLE', `${tipo} não altera "${c}": use o comando próprio.`);
};
const posicao = (lista, index) => (index === undefined ? lista.length : Math.max(0, Math.min(lista.length, index)));

const acharCena = (p, sceneId) => {
  const i = p.scenes.findIndex((s) => s.id === sceneId);
  if (i < 0) recusar('SCENE_NOT_FOUND', `Não existe cena "${sceneId}".`);
  return { cena: p.scenes[i], i };
};
const acharCamada = (p, layerId) => {
  for (const cena of p.scenes) {
    const j = cena.layers.findIndex((l) => l.id === layerId);
    if (j >= 0) return { cena, camada: cena.layers[j], j };
  }
  return recusar('LAYER_NOT_FOUND', `Não existe camada "${layerId}".`);
};
const acharAsset = (p, assetId) => {
  const i = p.assets.findIndex((a) => a.id === assetId);
  if (i < 0) recusar('ASSET_NOT_FOUND', `Não existe asset "${assetId}".`);
  return i;
};

const EXECUTORES = {
  'project.update': (p, c) => {
    exigir(c, 'patch'); proibir(c.patch, ['id', 'kind', 'createdAt', 'updatedAt', 'revision'], c.type);
    mergePatch(p.project, c.patch);
    return 'projeto';
  },
  'brand.set': (p, c) => { exigir(c, 'brand'); p.brand = structuredClone(c.brand); return 'marca'; },
  'composition.update': (p, c) => {
    exigir(c, 'patch'); proibir(c.patch, ['durationFrames'], c.type);
    mergePatch(p.composition, c.patch);
    return 'composição';
  },
  'export.update': (p, c) => { exigir(c, 'patch'); mergePatch(p.export, c.patch); return 'exportação'; },

  'asset.add': (p, c) => { exigir(c, 'asset'); p.assets.push(structuredClone(c.asset)); return `asset ${c.asset.id}`; },
  'asset.update': (p, c) => {
    exigir(c, 'assetId', 'patch'); proibir(c.patch, ['id'], c.type);
    mergePatch(p.assets[acharAsset(p, c.assetId)], c.patch);
    return `asset ${c.assetId}`;
  },
  'asset.remove': (p, c) => { exigir(c, 'assetId'); p.assets.splice(acharAsset(p, c.assetId), 1); return `asset ${c.assetId}`; },

  'scene.add': (p, c) => {
    exigir(c, 'scene');
    p.scenes.splice(posicao(p.scenes, c.index), 0, structuredClone(c.scene));
    return `cena ${c.scene.id}`;
  },
  'scene.update': (p, c) => {
    exigir(c, 'sceneId', 'patch'); proibir(c.patch, ['id', 'layers', 'transitionIn'], c.type);
    mergePatch(acharCena(p, c.sceneId).cena, c.patch);
    return `cena ${c.sceneId}`;
  },
  'scene.remove': (p, c) => {
    exigir(c, 'sceneId');
    if (p.scenes.length === 1) recusar('LAST_SCENE', 'O projeto precisa de pelo menos uma cena.');
    p.scenes.splice(acharCena(p, c.sceneId).i, 1);
    return `cena ${c.sceneId}`;
  },
  'scene.reorder': (p, c) => {
    exigir(c, 'sceneId', 'index');
    const [cena] = p.scenes.splice(acharCena(p, c.sceneId).i, 1);
    p.scenes.splice(posicao(p.scenes, c.index), 0, cena);
    return `cena ${c.sceneId}`;
  },
  'scene.setTransition': (p, c) => {
    exigir(c, 'sceneId', 'transition');
    const { cena } = acharCena(p, c.sceneId);
    if (c.transition === null) delete cena.transitionIn; else cena.transitionIn = structuredClone(c.transition);
    return `transição de ${c.sceneId}`;
  },

  'layer.add': (p, c) => {
    exigir(c, 'sceneId', 'layer');
    const { cena } = acharCena(p, c.sceneId);
    cena.layers.splice(posicao(cena.layers, c.index), 0, structuredClone(c.layer));
    return `camada ${c.layer.id}`;
  },
  'layer.update': (p, c) => {
    exigir(c, 'layerId', 'patch'); proibir(c.patch, ['id', 'type'], c.type);
    mergePatch(acharCamada(p, c.layerId).camada, c.patch);
    return `camada ${c.layerId}`;
  },
  'layer.remove': (p, c) => {
    exigir(c, 'layerId');
    const { cena, j } = acharCamada(p, c.layerId);
    cena.layers.splice(j, 1);
    return `camada ${c.layerId}`;
  },
  'layer.reorder': (p, c) => {
    exigir(c, 'layerId', 'index');
    const { cena, j } = acharCamada(p, c.layerId);
    const [camada] = cena.layers.splice(j, 1);
    cena.layers.splice(posicao(cena.layers, c.index), 0, camada);
    return `camada ${c.layerId}`;
  },
  'layer.move': (p, c) => {
    exigir(c, 'layerId', 'sceneId');
    const destino = acharCena(p, c.sceneId).cena;
    const { cena, j } = acharCamada(p, c.layerId);
    const [camada] = cena.layers.splice(j, 1);
    destino.layers.splice(posicao(destino.layers, c.index), 0, camada);
    return `camada ${c.layerId}`;
  },

  'animation.add': (p, c) => {
    exigir(c, 'layerId', 'animation');
    const { camada } = acharCamada(p, c.layerId);
    (camada.animations ??= []).push(structuredClone(c.animation));
    return `animação ${c.layerId}/${c.animation.id}`;
  },
  'animation.update': (p, c) => {
    exigir(c, 'layerId', 'animationId', 'patch'); proibir(c.patch, ['id'], c.type);
    const anim = (acharCamada(p, c.layerId).camada.animations ?? []).find((a) => a.id === c.animationId);
    if (!anim) recusar('ANIMATION_NOT_FOUND', `A camada "${c.layerId}" não tem animação "${c.animationId}".`);
    mergePatch(anim, c.patch);
    return `animação ${c.layerId}/${c.animationId}`;
  },
  'animation.remove': (p, c) => {
    exigir(c, 'layerId', 'animationId');
    const { camada } = acharCamada(p, c.layerId);
    const k = (camada.animations ?? []).findIndex((a) => a.id === c.animationId);
    if (k < 0) recusar('ANIMATION_NOT_FOUND', `A camada "${c.layerId}" não tem animação "${c.animationId}".`);
    camada.animations.splice(k, 1);
    if (!camada.animations.length) delete camada.animations;
    return `animação ${c.layerId}/${c.animationId}`;
  },

  'keyframe.set': (p, c) => {
    exigir(c, 'layerId', 'property', 'frame', 'value');
    if (!ANIMATABLE.includes(c.property)) recusar('PROPERTY_NOT_ANIMATABLE', `"${c.property}" não aceita keyframe. Aceitas: ${ANIMATABLE.join(', ')}.`);
    const { camada } = acharCamada(p, c.layerId);
    const trilha = ((camada.keyframes ??= {})[c.property] ??= []);
    const ponto = { frame: c.frame, value: c.value, ...(c.easing !== undefined ? { easing: structuredClone(c.easing) } : {}) };
    const k = trilha.findIndex((q) => q.frame === c.frame);
    if (k >= 0) trilha[k] = ponto; else { trilha.push(ponto); trilha.sort((a, b) => a.frame - b.frame); }
    return `keyframe ${c.layerId}.${c.property}@${c.frame}`;
  },
  'keyframe.remove': (p, c) => {
    exigir(c, 'layerId', 'property', 'frame');
    const { camada } = acharCamada(p, c.layerId);
    const trilha = camada.keyframes?.[c.property];
    const k = trilha ? trilha.findIndex((q) => q.frame === c.frame) : -1;
    if (k < 0) recusar('KEYFRAME_NOT_FOUND', `Não há keyframe de ${c.property} no quadro ${c.frame} da camada "${c.layerId}".`);
    trilha.splice(k, 1);
    if (!trilha.length) delete camada.keyframes[c.property];
    if (!Object.keys(camada.keyframes).length) delete camada.keyframes;
    return `keyframe ${c.layerId}.${c.property}@${c.frame}`;
  },
};

export const COMMAND_TYPES = Object.keys(EXECUTORES);

/**
 * Aplica uma lista de comandos. Não altera o projeto recebido.
 * @param {any} project projeto válido
 * @param {Array<{ type: string, [campo: string]: any }>} commands
 * @returns {{ ok: true, project: any, changes: Array<{ index: number, type: string, target: string }> }
 *   | { ok: false, error: { index: number | null, code: string, message: string, problems?: import('../types.js').Problem[] } }}
 */
export function applyCommands(project, commands) {
  if (!Array.isArray(commands)) return { ok: false, error: { index: null, code: 'COMMAND_LIST_INVALID', message: 'Os comandos têm que vir numa lista.' } };
  const copia = structuredClone(project);
  const changes = [];
  for (let index = 0; index < commands.length; index++) {
    const comando = commands[index];
    const executar = ehObjeto(comando) ? EXECUTORES[comando.type] : undefined;
    if (!executar) {
      return { ok: false, error: { index, code: 'COMMAND_UNKNOWN', message: `Comando desconhecido: ${JSON.stringify(comando?.type)}. Existem: ${COMMAND_TYPES.join(', ')}.` } };
    }
    try {
      changes.push({ index, type: comando.type, target: executar(copia, comando) });
    } catch (e) {
      if (!(e instanceof Recusa)) throw e;
      return { ok: false, error: { index, code: e.code, message: e.message } };
    }
  }
  // o que os comandos mantêm em dia sozinhos
  if (copia.scenes[0]?.transitionIn) {
    delete copia.scenes[0].transitionIn;
    changes.push({ index: null, type: 'auto', target: `transição da primeira cena (${copia.scenes[0].id}) removida` });
  }
  const total = getTimeline(copia).totalFrames;
  if (copia.composition.durationFrames !== total) {
    changes.push({ index: null, type: 'auto', target: `duração total: ${copia.composition.durationFrames} → ${total} quadros` });
    copia.composition.durationFrames = total;
  }
  const validacao = validateProject(copia);
  if (!validacao.valid) {
    return { ok: false, error: { index: null, code: 'RESULT_INVALID', message: 'Os comandos deixariam o projeto inválido. Nada foi alterado.', problems: validacao.errors } };
  }
  return { ok: true, project: copia, changes };
}
