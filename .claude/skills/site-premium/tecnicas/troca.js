// Troca — passar de uma foto pra outra com matéria, nunca com um desvanecer:
//   'tinta'     mancha que cresce de onde o dedo tocou, com a beira irregular   (gráfica, tatuagem, pintura, vinho)
//   'queima'    a foto nova queima a antiga em retalhos, com um fio de brasa    (churrasco, forno, solda, café)
//   'persiana'  lâminas que abrem uma depois da outra                           (persianas, arquitetura, escritório)
//   'iris'      diafragma de câmera fechando na imagem                          (fotógrafo, ótica, cinema, segurança)
//
// import { troca } from './tecnicas/troca.js';
// const t = troca(document.querySelector('#galeria'), {
//   imagens: [{ src: 'img/obra-1.webp', alt: 'Fachada pronta' }, { src: 'img/obra-2.webp', alt: 'Sala' }],
//   modo: 'tinta',
// });
// botao.onclick = (e) => t.proxima(e);        // passar o evento faz a mancha nascer no ponto do toque
// palco(secao, t.progresso);                   // ou a rolagem leva de uma foto pra outra
//
// As <img> ficam no HTML com o alt: sem WebGL, com a imagem bloqueada por CORS ou com "reduzir
// movimento", a troca vira um desvanecer simples. Imagens do mesmo site, de qualquer proporção
// (o enquadramento é "cobrir"). WebGL puro, sem three.
// Mecânica vista na Morph Gallery de Kedhareswer Naidu (21st.dev); o shader é daqui.

import { limitar, suave, semMovimento, quandoVisivel } from './palco.js';

const MODOS = { tinta: 0, queima: 1, persiana: 2, iris: 3 };
const VERT = 'attribute vec2 p; varying vec2 v; void main(){ v = p * .5 + .5; gl_Position = vec4(p, 0., 1.); }';
const FRAG = `precision mediump float;
varying vec2 v; uniform sampler2D A, B; uniform vec2 rA, rB, res, centro; uniform float t, modo;
float h(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
float n(vec2 p){ vec2 i = floor(p), f = fract(p); f = f * f * (3. - 2. * f);
  return mix(mix(h(i), h(i + vec2(1., 0.)), f.x), mix(h(i + vec2(0., 1.)), h(i + vec2(1., 1.)), f.x), f.y); }
float fbm(vec2 p){ float s = 0., a = .5; for (int i = 0; i < 4; i++) { s += a * n(p); p *= 2.03; a *= .5; } return s; }
vec2 cobrir(vec2 uv, vec2 r){ float ra = res.x / res.y, ri = r.x / r.y;
  vec2 s = ra > ri ? vec2(1., ri / ra) : vec2(ra / ri, 1.); return (uv - .5) * s + .5; }
void main(){
  vec2 uv = vec2(v.x, 1. - v.y);
  vec2 q = (uv - centro) * vec2(res.x / res.y, 1.);
  float m = 0., brasa = 0.;
  if (modo < .5) {
    float d = length(q) + (fbm(uv * 5.) - .5) * .55;
    m = 1. - smoothstep(-.02, .02, d - (t * 2.6 - .3));
  } else if (modo < 1.5) {
    float f = fbm(uv * 4. + 3.) - (t * 1.15 - .08);
    m = 1. - smoothstep(-.03, .03, f);
    brasa = (1. - smoothstep(0., .07, abs(f))) * step(.001, t) * step(t, .999);
  } else if (modo < 2.5) {
    m = step(fract(uv.x * 9.), clamp(t * 1.6 - uv.x * .6, 0., 1.));
  } else {
    float seg = 6.28318 / 7.;
    float pol = length(q) * cos(mod(atan(q.y, q.x) + t * 1.2, seg) - seg * .5);
    m = 1. - smoothstep(-.006, .006, pol - t * 1.9);
  }
  vec3 a = texture2D(A, cobrir(uv, rA)).rgb, b = texture2D(B, cobrir(uv, rB)).rgb;
  gl_FragColor = vec4(mix(a, b, m) + brasa * vec3(1., .78, .5) * .7, 1.);
}`;

export function troca(el, opcoes = {}) {
  const o = { imagens: [], modo: 'tinta', duracao: 1500, ...opcoes };
  const parado = semMovimento();
  el.classList.add('troca');
  let fotos = [...el.querySelectorAll('img')];
  if (!fotos.length) {
    fotos = o.imagens.map((im, i) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.alt = im.alt || '';
      img.decoding = 'async';
      if (i > 0) img.loading = 'lazy';
      img.src = im.src || im;
      el.append(img);
      return img;
    });
  }
  fotos.forEach((f, i) => { f.classList.add('troca-foto'); f.classList.toggle('ativa', i === 0); });
  const n = fotos.length;
  let de = 0, para = 0, t = 1, centro = [0.5, 0.5], raf = 0, inicio = 0, visivel = true;

  // ----- WebGL (se der) -----
  const canvas = document.createElement('canvas');
  canvas.className = 'tec-canvas';
  canvas.setAttribute('aria-hidden', 'true');
  let gl = parado ? null : canvas.getContext('webgl', { antialias: false, alpha: false });
  let u = {};
  const tex = [];
  if (gl) {
    const sh = (tipo, fonte) => { const s = gl.createShader(tipo); gl.shaderSource(s, fonte); gl.compileShader(s); return s; };
    const prog = gl.createProgram();
    gl.attachShader(prog, sh(gl.VERTEX_SHADER, VERT));
    gl.attachShader(prog, sh(gl.FRAGMENT_SHADER, FRAG));
    gl.linkProgram(prog);
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) gl = null;
    else {
      gl.useProgram(prog);
      gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
      const loc = gl.getAttribLocation(prog, 'p');
      gl.enableVertexAttribArray(loc);
      gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
      for (const nome of ['A', 'B', 'rA', 'rB', 'res', 'centro', 't', 'modo']) u[nome] = gl.getUniformLocation(prog, nome);
      gl.uniform1i(u.A, 0); gl.uniform1i(u.B, 1);
      el.append(canvas);
    }
  }
  function desistir() {                     // sem GL daqui pra frente: as <img> assumem
    gl = null;
    canvas.remove();
    fotos.forEach((f, i) => f.classList.toggle('ativa', i === para));
  }
  function textura(i) {
    if (!gl || tex[i] || !fotos[i].complete || !fotos[i].naturalWidth) return tex[i];
    try {
      const tx = gl.createTexture();
      gl.bindTexture(gl.TEXTURE_2D, tx);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, fotos[i]);
      for (const [k, val] of [[gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE], [gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE], [gl.TEXTURE_MIN_FILTER, gl.LINEAR], [gl.TEXTURE_MAG_FILTER, gl.LINEAR]]) gl.texParameteri(gl.TEXTURE_2D, k, val);
      tex[i] = tx;
    } catch { desistir(); }                 // imagem de outro domínio sem CORS
    return tex[i];
  }
  function desenhar() {
    if (!gl) return;
    const a = textura(de), b = textura(para);
    if (!a || !b) return;
    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D, a);
    gl.activeTexture(gl.TEXTURE1); gl.bindTexture(gl.TEXTURE_2D, b);
    gl.uniform2f(u.rA, fotos[de].naturalWidth, fotos[de].naturalHeight);
    gl.uniform2f(u.rB, fotos[para].naturalWidth, fotos[para].naturalHeight);
    gl.uniform2f(u.res, canvas.width, canvas.height);
    gl.uniform2f(u.centro, centro[0], centro[1]);
    gl.uniform1f(u.t, t);
    gl.uniform1f(u.modo, MODOS[o.modo] ?? 0);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
  }
  function medir() {
    const r = el.getBoundingClientRect();
    const dpr = Math.min(devicePixelRatio || 1, 1.5);
    canvas.width = Math.max(2, Math.round(r.width * dpr));
    canvas.height = Math.max(2, Math.round(r.height * dpr));
    desenhar();
  }
  function quadro(agora) {
    raf = 0;
    if (!visivel) return;
    t = suave(limitar((agora - inicio) / o.duracao));
    desenhar();
    if (t < 1) raf = requestAnimationFrame(quadro);
    else de = para;
  }

  function ir(i, evento) {
    i = ((i % n) + n) % n;
    if (i === para) return;
    de = para; para = i;
    fotos.forEach((f, j) => f.classList.toggle('ativa', j === i));    // também serve de leitura sem GL
    el.dispatchEvent(new CustomEvent('troca', { detail: { indice: i } }));
    if (!gl) return;
    if (evento?.clientX !== undefined) {
      const r = el.getBoundingClientRect();
      centro = [limitar((evento.clientX - r.left) / r.width), limitar((evento.clientY - r.top) / r.height)];
    } else centro = [0.5, 0.5];
    t = 0; inicio = performance.now();
    if (!raf) raf = requestAnimationFrame(quadro);
  }
  function progresso(p) {
    const x = limitar(p) * (n - 1);
    const base = Math.min(n - 2, Math.floor(x));
    if (n < 2) return;
    de = base; para = base + 1; t = limitar(x - base);
    centro = [0.5, 0.5];
    if (gl) desenhar();
    else fotos.forEach((f, j) => f.classList.toggle('ativa', j === (t > 0.5 ? para : de)));
  }

  fotos.forEach((f) => { if (!f.complete) f.addEventListener('load', desenhar, { once: true }); });
  new ResizeObserver(medir).observe(el);
  quandoVisivel(el, (v) => { visivel = v; if (v && t < 1 && !raf && gl) { inicio = performance.now() - t * o.duracao; raf = requestAnimationFrame(quadro); } });
  medir();
  return { ir, proxima: (e) => ir(para + 1, e), anterior: (e) => ir(para - 1, e), progresso, get atual() { return para; } };
}
