// Modelo /site-premium — hero 3D que conta a transformação do serviço.
// Three.js r160 via importmap (sem build). Por cliente, trocar só o CONFIG:
// o modelo (.glb do produto), as cores e os capítulos da história.
// Com data-modo="foto" no #palco, o Three.js nem é baixado: o hero usa img/hero.*.
let THREE, GLTFLoader, DRACOLoader, RoomEnvironment;

const CONFIG = {
  modelo: null,            // ex: 'modelos/produto.glb' — null usa o objeto de demonstração
  tamanho: 2.4,            // maior medida do objeto na cena, em metros
  girarModelo: -0.5,       // rotação inicial (radianos)
  corFundo: null,          // null = usa --bg-2 do estilo.css (acompanha o tema claro/escuro)
  corSujeira: 0x6b5a45,    // a cor do "antes" (sujeira, desgaste, poeira)
  corDestaque: 0xf2b33a,   // luz quente de destaque
  corLed: 0xe8eeff,
  segundosPorCapitulo: 4.2,
  // Cada capítulo é um ESTADO. A animação vai do estado anterior pro atual.
  //   limpo: 0 = todo "antes", 1 = todo "depois" (uma faixa de luz varre a transição)
  //   brilho: 0 = fosco, 1 = espelhado
  //   cam / alvo: posição da câmera e pra onde ela olha
  //   giro: rotação extra do objeto
  capitulos: [
    { rotulo: 'Chega',    limpo: 0,    brilho: 0,   cam: [5.6, 1.5, 6.4], alvo: [0, 0.75, 0], giro: 0 },
    { rotulo: 'Limpeza',  limpo: 1,    brilho: 0.2, cam: [4.2, 1.2, 5.0], alvo: [0, 0.8, 0],  giro: 0.25 },
    { rotulo: 'Detalhe',  limpo: 1,    brilho: 0.5, cam: [2.6, 1.6, 4.4], alvo: [0.2, 0.95, 0], giro: 0.45 },
    { rotulo: 'Proteção', limpo: 1,    brilho: 1,   cam: [-6.2, 2.4, 8.2], alvo: [0, 0.8, 0], giro: 0.9 },
    { rotulo: 'Entrega',  limpo: 1,    brilho: 1,   cam: [0.6, 1.4, 9.4], alvo: [0, 0.9, 0], giro: 1.7 },
  ],
};

// ---------- utilidades ----------
const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const suave = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
const lerp = (a, b, t) => a + (b - a) * t;

const palco = document.getElementById('palco');
const canvas = document.getElementById('hero3d');
const preloader = document.getElementById('preloader');
const plBarra = document.getElementById('plBarra');
const plPct = document.getElementById('plPct');
const plRotulo = document.getElementById('plRotulo');
const capLista = document.getElementById('capLista');
const btnPlay = document.getElementById('play');
const beats = [...document.querySelectorAll('.hero .beat')];
const ehCelular = matchMedia('(max-width: 900px)').matches;
const semMovimento = matchMedia('(prefers-reduced-motion: reduce)').matches;

function progresso(p, rotulo) {
  plBarra.style.transform = `scaleX(${p})`;
  plPct.textContent = `${Math.round(p * 100)}%`;
  if (rotulo) plRotulo.textContent = rotulo;
}
function liberarPagina() {
  progresso(1, 'pronto');
  setTimeout(() => {
    preloader.classList.add('pronto');
    document.body.classList.remove('is-loading');
  }, 250);
}
function semWebGL(motivo) {
  console.warn('hero 3D desligado:', motivo);
  palco.classList.add('sem-3d');
  document.getElementById('capitulos').hidden = true;
  liberarPagina();
}

// ---------- modo ----------
if (palco.dataset.modo === 'sequencia') {
  // quem cuida do hero é o hero-seq.js
} else if (palco.dataset.modo === 'foto') {
  palco.classList.add('modo-foto');
  document.getElementById('capitulos').hidden = true;
  liberarPagina();
} else {
  iniciar().catch((e) => semWebGL(e.message));
}

async function iniciar() {
  progresso(0.05, 'carregando o 3D');
  THREE = await import('three');
  ({ GLTFLoader } = await import('three/addons/loaders/GLTFLoader.js'));
  ({ DRACOLoader } = await import('three/addons/loaders/DRACOLoader.js'));
  ({ RoomEnvironment } = await import('three/addons/environments/RoomEnvironment.js'));

  const renderer = new THREE.WebGLRenderer({ canvas, antialias: !ehCelular, powerPreference: 'high-performance' });
  renderer.setPixelRatio(Math.min(devicePixelRatio || 1, ehCelular ? 1.5 : 2));
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;
  renderer.outputColorSpace = THREE.SRGBColorSpace;

  const corCss = getComputedStyle(document.documentElement).getPropertyValue('--bg-2').trim();
  const fundo = new THREE.Color(CONFIG.corFundo ?? (corCss || '#0d0f14'));
  const claro = fundo.getHSL({}).l > 0.5;
  const cena = new THREE.Scene();
  cena.background = fundo.clone();
  cena.fog = new THREE.Fog(fundo, 12, 30);
  const camera = new THREE.PerspectiveCamera(32, 1, 0.05, 100);

  // reflexos: um "estúdio" virtual que a superfície espelha (sem arquivo HDR)
  const pmrem = new THREE.PMREMGenerator(renderer);
  cena.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
  progresso(0.15, 'montando o estúdio');

  // ---------- estúdio ----------
  const chao = new THREE.Mesh(
    new THREE.CircleGeometry(30, 64),
    new THREE.MeshStandardMaterial({ color: fundo.clone().offsetHSL(0, 0, claro ? -0.06 : 0.015), roughness: 0.32, metalness: claro ? 0.05 : 0.3, envMapIntensity: 0.6 }),
  );
  chao.rotation.x = -Math.PI / 2;
  cena.add(chao);

  const parede = new THREE.Mesh(
    new THREE.CylinderGeometry(14, 14, 10, 64, 1, true, Math.PI * 0.75, Math.PI * 1.5),
    new THREE.MeshStandardMaterial({ color: fundo.clone().offsetHSL(0, 0, claro ? -0.02 : 0.04), roughness: 0.85, side: THREE.BackSide }),
  );
  parede.position.y = 5;
  cena.add(parede);

  // faixas de LED no teto (cor > 1 e sem tone mapping = brilho "estourado")
  const ledMat = new THREE.MeshBasicMaterial({ color: new THREE.Color(CONFIG.corLed).multiplyScalar(4), toneMapped: false });
  for (let i = -3; i <= 3; i++) {
    const led = new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.03, 9), ledMat);
    led.position.set(i * 1.25, 4.6, 0);
    led.rotation.y = 0.35;
    cena.add(led);
  }

  // sombra de contato (textura radial, barata)
  const sombraTex = (() => {
    const c = document.createElement('canvas');
    c.width = c.height = 128;
    const g = c.getContext('2d');
    const grad = g.createRadialGradient(64, 64, 4, 64, 64, 64);
    grad.addColorStop(0, claro ? 'rgba(0,0,0,.35)' : 'rgba(0,0,0,.75)');
    grad.addColorStop(1, 'rgba(0,0,0,0)');
    g.fillStyle = grad;
    g.fillRect(0, 0, 128, 128);
    return new THREE.CanvasTexture(c);
  })();
  const sombra = new THREE.Mesh(
    new THREE.PlaneGeometry(1, 1),
    new THREE.MeshBasicMaterial({ map: sombraTex, transparent: true, depthWrite: false }),
  );
  sombra.rotation.x = -Math.PI / 2;
  sombra.position.y = 0.005;
  cena.add(sombra);

  // luzes
  cena.add(new THREE.HemisphereLight(0xbfc8ff, 0x0a0a0a, 0.35));
  const topo = new THREE.SpotLight(0xf4f6ff, 120, 20, 0.7, 0.8, 1.6);
  topo.position.set(0.5, 6.5, 1.5);
  cena.add(topo, topo.target);
  const quente = new THREE.SpotLight(CONFIG.corDestaque, 0, 16, 0.6, 1, 1.5);
  quente.position.set(-4.5, 2.2, 3.5);
  cena.add(quente, quente.target);
  const recorte = new THREE.PointLight(0x6b86ff, 18, 12, 1.8);
  recorte.position.set(3.5, 2.5, -3.5);
  cena.add(recorte);

  // ---------- material "antes → depois" ----------
  // Injeta no material padrão do three uma máscara de ruído: onde a máscara vale,
  // a superfície fica com a cor da sujeira e fosca. A faixa uVarre limpa da esquerda pra direita.
  const uni = {
    uVarre: { value: -10 },
    uBrilho: { value: 0 },
    uCorSujeira: { value: new THREE.Color(CONFIG.corSujeira) },
  };
  const RUIDO = `
    varying vec3 vPosMundo;
    uniform float uVarre; uniform float uBrilho; uniform vec3 uCorSujeira;
    float h3(vec3 p){ p = fract(p*.3183099+.1); p *= 17.; return fract(p.x*p.y*p.z*(p.x+p.y+p.z)); }
    float n3(vec3 x){ vec3 i=floor(x), f=fract(x); f=f*f*(3.-2.*f);
      return mix(mix(mix(h3(i),h3(i+vec3(1,0,0)),f.x), mix(h3(i+vec3(0,1,0)),h3(i+vec3(1,1,0)),f.x),f.y),
                 mix(mix(h3(i+vec3(0,0,1)),h3(i+vec3(1,0,1)),f.x), mix(h3(i+vec3(0,1,1)),h3(i+vec3(1,1,1)),f.x),f.y), f.z); }
    float fbm(vec3 p){ float v=0., a=.5; for(int i=0;i<5;i++){ v+=a*n3(p); p=p*2.03+vec3(3.1,7.7,1.3); a*=.5; } return v; }
    float mascara(){
      float n = fbm(vPosMundo*3.2);
      float borda = smoothstep(uVarre-.25, uVarre+.25, vPosMundo.x + (n-.5)*.6);
      return clamp((n*1.5-.2), 0., 1.) * borda;
    }`;
  const materiais = [];
  function antesDepois(mat) {
    mat.onBeforeCompile = (s) => {
      Object.assign(s.uniforms, uni);
      s.vertexShader = s.vertexShader
        .replace('#include <common>', '#include <common>\nvarying vec3 vPosMundo;')
        .replace('#include <project_vertex>', '#include <project_vertex>\nvPosMundo = (modelMatrix * vec4(transformed, 1.0)).xyz;');
      s.fragmentShader = s.fragmentShader
        .replace('#include <common>', `#include <common>\n${RUIDO}`)
        .replace('#include <color_fragment>', `#include <color_fragment>
          float mSuj = mascara();
          diffuseColor.rgb = mix(diffuseColor.rgb, uCorSujeira * (.55 + .7*fbm(vPosMundo*9.)), mSuj*.93);`)
        .replace('#include <roughnessmap_fragment>', `#include <roughnessmap_fragment>
          roughnessFactor = mix(roughnessFactor, .04, uBrilho*.9);
          roughnessFactor = mix(roughnessFactor, .97, mSuj);`);
    };
    mat.customProgramCacheKey = () => 'antes-depois';
    materiais.push(mat);
    return mat;
  }

  // ---------- objeto ----------
  const objeto = new THREE.Group();
  cena.add(objeto);

  if (CONFIG.modelo) {
    const gerente = new THREE.LoadingManager();
    gerente.onProgress = (_, carregados, total) => progresso(0.2 + 0.7 * (carregados / total), 'carregando o modelo');
    const draco = new DRACOLoader().setDecoderPath('https://cdn.jsdelivr.net/npm/three@0.160.0/examples/jsm/libs/draco/');
    const gltf = await new GLTFLoader(gerente).setDRACOLoader(draco).loadAsync(CONFIG.modelo, (e) => {
      if (e.total) progresso(0.2 + 0.7 * (e.loaded / e.total), 'carregando o modelo');
    });
    const m = gltf.scene;
    m.traverse((o) => {
      if (!o.isMesh) return;
      const lista = Array.isArray(o.material) ? o.material : [o.material];
      lista.forEach((mt) => { if (mt.isMeshStandardMaterial) antesDepois(mt); });
    });
    // normaliza tamanho e apoia no chão
    const caixa = new THREE.Box3().setFromObject(m);
    const dim = caixa.getSize(new THREE.Vector3());
    m.scale.setScalar(CONFIG.tamanho / Math.max(dim.x, dim.y, dim.z));
    caixa.setFromObject(m);
    const centro = caixa.getCenter(new THREE.Vector3());
    m.position.set(-centro.x, -caixa.min.y, -centro.z);
    objeto.add(m);
  } else {
    // objeto de demonstração: peça polida num pedestal
    const corpo = new THREE.Mesh(
      new THREE.TorusKnotGeometry(0.62, 0.24, 220, 32, 2, 3),
      antesDepois(new THREE.MeshPhysicalMaterial({ color: 0x1d2a52, metalness: 0.55, roughness: 0.35, clearcoat: 1, clearcoatRoughness: 0.05 })),
    );
    corpo.position.y = 1.15;
    const base = new THREE.Mesh(
      new THREE.CylinderGeometry(1.05, 1.15, 0.22, 64),
      new THREE.MeshStandardMaterial({ color: 0x0f1115, roughness: 0.3, metalness: 0.6 }),
    );
    base.position.y = 0.11;
    objeto.add(corpo, base);
    progresso(0.85, 'ajustando a luz');
  }
  objeto.rotation.y = CONFIG.girarModelo;

  const caixaObj = new THREE.Box3().setFromObject(objeto);
  const tamObj = caixaObj.getSize(new THREE.Vector3());
  sombra.scale.set(tamObj.x * 1.5, tamObj.z * 1.5 || tamObj.x * 1.5, 1);
  const xMin = caixaObj.min.x - 0.6;
  const xMax = caixaObj.max.x + 0.6;

  // faixa de luz que acompanha a limpeza
  const faixa = new THREE.Mesh(
    new THREE.PlaneGeometry(0.06, tamObj.y * 1.6 + 1),
    new THREE.MeshBasicMaterial({ color: new THREE.Color(CONFIG.corLed).multiplyScalar(5), toneMapped: false, transparent: true, opacity: 0 }),
  );
  faixa.position.set(0, tamObj.y * 0.6, caixaObj.max.z + 0.4);
  cena.add(faixa);

  // ---------- linha do tempo ----------
  const caps = CONFIG.capitulos;
  const dur = CONFIG.segundosPorCapitulo;
  const total = caps.length * dur;
  let t = semMovimento ? total - 0.01 : 0;
  let tocando = !semMovimento;
  let visivel = true;

  capLista.innerHTML = caps.map((c, i) => `<button class="cap" data-i="${i}"><span>${c.rotulo}</span></button>`).join('');
  const botoes = [...capLista.children];
  capLista.addEventListener('click', (e) => {
    const b = e.target.closest('.cap');
    if (b) t = Number(b.dataset.i) * dur + 0.001;
  });
  const atualizarPlay = () => {
    btnPlay.classList.toggle('pausado', !tocando);
    btnPlay.setAttribute('aria-label', tocando ? 'Pausar animação' : 'Tocar animação');
  };
  btnPlay.addEventListener('click', () => { tocando = !tocando; atualizarPlay(); });
  atualizarPlay();

  const v3 = (a) => new THREE.Vector3(...a);
  const camPos = new THREE.Vector3();
  const camAlvo = new THREE.Vector3();
  const mouse = { x: 0, y: 0 };
  if (!ehCelular) {
    addEventListener('pointermove', (e) => {
      mouse.x = (e.clientX / innerWidth - 0.5) * 2;
      mouse.y = (e.clientY / innerHeight - 0.5) * 2;
    }, { passive: true });
  }

  function estado(tempo) {
    const i = clamp(Math.floor(tempo / dur), 0, caps.length - 1);
    const anterior = caps[Math.max(0, i - 1)];
    const atual = caps[i];
    const k = suave(clamp((tempo - i * dur) / (dur * 0.7)));
    return {
      i, k,
      limpo: lerp(i === 0 ? atual.limpo : anterior.limpo, atual.limpo, k),
      brilho: lerp(i === 0 ? atual.brilho : anterior.brilho, atual.brilho, k),
      giro: lerp(i === 0 ? atual.giro : anterior.giro, atual.giro, k),
      cam: v3(i === 0 ? atual.cam : anterior.cam).lerp(v3(atual.cam), k),
      alvo: v3(i === 0 ? atual.alvo : anterior.alvo).lerp(v3(atual.alvo), k),
    };
  }

  // ---------- layout ----------
  function redimensionar() {
    const w = palco.clientWidth;
    const h = palco.clientHeight;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    // no desktop o objeto fica à direita, longe do título; no celular, centralizado e mais alto
    if (w > 900) camera.setViewOffset(w, h, -w * 0.16, 0, w, h);
    else camera.setViewOffset(w, h, 0, h * 0.12, w, h);
    camera.fov = w / h < 0.8 ? 46 : 32;
    camera.updateProjectionMatrix();
  }
  addEventListener('resize', redimensionar);
  redimensionar();

  new IntersectionObserver((e) => { visivel = e[0].isIntersecting; }, { threshold: 0.02 }).observe(palco);
  let ultimo = performance.now();
  document.addEventListener('visibilitychange', () => { ultimo = performance.now(); });

  // ---------- quadro a quadro ----------
  function quadro(agora) {
    requestAnimationFrame(quadro);
    const dt = clamp((agora - ultimo) / 1000, 0, 0.05);
    ultimo = agora;
    if (!visivel || document.hidden) return;
    if (tocando) t = (t + dt) % total;

    const e = estado(t);
    uni.uVarre.value = lerp(xMin, xMax, e.limpo);
    uni.uBrilho.value = e.brilho;
    materiais.forEach((m) => { if ('clearcoat' in m) m.clearcoat = e.brilho; });
    objeto.rotation.y = CONFIG.girarModelo + e.giro;

    // faixa aparece só no meio da varredura; tudo derivado do tempo, não do fps
    faixa.position.x = uni.uVarre.value;
    faixa.material.opacity = Math.pow(Math.sin(Math.PI * clamp(e.limpo)), 0.4);
    faixa.visible = faixa.material.opacity > 0.01;
    quente.intensity = 40 * e.brilho;

    const seguir = 1 - Math.pow(0.004, dt); // suavização igual em 30 ou 144 fps
    camPos.lerp(e.cam.add(new THREE.Vector3(mouse.x * 0.35, -mouse.y * 0.2, 0)), seguir);
    camAlvo.lerp(e.alvo, seguir);
    camera.position.copy(camPos);
    camera.lookAt(camAlvo);

    beats.forEach((b, i) => b.classList.toggle('on', i === Math.min(e.i, beats.length - 1)));
    botoes.forEach((b, i) => {
      b.classList.toggle('ativo', i === e.i);
      b.style.setProperty('--p', i < e.i ? 1 : i === e.i ? clamp((t - i * dur) / dur) : 0);
    });

    renderer.render(cena, camera);
  }

  const e0 = estado(t);
  camPos.copy(e0.cam);
  camAlvo.copy(e0.alvo);
  renderer.compile(cena, camera);
  requestAnimationFrame(quadro);
  liberarPagina();
}
