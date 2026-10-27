// Modelo /site-premium — seção "Onde fica": mapa noturno com as ruas reais em volta da loja.
// Um carro sai sujo de uma avenida próxima, segue a rota "comendo" os pontos até a loja,
// é cuidado lá e sai brilhando. Os dados vêm do mapa.json gerado por scripts/mapa-ruas.js.
// Por cliente: trocar data-mapa e data-loja no .mapa-caixa do index.html (e os textos abaixo, se quiser).
(() => {
  const caixa = document.querySelector('.mapa-caixa');
  if (!caixa) return;

  const nomeLoja = caixa.dataset.loja || 'loja';
  const TEXTOS = {
    saindo: 'Saindo sujo…',
    indo: (m) => `A caminho da ${nomeLoja} · ${m} m`,
    chegou: `Na ${nomeLoja}: cuidando de tudo…`,
    saiu: 'Saiu novo.',
  };

  const canvas = caixa.querySelector('canvas');
  const ctx = canvas.getContext('2d');
  const elStatus = caixa.querySelector('[data-mapa-status]');
  const elPontos = caixa.querySelector('[data-mapa-pontos]');
  const semMovimento = matchMedia('(prefers-reduced-motion: reduce)').matches;

  const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
  const suave = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

  // ---------- cores do tema ----------
  const css = (n) => getComputedStyle(document.documentElement).getPropertyValue(n).trim();
  const conv = document.createElement('canvas').getContext('2d');
  function rgba(cor, a) {
    conv.fillStyle = '#000';
    conv.fillStyle = cor;
    const v = conv.fillStyle; // '#rrggbb' ou 'rgba(...)'
    if (v.startsWith('#')) {
      const n = parseInt(v.slice(1), 16);
      return `rgba(${n >> 16},${(n >> 8) & 255},${n & 255},${a})`;
    }
    return v.replace(/rgba?\(([^)]+)\)/, (_, c) => `rgba(${c.split(',').slice(0, 3).join(',')},${a})`);
  }
  let COR = {};
  const lerCores = () => {
    COR = { fundo: css('--bg-2') || '#0d0f14', base: css('--bg') || '#07080b', texto: css('--text') || '#eef0f4', apagado: css('--muted') || '#9aa0ab', destaque: css('--accent') || '#f2b33a' };
  };

  // ---------- carro visto de cima (desenhado aqui, limpo e sujo) ----------
  const CL = 34, CW = 16; // comprimento e largura do carro em px (antes da escala do celular)
  function texturaLama() {
    const c = document.createElement('canvas');
    c.width = CL * 2; c.height = CW * 2;
    const g = c.getContext('2d');
    let s = 7;
    const rnd = () => ((s = (s * 16807) % 2147483647) / 2147483647);
    g.fillStyle = '#6d5c46';
    g.fillRect(0, 0, c.width, c.height);
    for (let i = 0; i < 140; i++) {
      g.fillStyle = rnd() > 0.5 ? `rgba(58,46,33,${0.3 + rnd() * 0.5})` : `rgba(150,128,96,${0.2 + rnd() * 0.4})`;
      g.beginPath();
      g.ellipse(rnd() * c.width, rnd() * c.height, 1 + rnd() * 4, 1 + rnd() * 3, rnd() * 3, 0, Math.PI * 2);
      g.fill();
    }
    return c;
  }
  let lama;
  function corpo(g) {
    const r = 5;
    g.beginPath();
    g.moveTo(-CL / 2 + r, -CW / 2);
    g.lineTo(CL / 2 - r - 2, -CW / 2);
    g.quadraticCurveTo(CL / 2, -CW / 2, CL / 2, -CW / 2 + r);
    g.lineTo(CL / 2, CW / 2 - r);
    g.quadraticCurveTo(CL / 2, CW / 2, CL / 2 - r - 2, CW / 2);
    g.lineTo(-CL / 2 + r, CW / 2);
    g.quadraticCurveTo(-CL / 2, CW / 2, -CL / 2, CW / 2 - r);
    g.lineTo(-CL / 2, -CW / 2 + r);
    g.quadraticCurveTo(-CL / 2, -CW / 2, -CL / 2 + r, -CW / 2);
    g.closePath();
  }
  function desenharCarro(x, y, ang, sujo, brilho, escala) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(ang);
    ctx.scale(escala, escala);
    // sombra
    ctx.fillStyle = 'rgba(0,0,0,.5)';
    ctx.beginPath();
    ctx.ellipse(1.5, 2, CL / 2 + 3, CW / 2 + 3, 0, 0, Math.PI * 2);
    ctx.fill();
    // lataria
    corpo(ctx);
    if (sujo > 0.5) {
      ctx.save();
      ctx.clip();
      ctx.drawImage(lama, -CL / 2, -CW / 2, CL, CW);
      ctx.restore();
    } else {
      const g = ctx.createLinearGradient(0, -CW / 2, 0, CW / 2);
      g.addColorStop(0, '#20242d'); g.addColorStop(0.5, '#07080b'); g.addColorStop(1, '#20242d');
      ctx.fillStyle = g;
      ctx.fill();
    }
    // vidros e teto
    ctx.fillStyle = sujo > 0.5 ? '#52483b' : '#16243f';
    ctx.beginPath(); // para-brisa (frente = +x)
    ctx.moveTo(CL * 0.2, -CW * 0.36); ctx.lineTo(CL * 0.33, -CW * 0.3); ctx.lineTo(CL * 0.33, CW * 0.3); ctx.lineTo(CL * 0.2, CW * 0.36); ctx.closePath(); ctx.fill();
    ctx.beginPath(); // vidro traseiro
    ctx.moveTo(-CL * 0.3, -CW * 0.32); ctx.lineTo(-CL * 0.38, -CW * 0.27); ctx.lineTo(-CL * 0.38, CW * 0.27); ctx.lineTo(-CL * 0.3, CW * 0.32); ctx.closePath(); ctx.fill();
    ctx.fillStyle = sujo > 0.5 ? '#665643' : '#0b0d12';
    ctx.fillRect(-CL * 0.29, -CW * 0.34, CL * 0.48, CW * 0.68);
    // faróis e lanternas
    ctx.fillStyle = sujo > 0.5 ? '#bfae88' : '#eaf2ff';
    ctx.fillRect(CL / 2 - 2.5, -CW / 2 + 2, 2, 3.2); ctx.fillRect(CL / 2 - 2.5, CW / 2 - 5.2, 2, 3.2);
    ctx.fillStyle = sujo > 0.5 ? '#6e3426' : '#ff3d3d';
    ctx.fillRect(-CL / 2 + 0.5, -CW / 2 + 2, 1.6, 3); ctx.fillRect(-CL / 2 + 0.5, CW / 2 - 5, 1.6, 3);
    // reflexo do verniz
    if (brilho > 0) {
      ctx.save();
      corpo(ctx);
      ctx.clip();
      const px = -CL + brilho * CL * 2.4;
      const g = ctx.createLinearGradient(px - 10, -CW, px + 10, CW);
      g.addColorStop(0, 'rgba(255,255,255,0)'); g.addColorStop(0.5, 'rgba(255,255,255,.55)'); g.addColorStop(1, 'rgba(255,255,255,0)');
      ctx.fillStyle = g;
      ctx.fillRect(-CL, -CW, CL * 2, CW * 2);
      ctx.restore();
    }
    ctx.restore();
  }

  // ---------- dados e layout ----------
  let M = null, W = 0, H = 0, DPR = 1, S = 1, OX = 0, OY = 0, base = null, escalaCarro = 1;
  let rota = [], acum = [], L = 0, pontos = [];
  const tela = ([x, y]) => [OX + x * S, OY + y * S];

  function ponto(d) {
    d = clamp(d, 0, L);
    let i = 1;
    while (i < acum.length - 1 && acum[i] < d) i++;
    const [ax, ay] = rota[i - 1], [bx, by] = rota[i];
    const k = (d - acum[i - 1]) / (acum[i] - acum[i - 1] || 1);
    return { p: [ax + (bx - ax) * k, ay + (by - ay) * k], ang: Math.atan2(by - ay, bx - ax) };
  }

  function montar() {
    const r = canvas.getBoundingClientRect();
    DPR = Math.min(devicePixelRatio || 1, 2);
    W = r.width; H = r.height;
    canvas.width = Math.round(W * DPR); canvas.height = Math.round(H * DPR);
    lerCores();
    escalaCarro = W < 600 ? 0.8 : 1.15;

    // enquadra a rota (com folga); no desktop deixa a esquerda livre pro cartão
    const xs = M.rota.map((p) => p[0]).concat(0), ys = M.rota.map((p) => p[1]).concat(0);
    const folga = 170;
    const x0 = Math.min(...xs) - folga, x1 = Math.max(...xs) + folga, y0 = Math.min(...ys) - folga, y1 = Math.max(...ys) + folga;
    const desk = W > 860;
    const topo = 56;
    const areaX = desk ? W * 0.38 : 0, areaW = desk ? W * 0.62 : W, areaH = H - topo;
    S = Math.min(areaW / (x1 - x0), areaH / (y1 - y0));
    OX = areaX + (areaW - (x1 + x0) * S) / 2;
    OY = topo + (areaH - (y1 + y0) * S) / 2;

    rota = M.rota.map(tela);
    acum = [0];
    for (let i = 1; i < rota.length; i++) acum.push(acum[i - 1] + Math.hypot(rota[i][0] - rota[i - 1][0], rota[i][1] - rota[i - 1][1]));
    L = acum[acum.length - 1];
    pontos = [];
    for (let d = 26; d < L - 22; d += 18) pontos.push({ d, p: ponto(d).p, comido: -1 });

    // camada fixa: fundo, ruas e nomes
    base = document.createElement('canvas');
    base.width = canvas.width; base.height = canvas.height;
    const g = base.getContext('2d');
    g.scale(DPR, DPR);
    g.fillStyle = COR.fundo;
    g.fillRect(0, 0, W, H);
    const larg = { v: 3.5, l: 7, s: 10, p: 15 };
    const alfa = { v: 0.07, l: 0.13, s: 0.2, p: 0.28 };
    g.lineCap = 'round'; g.lineJoin = 'round';
    for (const c of ['v', 'l', 's', 'p']) {
      g.strokeStyle = rgba(COR.texto, alfa[c]);
      g.lineWidth = Math.max(c === 'v' ? 0.8 : 1.2, larg[c] * S);
      g.beginPath();
      for (const rua of M.ruas) {
        if (rua.c !== c) continue;
        rua.p.forEach((pt, i) => { const [x, y] = tela(pt); i ? g.lineTo(x, y) : g.moveTo(x, y); });
      }
      g.stroke();
    }
    // nomes das avenidas (cada nome uma vez, no maior trecho visível)
    const maior = new Map();
    for (const rua of M.ruas) {
      if (!rua.n) continue;
      for (let i = 1; i < rua.p.length; i++) {
        const a = tela(rua.p[i - 1]), b = tela(rua.p[i]);
        const len = Math.hypot(b[0] - a[0], b[1] - a[1]);
        const meio = [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
        if (meio[0] < 20 || meio[0] > W - 20 || meio[1] < 60 || meio[1] > H - 20) continue;
        if (len > (maior.get(rua.n)?.len || 90)) maior.set(rua.n, { len, a, b, meio });
      }
    }
    g.font = `500 ${W < 600 ? 8 : 9}px "JetBrains Mono", ui-monospace, monospace`;
    g.fillStyle = rgba(COR.apagado, 0.8);
    g.textAlign = 'center'; g.textBaseline = 'middle';
    for (const [nome, s] of maior) {
      let ang = Math.atan2(s.b[1] - s.a[1], s.b[0] - s.a[0]);
      if (ang > Math.PI / 2) ang -= Math.PI;
      if (ang < -Math.PI / 2) ang += Math.PI;
      g.save(); g.translate(...s.meio); g.rotate(ang);
      g.fillText(nome.toUpperCase().split('').join(' '), 0, -Math.max(7, larg.p * S * 0.5 + 6));
      g.restore();
    }
    // vinheta
    const v = g.createRadialGradient(W * 0.6, H * 0.5, Math.min(W, H) * 0.25, W * 0.6, H * 0.5, Math.max(W, H) * 0.75);
    v.addColorStop(0, 'rgba(0,0,0,0)'); v.addColorStop(1, rgba(COR.base, 0.75));
    g.fillStyle = v;
    g.fillRect(0, 0, W, H);
  }

  // ---------- animação ----------
  let T = { indo: 7, chegou: 2.6, saiu: 3, pausa: 1 };
  let t = 0, ultimo = 0, rodando = false, visto = false;
  const brilhos = Array.from({ length: 14 }, (_, i) => ({ a: (i / 14) * Math.PI * 2 + i, r: 0.6 + (i % 4) * 0.25, f: (i * 0.37) % 1 }));

  function estrela(x, y, s, a) {
    ctx.save();
    ctx.translate(x, y);
    ctx.fillStyle = `rgba(255,255,255,${a})`;
    ctx.beginPath();
    for (let i = 0; i < 8; i++) {
      const r = i % 2 ? s * 0.22 : s;
      const ang = (i / 8) * Math.PI * 2;
      ctx.lineTo(Math.cos(ang) * r, Math.sin(ang) * r);
    }
    ctx.fill();
    ctx.restore();
  }

  function desenhar() {
    const total = T.indo + T.chegou + T.saiu + T.pausa;
    const fase = t < T.indo ? 'indo' : t < T.indo + T.chegou ? 'chegou' : t < T.indo + T.chegou + T.saiu ? 'saiu' : 'pausa';
    const kIndo = clamp(t / T.indo);
    const d = L * suave(kIndo);
    const kChegou = clamp((t - T.indo) / T.chegou);
    const kSaiu = clamp((t - T.indo - T.chegou) / T.saiu);
    const some = fase === 'pausa' ? clamp((t - T.indo - T.chegou - T.saiu) / T.pausa) : 0;

    ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
    ctx.drawImage(base, 0, 0, W, H);

    // rastro dourado
    ctx.save();
    ctx.globalAlpha = 1 - some;
    ctx.strokeStyle = COR.destaque;
    ctx.lineWidth = 2.4;
    ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    ctx.shadowColor = COR.destaque; ctx.shadowBlur = 10;
    ctx.beginPath();
    ctx.moveTo(...rota[0]);
    for (let i = 1; i < rota.length && acum[i - 1] < d; i++) {
      if (acum[i] <= d) ctx.lineTo(...rota[i]);
      else ctx.lineTo(...ponto(d).p);
    }
    ctx.stroke();
    ctx.restore();

    // pontos da rota
    let comidos = 0;
    for (const pt of pontos) {
      if (pt.d <= d + 4) {
        if (pt.comido < 0) pt.comido = t;
        comidos++;
        const k = clamp((t - pt.comido) / 0.3);
        if (k < 1) {
          ctx.fillStyle = rgba(COR.destaque, 1 - k);
          ctx.beginPath(); ctx.arc(pt.p[0], pt.p[1], 2.2 + k * 4, 0, Math.PI * 2); ctx.fill();
        }
      } else {
        pt.comido = -1;
        ctx.fillStyle = rgba(COR.destaque, 0.85 * (1 - some));
        ctx.beginPath(); ctx.arc(pt.p[0], pt.p[1], 2.1, 0, Math.PI * 2); ctx.fill();
      }
    }

    // loja: pulso e etiqueta
    const [lx, ly] = tela([0, 0]);
    const pulso = (t % 1.6) / 1.6;
    ctx.strokeStyle = rgba(COR.destaque, 0.6 * (1 - pulso));
    ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.arc(lx, ly, 8 + pulso * 22, 0, Math.PI * 2); ctx.stroke();
    ctx.fillStyle = COR.destaque;
    ctx.beginPath(); ctx.arc(lx, ly, 5, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = COR.base;
    ctx.beginPath(); ctx.arc(lx, ly, 2, 0, Math.PI * 2); ctx.fill();
    ctx.font = 'italic 900 13px Archivo, system-ui, sans-serif';
    const tw = ctx.measureText(nomeLoja.toUpperCase()).width + 22;
    const ex = clamp(lx - tw / 2, 8, W - tw - 8), ey = ly - 46;
    ctx.fillStyle = rgba(COR.base, 0.92);
    ctx.strokeStyle = rgba(COR.destaque, 0.7);
    ctx.beginPath(); ctx.roundRect(ex, ey, tw, 26, 6); ctx.fill(); ctx.stroke();
    ctx.fillStyle = COR.destaque;
    ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
    ctx.fillText(nomeLoja.toUpperCase(), ex + 11, ey + 13.5);
    ctx.strokeStyle = rgba(COR.destaque, 0.7);
    ctx.beginPath(); ctx.moveTo(lx, ey + 26); ctx.lineTo(lx, ly - 7); ctx.stroke();

    // carro
    const { p, ang } = ponto(d);
    const sujo = fase === 'indo' || (fase === 'chegou' && kChegou < 0.55) ? 1 : 0;
    ctx.globalAlpha = 1 - some;
    if (fase === 'chegou' || fase === 'saiu') {
      // cuidado na loja: anéis e brilhos; troca de sujo pra limpo com um clarão
      const k = fase === 'chegou' ? kChegou : 1;
      for (const b of brilhos) {
        const f = (b.f + t * 0.9) % 1;
        const r = (CL * escalaCarro) * (0.7 + b.r * 0.6);
        const a = Math.sin(Math.PI * f) * (fase === 'chegou' ? 1 : 0.45 * (1 - kSaiu));
        estrela(p[0] + Math.cos(b.a + t * 0.3) * r, p[1] + Math.sin(b.a + t * 0.3) * r * 0.7, 3 + 3 * Math.sin(Math.PI * f), a);
      }
      const clarao = fase === 'chegou' ? Math.exp(-Math.pow((k - 0.55) / 0.08, 2)) : 0;
      if (clarao > 0.01) {
        const g = ctx.createRadialGradient(p[0], p[1], 0, p[0], p[1], 46);
        g.addColorStop(0, `rgba(255,255,255,${0.85 * clarao})`); g.addColorStop(1, 'rgba(255,255,255,0)');
        ctx.fillStyle = g;
        ctx.beginPath(); ctx.arc(p[0], p[1], 46, 0, Math.PI * 2); ctx.fill();
      }
      if (fase === 'saiu') {
        const g = ctx.createRadialGradient(p[0], p[1], 0, p[0], p[1], 40);
        g.addColorStop(0, rgba(COR.destaque, 0.28)); g.addColorStop(1, rgba(COR.destaque, 0));
        ctx.fillStyle = g;
        ctx.beginPath(); ctx.arc(p[0], p[1], 40, 0, Math.PI * 2); ctx.fill();
      }
    }
    desenharCarro(p[0], p[1], ang, sujo, fase === 'saiu' ? kSaiu : 0, escalaCarro);
    ctx.globalAlpha = 1;

    // painel
    const status = fase === 'indo' ? (kIndo < 0.08 ? TEXTOS.saindo : TEXTOS.indo(Math.max(0, Math.round((L - d) / S / 10) * 10)))
      : fase === 'chegou' ? TEXTOS.chegou : TEXTOS.saiu;
    if (elStatus && elStatus.textContent !== status) elStatus.textContent = status;
    if (elPontos) elPontos.textContent = comidos;
    if (t >= total) t = 0;
  }

  function laco(agora) {
    requestAnimationFrame(laco);
    const dt = clamp((agora - ultimo) / 1000, 0, 0.05);
    ultimo = agora;
    if (!rodando || document.hidden) return;
    t += dt;
    desenhar();
  }

  // ---------- início ----------
  fetch(caixa.dataset.mapa || 'mapa.json')
    .then((r) => { if (!r.ok) throw new Error(`mapa ${r.status}`); return r.json(); })
    .then(async (dados) => {
      M = dados;
      if (!M.rota?.length || !M.ruas?.length) throw new Error('mapa sem rota');
      lama = texturaLama();
      await document.fonts?.ready;
      montar();
      T.indo = clamp(L / 110, 4.5, 9);
      addEventListener('resize', () => { montar(); if (!rodando) desenhar(); });
      if (semMovimento) {
        t = T.indo + T.chegou + T.saiu * 0.6;
        desenhar();
        return;
      }
      desenhar();
      new IntersectionObserver((e) => {
        rodando = e[0].isIntersecting;
        if (rodando && !visto) { visto = true; t = 0; } // começa do começo na primeira vez que aparece
        ultimo = performance.now();
      }, { threshold: 0.25 }).observe(caixa);
      requestAnimationFrame(laco);
    })
    .catch((e) => {
      console.warn('mapa desligado:', e.message);
      caixa.classList.add('sem-mapa');
    });

  // pra conferência e pra gerar print de cada fase
  window.__mapa = { ir: (s) => { t = s; if (M) desenhar(); }, pausar: () => { rodando = false; }, get fases() { return { ...T }; } };
})();
