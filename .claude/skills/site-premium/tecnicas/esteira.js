// Esteira — os produtos giram numa pista como num balcão de rodízio. Passar o mouse para a esteira e
// levanta o prato, arrastar gira com inércia, tocar abre a ficha com o botão de pedir. O cardápio
// deixa de ser lista e vira brinquedo. Serve pra restaurante, pizzaria, padaria, doceria, adega,
// loja de produto com poucos itens fortes.
//
// import { esteira } from './tecnicas/esteira.js';
// esteira(document.querySelector('#balcao'), {
//   itens: [{ nome: 'Pizza da casa', preco: 'R$ 62', imagem: 'img/pizza.webp', texto: 'Massa de 48 horas.', cor: '#c8451f' }],
//   botao: 'Pedir no WhatsApp',
//   aoEscolher: (item) => abrirWhatsApp(item),
// });
//
// A imagem é uma foto de cima, recortada, num quadrado com fundo transparente. Sem `aoEscolher`, a
// ficha só mostra o produto. Reduzir movimento deixa a esteira parada; as setas andam prato a prato.
//
// Geometria e física a partir do Sushi Conveyor Belt Menu, de DHxWhy (21st.dev, licença MIT).

import { limitar, semMovimento } from './palco.js';
import { laco, mola, balanco, arremesso, voar } from './fisica.js';

const INCLINA = 0.8, VAO = 1.35, CURVA = 0.95, FAIXA = 1.22, SOBE = 0.08;
const RODA = 0, BUSCA = 1, ARRASTO = 2;

function pontoNaPista(g, u) {
  const { s, r, l } = g;
  let t = ((u % l) + l) % l;
  if (t < s) return { x: s / 2 - t, z: r, nx: 0, nz: 1, tx: -1, tz: 0 };
  t -= s;
  const arco = Math.PI * r;
  if (t < arco) {
    const f = t / r, sen = Math.sin(f), cos = Math.cos(f);
    return { x: -s / 2 - r * sen, z: r * cos, nx: -sen, nz: cos, tx: -cos, tz: -sen };
  }
  t -= arco;
  if (t < s) return { x: -s / 2 + t, z: -r, nx: 0, nz: -1, tx: 1, tz: 0 };
  t -= s;
  const f = Math.min(Math.PI, t / r), sen = Math.sin(f), cos = Math.cos(f);
  return { x: s / 2 + r * sen, z: -r * cos, nx: sen, nz: -cos, tx: cos, tz: sen };
}

// a pista de trás encolhe pra kb e a profundidade achata: perspectiva sem 3D, em qualquer celular
function projetar(g, x, z) {
  const k = g.a + g.b * z;
  return { x: g.cx + x * k, y: g.ym + INCLINA * (g.a * z + (g.b * z * z) / 2), k };
}

function montar(W, n, d, kb) {
  const l = Math.max(1, n) * VAO * d;
  const r = Math.min(CURVA * d, l / (2 * Math.PI));
  const g = { W, d, r, l, s: Math.max(0, (l - 2 * Math.PI * r) / 2), passo: l / n, n, kb, cx: W / 2, ym: 0, a: (1 + kb) / 2, b: (1 - kb) / (2 * r), faixa: FAIXA * d, ripas: Math.max(10, Math.round(l / (0.34 * d))), lado: Math.max(3, d * 0.07), H: 0, meia: 0 };
  let topo = Infinity, base = -Infinity, meia = 0;
  for (let j = 0; j < 120; j++) {
    const p = pontoNaPista(g, (j / 120) * l);
    const b = projetar(g, p.x + p.nx * g.faixa / 2, p.z + p.nz * g.faixa / 2);
    const c = projetar(g, p.x, p.z);
    const h = c.k * d * INCLINA / 2;
    topo = Math.min(topo, b.y, c.y - h * 1.3 - 34);
    base = Math.max(base, b.y + g.lado + d * 0.06, c.y + h + d * 0.08);
    meia = Math.max(meia, Math.abs(b.x - g.cx) + 3, Math.abs(c.x - g.cx) + c.k * d * 1.08 / 2);
  }
  g.ym = Math.ceil(-topo) + 2;
  g.H = Math.ceil(base - topo) + 4;
  g.meia = meia;
  return g;
}

function contorno(g, desvio) {
  let d = '';
  for (let j = 0; j < 168; j++) {
    const p = pontoNaPista(g, (j / 168) * g.l);
    const q = projetar(g, p.x + p.nx * desvio, p.z + p.nz * desvio);
    d += `${j ? 'L' : 'M'}${q.x.toFixed(1)} ${q.y.toFixed(1)}`;
  }
  return `${d}Z`;
}

function ripas(g, deslocar, extra) {
  const meia = g.faixa * 0.46, vao = g.l / g.ripas, curva = vao * 0.2;
  let d = '';
  for (let j = 0; j < g.ripas; j++) {
    const p = pontoNaPista(g, deslocar + extra + j * vao);
    const a = projetar(g, p.x - p.nx * meia, p.z - p.nz * meia);
    const b = projetar(g, p.x + p.nx * meia, p.z + p.nz * meia);
    const m = projetar(g, p.x + p.tx * curva, p.z + p.tz * curva);
    d += `M${a.x.toFixed(1)} ${a.y.toFixed(1)}Q${(2 * m.x - (a.x + b.x) / 2).toFixed(1)} ${(2 * m.y - (a.y + b.y) / 2).toFixed(1)} ${b.x.toFixed(1)} ${b.y.toFixed(1)}`;
  }
  return d;
}

export function esteira(quadro, opcoes = {}) {
  const o = { itens: [], velocidade: 26, rotulo: 'Esteira de produtos', dica: 'Pare o mouse num prato, arraste pra girar, toque pra ver.', botao: 'Pedir', fechar: 'Fechar', pausar: 'Pausar esteira', aoEscolher: null, ...opcoes };
  const n = o.itens.length;
  quadro.classList.add('esteira');
  quadro.innerHTML = `
    <div class="est-palco" role="group" aria-label="${o.rotulo}">
      <svg class="est-pista" aria-hidden="true"></svg>
      ${o.itens.map((it, i) => `
        <button class="est-prato" type="button" data-i="${i}" tabindex="${i ? -1 : 0}" aria-label="${it.nome}, ${it.preco || ''}" aria-haspopup="dialog">
          <span class="est-sombra" aria-hidden="true"></span>
          <span class="est-sobe"><img src="${it.imagem}" alt="" draggable="false"><span class="est-aro" style="--cor:${it.cor || 'currentColor'}"></span></span>
        </button>`).join('')}
    </div>
    <p class="est-legenda" aria-live="polite"></p>
    <div class="est-botoes">
      <button type="button" data-ir="-1" aria-label="Prato anterior">‹</button>
      <button type="button" data-pausa aria-label="${o.pausar}" aria-pressed="false">Ⅱ</button>
      <button type="button" data-ir="1" aria-label="Próximo prato">›</button>
    </div>
    <dialog class="est-ficha">
      <div class="est-ficha-foto"><img alt=""></div>
      <div class="est-ficha-texto"><h3></h3><p></p><b></b><div><button type="button" class="est-pedir">${o.botao}</button><button type="button" class="est-fechar">${o.fechar}</button></div></div>
    </dialog>`;

  const palco = quadro.querySelector('.est-palco');
  const svg = quadro.querySelector('.est-pista');
  const pratos = [...quadro.querySelectorAll('.est-prato')];
  const legenda = quadro.querySelector('.est-legenda');
  const ficha = quadro.querySelector('.est-ficha');
  const parado = semMovimento();
  const s = { offset: 0, v: 0, modo: RODA, alvo: 0, sobe: new Array(n).fill(0), vsobe: new Array(n).fill(0) };
  const dedo = arremesso();
  let g = null, ativo = null, pausado = false, abriu = false, emFoco = 0, costura = null, brilho = null;
  let px = 0, py = 0, dentro = false, travado = false, trava = { x: 0, y: 0 };
  let toque = null;

  function pose(i) {
    const p = pontoNaPista(g, s.offset - i * g.passo);
    const q = projetar(g, p.x, p.z);
    return { x: q.x, y: q.y, k: q.k, fundo: (p.z + g.r) / (2 * g.r) };
  }
  const noCentro = () => ((Math.round((s.offset - g.s / 2) / g.passo) % n) + n) % n;

  // o prato embaixo do mouse muda sozinho enquanto a esteira gira: por isso o teste é por conta, a cada quadro
  function quemEsta(x, y) {
    let melhor = null, baixo = -Infinity;
    for (let i = 0; i < n; i++) {
      const q = pose(i);
      const e = limitar(s.sobe[i], 0, 1.2);
      const rx = g.d * q.k * (1 + SOBE * e) / 2, ry = g.d * INCLINA * q.k * (1 + SOBE * e) / 2;
      const dx = (x - q.x) / rx, dy = (y - q.y + 0.06 * g.d * INCLINA * q.k * e) / ry;
      if (dx * dx + dy * dy > 1) continue;
      if (i === ativo) return i;
      if (q.y > baixo) { melhor = i; baixo = q.y; }
    }
    return melhor;
  }

  function escolher(i) {
    if (i === ativo) return;
    ativo = i;
    pratos.forEach((p, j) => p.classList.toggle('ativo', j === i));
    const it = i === null ? null : o.itens[i];
    legenda.textContent = it ? `${it.nome}${it.preco ? ` · ${it.preco}` : ''}` : o.dica;
    acordar();
  }

  function pintar() {
    if (!g) return;
    pratos.forEach((b, i) => {
      const q = pose(i), e = s.sobe[i];
      b.style.transform = `translate3d(${(q.x - g.d / 2).toFixed(2)}px, ${(q.y - g.d * INCLINA / 2).toFixed(2)}px, 0) scale(${q.k.toFixed(4)})`;
      b.style.zIndex = i === ativo ? 2000 : 100 + Math.round(q.y);
      b.firstElementChild.nextElementSibling.style.transform = `translateY(${(-6 * e).toFixed(3)}%) scale(${(1 + SOBE * e).toFixed(4)})`;
      b.style.filter = `brightness(${(1 - 0.16 * limitar(1 - q.fundo) * (1 - 0.7 * limitar(e))).toFixed(3)})`;
    });
    costura?.setAttribute('d', ripas(g, s.offset, 0));
    brilho?.setAttribute('d', ripas(g, s.offset, -Math.max(1.4, g.d * 0.024)));
  }

  const acordar = laco(quadro, {
    passo(h) {
      if (!g) return false;
      const parar = pausado || ativo !== null || abriu;
      const cruzeiro = parado ? 0 : o.velocidade;
      if (s.modo === BUSCA) {
        [s.offset, s.v] = mola(s.offset, s.v, s.alvo, 5.6, h);
        if (Math.abs(s.alvo - s.offset) < 0.3 && Math.abs(s.v) < 4) { s.offset = s.alvo; s.v = 0; s.modo = RODA; }
      } else if (s.modo === RODA) {
        if (parar) { s.v *= Math.exp(-7.2 * h); if (Math.abs(s.v) < 0.02) s.v = 0; }
        else { const e = (s.v - cruzeiro) * Math.exp(-3.4 * h); s.v = cruzeiro + (Math.abs(e) < 0.01 ? 0 : e); }
        s.offset += s.v * h;
      }
      let ocupado = s.modo !== RODA || s.v !== 0 || (!parar && cruzeiro > 0);
      for (let i = 0; i < n; i++) {
        const meta = i === ativo ? 1 : 0;
        if (parado) { s.sobe[i] = meta; s.vsobe[i] = 0; continue; }
        [s.sobe[i], s.vsobe[i]] = balanco(s.sobe[i], s.vsobe[i], meta, 330, 23, h);
        if (Math.abs(meta - s.sobe[i]) < 0.002 && Math.abs(s.vsobe[i]) < 0.02) { s.sobe[i] = meta; s.vsobe[i] = 0; } else ocupado = true;
      }
      if (dentro && !travado && s.modo === RODA && !abriu && !toque && Math.abs(s.v) > 0.3) {
        const q = quemEsta(px, py);
        if (q !== null && q !== ativo) escolher(q);
      }
      return ocupado;
    },
    desenhar: pintar,
  });

  function medir() {
    const W = palco.clientWidth;
    if (!W || !n) return;
    const estreito = quadro.clientWidth < 480;
    const kb = estreito ? 0.6 : 0.68;
    const meia = montar(1000, n, 100, kb).meia / 100;
    // no celular a pista passa da tela de propósito: prato de 96 px cortado vale mais que prato minúsculo inteiro
    const d = Math.round(limitar((W - 8) / (2 * meia), 96, 170));
    const novo = montar(W, n, d, kb);
    if (g && g.l !== novo.l) { s.offset *= novo.l / g.l; s.alvo *= novo.l / g.l; }
    const primeira = !g;
    g = novo;
    if (primeira) { s.offset = g.s / 2; s.v = parado ? 0 : o.velocidade; }
    palco.style.height = `${g.H}px`;
    pratos.forEach((b) => { b.style.width = `${g.d}px`; b.style.height = `${g.d * INCLINA}px`; });
    const fora = contorno(g, g.faixa / 2), dentroP = contorno(g, -g.faixa / 2), ilha = contorno(g, -g.faixa / 2 - g.d * 0.035);
    // camadas, de baixo pra cima: sombra borrada, lateral (a mesma forma descida), tampo, ripas, trilhos com fio de luz, ilha
    svg.setAttribute('viewBox', `0 0 ${g.W} ${g.H}`);
    svg.innerHTML = `
      <defs><filter id="est-borra" x="-10%" y="-30%" width="120%" height="160%"><feGaussianBlur stdDeviation="${(g.d * 0.06).toFixed(1)}"/></filter></defs>
      <path d="${fora}" transform="translate(0 ${(g.lado + g.d * 0.07).toFixed(1)})" fill="#000" opacity=".28" filter="url(#est-borra)"/>
      <path class="est-lado" d="${fora}${dentroP}" fill-rule="evenodd" transform="translate(0 ${g.lado.toFixed(1)})"/>
      <path class="est-tampo" d="${fora}${dentroP}" fill-rule="evenodd"/>
      <path class="est-costura" fill="none" stroke="#000" stroke-opacity=".42" stroke-width="${Math.max(1, g.d * 0.013)}" stroke-linecap="round"/>
      <path class="est-brilho" fill="none" stroke="#fff" stroke-opacity=".14" stroke-width="${Math.max(0.8, g.d * 0.009)}" stroke-linecap="round"/>
      <path class="est-trilho" d="${fora}" fill="none" stroke-width="${Math.max(2, g.d * 0.026)}"/>
      <path d="${fora}" fill="none" stroke="#fff" stroke-opacity=".5" stroke-width="${Math.max(0.8, g.d * 0.008)}" transform="translate(0 -.8)"/>
      <path class="est-trilho" d="${dentroP}" fill="none" stroke-width="${Math.max(1.6, g.d * 0.02)}"/>
      <path class="est-parede" d="${ilha}"/>
      <path class="est-ilha" d="${ilha}" transform="translate(0 ${(-g.lado * 0.6).toFixed(1)})"/>`;
    costura = svg.querySelector('.est-costura');
    brilho = svg.querySelector('.est-brilho');
    pintar();
    acordar();
  }
  new ResizeObserver(medir).observe(palco);

  function buscar(i) {
    const base = g.s / 2 + i * g.passo;
    s.alvo = base + Math.round((s.offset - base) / g.l) * g.l;
    if (parado) { s.offset = s.alvo; s.v = 0; pintar(); return; }
    s.modo = BUSCA;
    acordar();
  }
  function ir(i, focar) {
    const prox = ((i % n) + n) % n;
    emFoco = prox;
    pratos.forEach((b, j) => { b.tabIndex = j === prox ? 0 : -1; });
    if (focar) pratos[prox].focus({ preventScroll: true });
    escolher(prox);
    buscar(prox);
  }

  function abrir(i) {
    const it = o.itens[i];
    const origem = pratos[i].querySelector('.est-sobe').getBoundingClientRect();
    abriu = true;
    s.v = 0; s.modo = RODA;
    escolher(i);
    ficha.querySelector('img').src = it.imagem;
    ficha.querySelector('img').alt = it.nome;
    ficha.querySelector('h3').textContent = it.nome;
    ficha.querySelector('p').textContent = it.texto || '';
    ficha.querySelector('b').textContent = it.preco || '';
    ficha.querySelector('.est-pedir').hidden = !o.aoEscolher;
    ficha.dataset.i = i;
    pratos[i].style.opacity = '0'; // opacity, não visibility: o foco precisa conseguir voltar ao prato
    ficha.showModal();
    if (!parado) voar(ficha.querySelector('.est-ficha-foto'), origem);
  }
  // <dialog> já prende o foco, fecha com Esc e devolve o foco ao prato
  ficha.addEventListener('close', () => {
    abriu = false;
    pratos.forEach((b) => { b.style.opacity = ''; });
    escolher(null);
  });
  ficha.addEventListener('click', (e) => { if (e.target === ficha) ficha.close(); });
  ficha.querySelector('.est-fechar').addEventListener('click', () => ficha.close());
  ficha.querySelector('.est-pedir').addEventListener('click', () => { o.aoEscolher?.(o.itens[ficha.dataset.i]); ficha.close(); });

  const local = (e) => { const r = palco.getBoundingClientRect(); return { x: e.clientX - r.left, y: e.clientY - r.top }; };
  palco.addEventListener('pointerdown', (e) => {
    if (e.button || !g) return;
    const at = local(e);
    toque = { id: e.pointerId, i: quemEsta(at.x, at.y), x: e.clientX, y: e.clientY, inicio: s.offset, moveu: false, pista: at.y >= g.ym ? 1 : -1 };
    dedo.inicio(e.clientX, e.timeStamp);
  });
  palco.addEventListener('pointermove', (e) => {
    if (!g) return;
    const at = local(e);
    if (e.pointerType === 'mouse') { px = at.x; py = at.y; dentro = true; }
    if (toque && toque.id === e.pointerId) {
      const dx = e.clientX - toque.x;
      // só vira arrasto se andou mais de lado que de pé: o resto é a pessoa rolando a página
      if (!toque.moveu && Math.abs(dx) > 6 && Math.abs(dx) > Math.abs(e.clientY - toque.y)) {
        toque.moveu = true;
        escolher(null);
        s.modo = ARRASTO;
        palco.setPointerCapture(e.pointerId);
      }
      if (toque.moveu) {
        const escala = toque.pista > 0 ? 1 : 1 / g.kb;
        const v = dedo.mover(e.clientX, e.timeStamp);
        s.offset = toque.inicio - toque.pista * dx * escala;
        s.v = parado ? 0 : -toque.pista * v * escala;
        pintar();
      }
      return;
    }
    if (e.pointerType !== 'mouse' || abriu) return;
    // depois de soltar, nada levanta até o mouse andar de novo
    if (travado) { if (Math.hypot(at.x - trava.x, at.y - trava.y) < 4) return; travado = false; }
    escolher(quemEsta(at.x, at.y));
  });
  function soltar(e, cancelou) {
    if (!toque || toque.id !== e.pointerId) return;
    const t = toque;
    toque = null;
    if (palco.hasPointerCapture(e.pointerId)) palco.releasePointerCapture(e.pointerId);
    if (s.modo === ARRASTO) {
      s.modo = RODA;
      const escala = t.pista > 0 ? 1 : 1 / g.kb;
      s.v = parado ? 0 : limitar(-t.pista * dedo.soltar(e.timeStamp) * escala, -1400, 1400);
      if (e.pointerType === 'mouse') { const at = local(e); travado = true; trava = at; }
      acordar();
      return;
    }
    if (cancelou || t.moveu || t.i === null) return;
    // no toque, o primeiro levanta o prato e o segundo abre; com mouse, já estava levantado
    if (e.pointerType !== 'mouse' && ativo !== t.i) escolher(t.i);
    else abrir(t.i);
  }
  palco.addEventListener('pointerup', (e) => soltar(e, false));
  palco.addEventListener('pointercancel', (e) => soltar(e, true));
  palco.addEventListener('pointerleave', (e) => { if (e.pointerType === 'mouse') { dentro = false; travado = false; if (!toque && !abriu) escolher(null); } });
  palco.addEventListener('keydown', (e) => {
    const d = { ArrowRight: 1, ArrowLeft: -1 }[e.key];
    if (d) { e.preventDefault(); ir(emFoco + d, true); }
    if ((e.key === 'Enter' || e.key === ' ') && e.target.dataset.i !== undefined) { e.preventDefault(); abrir(Number(e.target.dataset.i)); }
  });
  quadro.querySelectorAll('[data-ir]').forEach((b) => b.addEventListener('click', () => ir((ativo ?? noCentro()) + Number(b.dataset.ir), false)));
  const pausa = quadro.querySelector('[data-pausa]');
  pausa.addEventListener('click', () => {
    pausado = !pausado;
    pausa.setAttribute('aria-pressed', String(pausado));
    pausa.textContent = pausado ? '▶' : 'Ⅱ';
    acordar();
  });
  legenda.textContent = o.dica;
  medir();

  return { ir: (i) => ir(i, false), abrir };
}
