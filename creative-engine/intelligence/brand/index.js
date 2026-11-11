// Marca: transforma o marca.json do /identidade-loja no bloco `brand` do projeto, e confere se
// uma peça usa só as cores e as fontes da marca.
import { resolveColor } from '../../core/src/index.js';

const HEX = /^#[0-9a-f]{6}$/i;
const hex = (valor) => {
  if (typeof valor !== 'string') return null;
  const v = valor.trim();
  if (HEX.test(v)) return v.toUpperCase();
  const curto = /^#([0-9a-f])([0-9a-f])([0-9a-f])$/i.exec(v);
  return curto ? `#${curto[1]}${curto[1]}${curto[2]}${curto[2]}${curto[3]}${curto[3]}`.toUpperCase() : null;
};

/**
 * marca.json (cores.fundo/texto/destaque/base_escura/secundarias, tipografia.titulos/corpo, logo.arquivo)
 * → bloco `brand`. Não lê disco: quem chama entrega o conteúdo e diz onde ele estava.
 * @param {any} marca conteúdo do marca.json
 * @param {{ source?: string | null, syncedAt: string, logoAssetId?: string | null }} opcoes
 * @returns {{ brand: any, notes: string[] }} notes: o que faltou e foi preenchido com um padrão
 */
export function brandFromMarca(marca, { source = null, syncedAt, logoAssetId = null }) {
  const notes = [];
  const cores = marca?.cores ?? {};
  const cor = (valor, padrao, nome) => {
    const c = hex(valor);
    if (!c) notes.push(`a marca não traz ${nome}: usei ${padrao}. Conferir com o dono antes de usar.`);
    return c ?? padrao;
  };
  const colors = {
    background: cor(cores.fundo, '#FFFFFF', 'cor de fundo'),
    text: cor(cores.texto, '#111111', 'cor de texto'),
    accent: cor(cores.destaque, hex(cores.texto) ?? '#111111', 'cor de destaque'),
  };
  if (hex(cores.base_escura)) colors.darkBase = hex(cores.base_escura);
  const secundarias = (cores.secundarias ?? []).map(hex).filter(Boolean).slice(0, 10);
  if (secundarias.length) colors.secondary = secundarias;

  const tipos = marca?.tipografia ?? {};
  const familia = (valor, nome) => {
    if (typeof valor === 'string' && valor.trim()) return valor.trim();
    notes.push(`a marca não traz a fonte de ${nome}: usei sans-serif.`);
    return 'sans-serif';
  };
  const fonts = { heading: { family: familia(tipos.titulos, 'títulos') }, body: { family: familia(tipos.corpo, 'corpo') } };
  notes.push('as fontes vêm só com o nome: ponha o arquivo (.woff2) em assets/ e ligue em brand.fonts para o render não depender da máquina.');

  const logos = {};
  if (logoAssetId) {
    logos.primary = logoAssetId;
    if (marca?.logo?.fundo === 'claro') notes.push('o logo tem fundo claro: em cena escura, pôr sobre um cartão claro.');
  } else notes.push('a marca não traz logo: peça o arquivo ao dono.');

  return { brand: { source, syncedAt, colors, fonts, logos }, notes };
}

/**
 * Cores e fontes usadas na peça que não são da marca.
 * @returns {Array<{ code: string, path: string, message: string }>}
 */
export function brandConsistency(project) {
  const { brand } = project;
  const paleta = new Set([brand.colors.background, brand.colors.text, brand.colors.accent, brand.colors.darkBase, ...(brand.colors.secondary ?? []), '#FFFFFF', '#000000']
    .filter(Boolean).map((c) => c.toUpperCase()));
  const achados = [];
  const cor = (valor, path) => {
    if (valor === undefined || valor.startsWith('brand.')) return;
    const base = valor.slice(0, 7).toUpperCase(); // ignora a transparência de #RRGGBBAA
    if (!paleta.has(base)) achados.push({ code: 'COLOR_NOT_IN_BRAND', path, message: `A cor ${valor} não é da marca.` });
  };
  cor(project.composition.background, '/composition/background');
  project.scenes.forEach((cena, i) => {
    cor(cena.background, `/scenes/${i}/background`);
    cena.layers.forEach((camada, j) => {
      const p = `/scenes/${i}/layers/${j}`;
      if (camada.type === 'text') cor(camada.text.color, `${p}/text/color`);
      if (camada.type === 'shape') { cor(camada.shape.fill, `${p}/shape/fill`); cor(camada.shape.stroke?.color, `${p}/shape/stroke/color`); }
    });
  });
  return achados;
}

export { resolveColor };
