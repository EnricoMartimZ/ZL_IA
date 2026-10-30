// Luz — o dia passa na tela: a manhã entra pela janela, o meio-dia clareia, a noite acende. A cor da
// página, a tinta do texto e a mancha de sol na parede andam com a rolagem. É CSS puro por baixo,
// então pesa quase nada e roda em qualquer celular.
// Serve pra padaria, café, pousada, decoração, móveis, cerâmica, floricultura, restaurante que muda
// do almoço pro jantar, e pra história "um dia com a empresa" (o sol é o relógio do site).
//
// import { dia } from './tecnicas/luz.js';
// const d = dia(document.querySelector('#quadro'), {
//   paradas: [
//     { p: 0,   fundo: '#f1e2cb', tinta: '#2c2118', luz: '#fff1d6' },   // manhã
//     { p: .5,  fundo: '#fbf6ec', tinta: '#1c1712', luz: '#ffffff' },   // meio-dia
//     { p: .6,  fundo: '#fbf6ec', tinta: '#1c1712', luz: '#ffffff' },
//     { p: .72, fundo: '#191a28', tinta: '#efe6d6', luz: '#ffb36b' },   // noite: a "janela" vira luz acesa
//     { p: 1,   fundo: '#191a28', tinta: '#efe6d6', luz: '#ffb36b' },
//   ],
//   folhas: true,
// });
// palco(secao, d.progresso);
//
// A virada do claro pro escuro precisa ser curta e cair entre dois capítulos: no meio dela a tinta e
// o fundo têm a mesma cor e o texto some.
//
// O alvo recebe --dia-fundo, --dia-tinta e --dia-luz: usar no CSS do site pra tudo acompanhar.

import { limitar } from './palco.js';

const hex = (h) => { const v = parseInt(h.replace('#', ''), 16); return [(v >> 16) & 255, (v >> 8) & 255, v & 255]; };
const css = (c) => `rgb(${c.map((x) => Math.round(x)).join(' ')})`;

const FOLHAS = `<svg viewBox="0 0 600 400" preserveAspectRatio="xMidYMid slice" aria-hidden="true">${
  [[60, 90, 26], [150, 40, -12], [235, 120, 40], [330, 55, 8], [420, 140, -30], [520, 70, 18], [110, 210, -20], [300, 230, 30], [470, 260, 12]]
    .map(([x, y, r]) => `<path transform="translate(${x} ${y}) rotate(${r})" d="M0 0 C 34 -44, 96 -44, 130 0 C 96 44, 34 44, 0 0 Z"/>`).join('')
}<path d="M-20 70 Q 160 130 320 90 T 640 130" fill="none" stroke="currentColor" stroke-width="10"/></svg>`;

export function dia(alvo, opcoes = {}) {
  const o = {
    paradas: [
      { p: 0, fundo: '#f1e2cb', tinta: '#2c2118', luz: '#fff1d6' },
      { p: 0.5, fundo: '#fbf6ec', tinta: '#1c1712', luz: '#ffffff' },
      { p: 0.6, fundo: '#fbf6ec', tinta: '#1c1712', luz: '#ffffff' },
      { p: 0.72, fundo: '#191a28', tinta: '#efe6d6', luz: '#ffb36b' },
      { p: 1, fundo: '#191a28', tinta: '#efe6d6', luz: '#ffb36b' },
    ],
    colunas: 3,
    linhas: 2,
    folhas: false,
    ...opcoes,
  };
  const P = o.paradas.map((x) => ({ p: x.p, fundo: hex(x.fundo), tinta: hex(x.tinta), luz: hex(x.luz), forca: x.forca ?? 1 }));

  alvo.classList.add('dia');
  const janela = document.createElement('div');
  janela.className = 'dia-janela';
  janela.setAttribute('aria-hidden', 'true');
  janela.style.gridTemplate = `repeat(${o.linhas}, 1fr) / repeat(${o.colunas}, 1fr)`;
  janela.innerHTML = '<i></i>'.repeat(o.linhas * o.colunas);
  alvo.prepend(janela);
  let folhas = null;
  if (o.folhas) {
    folhas = document.createElement('div');
    folhas.className = 'dia-folhas';
    folhas.innerHTML = FOLHAS;
    janela.after(folhas);
  }

  function misturar(p, chave) {
    let i = 0;
    while (i < P.length - 2 && p > P[i + 1].p) i++;
    const a = P[i], b = P[i + 1];
    const t = limitar((p - a.p) / (b.p - a.p));
    return a[chave].map((x, k) => x + (b[chave][k] - x) * t);
  }

  function progresso(p) {
    alvo.style.setProperty('--dia-fundo', css(misturar(p, 'fundo')));
    alvo.style.setProperty('--dia-tinta', css(misturar(p, 'tinta')));
    alvo.style.setProperty('--dia-luz', css(misturar(p, 'luz')));
    // o sol anda da esquerda pra direita e a mancha se estica nas pontas, como a sombra de verdade
    const s = p * 2 - 1;
    janela.style.transform = `translate(${(s * 34).toFixed(2)}%, ${(Math.abs(s) * 8).toFixed(2)}%) rotate(-9deg) skewX(${(s * -26).toFixed(2)}deg) scaleY(${(1 + Math.abs(s) * 0.34).toFixed(3)})`;
    if (folhas) folhas.style.transform = `translate(${(s * 12).toFixed(2)}%, 0)`;
  }
  progresso(0);

  return { progresso };
}
