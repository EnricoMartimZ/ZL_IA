// Linhas — um desenho em SVG que se constrói traço a traço com a rolagem, como uma planta técnica.
// Serve pra quem projeta e constrói: arquitetura, engenharia, serralheria, marcenaria, móveis planejados,
// construtora, instalações, gesso. Também pra "mostrar por dentro" (esquema elétrico, encanamento).
//
// <svg viewBox="0 0 1200 800" class="tec-linhas">
//   <path d="…" />                      ← cada traço vira uma etapa do desenho, na ordem do arquivo
//   <circle … data-preencher />          ← depois de desenhado, ganha o preenchimento (.preenchido)
//   <text … data-depois=".7">3,20 m</text>  ← cotas e rótulos aparecem num ponto do progresso
// </svg>
//
// import { linhas } from './tecnicas/linhas.js';
// const l = linhas(document.querySelector('.tec-linhas'), { espalhar: 0.65 });
// palco(secao, l.progresso);
//
// O SVG pode vir do Illustrator/Figma (exportar com traços, não contornos), de uma planta real do cliente
// redesenhada, ou ser gerado por código (grades, círculos de construção, cotas).

import { local, suave } from './palco.js';

export function linhas(svg, opcoes = {}) {
  const o = {
    espalhar: 0.6,       // quanto da linha do tempo é usado pra escalonar os traços (0 = todos juntos)
    ordem: 'documento',  // 'documento' | 'aleatoria' | 'centro' (do meio pra fora)
    ...opcoes,
  };
  let tracos = [...svg.querySelectorAll('path, line, polyline, polygon, circle, rect, ellipse')]
    .filter((el) => !el.closest('defs, mask, clipPath'))
    .map((el) => {
      let len = 0;
      try { len = el.getTotalLength(); } catch { len = 0; }
      if (!len) return null;
      el.style.strokeDasharray = `${len} ${len}`;
      el.style.strokeDashoffset = `${len}`;
      const b = el.getBBox();
      return { el, len, cx: b.x + b.width / 2, cy: b.y + b.height / 2 };
    })
    .filter(Boolean);

  if (o.ordem === 'aleatoria') {
    tracos.sort(() => Math.random() - 0.5);
  } else if (o.ordem === 'centro') {
    const vb = svg.viewBox.baseVal;
    const mx = vb.x + vb.width / 2, my = vb.y + vb.height / 2;
    tracos.sort((a, b) => Math.hypot(a.cx - mx, a.cy - my) - Math.hypot(b.cx - mx, b.cy - my));
  }
  const textos = [...svg.querySelectorAll('[data-depois]')];
  const n = tracos.length;
  const dur = Math.max(0.05, 1 - o.espalhar);

  function progresso(p) {
    tracos.forEach((t, i) => {
      const inicio = n > 1 ? (i / (n - 1)) * o.espalhar : 0;
      const k = suave(local(p, inicio, inicio + dur));
      t.el.style.strokeDashoffset = `${t.len * (1 - k)}`;
      if (t.el.hasAttribute('data-preencher')) t.el.classList.toggle('preenchido', k >= 1);
    });
    textos.forEach((el) => el.classList.toggle('visivel', p >= Number(el.dataset.depois)));
  }
  progresso(0);
  return { progresso };
}

// Ajudante: linhas de construção (grade fina + círculos de compasso + diagonais) pra pôr atrás de um
// logo ou de uma peça e dar o ar de "projeto". Devolve um <g> pra colocar no SVG.
export function construcao(svg, { colunas = 6, linhas: lin = 4, circulos = 3, diagonais = true } = {}) {
  const ns = 'http://www.w3.org/2000/svg';
  const vb = svg.viewBox.baseVal;
  const g = document.createElementNS(ns, 'g');
  g.setAttribute('class', 'tec-construcao');
  const add = (tag, at) => { const e = document.createElementNS(ns, tag); for (const k in at) e.setAttribute(k, at[k]); g.appendChild(e); };
  for (let i = 1; i < colunas; i++) { const x = vb.x + (vb.width * i) / colunas; add('line', { x1: x, y1: vb.y, x2: x, y2: vb.y + vb.height }); }
  for (let i = 1; i < lin; i++) { const y = vb.y + (vb.height * i) / lin; add('line', { x1: vb.x, y1: y, x2: vb.x + vb.width, y2: y }); }
  const cx = vb.x + vb.width / 2, cy = vb.y + vb.height / 2;
  for (let i = 1; i <= circulos; i++) add('circle', { cx, cy, r: (Math.min(vb.width, vb.height) * 0.45 * i) / circulos });
  if (diagonais) {
    add('line', { x1: vb.x, y1: vb.y, x2: vb.x + vb.width, y2: vb.y + vb.height });
    add('line', { x1: vb.x + vb.width, y1: vb.y, x2: vb.x, y2: vb.y + vb.height });
  }
  svg.prepend(g);
  return g;
}
