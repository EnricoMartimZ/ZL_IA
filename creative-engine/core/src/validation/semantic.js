// Segunda camada da validação: regras que cruzam campos e que o JSON Schema não expressa.
// Só roda em projeto que já passou no schema.
import { getTimeline, overlapIn } from '../timeline/index.js';

/** @typedef {import('../types.js').Problem} Problem */

export const MIN_FONT_SIZE = 28; // o mínimo de vídeo vertical da /video-reels

const TOKEN = /^brand\.(background|text|accent|darkBase|secondary\.([0-9]))$/;

/** A referência de cor existe na marca? Cor literal sempre existe. */
export function brandTokenDefined(brand, color) {
  const m = TOKEN.exec(color);
  if (!m) return true;
  if (m[2] !== undefined) return (brand.colors.secondary ?? [])[Number(m[2])] !== undefined;
  return brand.colors[m[1]] !== undefined;
}

/**
 * @param {any} project projeto já válido no schema
 * @returns {{ errors: Problem[], warnings: Problem[] }}
 */
export function validateSemantics(project) {
  const errors = [], warnings = [];
  const erro = (code, path, message, hint) => errors.push(hint ? { code, path, message, hint } : { code, path, message });
  const aviso = (code, path, message, hint) => warnings.push(hint ? { code, path, message, hint } : { code, path, message });

  const { brand, composition, assets, scenes } = project;
  const assetPorId = new Map();
  const usados = new Set();

  // ---- ids únicos ----
  const vistos = new Set();
  const unico = (tipo, id, path) => {
    if (vistos.has(`${tipo}:${id}`)) erro('DUPLICATE_ID', path, `Id repetido: "${id}".`, 'Cada asset, cena e camada tem id único no projeto inteiro.');
    vistos.add(`${tipo}:${id}`);
  };
  assets.forEach((a, i) => { unico('asset', a.id, `/assets/${i}/id`); if (!assetPorId.has(a.id)) assetPorId.set(a.id, a); });

  // ---- referências a assets ----
  const conferirAsset = (id, tipo, path) => {
    usados.add(id);
    const asset = assetPorId.get(id);
    if (!asset) erro('ASSET_NOT_FOUND', path, `Asset "${id}" não existe em assets.`);
    else if (asset.type !== tipo) erro('ASSET_TYPE_MISMATCH', path, `Asset "${id}" é do tipo ${asset.type}; aqui precisa ser ${tipo}.`);
  };
  for (const papel of ['primary', 'onDark', 'onLight']) {
    if (brand.logos[papel]) conferirAsset(brand.logos[papel], 'logo', `/brand/logos/${papel}`);
  }
  for (const papel of ['heading', 'body']) {
    const fonte = brand.fonts[papel];
    if (fonte.assetId) conferirAsset(fonte.assetId, 'font', `/brand/fonts/${papel}/assetId`);
    else aviso('FONT_WITHOUT_FILE', `/brand/fonts/${papel}`, `A fonte "${fonte.family}" não tem arquivo no projeto.`, 'Sem o arquivo, o render depende da fonte instalada na máquina.');
  }

  // ---- cores e fontes da marca ----
  const cor = (valor, path) => {
    if (valor !== undefined && !brandTokenDefined(brand, valor)) erro('BRAND_TOKEN_UNDEFINED', path, `A marca não define ${valor}.`, 'Defina a cor em brand.colors ou use outra referência.');
  };
  const familias = new Set(['brand.heading', 'brand.body', brand.fonts.heading.family, brand.fonts.body.family]);
  cor(composition.background, '/composition/background');

  // ---- tempo ----
  const total = getTimeline(project).totalFrames;
  if (total !== composition.durationFrames) {
    erro('DURATION_MISMATCH', '/composition/durationFrames', `Duração declarada (${composition.durationFrames}) diferente da calculada (${total}).`,
      'É a soma das cenas menos a soma das transições.');
  }

  const area = composition.safeArea;
  const foraDaArea = (b) => b.x < area.left || b.y < area.top
    || b.x + b.width > composition.width - area.right || b.y + b.height > composition.height - area.bottom;

  scenes.forEach((cena, i) => {
    const pc = `/scenes/${i}`;
    unico('scene', cena.id, `${pc}/id`);
    cor(cena.background, `${pc}/background`);

    if (cena.transitionIn) {
      const t = cena.transitionIn;
      if (i === 0) erro('FIRST_SCENE_TRANSITION', `${pc}/transitionIn`, 'A primeira cena não tem cena anterior para fazer transição.');
      else {
        const anterior = scenes[i - 1];
        const livreNaAnterior = anterior.durationFrames - overlapIn(anterior, i - 1);
        if (t.durationFrames > cena.durationFrames || t.durationFrames > livreNaAnterior) {
          erro('TRANSITION_TOO_LONG', `${pc}/transitionIn/durationFrames`, `Transição de ${t.durationFrames} quadros não cabe entre as duas cenas.`,
            'Ela não pode ser maior que a cena que entra nem que o trecho livre da cena anterior.');
        }
      }
      if (t.type !== 'fade' && !t.direction) erro('SLIDE_WITHOUT_DIRECTION', `${pc}/transitionIn/direction`, `Transição ${t.type} precisa de direction.`);
    }
    if (cena.layers.length === 0 && cena.background === undefined) aviso('EMPTY_SCENE', pc, `A cena "${cena.id}" não tem camada nem fundo.`);

    cena.layers.forEach((camada, j) => {
      const pl = `${pc}/layers/${j}`;
      unico('layer', camada.id, `${pl}/id`);
      if (camada.startFrame + camada.durationFrames > cena.durationFrames) {
        erro('LAYER_OUT_OF_SCENE', pl, `A camada "${camada.id}" termina no quadro ${camada.startFrame + camada.durationFrames} e a cena tem ${cena.durationFrames}.`);
      }

      // animações prontas
      const idsAnim = new Set();
      let entra = 0, sai = 0;
      (camada.animations ?? []).forEach((a, k) => {
        if (idsAnim.has(a.id)) erro('DUPLICATE_ID', `${pl}/animations/${k}/id`, `Id de animação repetido na camada: "${a.id}".`);
        idsAnim.add(a.id);
        const fim = (a.delayFrames ?? 0) + a.durationFrames;
        if (a.role === 'in') entra = Math.max(entra, fim); else sai = Math.max(sai, fim);
        if (a.preset === 'slide' && !a.params?.direction) erro('SLIDE_WITHOUT_DIRECTION', `${pl}/animations/${k}/params/direction`, 'Animação slide precisa de params.direction.');
      });
      if (entra + sai > camada.durationFrames) {
        erro('ANIMATION_OVERFLOW', `${pl}/animations`, `Entrada (${entra}) e saída (${sai}) somam mais que a duração da camada (${camada.durationFrames}).`);
      }

      // keyframes
      for (const [prop, trilha] of Object.entries(camada.keyframes ?? {})) {
        trilha.forEach((k, n) => {
          const pk = `${pl}/keyframes/${prop}/${n}`;
          if (n > 0 && k.frame <= trilha[n - 1].frame) erro('KEYFRAME_ORDER', pk, 'Os quadros de uma trilha têm que crescer, sem repetir.');
          if (k.frame >= camada.durationFrames) erro('KEYFRAME_OUT_OF_LAYER', pk, `Keyframe no quadro ${k.frame}, mas a camada tem ${camada.durationFrames} quadros.`);
        });
      }

      // conteúdo
      if (camada.type === 'text') {
        cor(camada.text.color, `${pl}/text/color`);
        if (!familias.has(camada.text.fontFamily)) {
          erro('FONT_NOT_IN_BRAND', `${pl}/text/fontFamily`, `A fonte "${camada.text.fontFamily}" não é da marca.`, 'Use brand.heading, brand.body ou uma família de brand.fonts.');
        }
        if (camada.text.fontSize < MIN_FONT_SIZE) aviso('TEXT_TOO_SMALL', `${pl}/text/fontSize`, `Texto de ${camada.text.fontSize} px: abaixo de ${MIN_FONT_SIZE} px fica ilegível no celular.`);
      } else if (camada.type === 'image') conferirAsset(camada.image.assetId, 'image', `${pl}/image/assetId`);
      else if (camada.type === 'logo') conferirAsset(camada.logo.assetId, 'logo', `${pl}/logo/assetId`);
      else if (camada.type === 'shape') {
        cor(camada.shape.fill, `${pl}/shape/fill`);
        cor(camada.shape.stroke?.color, `${pl}/shape/stroke/color`);
      }
      if ((camada.type === 'text' || camada.type === 'logo') && foraDaArea(camada.box)) {
        aviso('TEXT_OUTSIDE_SAFE_AREA', `${pl}/box`, `A camada "${camada.id}" sai da área segura.`, 'Fora dela, a barra e os botões do aplicativo cobrem o conteúdo.');
      }
    });
  });

  assets.forEach((a, i) => {
    if (!usados.has(a.id)) aviso('UNUSED_ASSET', `/assets/${i}`, `O asset "${a.id}" não é usado por nenhuma camada nem pela marca.`);
  });

  return { errors, warnings };
}
