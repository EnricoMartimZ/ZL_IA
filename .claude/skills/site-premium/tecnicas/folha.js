// Folha — cada imagem é uma folha impressa: o visitante puxa a beira, o papel enrola sobre um cilindro
// iluminado, mostra o verso com a tinta aparecendo do outro lado e faz sombra na página de baixo.
// Serve pra cardápio, catálogo, revista, portfólio de gráfica, papelaria, livro de obras.
//
// import { folha } from './tecnicas/folha.js';
// folha(document.querySelector('#cardapio'), {
//   paginas: [{ src: 'img/pag1.webp', alt: 'Entradas' }, { src: 'img/pag2.webp', alt: 'Pratos' }],
//   papel: '#ede8dc',                       // cor do verso
//   aoMudar: (i) => { legenda.textContent = `Página ${i + 1}`; },
// });
//
// O quadro precisa de altura definida, de preferência na proporção da página (aspect-ratio): a imagem
// cobre o quadro e o que sobra é cortado, então página deitada num quadro em pé perde as bordas. Passar o mouse na beira levanta o canto; tocar à direita avança,
// à esquerda volta; arrastar decide pela velocidade ou pela metade do caminho. Setas do teclado também.
// A imagem precisa vir do mesmo site ou de data: URL (WebGL não lê imagem de outro domínio sem CORS).
// Sem WebGL, ou com "reduzir movimento", as páginas só trocam, sem a dobra.
//
// Sombreador e contas da dobra vêm do Paper Curl Carousel, de Kedhareswer Naidu (21st.dev, licença MIT).

import { limitar, semMovimento } from './palco.js';

const RAIO = 0.09, FLICK = 0.11, W_VIRA = 4.5, W_ESPIA = 16, EMPURRA_SAI = 0.3, EMPURRA_CHEGA = 0.2;
const INCLINA = -0.4, ESPIA_PROX = 0.22, ESPIA_ANT = 0.07;

const VERT = 'attribute vec2 p; varying vec2 v_uv; void main(){ v_uv = p * .5 + .5; gl_Position = vec4(p, 0., 1.); }';
const FRAG = `precision highp float;
uniform sampler2D u_de, u_para;
uniform vec2 u_res, u_dir;
uniform float u_ade, u_apara, u_dobra, u_r, u_sombra, u_virando;
uniform vec3 u_papel;
varying vec2 v_uv;
const float PI = 3.14159265;
const vec2 LUZ = vec2(.33, .944);
float asp() { return u_res.x / u_res.y; }
vec3 capa(sampler2D t, float ia, vec2 P) {
  float a = asp();
  vec2 uv = vec2(P.x / a, P.y);
  vec2 s = a > ia ? vec2(1., ia / a) : vec2(a / ia, 1.);
  return texture2D(t, (uv - .5) * s + .5).rgb;
}
float sdPag(vec2 P) {
  vec2 h = vec2(asp(), 1.) * .5;
  vec2 q = abs(P - h) - h;
  return length(max(q, 0.)) + min(max(q.x, q.y), 0.);
}
float temPapel(vec2 P, float aa) { return clamp(.5 - sdPag(P) / aa, 0., 1.); }
float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
float luzVerso(float th) {
  vec2 n = vec2(sin(th), -cos(th));
  float d = dot(n, LUZ);
  return .64 + .34 * clamp(d, 0., 1.) + pow(max(d, 0.), 14.) * .07;
}
vec3 verso(vec2 P, float luz) {
  vec3 tinta = capa(u_de, u_ade, P);
  float l = dot(tinta, vec3(.299, .587, .114));
  vec3 c = u_papel * mix(1., .72 + .28 * l, .35);
  float dente = hash(floor(P * u_res.y * .7)) - .5;
  float fibra = hash(vec2(floor(P.x * 9.), floor(P.y * u_res.y * .25))) - .5;
  return (c + dente * .03 + fibra * .012) * luz;
}
void main() {
  vec2 p = vec2(v_uv.x * asp(), v_uv.y);
  float aa = 1.2 / u_res.y;
  float grao = (hash(floor(v_uv * u_res)) - .5) * .024;
  if (u_virando < .5) { gl_FragColor = vec4(capa(u_de, u_ade, p) + grao, 1.); return; }
  float d = dot(p, u_dir), f = u_dobra, R = u_r;
  vec3 col = capa(u_para, u_apara, p) + grao;
  vec2 topo = p + u_dir * (f + R * PI * .5 - d);
  float ao = 1. - smoothstep(0., R * .8, sdPag(topo));
  float alem = max(d - f - R, 0.);
  col *= 1. - .42 * u_sombra * ao * exp(-alem / (R * .8)) * step(f, d);
  vec2 deitado = p + u_dir * (2. * f + PI * R - 2. * d);
  if (d < f) {
    float oc = .3 * exp(-max(sdPag(deitado), 0.) / (R * .28));
    float vinco = .1 * exp(-(f - d) / (R * .4));
    col = (capa(u_de, u_ade, p) + grao) * (1. - oc - vinco);
  }
  float rolo = step(f, d) * (1. - smoothstep(f + R - aa, f + R, d));
  if (rolo > 0.) {
    float a = asin(clamp((d - f) / R, 0., 1.));
    vec2 sob = p + u_dir * (f + R * a - d);
    float li = .42 + .6 * clamp(dot(vec2(-sin(a), cos(a)), LUZ), 0., 1.);
    col = mix(col, (capa(u_de, u_ade, sob) + grao) * li, temPapel(sob, aa) * rolo);
    float th = PI - a;
    vec2 sobre = p + u_dir * (f + R * th - d);
    col = mix(col, verso(sobre, luzVerso(th)), temPapel(sobre, aa) * rolo);
  }
  if (d < f) col = mix(col, verso(deitado, luzVerso(PI)), temPapel(deitado, aa));
  gl_FragColor = vec4(col, 1.);
}`;

const hex = (h) => { const v = parseInt(h.replace('#', ''), 16); return [(v >> 16) / 255, ((v >> 8) & 255) / 255, (v & 255) / 255]; };
const dirDobra = (t) => { const l = Math.hypot(1, t); return [1 / l, t / l]; };
function pontas(dir, asp) {
  const ds = [0, asp * dir[0], dir[1], asp * dir[0] + dir[1]];
  const lo = Math.min(...ds), hi = Math.max(...ds);
  return { repouso: hi + 0.001, fora: lo - RAIO * 1.6, meio: (lo + hi) / 2, lo };
}
// no começo o canto acompanha o dedo; depois de meia volta de papel, a dobra anda na metade da velocidade
const arrastoProx = (rep, t) => { const v = Math.max(t, 0), joelho = Math.PI * RAIO; return v < joelho ? rep - v : rep - v / 2 - joelho / 2; };
const caminhoProx = (rep, f) => { const k = Math.max(rep - f, 0), joelho = Math.PI * RAIO; return k < joelho ? k : 2 * k - joelho; };
const sombraDe = (f, lo) => limitar((f + RAIO - lo) / (RAIO * 0.6));

export function folha(quadro, opcoes = {}) {
  const o = { paginas: [], papel: '#ede8dc', circular: true, inicio: 0, aoMudar: () => {}, ...opcoes };
  const n = o.paginas.length;
  const envolve = (i) => (o.circular ? ((i % n) + n) % n : limitar(i, 0, n - 1));
  quadro.classList.add('folha');
  quadro.tabIndex = 0;
  quadro.style.background = o.papel;
  quadro.setAttribute('role', 'group');
  quadro.setAttribute('aria-roledescription', 'páginas');
  quadro.setAttribute('aria-label', 'Arraste a folha ou use as setas');
  const foto = document.createElement('img');
  foto.className = 'folha-foto';
  const canvas = document.createElement('canvas');
  canvas.className = 'tec-canvas';
  canvas.setAttribute('aria-hidden', 'true');
  const aviso = document.createElement('p');
  aviso.className = 'folha-aviso';
  aviso.setAttribute('aria-live', 'polite');
  quadro.prepend(foto, canvas, aviso);

  const parado = semMovimento();
  const pedido = { atual: envolve(o.inicio) };
  let atual = pedido.atual, vira = null, asp = 1.6;
  const mostrar = () => {
    foto.src = o.paginas[atual]?.src || '';
    foto.alt = o.paginas[atual]?.alt || '';
    aviso.textContent = o.paginas[atual]?.alt ? `${o.paginas[atual].alt}, ${atual + 1} de ${n}` : `Página ${atual + 1} de ${n}`;
  };
  mostrar();

  const gl = parado ? null : canvas.getContext('webgl', { alpha: false, antialias: false });
  function semDobra() {
    canvas.remove();
    return {
      ir(i) { atual = envolve(i); mostrar(); o.aoMudar(atual); },
      proxima() { this.ir(atual + 1); },
      anterior() { this.ir(atual - 1); },
    };
  }
  if (!gl) {
    const r = semDobra();
    quadro.addEventListener('click', (e) => { const b = quadro.getBoundingClientRect(); (e.clientX - b.left > b.width / 2 ? r.proxima() : r.anterior()); });
    quadro.addEventListener('keydown', (e) => { if (e.key === 'ArrowRight') r.proxima(); if (e.key === 'ArrowLeft') r.anterior(); });
    return r;
  }
  const comp = (t, s) => { const x = gl.createShader(t); gl.shaderSource(x, s); gl.compileShader(x); return x; };
  const prog = gl.createProgram();
  gl.attachShader(prog, comp(gl.VERTEX_SHADER, VERT));
  gl.attachShader(prog, comp(gl.FRAGMENT_SHADER, FRAG));
  gl.linkProgram(prog);
  if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) { console.warn(gl.getProgramInfoLog(prog)); return semDobra(); }
  gl.useProgram(prog);
  gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
  const pos = gl.getAttribLocation(prog, 'p');
  gl.enableVertexAttribArray(pos);
  gl.vertexAttribPointer(pos, 2, gl.FLOAT, false, 0, 0);
  gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
  const U = Object.fromEntries(['de', 'para', 'res', 'ade', 'apara', 'dir', 'dobra', 'r', 'sombra', 'virando', 'papel'].map((k) => [k, gl.getUniformLocation(prog, `u_${k}`)]));
  gl.uniform3fv(U.papel, hex(o.papel));
  const texturas = new Array(n).fill(null), aspectos = new Array(n).fill(1);
  const escolhe = (i) => texturas[i] ?? texturas.find(Boolean) ?? null;

  function desenhar() {
    const de = vira ? vira.de : atual, para = vira ? vira.para : atual;
    const a = escolhe(de), b = escolhe(para);
    if (!a || !b) return;
    gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D, a); gl.uniform1i(U.de, 0);
    gl.activeTexture(gl.TEXTURE1); gl.bindTexture(gl.TEXTURE_2D, b); gl.uniform1i(U.para, 1);
    gl.uniform2f(U.res, canvas.width, canvas.height);
    gl.uniform1f(U.ade, aspectos[de]); gl.uniform1f(U.apara, aspectos[para]);
    gl.uniform1f(U.virando, vira ? 1 : 0);
    if (vira) {
      gl.uniform2f(U.dir, vira.dir[0], vira.dir[1]);
      gl.uniform1f(U.dobra, vira.f);
      gl.uniform1f(U.r, RAIO);
      gl.uniform1f(U.sombra, sombraDe(vira.f, vira.p.lo));
    }
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
  }
  function medir() {
    const dpr = Math.min(devicePixelRatio || 1, 2);
    const w = Math.round(canvas.clientWidth * dpr), h = Math.round(canvas.clientHeight * dpr);
    if (!w || !h) return;
    asp = w / h;
    if (canvas.width !== w || canvas.height !== h) { canvas.width = w; canvas.height = h; gl.viewport(0, 0, w, h); }
    desenhar();
  }
  new ResizeObserver(medir).observe(canvas);

  o.paginas.forEach((pg, i) => {
    const img = new Image();
    img.onload = () => {
      const t = gl.createTexture();
      gl.bindTexture(gl.TEXTURE_2D, t);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, img);
      for (const [k, v] of [[gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE], [gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE], [gl.TEXTURE_MIN_FILTER, gl.LINEAR], [gl.TEXTURE_MAG_FILTER, gl.LINEAR]]) gl.texParameteri(gl.TEXTURE_2D, k, v);
      texturas[i] = t;
      aspectos[i] = img.naturalWidth / Math.max(1, img.naturalHeight);
      medir();
    };
    img.src = pg.src;
  });

  const novo = (tipo, incl, de, para, espia) => {
    const dir = dirDobra(incl), p = pontas(dir, asp);
    return { tipo, de, para, dir, p, f: tipo === 1 ? p.repouso : p.fora, v: 0, alvo: tipo === 1 ? p.repouso : p.fora, w: espia ? W_ESPIA : W_VIRA, espia, preso: false };
  };
  const inicioDe = (t) => (t.tipo === 1 ? t.p.repouso : t.p.fora);
  const fimDe = (t) => (t.tipo === 1 ? t.p.fora : t.p.repouso);
  const naPonta = (t) => t.alvo === t.p.fora || t.alvo === t.p.repouso;
  const movendo = (t) => !!t && !t.preso && (naPonta(t) || Math.abs(t.f - t.alvo) > 0.0015 || Math.abs(t.v) > 0.02);
  function pousar(t, fim) {
    const antes = atual;
    atual = fim === t.p.fora ? t.para : t.de;
    vira = null;
    mostrar();
    if (atual !== antes) o.aoMudar(atual);
  }

  let raf = 0, ultimo = 0;
  function quadroGl(agora) {
    raf = 0;
    const dt = Math.min((agora - ultimo) / 1000, 1 / 20);
    ultimo = agora;
    const t = vira;
    if (t && !t.preso) {
      const fim = naPonta(t);
      // uma mola só se aproxima: mirar além da borda faz a folha chegar andando, sem arrastar o último canto
      const mira = !fim ? t.alvo : t.alvo === t.p.fora ? t.alvo - EMPURRA_SAI : t.alvo + EMPURRA_CHEGA;
      const a = -t.w * t.w * (t.f - mira) - 2 * t.w * t.v;
      const nv = t.v + a * dt, nx = t.f + nv * dt;
      t.f = limitar(nx, t.p.fora, t.p.repouso);
      t.v = t.f === nx ? nv : 0;
      if (fim && t.f === t.alvo) pousar(t, t.alvo);
      else if (!fim && !movendo(t)) { t.f = t.alvo; t.v = 0; }
    }
    desenhar();
    if (movendo(vira)) raf = requestAnimationFrame(quadroGl);
  }
  const acordar = () => { if (raf) return; ultimo = performance.now(); raf = requestAnimationFrame(quadroGl); };

  const pode = (tipo) => n > 1 && (o.circular || (tipo === 1 ? atual < n - 1 : atual > 0));
  const folhasDe = (tipo) => (tipo === 1 ? [atual, envolve(atual + 1)] : [envolve(atual - 1), atual]);
  function terminar() { if (vira) pousar(vira, naPonta(vira) ? vira.alvo : inicioDe(vira)); }
  function virar(tipo) {
    if (!pode(tipo)) return;
    if (vira && vira.espia && vira.tipo === tipo) { vira.espia = false; vira.preso = false; vira.w = W_VIRA; vira.alvo = fimDe(vira); acordar(); return; }
    terminar();
    const [de, para] = folhasDe(tipo);
    vira = novo(tipo, INCLINA, de, para, false);
    vira.alvo = fimDe(vira);
    acordar();
  }
  const inclinaEm = (y, r) => (0.5 - (y - r.top) / r.height) * 0.9;
  function espiar(zona, incl) {
    let t = vira;
    if (t && !t.espia) return;
    if (!zona || !pode(zona)) { if (t) { t.alvo = inicioDe(t); acordar(); } return; }
    if (t && t.tipo !== zona) { vira = null; t = null; }
    if (!t) { const [de, para] = folhasDe(zona); t = vira = novo(zona, incl, de, para, true); }
    t.alvo = zona === 1 ? t.p.repouso - ESPIA_PROX : t.p.lo - RAIO + ESPIA_ANT;
    acordar();
  }

  let dedo = null;
  const fino = matchMedia('(hover: hover) and (pointer: fine)').matches;
  quadro.addEventListener('pointerdown', (e) => {
    if (e.button) return;
    const r = quadro.getBoundingClientRect();
    const tipo = e.clientX - r.left > r.width / 2 ? 1 : -1;
    if (!pode(tipo)) return;
    let t = vira;
    if (t && !(t.espia && t.tipo === tipo)) { terminar(); t = null; }
    if (!t) {
      const [de, para] = folhasDe(tipo);
      t = vira = novo(tipo, inclinaEm(e.clientY, r), de, para, false);
      if (tipo === -1) t.f = t.p.lo - RAIO;
    }
    t.preso = true; t.espia = false; t.v = 0;
    const pega = tipo === 1 ? caminhoProx(t.p.repouso, t.f) : Math.max(t.f - (t.p.lo - RAIO), 0);
    quadro.setPointerCapture?.(e.pointerId);
    dedo = { id: e.pointerId, x0: e.clientX, y0: e.clientY, x: e.clientX, y: e.clientY, t: e.timeStamp, h: r.height, pega, v: 0, moveu: false };
    quadro.classList.add('arrastando');
    acordar();
  });
  quadro.addEventListener('pointermove', (e) => {
    const t = vira;
    if (!dedo || e.pointerId !== dedo.id || !t) {
      if (!dedo && fino) {
        const r = quadro.getBoundingClientRect();
        const x = (e.clientX - r.left) / r.width;
        espiar(x > 0.86 ? 1 : x < 0.14 ? -1 : 0, limitar(inclinaEm(e.clientY, r) * 1.8, -0.75, 0.75));
      }
      return;
    }
    const d = dedo, sinal = t.tipo === 1 ? -1 : 1;
    const anda = ((e.clientX - d.x0) * t.dir[0] - (e.clientY - d.y0) * t.dir[1]) / d.h;
    const trilho = d.pega + sinal * anda;
    t.f = limitar(t.tipo === 1 ? arrastoProx(t.p.repouso, trilho) : t.p.lo - RAIO + Math.max(trilho, 0), t.p.fora, t.p.repouso);
    const passo = ((e.clientX - d.x) * t.dir[0] - (e.clientY - d.y) * t.dir[1]) * sinal;
    d.v = d.v * 0.6 + (passo / Math.max(e.timeStamp - d.t, 1)) * 0.4;
    d.x = e.clientX; d.y = e.clientY; d.t = e.timeStamp;
    if (Math.hypot(e.clientX - d.x0, e.clientY - d.y0) > 6) d.moveu = true;
    desenhar();
  });
  function soltar(e, cancelou) {
    const d = dedo;
    if (!d || e.pointerId !== d.id) return;
    dedo = null;
    quadro.classList.remove('arrastando');
    const t = vira;
    if (!t) return;
    t.preso = false; t.w = W_VIRA;
    const { repouso, fora, meio } = t.p;
    let vai = false;
    if (!cancelou) {
      const andou = t.tipo === 1 ? repouso - t.f : t.f - fora;
      const metade = t.tipo === 1 ? repouso - meio : meio - fora;
      vai = d.moveu ? (Math.abs(d.v) > FLICK ? d.v > 0 : andou > metade) : true;
    }
    t.alvo = vai ? fimDe(t) : inicioDe(t);
    // passa a velocidade do dedo pra mola: soltar não deixa emenda
    const porSeg = (d.v * 1000) / d.h;
    const razao = t.tipo === 1 && repouso - t.f >= Math.PI * RAIO ? 0.5 : 1;
    t.v = d.moveu ? (t.tipo === 1 ? -porSeg : porSeg) * razao : 0;
    acordar();
  }
  quadro.addEventListener('pointerup', (e) => soltar(e, false));
  quadro.addEventListener('pointercancel', (e) => soltar(e, true));
  quadro.addEventListener('pointerleave', () => { if (!dedo) espiar(0, 0); });
  quadro.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowRight') { e.preventDefault(); virar(1); }
    if (e.key === 'ArrowLeft') { e.preventDefault(); virar(-1); }
  });

  return { proxima: () => virar(1), anterior: () => virar(-1), get atual() { return atual; } };
}
