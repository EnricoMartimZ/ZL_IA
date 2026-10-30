// Superfície — a foto vira matéria. Quatro modos sobre uma imagem comum (sem 3D nem mapa extra):
//   relevo  a luz segue o mouse/dedo e acha o relevo da própria foto: pedra, metal, couro, madeira, tecido
//   agua    a imagem ondula como reflexo e o toque abre um anel: piscina, bebida, lavanderia, limpeza
//   vidro   vidro canelado entorta o que está atrás e o toque limpa uma janela: vidraçaria, box, clínica
//   calor   ar quente tremendo, mais forte embaixo: forno, solda, churrasco, asfalto, climatização
//
// import { superficie } from './tecnicas/superficie.js';
// const s = superficie(document.querySelector('#quadro'), { imagem: 'img/marmore.webp', modo: 'relevo', cor: '#ffe9c9' });
// palco(secao, s.progresso);   // a rolagem controla a força; sem palco, fica em `forca`
//
// O claro da foto é tratado como alto e o escuro como fundo, então funciona melhor em textura de
// perto do que em foto de gente. Sem WebGL a foto fica parada: o conteúdo não depende do efeito.

import { quandoVisivel, semMovimento } from './palco.js';

const MODOS = { relevo: 0, agua: 1, vidro: 2, calor: 3 };
const hex = (h) => { const v = parseInt(h.replace('#', ''), 16); return [(v >> 16) / 255, ((v >> 8) & 255) / 255, (v & 255) / 255]; };

const VERT = 'attribute vec2 a; varying vec2 v; void main(){ v = a * .5 + .5; gl_Position = vec4(a, 0., 1.); }';
const FRAG = `precision highp float;
varying vec2 v;
uniform sampler2D tex;
uniform vec2 tela, img, mouse;
uniform float t, forca, toque, canelas;
uniform int modo;
uniform vec3 cor;

vec2 cobrir(vec2 u) {
  float a = tela.x / tela.y, b = img.x / img.y;
  vec2 e = a > b ? vec2(1., b / a) : vec2(a / b, 1.);
  return (u - .5) * e + .5;
}
float lum(vec2 u) { return dot(texture2D(tex, u).rgb, vec3(.299, .587, .114)); }
float h(vec2 q) { return fract(sin(dot(q, vec2(127.1, 311.7))) * 43758.5453); }
float ruido(vec2 p) {
  vec2 i = floor(p), f = fract(p);
  f = f * f * (3. - 2. * f);
  return mix(mix(h(i), h(i + vec2(1., 0.)), f.x), mix(h(i + vec2(0., 1.)), h(i + vec2(1., 1.)), f.x), f.y);
}

void main() {
  vec2 d = (v - mouse) * vec2(tela.x / tela.y, 1.);
  float r = length(d);
  vec3 c;
  if (modo == 0) {
    vec2 q = cobrir(v);
    vec2 px = 1.5 / img;
    float l = lum(q), k = 3. + forca * 16.;
    vec3 n = normalize(vec3((l - lum(q + vec2(px.x, 0.))) * k, (l - lum(q + vec2(0., px.y))) * k, 1.));
    vec3 L = normalize(vec3(-d, .24));
    float dif = max(dot(n, L), 0.);
    float esp = pow(max(dot(reflect(-L, n), vec3(0., 0., 1.)), 0.), 26.);
    float cai = 1. / (1. + r * r * 5.);
    c = texture2D(tex, q).rgb * (.3 + dif * cai * 1.2 * cor) + cor * esp * cai * .5 * forca;
  } else if (modo == 1) {
    float o = sin(v.y * 38. + t * 1.4) * .0016 + sin(v.y * 17. - t * .9 + v.x * 9.) * .0024 + (ruido(v * vec2(7., 26.) + t * .35) - .5) * .007;
    float anel = sin(r * 60. - t * 6.) * exp(-r * 7.) * toque;
    vec2 q = cobrir(v + vec2(o, o * .6) * forca * 2. + normalize(d + 1e-4) * anel * .02);
    c = texture2D(tex, q).rgb + cor * pow(ruido(v * vec2(12., 30.) + t * .4), 3.) * .2 * forca;
  } else if (modo == 2) {
    float o = (fract(v.x * canelas) - .5) * 2.;
    float aberto = smoothstep(.1, .3, r + (1. - toque));
    vec2 q = cobrir(v + vec2(o * .05 * forca * aberto, 0.));
    float b = .005 * forca * aberto;
    c = (texture2D(tex, q).rgb + texture2D(tex, q + vec2(0., b)).rgb + texture2D(tex, q - vec2(0., b)).rgb + texture2D(tex, q + vec2(b, 0.)).rgb) / 4.;
    c *= 1. - .14 * o * o * forca * aberto;
    c += cor * pow(1. - abs(o), 7.) * .1 * forca * aberto;
  } else {
    float alto = pow(1. - v.y, 1.6);
    float o = (ruido(vec2(v.x * 14., v.y * 9. - t * 1.8)) - .5) * .035 * alto * forca;
    c = texture2D(tex, cobrir(v + vec2(o, o * .4))).rgb + cor * alto * alto * .08 * forca;
  }
  gl_FragColor = vec4(c, 1.);
}`;

export function superficie(quadro, opcoes = {}) {
  const o = { imagem: '', modo: 'relevo', cor: '#ffffff', forca: 1, canelas: 26, ...opcoes };
  const foto = document.createElement('img');
  foto.className = 'superficie-foto';
  foto.src = o.imagem;
  foto.alt = o.alt || '';
  const canvas = document.createElement('canvas');
  canvas.className = 'tec-canvas';
  canvas.setAttribute('aria-hidden', 'true');
  quadro.prepend(foto, canvas);

  const gl = canvas.getContext('webgl', { antialias: false, alpha: false });
  if (!gl) { canvas.remove(); return { progresso() {} }; }

  const compilar = (tipo, src) => { const s = gl.createShader(tipo); gl.shaderSource(s, src); gl.compileShader(s); return s; };
  const prog = gl.createProgram();
  gl.attachShader(prog, compilar(gl.VERTEX_SHADER, VERT));
  gl.attachShader(prog, compilar(gl.FRAGMENT_SHADER, FRAG));
  gl.linkProgram(prog);
  if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) { console.warn(gl.getProgramInfoLog(prog)); canvas.remove(); return { progresso() {} }; }
  gl.useProgram(prog);
  gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
  const pos = gl.getAttribLocation(prog, 'a');
  gl.enableVertexAttribArray(pos);
  gl.vertexAttribPointer(pos, 2, gl.FLOAT, false, 0, 0);
  const u = (n) => gl.getUniformLocation(prog, n);
  const U = { tela: u('tela'), img: u('img'), mouse: u('mouse'), t: u('t'), forca: u('forca'), toque: u('toque'), canelas: u('canelas'), modo: u('modo'), cor: u('cor') };
  gl.uniform1i(U.modo, MODOS[o.modo] ?? 0);
  gl.uniform3fv(U.cor, hex(o.cor));
  gl.uniform1f(U.canelas, innerWidth < 760 ? o.canelas * 0.6 : o.canelas);

  const dpr = Math.min(devicePixelRatio, innerWidth < 760 ? 1.5 : 2);
  function ajustar() {
    canvas.width = Math.max(1, quadro.clientWidth * dpr);
    canvas.height = Math.max(1, quadro.clientHeight * dpr);
    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.uniform2f(U.tela, canvas.width, canvas.height);
  }
  new ResizeObserver(ajustar).observe(quadro);
  ajustar();

  let pronta = false;
  const textura = new Image();
  if (/^https?:/.test(o.imagem)) textura.crossOrigin = 'anonymous';
  textura.onload = () => {
    gl.bindTexture(gl.TEXTURE_2D, gl.createTexture());
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, textura);
    for (const [k, val] of [[gl.TEXTURE_MIN_FILTER, gl.LINEAR], [gl.TEXTURE_MAG_FILTER, gl.LINEAR], [gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE], [gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE]]) gl.texParameteri(gl.TEXTURE_2D, k, val);
    gl.uniform2f(U.img, textura.naturalWidth, textura.naturalHeight);
    pronta = true;
  };
  textura.src = o.imagem;

  const m = { x: 0.5, y: 0.5, ax: 0.5, ay: 0.5, toque: 0, alvoToque: 0, ultimo: -1e9 };
  quadro.addEventListener('pointermove', (e) => {
    const r = quadro.getBoundingClientRect();
    m.ax = (e.clientX - r.left) / r.width;
    m.ay = 1 - (e.clientY - r.top) / r.height;
    m.alvoToque = 1;
    m.ultimo = performance.now();
  });
  quadro.addEventListener('pointerleave', () => { m.alvoToque = 0; });

  const parado = semMovimento();
  let forca = o.forca, vivo = true, id = 0;
  function desenhar(agora) {
    if (!vivo) return;
    id = requestAnimationFrame(desenhar);
    if (!pronta) return;
    // sem ninguém mexendo (celular parado), a luz passeia devagar pra superfície continuar viva
    if (!parado && agora - m.ultimo > 2500) {
      m.ax = 0.5 + Math.sin(agora / 3100) * 0.34;
      m.ay = 0.5 + Math.cos(agora / 2300) * 0.3;
    }
    m.x += (m.ax - m.x) * 0.1; m.y += (m.ay - m.y) * 0.1;
    m.toque += (m.alvoToque - m.toque) * 0.06;
    gl.uniform2f(U.mouse, m.x, m.y);
    gl.uniform1f(U.t, parado ? 0 : agora / 1000);
    gl.uniform1f(U.forca, forca);
    gl.uniform1f(U.toque, m.toque);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
  }
  id = requestAnimationFrame(desenhar);
  quandoVisivel(quadro, (v) => {
    if (v && !vivo) { vivo = true; id = requestAnimationFrame(desenhar); }
    if (!v) { vivo = false; cancelAnimationFrame(id); }
  });

  return { progresso(p) { forca = p * o.forca; }, canvas };
}
