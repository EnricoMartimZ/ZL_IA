// Variation Engine: gera variantes de uma peça mexendo num eixo por vez, com semente. A mesma
// semente dá sempre as mesmas variantes, e cada uma diz exatamente o que mudou.
import { cpSync, existsSync, mkdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { validateProject } from '../../core/src/index.js';
import { openProject, PROJECT_FILE } from '../../storage/index.js';

export const AXES = ['entrada', 'ritmo'];

/** Gerador de números com semente (mulberry32): mesma semente, mesma sequência. */
function sorteador(semente) {
  let a = semente >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const embaralhar = (lista, sortear) => {
  const copia = [...lista];
  for (let i = copia.length - 1; i > 0; i--) { const j = Math.floor(sortear() * (i + 1)); [copia[i], copia[j]] = [copia[j], copia[i]]; }
  return copia;
};

const ENTRADAS = [
  { nome: 'só aparecer', descricao: 'entradas só com fade', monta: (d) => [{ id: 'entra-fade', preset: 'fade', role: 'in', durationFrames: d }] },
  { nome: 'subir aparecendo', descricao: 'entradas subindo com fade', monta: (d) => [{ id: 'entra-fade', preset: 'fade', role: 'in', durationFrames: Math.max(2, Math.round(d * 0.8)) }, { id: 'entra-sobe', preset: 'slide', role: 'in', durationFrames: d, easing: 'ease-out-expo', params: { direction: 'up', distance: 60 } }] },
  { nome: 'crescer', descricao: 'entradas crescendo com fade', monta: (d) => [{ id: 'entra-fade', preset: 'fade', role: 'in', durationFrames: Math.max(2, Math.round(d * 0.7)) }, { id: 'entra-cresce', preset: 'scale', role: 'in', durationFrames: d, easing: 'ease-out-back', params: { scale: 0.85 } }] },
  { nome: 'vir do lado', descricao: 'entradas deslizando da direita', monta: (d) => [{ id: 'entra-fade', preset: 'fade', role: 'in', durationFrames: Math.max(2, Math.round(d * 0.6)) }, { id: 'entra-lado', preset: 'slide', role: 'in', durationFrames: d, easing: 'ease-out-expo', params: { direction: 'left', distance: 120 } }] },
];
const RITMOS = [
  { fator: 0.6, nome: 'seco', descricao: 'animações 40% mais curtas' },
  { fator: 1.4, nome: 'calmo', descricao: 'animações 40% mais longas' },
  { fator: 0.8, nome: 'ágil', descricao: 'animações 20% mais curtas' },
  { fator: 1.2, nome: 'suave', descricao: 'animações 20% mais longas' },
];

const resumo = (animacoes) => animacoes.map((a) => `${a.preset}/${a.durationFrames}`).join('+') || 'nenhuma';

function variarEntrada(projeto, opcao) {
  const mudancas = [];
  for (const cena of projeto.scenes) for (const camada of cena.layers) {
    const entradas = (camada.animations ?? []).filter((a) => a.role === 'in');
    if (!entradas.length) continue;
    const atraso = Math.min(...entradas.map((a) => a.delayFrames ?? 0));
    const duracao = Math.max(...entradas.map((a) => a.durationFrames));
    const novas = opcao.monta(duracao).map((a) => (atraso ? { ...a, delayFrames: atraso } : a));
    const outras = camada.animations.filter((a) => a.role !== 'in');
    const usados = new Set(outras.map((a) => a.id));
    for (const n of novas) { while (usados.has(n.id)) n.id += '-b'; usados.add(n.id); }
    if (resumo(entradas) !== resumo(novas) || JSON.stringify(entradas.map((a) => a.params)) !== JSON.stringify(novas.map((a) => a.params))) {
      mudancas.push(`${camada.id}: entrada ${resumo(entradas)} → ${resumo(novas)}`);
    }
    camada.animations = [...novas, ...outras];
  }
  return mudancas;
}

function variarRitmo(projeto, opcao) {
  const mudancas = [];
  for (const cena of projeto.scenes) for (const camada of cena.layers) {
    if (!camada.animations?.length) continue;
    const antes = resumo(camada.animations);
    for (const a of camada.animations) {
      a.durationFrames = Math.max(2, Math.round(a.durationFrames * opcao.fator));
      if (a.delayFrames) a.delayFrames = Math.round(a.delayFrames * opcao.fator);
    }
    // entrada e saída têm que continuar cabendo na camada
    const ocupa = (papel) => Math.max(0, ...camada.animations.filter((a) => a.role === papel).map((a) => (a.delayFrames ?? 0) + a.durationFrames));
    const sobra = camada.durationFrames / (ocupa('in') + ocupa('out'));
    if (sobra < 1) for (const a of camada.animations) { a.durationFrames = Math.max(1, Math.floor(a.durationFrames * sobra)); if (a.delayFrames) a.delayFrames = Math.floor(a.delayFrames * sobra); }
    if (antes !== resumo(camada.animations)) mudancas.push(`${camada.id}: ${antes} → ${resumo(camada.animations)}`);
  }
  return mudancas;
}

/**
 * Gera variantes em memória. Não altera o projeto recebido. Cenas, textos e duração total não mudam.
 * @param {any} project projeto válido
 * @param {{ axis?: 'entrada' | 'ritmo', count?: number, seed?: number }} [opcoes]
 * @returns {Array<{ id: string, axis: string, description: string, changes: string[], divergence: number, project: any }>}
 */
export function generateVariations(project, { axis = 'entrada', count = 3, seed = 1 } = {}) {
  if (!AXES.includes(axis)) throw new Error(`eixo desconhecido: ${axis}. Existem: ${AXES.join(', ')}`);
  const opcoes = embaralhar(axis === 'entrada' ? ENTRADAS : RITMOS, sorteador(seed));
  const comAnimacao = project.scenes.flatMap((s) => s.layers).filter((l) => l.animations?.length).length || 1;
  const variantes = [];
  for (const opcao of opcoes) {
    if (variantes.length >= count) break;
    const copia = structuredClone(project);
    const changes = axis === 'entrada' ? variarEntrada(copia, opcao) : variarRitmo(copia, opcao);
    if (!changes.length) continue; // igual ao original: não é variante
    const id = `${axis}-${opcao.nome.normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/gi, '-').toLowerCase()}`;
    copia.project.id = `${project.project.id}-${id}`.slice(0, 63);
    copia.project.name = `${project.project.name} (${opcao.nome})`.slice(0, 120);
    copia.project.revision = 1;
    if (copia.export.fileName) copia.export.fileName = `${copia.project.id}.mp4`;
    const validacao = validateProject(copia);
    if (!validacao.valid) throw new Error(`a variante ${id} saiu inválida: ${validacao.errors[0].code} em ${validacao.errors[0].path}`);
    variantes.push({ id, axis, description: opcao.descricao, changes, divergence: Math.round(100 * changes.length / comAnimacao), project: copia });
  }
  return variantes;
}

/** Gera as variantes e grava cada uma como projeto irmão em <pasta>/variantes/<id>/, com os assets. */
export function writeVariations({ dir, axis, count, seed }) {
  const { dir: pasta, project } = openProject(dir);
  const variantes = generateVariations(project, { axis, count, seed });
  const gravadas = variantes.map((v) => {
    const destino = path.join(pasta, 'variantes', v.id);
    mkdirSync(destino, { recursive: true });
    if (existsSync(path.join(pasta, 'assets'))) cpSync(path.join(pasta, 'assets'), path.join(destino, 'assets'), { recursive: true });
    writeFileSync(path.join(destino, PROJECT_FILE), `${JSON.stringify(v.project, null, 2)}\n`);
    return { id: v.id, axis: v.axis, description: v.description, changes: v.changes, divergence: v.divergence, dir: destino };
  });
  return { base: pasta, seed: seed ?? 1, variations: gravadas };
}
