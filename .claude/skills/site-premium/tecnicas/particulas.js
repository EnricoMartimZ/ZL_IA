// Partículas — dezenas de milhares de pontos que mudam de forma com a rolagem (WebGL, three.js).
// Serve pra mostrar o que não dá pra fotografar: ar, energia, sinal, dados, química, som.
// Uma nuvem solta vira a palavra da marca, que vira um anel de ondas, que vira a peça...
//
// import { particulas } from './tecnicas/particulas.js';
// const p = await particulas(document.querySelector('#quadro'), {
//   formas: [
//     { tipo: 'nuvem' },
//     { tipo: 'texto', texto: 'AR', fonte: '800 220px Inter' },
//     { tipo: 'aneis', aneis: 4 },
//     { tipo: 'imagem', src: 'img/peca-silhueta.png' },   // PNG com fundo transparente
//   ],
//   cores: ['#9fe3ff', '#ffffff'],
// });
// palco(secao, p.progresso);
//
// Formas: nuvem · esfera · aneis · onda · grade · espiral · texto · imagem.
// Precisa do importmap do three no <head> (o mesmo do modelo).

import * as THREE from 'three';
import { quandoVisivel, semMovimento } from './palco.js';

const celular = () => innerWidth < 760;

// cada forma devolve n pontos [x, y, z] mais ou menos dentro de um cubo de lado 3 em volta do centro
function amostrarCanvas(desenhar, n, larg = 640, alt = 320) {
  const c = document.createElement('canvas');
  c.width = larg; c.height = alt;
  const ctx = c.getContext('2d', { willReadFrequently: true });
  desenhar(ctx, larg, alt);
  const dados = ctx.getImageData(0, 0, larg, alt).data;
  const cheios = [];
  for (let y = 0; y < alt; y += 2) {
    for (let x = 0; x < larg; x += 2) {
      if (dados[(y * larg + x) * 4 + 3] > 128) cheios.push([x, y]);
    }
  }
  if (!cheios.length) return formas.nuvem(n);
  const escala = 3.2 / larg;
  const out = new Float32Array(n * 3);
  for (let i = 0; i < n; i++) {
    const [x, y] = cheios[(Math.random() * cheios.length) | 0];
    out[i * 3] = (x - larg / 2 + Math.random() * 2) * escala;
    out[i * 3 + 1] = -(y - alt / 2 + Math.random() * 2) * escala;
    out[i * 3 + 2] = (Math.random() - 0.5) * 0.12;
  }
  return out;
}

function carregarImagem(src) {
  return new Promise((ok, erro) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => ok(img);
    img.onerror = erro;
    img.src = src;
  });
}

export const formas = {
  nuvem(n) {
    const o = new Float32Array(n * 3);
    for (let i = 0; i < n; i++) {
      // gaussiana achatada: parece fumaça/névoa
      const g = () => (Math.random() + Math.random() + Math.random() - 1.5) / 1.5;
      o[i * 3] = g() * 2.4; o[i * 3 + 1] = g() * 1.3; o[i * 3 + 2] = g() * 1.2;
    }
    return o;
  },
  esfera(n, { raio = 1.15 } = {}) {
    const o = new Float32Array(n * 3);
    const ouro = Math.PI * (3 - Math.sqrt(5));
    for (let i = 0; i < n; i++) {
      const y = 1 - (i / (n - 1)) * 2;
      const r = Math.sqrt(1 - y * y);
      const t = ouro * i;
      o[i * 3] = Math.cos(t) * r * raio; o[i * 3 + 1] = y * raio; o[i * 3 + 2] = Math.sin(t) * r * raio;
    }
    return o;
  },
  aneis(n, { aneis = 4, raio = 1.4 } = {}) {
    const o = new Float32Array(n * 3);
    for (let i = 0; i < n; i++) {
      const k = i % aneis;
      const r = raio * (0.3 + 0.7 * (k + 1) / aneis) + (Math.random() - 0.5) * 0.03;
      const t = Math.random() * Math.PI * 2;
      o[i * 3] = Math.cos(t) * r; o[i * 3 + 1] = Math.sin(t) * r; o[i * 3 + 2] = (Math.random() - 0.5) * 0.05;
    }
    return o;
  },
  onda(n, { amplitude = 0.22 } = {}) {
    const o = new Float32Array(n * 3);
    const lado = Math.ceil(Math.sqrt(n));
    for (let i = 0; i < n; i++) {
      const x = ((i % lado) / lado - 0.5) * 3.6;
      const z = (Math.floor(i / lado) / lado - 0.5) * 2.4;
      o[i * 3] = x; o[i * 3 + 1] = Math.sin(x * 2.2) * Math.cos(z * 1.7) * amplitude - 0.2; o[i * 3 + 2] = z;
    }
    return o;
  },
  grade(n, { lado = 1.6 } = {}) {
    const o = new Float32Array(n * 3);
    const k = Math.ceil(Math.cbrt(n));
    for (let i = 0; i < n; i++) {
      o[i * 3] = ((i % k) / (k - 1) - 0.5) * lado;
      o[i * 3 + 1] = ((Math.floor(i / k) % k) / (k - 1) - 0.5) * lado;
      o[i * 3 + 2] = (Math.floor(i / (k * k)) / (k - 1) - 0.5) * lado;
    }
    return o;
  },
  espiral(n, { voltas = 5 } = {}) {
    const o = new Float32Array(n * 3);
    for (let i = 0; i < n; i++) {
      const t = i / n;
      const a = t * voltas * Math.PI * 2 + (Math.random() - 0.5) * 0.25;
      const r = 0.15 + t * 1.3;
      o[i * 3] = Math.cos(a) * r; o[i * 3 + 1] = (t - 0.5) * 2.2; o[i * 3 + 2] = Math.sin(a) * r;
    }
    return o;
  },
  texto(n, { texto = 'MARCA', fonte = '800 200px system-ui, sans-serif' } = {}) {
    return amostrarCanvas((ctx, w, h) => {
      ctx.fillStyle = '#000';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.font = fonte;
      // encolhe a fonte até caber
      let tam = parseInt(fonte.match(/(\d+)px/)?.[1] || '200', 10);
      while (ctx.measureText(texto).width > w * 0.92 && tam > 20) {
        tam -= 8;
        ctx.font = fonte.replace(/\d+px/, `${tam}px`);
      }
      ctx.fillText(texto, w / 2, h / 2);
    }, n);
  },
  async imagem(n, { src }) {
    const img = await carregarImagem(src);
    const larg = 640;
    const alt = Math.round(larg * img.height / img.width);
    return amostrarCanvas((ctx, w, h) => ctx.drawImage(img, 0, 0, w, h), n, larg, alt);
  },
};

const VERT = /* glsl */`
  attribute vec3 de;
  attribute vec3 para;
  attribute float semente;
  uniform float uT, uTempo, uTam, uPx, uAgito;
  varying float vS;
  void main() {
    float atraso = semente * 0.35;
    float t = clamp((uT - atraso) / 0.65, 0.0, 1.0);
    t = t * t * (3.0 - 2.0 * t);
    vec3 p = mix(de, para, t);
    float s = semente * 6.2831;
    // no meio da troca os pontos se soltam e voltam: dá a sensação de matéria se reorganizando
    vec3 dir = normalize(vec3(cos(s * 1.7), sin(s * 2.3), cos(s * 0.9)));
    p += dir * sin(t * 3.14159) * uAgito;
    // deriva leve, pra nada ficar parado
    p += 0.018 * vec3(sin(uTempo * 0.7 + s * 3.0), cos(uTempo * 0.6 + s * 5.0), sin(uTempo * 0.5 + s * 7.0));
    vec4 mv = modelViewMatrix * vec4(p, 1.0);
    gl_Position = projectionMatrix * mv;
    gl_PointSize = uTam * uPx * (0.55 + semente * 0.9) / -mv.z;
    vS = semente;
  }
`;
const FRAG = /* glsl */`
  uniform vec3 uCorA, uCorB;
  uniform float uAlfa;
  varying float vS;
  void main() {
    float d = length(gl_PointCoord - 0.5);
    if (d > 0.5) discard;
    float a = smoothstep(0.5, 0.0, d);
    gl_FragColor = vec4(mix(uCorA, uCorB, vS), a * uAlfa);
  }
`;

export async function particulas(quadro, opcoes = {}) {
  const o = {
    quantidade: celular() ? 9000 : 26000,
    formas: [{ tipo: 'nuvem' }, { tipo: 'esfera' }],
    cores: ['#ffffff', '#8fd3ff'],
    fundoClaro: false, // em fundo claro os pontos somam errado: usa mistura normal e mais opacidade
    tamanho: 14,
    agito: 0.35,
    balanco: 0.35, // quanto a forma balança de um lado pro outro (radianos). Giro contínuo deixaria texto e anéis de perfil
    ...opcoes,
  };
  const n = o.quantidade;
  await document.fonts?.ready; // a forma 'texto' precisa da fonte da marca já carregada
  const posicoes = await Promise.all(o.formas.map((f) => formas[f.tipo](n, f)));

  const canvas = document.createElement('canvas');
  canvas.className = 'tec-canvas';
  quadro.prepend(canvas);
  const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: false, powerPreference: 'high-performance' });
  const px = Math.min(devicePixelRatio, celular() ? 1.5 : 2);
  renderer.setPixelRatio(px);
  const cena = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(35, 1, 0.1, 50);
  camera.position.set(0, 0, 5.2);

  const geo = new THREE.BufferGeometry();
  const de = new Float32Array(posicoes[0]);
  const para = new Float32Array(posicoes[Math.min(1, posicoes.length - 1)]);
  const sementes = new Float32Array(n).map(() => Math.random());
  geo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(n * 3), 3)); // exigido; o shader usa de/para
  geo.setAttribute('de', new THREE.BufferAttribute(de, 3));
  geo.setAttribute('para', new THREE.BufferAttribute(para, 3));
  geo.setAttribute('semente', new THREE.BufferAttribute(sementes, 1));
  geo.boundingSphere = new THREE.Sphere(new THREE.Vector3(), 10);

  const uni = {
    uT: { value: 0 }, uTempo: { value: 0 }, uTam: { value: o.tamanho }, uPx: { value: px }, uAgito: { value: o.agito },
    uCorA: { value: new THREE.Color(o.cores[0]) }, uCorB: { value: new THREE.Color(o.cores[1] || o.cores[0]) },
    uAlfa: { value: o.fundoClaro ? 0.9 : 0.75 },
  };
  const mat = new THREE.ShaderMaterial({
    vertexShader: VERT, fragmentShader: FRAG, uniforms: uni, transparent: true, depthWrite: false,
    blending: o.fundoClaro ? THREE.NormalBlending : THREE.AdditiveBlending,
  });
  const pontos = new THREE.Points(geo, mat);
  const grupo = new THREE.Group();
  grupo.add(pontos);
  cena.add(grupo);

  function ajustar() {
    const w = quadro.clientWidth, h = quadro.clientHeight;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    const s = Math.min(1, (w / h) * 0.95); // celular em pé: encolhe pra caber
    grupo.scale.setScalar(s);
  }
  new ResizeObserver(ajustar).observe(quadro);
  ajustar();

  let segmento = -1;
  let alvoMouse = [0, 0], mouse = [0, 0];
  quadro.addEventListener('pointermove', (e) => {
    const r = quadro.getBoundingClientRect();
    alvoMouse = [(e.clientX - r.left) / r.width - 0.5, (e.clientY - r.top) / r.height - 0.5];
  });

  function progresso(p) {
    const k = posicoes.length - 1;
    if (k < 1) return;
    const x = Math.min(0.99999, Math.max(0, p)) * k;
    const i = Math.floor(x);
    if (i !== segmento) {
      segmento = i;
      de.set(posicoes[i]); para.set(posicoes[i + 1]);
      geo.attributes.de.needsUpdate = true;
      geo.attributes.para.needsUpdate = true;
    }
    uni.uT.value = x - i;
  }

  let ligado = true;
  const parar = quandoVisivel(quadro, (v) => { ligado = v; });
  const relogio = new THREE.Clock();
  const parado = semMovimento();
  renderer.setAnimationLoop(() => {
    if (!ligado) return;
    const dt = Math.min(relogio.getDelta(), 0.05);
    if (!parado) {
      uni.uTempo.value += dt;
      mouse = mouse.map((m, j) => m + (alvoMouse[j] - m) * 0.05);
      grupo.rotation.y = Math.sin(uni.uTempo.value * 0.25) * o.balanco + mouse[0] * 0.35;
      grupo.rotation.x = Math.sin(uni.uTempo.value * 0.19) * o.balanco * 0.3 + mouse[1] * 0.25;
    }
    renderer.render(cena, camera);
  });

  progresso(0);
  return {
    progresso,
    cores(a, b) { uni.uCorA.value.set(a); uni.uCorB.value.set(b || a); },
    destruir() { parar(); renderer.setAnimationLoop(null); renderer.dispose(); geo.dispose(); mat.dispose(); canvas.remove(); },
  };
}
