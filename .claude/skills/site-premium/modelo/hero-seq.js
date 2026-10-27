// Modelo /site-premium — hero em SEQUÊNCIA: imagens geradas por IA da mesma cena (mesma câmera),
// costuradas com transições em WebGL. Sem modelo 3D, leve (~1,5 MB) e roda em qualquer celular.
// Ativo com data-modo="sequencia" no #palco. Por cliente, trocar só o CONFIG.
// Como gerar as cenas: .claude/skills/site-premium/cenas.md
(() => {
  const palco = document.getElementById('palco');
  if (!palco || palco.dataset.modo !== 'sequencia') return;

  const CONFIG = {
    proporcao: 16 / 9,          // largura/altura das imagens (todas iguais)
    larguraMinCelular: 0.62,    // no celular, mostra pelo menos 62% da largura da imagem (o resto vira faixa)
    // Cenas: as imagens, na ordem da história.
    cenas: [
      'img/seq/exemplo-cena-1.webp', // 0 — estúdio vazio / antes de tudo
      'img/seq/exemplo-cena-2.webp', // 1 — o "antes" (sujo, gasto, bagunçado)
      'img/seq/exemplo-cena-3.webp', // 2 — o "depois", mesma câmera
      'img/seq/exemplo-cena-4.webp', // 3 — close de um detalhe (antes do acabamento)
      'img/seq/exemplo-cena-5.webp', // 4 — o mesmo close, acabado
      'img/seq/exemplo-cena-6.webp', // 5 — entrega: o resultado num clima especial
    ],
    // Passos: a linha do tempo, em ordem. Cada passo dura `dur` segundos.
    //   segurar  — mostra `cena` com aproximação lenta
    //   acender  — `cena` surge do escuro, com luz piscando (abertura)
    //   cruzar   — passa de `de` pra `para` com zoom e desfoque
    //   linha    — linha de luz varre da esquerda pra direita revelando `para` (limpeza)
    //   circulo  — círculo cresce a partir de `centro` revelando `para` (polimento, ajuste, conserto)
    //   mergulho — câmera mergulha em `foco` de `de` e cai em `para` (olhar de perto)
    // zoom: [início, fim] (1 = imagem inteira) · foco: [x, y] da imagem, de 0 a 1
    // capitulo: abre um capítulo na barra de baixo e troca o título (bloco .beat com o mesmo índice)
    passos: [
      { tipo: 'acender', cena: 0, dur: 1.4, zoom: [1.0, 1.02], capitulo: 'Chega' },
      { tipo: 'cruzar', de: 0, para: 1, dur: 1.4, zoom: [1.02, 1.04], foco: [0.52, 0.5] },
      { tipo: 'segurar', cena: 1, dur: 1.8, zoom: [1.04, 1.07], foco: [0.52, 0.5] },
      { tipo: 'linha', de: 1, para: 2, dur: 3.0, zoom: [1.07, 1.1], foco: [0.52, 0.5], capitulo: 'Limpeza' },
      { tipo: 'segurar', cena: 2, dur: 1.4, zoom: [1.1, 1.12], foco: [0.52, 0.5] },
      { tipo: 'mergulho', de: 2, para: 3, dur: 1.5, zoom: [1.12, 1.0], foco: [0.32, 0.44], capitulo: 'Detalhe' },
      { tipo: 'segurar', cena: 3, dur: 1.4, zoom: [1.0, 1.03], foco: [0.55, 0.45] },
      { tipo: 'circulo', de: 3, para: 4, dur: 2.2, zoom: [1.03, 1.05], foco: [0.55, 0.45], centro: [0.57, 0.45], capitulo: 'Acabamento' },
      { tipo: 'segurar', cena: 4, dur: 2.0, zoom: [1.05, 1.07], foco: [0.55, 0.45] },
      { tipo: 'cruzar', de: 4, para: 5, dur: 1.4, zoom: [1.3, 1.0], foco: [0.52, 0.5], desfoque: 0.2, capitulo: 'Entrega' },
      { tipo: 'segurar', cena: 5, dur: 5.0, zoom: [1.0, 1.05], foco: [0.52, 0.5] },
    ],
  };

  // ---------- utilidades ----------
  const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
  const lerp = (a, b, t) => a + (b - a) * t;
  const suave = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
  const sai = (t) => 1 - Math.pow(1 - t, 3);
  const entra = (t) => t * t * t;

  const canvas = document.getElementById('hero3d');
  const preloader = document.getElementById('preloader');
  const plBarra = document.getElementById('plBarra');
  const plPct = document.getElementById('plPct');
  const plRotulo = document.getElementById('plRotulo');
  const capLista = document.getElementById('capLista');
  const btnPlay = document.getElementById('play');
  const beats = [...document.querySelectorAll('.hero .beat')];
  const semMovimento = matchMedia('(prefers-reduced-motion: reduce)').matches;

  const progresso = (p, rotulo) => {
    plBarra.style.transform = `scaleX(${p})`;
    plPct.textContent = `${Math.round(p * 100)}%`;
    if (rotulo) plRotulo.textContent = rotulo;
  };
  const liberar = () => {
    progresso(1, 'pronto');
    setTimeout(() => { preloader.classList.add('pronto'); document.body.classList.remove('is-loading'); }, 250);
  };
  const mostrarBeat = (i) => beats.forEach((b, k) => b.classList.toggle('on', k === i));

  // sem WebGL ou com movimento reduzido: última cena parada, como foto
  function modoFoto() {
    const foto = palco.querySelector('.palco-foto');
    foto.src = CONFIG.cenas[CONFIG.cenas.length - 1];
    palco.classList.add('modo-foto');
    document.getElementById('capitulos').hidden = true;
    mostrarBeat(0);
    liberar();
  }

  const gl = !semMovimento && canvas.getContext('webgl', { antialias: false, alpha: false, preserveDrawingBuffer: false });
  if (!gl) { modoFoto(); return; }

  // ---------- shader ----------
  const VERT = 'attribute vec2 p; varying vec2 vUv; void main(){ vUv = p*.5+.5; gl_Position = vec4(p,0.,1.); }';
  const FRAG = `precision highp float;
  varying vec2 vUv;
  uniform sampler2D tA, tB;
  uniform vec4 qA, qB;            // janela de cada imagem: centro.xy, tamanho.zw (em uv da imagem)
  uniform float uModo, uP, uT, uLuzA, uLuzB, uDesf, uLinha, uAspecto;
  uniform vec2 uRes, uCentro;
  uniform vec3 uFundo;
  float hash(vec2 p){ p = fract(p*vec2(123.34,456.21)); p += dot(p,p+45.32); return fract(p.x*p.y); }
  float ruido(vec2 p){ vec2 i=floor(p), f=fract(p); vec2 u=f*f*(3.-2.*f);
    return mix(mix(hash(i),hash(i+vec2(1,0)),u.x), mix(hash(i+vec2(0,1)),hash(i+vec2(1,1)),u.x), u.y); }
  vec2 naImagem(vec4 q, vec2 uv){ return q.xy + (uv - .5)*q.zw; }
  vec3 ler(sampler2D t, vec4 q, vec2 uv, float desf){
    vec2 a = naImagem(q, uv);
    vec3 soma = vec3(0.); float peso = 0.;
    for(int i=0;i<8;i++){                       // desfoque radial na direção do centro da janela
      float k = float(i)/7.;
      vec2 u = mix(a, q.xy, k*desf);
      float borda = smoothstep(0.,.05,u.y)*smoothstep(1.,.95,u.y)*smoothstep(0.,.02,u.x)*smoothstep(1.,.98,u.x);
      vec3 c = mix(uFundo, texture2D(t, vec2(u.x, 1.-u.y)).rgb, borda);
      float w = 1. - k*.5; soma += c*w; peso += w;
      if(desf < .001) break;
    }
    return soma/peso;
  }
  void main(){
    vec2 uv = vec2(vUv.x, 1.-vUv.y);
    vec3 a = ler(tA, qA, uv, uDesf)*uLuzA;
    vec3 b = ler(tB, qB, uv, uDesf*.6)*uLuzB;
    vec3 c;
    if(uModo < .5){                                    // cruzar
      c = mix(a, b, uP);
    } else if(uModo < 1.5){                            // linha de luz
      float y = uv.y;
      float borda = uP + .004*sin(y*120.+uT*5.) + .012*(ruido(vec2(y*36., uT*1.3))-.5);
      float px = (uv.x - borda)*uRes.x;
      float lado = smoothstep(-1.2, 1.2, px);
      c = mix(b, a, lado);
      float nucleo = exp(-abs(px)/2.), brilho = exp(-abs(px)/34.);
      float tremor = .85 + .15*ruido(vec2(y*12., uT*9.));
      c += uLinha*(nucleo*1.5 + brilho*.35)*tremor*vec3(.93,.96,1.);
    } else {                                           // círculo
      vec2 d = (naImagem(qA, uv) - uCentro)*vec2(uAspecto, 1.);
      float r = length(d), R = uP*1.3;
      c = mix(a, b, smoothstep(R, R-.05, r));
      c += exp(-pow((r-R)/.012, 2.))*(1.-smoothstep(.8,1.,uP))*.55*vec3(1.,.95,.86);
    }
    c += (hash(gl_FragCoord.xy + fract(uT)*91.)-.5)*.012;  // grão de filme
    gl_FragColor = vec4(c, 1.);
  }`;
  const compilar = (tipo, fonte) => {
    const s = gl.createShader(tipo);
    gl.shaderSource(s, fonte);
    gl.compileShader(s);
    if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s));
    return s;
  };
  let U;
  try {
    const prog = gl.createProgram();
    gl.attachShader(prog, compilar(gl.VERTEX_SHADER, VERT));
    gl.attachShader(prog, compilar(gl.FRAGMENT_SHADER, FRAG));
    gl.linkProgram(prog);
    gl.useProgram(prog);
    gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
    const loc = gl.getAttribLocation(prog, 'p');
    gl.enableVertexAttribArray(loc);
    gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
    U = Object.fromEntries(['tA', 'tB', 'qA', 'qB', 'uModo', 'uP', 'uT', 'uLuzA', 'uLuzB', 'uDesf', 'uLinha', 'uAspecto', 'uRes', 'uCentro', 'uFundo']
      .map((n) => [n, gl.getUniformLocation(prog, n)]));
    gl.uniform1i(U.tA, 0);
    gl.uniform1i(U.tB, 1);
    gl.uniform1f(U.uAspecto, CONFIG.proporcao);
  } catch (e) {
    console.warn('hero em sequência desligado:', e.message);
    modoFoto();
    return;
  }

  const corFundo = getComputedStyle(document.documentElement).getPropertyValue('--bg').trim() || '#07080b';
  const rgb = corFundo.match(/^#?([\da-f]{2})([\da-f]{2})([\da-f]{2})$/i);
  gl.uniform3f(U.uFundo, ...(rgb ? rgb.slice(1).map((h) => parseInt(h, 16) / 255) : [0.03, 0.03, 0.04]));

  const texturas = [];
  const subir = (i, img) => {
    const t = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, t);
    [[gl.TEXTURE_MIN_FILTER, gl.LINEAR], [gl.TEXTURE_MAG_FILTER, gl.LINEAR], [gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE], [gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE]]
      .forEach(([k, v]) => gl.texParameteri(gl.TEXTURE_2D, k, v));
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, img);
    texturas[i] = t;
  };
  const ligar = (unidade, i) => { gl.activeTexture(gl.TEXTURE0 + unidade); gl.bindTexture(gl.TEXTURE_2D, texturas[i]); };

  // ---------- enquadramento ----------
  let W = 1, H = 1;
  function redimensionar() {
    const dpr = Math.min(devicePixelRatio || 1, 2);
    W = palco.clientWidth;
    H = palco.clientHeight;
    canvas.width = Math.round(W * dpr);
    canvas.height = Math.round(H * dpr);
    gl.viewport(0, 0, canvas.width, canvas.height);
  }
  addEventListener('resize', redimensionar);
  redimensionar();

  // janela da imagem visível na tela: cobre a tela; em tela vertical mostra uma largura mínima
  function janela(zoom = 1, foco = [0.5, 0.5]) {
    const tela = W / H, IA = CONFIG.proporcao;
    let w = tela > IA ? 1 : tela / IA;
    const vertical = tela < 0.95;
    if (vertical) w = Math.max(w, CONFIG.larguraMinCelular);
    let h = (w * IA) / tela;
    w /= zoom; h /= zoom;
    const cx = w >= 1 ? 0.5 : clamp(foco[0], w / 2, 1 - w / 2);
    const cy = h >= 1 ? 0.5 + (vertical ? (h - 1) * 0.1 : 0) : clamp(foco[1], h / 2, 1 - h / 2);
    return [cx, cy, w, h];
  }

  // ---------- linha do tempo ----------
  const passos = CONFIG.passos.map((p) => ({ zoom: [1, 1], foco: [0.5, 0.5], ...p }));
  let acum = 0;
  passos.forEach((p) => { p.ini = acum; acum += p.dur; });
  const TOTAL = acum;
  const caps = passos.map((p, i) => ({ ...p, i })).filter((p) => p.capitulo);
  capLista.innerHTML = caps.map((c, i) => `<button class="cap" data-i="${i}"><span>${c.capitulo}</span></button>`).join('');
  const botoes = [...capLista.children];

  let t = 0, tocando = true, visivel = true, pronto = false, ultimo = performance.now();
  const atualizarPlay = () => {
    btnPlay.classList.toggle('pausado', !tocando);
    btnPlay.setAttribute('aria-label', tocando ? 'Pausar animação' : 'Tocar animação');
  };
  btnPlay.addEventListener('click', () => { tocando = !tocando; atualizarPlay(); });
  capLista.addEventListener('click', (e) => {
    const b = e.target.closest('.cap');
    if (!b) return;
    t = caps[Number(b.dataset.i)].ini + 0.01;
    if (!tocando) { tocando = true; atualizarPlay(); }
  });
  atualizarPlay();
  new IntersectionObserver((e) => { visivel = e[0].isIntersecting; }, { threshold: 0.02 }).observe(palco);
  document.addEventListener('visibilitychange', () => { ultimo = performance.now(); });

  // zoom de um passo no instante k (0..1)
  const zoomEm = (p, k) => lerp(p.zoom[0], p.zoom[1], k);
  const cenaFinal = (p) => (p.tipo === 'segurar' || p.tipo === 'acender' ? p.cena : p.para);

  function quadro() {
    const idx = passos.findIndex((p) => t >= p.ini && t < p.ini + p.dur);
    const p = passos[idx < 0 ? passos.length - 1 : idx];
    const ant = passos[Math.max(0, (idx < 0 ? passos.length - 1 : idx) - 1)];
    const k = clamp((t - p.ini) / p.dur);
    let A, B, qA, qB, modo = 0, prog = 0, luzA = 1, luzB = 1, desf = 0, linha = 0;
    const qAnt = janela(ant.zoom[1], ant.foco);

    switch (p.tipo) {
      case 'acender': {
        A = B = p.cena;
        const l = k;
        const pisca = l < 0.35 ? (l > 0.12 && l < 0.2 ? 0.2 : 0.55) : l < 0.5 ? 0.35 : 1;
        luzA = luzB = 0.06 + 0.94 * pisca * sai(l);
        qA = qB = janela(zoomEm(p, k), p.foco);
        break;
      }
      case 'cruzar':
        A = p.de; B = p.para;
        prog = suave(k);
        desf = Math.sin(Math.PI * k) * (p.desfoque ?? 0.08);
        qA = janela(ant.zoom[1] * (1 + 0.15 * entra(k)), ant.foco);
        qB = janela(zoomEm(p, sai(k)), p.foco);
        break;
      case 'linha':
        A = p.de; B = p.para; modo = 1;
        prog = -0.03 + 1.06 * suave(k);
        linha = clamp(k * 25) * clamp((1 - k) * 25);
        qA = qB = janela(zoomEm(p, k), p.foco);
        break;
      case 'circulo':
        A = p.de; B = p.para; modo = 2;
        prog = suave(k);
        qA = qB = janela(zoomEm(p, k), p.foco);
        gl.uniform2fv(U.uCentro, p.centro || p.foco);
        break;
      case 'mergulho': {
        A = p.de; B = p.para;
        const f = suave(k);
        qA = janela(ant.zoom[1] * (1 + 3.2 * entra(k)), [lerp(ant.foco[0], p.foco[0], f), lerp(ant.foco[1], p.foco[1], f)]);
        qB = janela(lerp(1.3, p.zoom[1], sai(clamp((k - 0.5) / 0.5))), p.foco);
        desf = Math.sin(Math.PI * k) * 0.22;
        prog = suave(clamp((k - 0.5) / 0.45));
        break;
      }
      default:
        A = B = p.cena;
        qA = qB = janela(zoomEm(p, k), p.foco);
    }

    ligar(0, A); ligar(1, B);
    gl.uniform4fv(U.qA, qA); gl.uniform4fv(U.qB, qB);
    gl.uniform1f(U.uModo, modo); gl.uniform1f(U.uP, prog); gl.uniform1f(U.uT, t);
    gl.uniform1f(U.uLuzA, luzA); gl.uniform1f(U.uLuzB, luzB); gl.uniform1f(U.uDesf, desf); gl.uniform1f(U.uLinha, linha);
    gl.uniform2f(U.uRes, canvas.width, canvas.height);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);

    // capítulo atual: barra e título
    let c = 0;
    caps.forEach((cap, i) => { if (t >= cap.ini) c = i; });
    botoes.forEach((b, i) => {
      const ini = caps[i].ini, fim = caps[i + 1]?.ini ?? TOTAL;
      b.classList.toggle('ativo', i === c);
      b.style.setProperty('--p', clamp((t - ini) / (fim - ini)).toFixed(3));
    });
    mostrarBeat(c);
    palco.dataset.cena = cenaFinal(p);
  }

  function laco(agora) {
    requestAnimationFrame(laco);
    const dt = clamp((agora - ultimo) / 1000, 0, 0.05);
    ultimo = agora;
    if (!pronto || !visivel || document.hidden) return;
    if (tocando) t = (t + dt) % TOTAL;
    quadro();
  }

  // ---------- carregamento ----------
  let carregadas = 0;
  progresso(0.03, 'acendendo as luzes');
  const minimo = new Promise((r) => setTimeout(r, 900));
  Promise.all(CONFIG.cenas.map((src, i) => {
    const img = new Image();
    img.src = src;
    return img.decode().then(() => {
      subir(i, img);
      carregadas++;
      progresso(0.05 + 0.95 * (carregadas / CONFIG.cenas.length), 'preparando a cena');
    });
  }))
    .then(async () => {
      await minimo;
      pronto = true;
      ultimo = performance.now();
      quadro();
      liberar();
    })
    .catch((e) => { console.warn('hero em sequência: imagem não carregou', e); modoFoto(); });
  requestAnimationFrame(laco);

  // pra conferência e pra gerar print de cada etapa
  window.__hero = { ir: (s) => { t = s; if (pronto) quadro(); }, pausar: () => { tocando = false; atualizarPlay(); }, get t() { return t; }, total: TOTAL };
})();
