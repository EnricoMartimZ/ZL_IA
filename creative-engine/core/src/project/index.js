// Project Manager: criar um projeto a partir de um modelo e conferir a versão do formato.
// Só mexe no documento; ler e gravar disco é do storage/.
import { getTimeline } from '../timeline/index.js';

export const SCHEMA_VERSION = '1.0.0';

/** Marca neutra, usada enquanto a identidade do cliente não foi importada. */
export const NEUTRAL_BRAND = {
  source: null, syncedAt: null,
  colors: { background: '#FFFFFF', text: '#111111', accent: '#1F6FEB', darkBase: '#111111' },
  fonts: { heading: { family: 'sans-serif' }, body: { family: 'sans-serif' } },
  logos: {},
};

const texto = (id, name, startFrame, durationFrames, y, height, content, fontSize, fontFamily, color) => ({
  id, name, type: 'text', startFrame, durationFrames,
  box: { x: 64, y, width: 952, height },
  text: { content, fontFamily, fontSize, fontWeight: fontFamily === 'brand.heading' ? 800 : 600, lineHeight: 1.05, color, align: 'center', verticalAlign: 'middle' },
  ...(startFrame > 0 ? { animations: [{ id: 'entra', preset: 'fade', role: 'in', durationFrames: 10 }] } : {}),
});

const TEMPLATES = {
  'motion-ad-9x16': {
    description: 'Anúncio vertical 1080×1920, 30 fps, 15 s, em 4 cenas: gancho, produto, oferta e chamada.',
    composition: { width: 1080, height: 1920, fps: 30, background: 'brand.darkBase', safeArea: { top: 168, right: 64, bottom: 590, left: 64 } },
    scenes: () => [
      {
        id: 'cena-gancho', name: 'Gancho', durationFrames: 96, background: 'brand.darkBase',
        beat: { role: 'hook', intent: 'O resultado ou a frase forte já no primeiro quadro.' },
        layers: [texto('gancho-titulo', 'Título', 0, 96, 560, 400, 'O gancho\nvem aqui.', 128, 'brand.heading', '#FFFFFF')],
      },
      {
        id: 'cena-produto', name: 'Produto', durationFrames: 132, background: 'brand.background',
        beat: { role: 'product', intent: 'O produto e o que ele resolve.' },
        transitionIn: { type: 'fade', durationFrames: 12 },
        layers: [texto('produto-titulo', 'Título', 12, 120, 1000, 240, 'O produto\ne o diferencial.', 88, 'brand.heading', 'brand.text')],
      },
      {
        id: 'cena-oferta', name: 'Oferta', durationFrames: 132, background: 'brand.accent',
        beat: { role: 'offer', intent: 'A oferta grande e o prazo.' },
        transitionIn: { type: 'fade', durationFrames: 12 },
        layers: [texto('oferta-titulo', 'Oferta', 12, 120, 560, 400, 'A oferta', 200, 'brand.heading', '#FFFFFF')],
      },
      {
        id: 'cena-chamada', name: 'Chamada', durationFrames: 126, background: 'brand.darkBase',
        beat: { role: 'cta', intent: 'Uma ação só.' },
        transitionIn: { type: 'fade', durationFrames: 12 },
        layers: [texto('chamada-titulo', 'Chamada', 12, 114, 660, 240, 'Chama no WhatsApp', 80, 'brand.heading', '#FFFFFF')],
      },
    ],
  },
};

export const listTemplates = () => Object.entries(TEMPLATES).map(([id, t]) => ({ id, description: t.description, composition: { ...t.composition } }));

/**
 * Cria um projeto novo a partir de um modelo. `now` vem de fora: o Core não lê relógio.
 * @param {{ template?: string, id: string, name: string, clientId?: string | null, brand?: any, now: string }} opcoes
 */
export function createProject({ template = 'motion-ad-9x16', id, name, clientId = null, brand, now }) {
  const modelo = TEMPLATES[template];
  if (!modelo) throw new Error(`modelo desconhecido: ${template}. Existem: ${Object.keys(TEMPLATES).join(', ')}`);
  const projeto = {
    schemaVersion: SCHEMA_VERSION,
    project: { id, name, kind: 'motion-ad', createdAt: now, updatedAt: now, revision: 1 },
    clientId,
    brand: structuredClone(brand ?? NEUTRAL_BRAND),
    composition: { ...structuredClone(modelo.composition), durationFrames: 0 },
    assets: [],
    scenes: modelo.scenes(),
    export: { container: 'mp4', videoCodec: 'h264', pixelFormat: 'yuv420p', crf: 18, fileName: `${id}.mp4` },
  };
  projeto.composition.durationFrames = getTimeline(projeto).totalFrames;
  // a composição precisa ficar na ordem do schema só por legibilidade
  const { width, height, fps, durationFrames, background, safeArea } = projeto.composition;
  projeto.composition = { width, height, fps, durationFrames, background, safeArea };
  return projeto;
}

/**
 * Confere se este motor abre o projeto. Na série 1.0 não há o que migrar.
 * @returns {{ ok: true, project: any } | { ok: false, code: string, message: string }}
 */
export function migrateProject(project) {
  const versao = project?.schemaVersion;
  if (typeof versao !== 'string') return { ok: false, code: 'VERSION_MISSING', message: 'O projeto não tem schemaVersion.' };
  const [maior, menor] = versao.split('.').map(Number);
  const [motorMaior, motorMenor] = SCHEMA_VERSION.split('.').map(Number);
  if (maior > motorMaior || (maior === motorMaior && menor > motorMenor)) {
    return { ok: false, code: 'VERSION_NEWER', message: `Projeto feito numa versão mais nova do motor (${versao}; este motor lê até ${motorMaior}.${motorMenor}).` };
  }
  if (maior < motorMaior) return { ok: false, code: 'VERSION_UNSUPPORTED', message: `Não há migração do formato ${versao}.` };
  return { ok: true, project };
}
