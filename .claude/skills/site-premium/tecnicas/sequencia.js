// Sequência — um vídeo que anda com a rolagem: o visitante controla o filme. Solda acendendo, peça
// sendo cortada, massa crescendo, a porta da oficina abrindo, o drone chegando na obra.
//
// import { sequencia } from './tecnicas/sequencia.js';
// const s = sequencia(document.querySelector('#quadro'), {
//   quadros: (i) => `img/seq/${String(i + 1).padStart(4, '0')}.webp`, total: 120,
// });
// palco(secao, s.progresso);
//
// Quadros soltos em canvas (padrão) andam pra frente e pra trás sem engasgar em nenhum celular.
// Tirar do vídeo: ffmpeg -i bruto.mp4 -vf "fps=24,scale=1600:-2" -c:v libwebp -q:v 72 img/seq/%04d.webp
// Pra 120 quadros de 1600 px dá 4–8 MB: carregar só no palco que usa. No celular `passo: 2` pega um
// quadro sim, outro não. Alternativa com um arquivo só, em desktop: { video: 'img/filme.mp4' }, gerado
// com ffmpeg -i bruto.mp4 -g 1 -an -c:v libx264 -crf 24 filme.mp4 (todo quadro é chave).

import { quandoVisivel } from './palco.js';

export function sequencia(quadro, opcoes = {}) {
  const o = { quadros: null, total: 0, passo: innerWidth < 760 ? 2 : 1, video: null, ...opcoes };

  if (o.video) {
    const v = document.createElement('video');
    v.className = 'tec-canvas sequencia-video';
    Object.assign(v, { src: o.video, muted: true, playsInline: true, preload: 'auto' });
    v.setAttribute('aria-hidden', 'true');
    quadro.prepend(v);
    return { progresso(p) { if (v.duration) v.currentTime = p * (v.duration - 0.05); } };
  }

  const canvas = document.createElement('canvas');
  canvas.className = 'tec-canvas';
  canvas.setAttribute('aria-hidden', 'true');
  quadro.prepend(canvas);
  const ctx = canvas.getContext('2d');
  const dpr = Math.min(devicePixelRatio, innerWidth < 760 ? 1.5 : 2);
  const indices = [];
  for (let i = 0; i < o.total; i += o.passo) indices.push(i);
  const imagens = new Array(indices.length).fill(null);
  let atual = 0, desenhado = -1;

  function ajustar() {
    canvas.width = quadro.clientWidth * dpr;
    canvas.height = quadro.clientHeight * dpr;
    desenhado = -1;
    desenhar();
  }
  function maisPerto(k) {
    for (let d = 0; d < imagens.length; d++) {
      if (imagens[k - d]) return k - d;
      if (imagens[k + d]) return k + d;
    }
    return -1;
  }
  function desenhar() {
    const k = maisPerto(atual);
    if (k < 0 || k === desenhado) return;
    desenhado = k;
    const img = imagens[k];
    const W = canvas.width, H = canvas.height;
    const e = Math.max(W / img.width, H / img.height);
    ctx.drawImage(img, (W - img.width * e) / 2, (H - img.height * e) / 2, img.width * e, img.height * e);
  }
  new ResizeObserver(ajustar).observe(quadro);
  ajustar();

  // carrega em passadas: primeiro um esqueleto do filme inteiro, depois preenche os buracos
  const ordem = [];
  for (let salto = 16; salto >= 1; salto = Math.floor(salto / 2)) {
    for (let k = 0; k < indices.length; k += salto) if (!ordem.includes(k)) ordem.push(k);
  }
  let proximo = 0, ativos = 0;
  function buscar() {
    while (ativos < 6 && proximo < ordem.length) {
      const k = ordem[proximo++];
      ativos++;
      const img = new Image();
      img.onload = img.onerror = () => {
        ativos--;
        if (img.naturalWidth) { imagens[k] = img; desenhar(); }
        buscar();
      };
      img.src = o.quadros(indices[k]);
    }
  }
  quandoVisivel(quadro, (v) => { if (v) buscar(); }); // nada baixa antes de o palco chegar perto da tela

  return {
    progresso(p) {
      atual = Math.round(p * (indices.length - 1));
      desenhar();
    },
    get carregados() { return imagens.filter(Boolean).length; },
    total: indices.length,
  };
}
