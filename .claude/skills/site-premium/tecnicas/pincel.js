// Pincel — o visitante passa o dedo e descobre o resultado: limpa o estofado, tira a sujeira do vidro,
// pinta a parede, revela a fachada pronta. É o "antes e depois" que a pessoa faz com a própria mão.
// Serve pra limpeza, higienização, pintura, funilaria, gráfica, dentista, reforma, jardinagem.
//
// import { pincel } from './tecnicas/pincel.js';
// const b = pincel(document.querySelector('#sofa'), {
//   antes: 'img/sofa-sujo.webp',      // ou uma cor ('#ffffff') pra pintar sobre o vazio
//   depois: 'img/sofa-limpo.webp',    // MESMO enquadramento nas duas
//   alt: 'Sofá depois da higienização',
//   aoCompletar: () => mostrarBotao(),
// });
// Com palco: palco(secao, b.progresso) pinta sozinho conforme a rolagem, pra quem não encostar.
//
// No celular o gesto de lado pinta e o de cima pra baixo continua rolando a página.

const carregar = (src) => new Promise((ok, erro) => { const i = new Image(); i.onload = () => ok(i); i.onerror = erro; i.src = src; });

function cobrir(ctx, img, W, H) {
  const e = Math.max(W / img.naturalWidth, H / img.naturalHeight);
  const w = img.naturalWidth * e, h = img.naturalHeight * e;
  ctx.drawImage(img, (W - w) / 2, (H - h) / 2, w, h);
}

export function pincel(quadro, opcoes = {}) {
  const o = { antes: '#ffffff', depois: '', raio: 58, limite: 0.62, dica: 'Passe o dedo', botao: 'Ver pronto', aoCompletar: () => {}, ...opcoes };
  quadro.classList.add('pincel');
  quadro.innerHTML = `
    <img class="pincel-depois" src="${o.depois}" alt="${o.alt || ''}">
    <canvas class="tec-canvas" aria-hidden="true"></canvas>
    <span class="pincel-dica">${o.dica}</span>
    <button class="pincel-botao" type="button">${o.botao}</button>`;
  const canvas = quadro.querySelector('canvas');
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  const dica = quadro.querySelector('.pincel-dica');
  const dpr = Math.min(devicePixelRatio, 2);
  let W = 0, H = 0, antes = null, pronto = false, largura = 0;

  // carimbo macio: a borda do pincel não fica dura
  const carimbo = document.createElement('canvas');
  carimbo.width = carimbo.height = 256;
  const c = carimbo.getContext('2d');
  const g = c.createRadialGradient(128, 128, 30, 128, 128, 128);
  g.addColorStop(0, 'rgba(0,0,0,1)'); g.addColorStop(0.62, 'rgba(0,0,0,.92)'); g.addColorStop(1, 'rgba(0,0,0,0)');
  c.fillStyle = g; c.fillRect(0, 0, 256, 256);

  function pintarAntes() {
    W = quadro.clientWidth; H = quadro.clientHeight;
    canvas.width = W * dpr; canvas.height = H * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.globalCompositeOperation = 'source-over';
    if (antes) cobrir(ctx, antes, W, H);
    else { ctx.fillStyle = o.antes; ctx.fillRect(0, 0, W, H); }
    ctx.globalCompositeOperation = 'destination-out';
  }
  new ResizeObserver(() => { if (quadro.clientWidth !== largura) { largura = quadro.clientWidth; if (!pronto) pintarAntes(); } }).observe(quadro);
  if (/^#/.test(o.antes)) pintarAntes();
  else carregar(o.antes).then((i) => { antes = i; pintarAntes(); });

  function carimbar(x, y) {
    const r = o.raio;
    ctx.drawImage(carimbo, x - r, y - r, r * 2, r * 2);
  }
  function traco(x0, y0, x1, y1) {
    const passos = Math.max(1, Math.hypot(x1 - x0, y1 - y0) / (o.raio / 4));
    for (let i = 0; i <= passos; i++) carimbar(x0 + (x1 - x0) * i / passos, y0 + (y1 - y0) * i / passos);
  }

  // mede o quanto já foi descoberto numa cópia pequena (ler o canvas inteiro travaria o celular)
  const amostra = document.createElement('canvas');
  amostra.width = 48; amostra.height = 30;
  const a = amostra.getContext('2d', { willReadFrequently: true });
  function descoberto() {
    a.clearRect(0, 0, 48, 30);
    a.drawImage(canvas, 0, 0, 48, 30);
    const d = a.getImageData(0, 0, 48, 30).data;
    let vazios = 0;
    for (let i = 3; i < d.length; i += 4) if (d[i] < 40) vazios++;
    return vazios / (48 * 30);
  }

  function concluir() {
    if (pronto) return;
    pronto = true;
    quadro.classList.add('pincel-pronto');
    o.aoCompletar();
  }
  quadro.querySelector('.pincel-botao').addEventListener('click', concluir);

  let ultimo = null, medido = 0;
  const ponto = (e) => { const r = canvas.getBoundingClientRect(); return [e.clientX - r.left, e.clientY - r.top]; };
  canvas.addEventListener('pointerdown', (e) => {
    ultimo = ponto(e);
    carimbar(...ultimo);
    dica.classList.add('sumiu');
  });
  // com mouse basta passar por cima; no toque o pointerdown já marcou o início do traço
  canvas.addEventListener('pointermove', (e) => {
    if (!ultimo) { ultimo = ponto(e); dica.classList.add('sumiu'); }
    const atual = ponto(e);
    traco(...ultimo, ...atual);
    ultimo = atual;
    const agora = performance.now();
    if (agora - medido > 220) { medido = agora; if (descoberto() >= o.limite) concluir(); }
  });
  const soltar = () => { ultimo = null; };
  canvas.addEventListener('pointerup', soltar);
  canvas.addEventListener('pointercancel', soltar);
  canvas.addEventListener('pointerleave', soltar);

  // zigue-zague de ponta a ponta, pintando conforme a rolagem
  const carreiras = 6;
  let pintado = 0;
  function posicao(t) {
    const s = t * carreiras, i = Math.min(Math.floor(s), carreiras - 1), f = s - i;
    return [(i % 2 ? 1 - f : f) * W, ((i + f) / carreiras) * H];
  }
  return {
    concluir,
    progresso(p) {
      if (pronto || !W || p <= pintado) return;
      dica.classList.add('sumiu');
      traco(...posicao(pintado), ...posicao(p));
      pintado = p;
      if (p >= 0.98) concluir();
    },
  };
}
