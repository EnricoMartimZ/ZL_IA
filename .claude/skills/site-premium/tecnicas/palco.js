// Palco — seção alta com um quadro preso na tela (sticky) e o progresso da rolagem de 0 a 1.
// É a base das outras técnicas: cada uma recebe progresso(p) e desenha o estado daquele ponto,
// então a rolagem vira a linha do tempo da história (como nos sites de referência).
//
// <section class="palco" data-telas="4">            ← altura = 4 telas de rolagem
//   <div class="palco-quadro">                        ← fica preso enquanto a seção passa
//     <canvas></canvas>
//     <div data-cap>Capítulo 1</div>                  ← ganha .ativo na sua fatia do progresso
//     <div data-cap data-de=".5" data-ate=".8">…</div> ← ou numa fatia escolhida
//   </div>
// </section>
//
// import { palco, rolagemSuave } from './tecnicas/palco.js';
// rolagemSuave();
// palco(document.querySelector('.palco'), (p) => fluxo.progresso(p));
//
// A seção também recebe a variável CSS --p (0 → 1): dá pra animar qualquer coisa só com CSS,
// ex: transform: translateX(calc(var(--p) * -60%)).

export const limitar = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
// pedaço do progresso: local(p, .2, .5) vai de 0 a 1 enquanto p anda de .2 a .5
export const local = (p, de, ate) => limitar((p - de) / (ate - de));
export const suave = (t) => t * t * (3 - 2 * t);
export const semMovimento = () => matchMedia('(prefers-reduced-motion: reduce)').matches;

const ativos = new Set();
let rodando = false;
function quadro() {
  for (const a of ativos) a.medir();
  requestAnimationFrame(quadro);
}

// Rolagem macia (Lenis). Sem ela tudo funciona, só fica menos "amanteigado".
export async function rolagemSuave(opcoes = {}) {
  if (semMovimento()) return null;
  const { default: Lenis } = await import('https://cdn.jsdelivr.net/npm/lenis@1.1.13/dist/lenis.mjs');
  const lenis = new Lenis({ lerp: 0.09, ...opcoes });
  const raf = (t) => { lenis.raf(t); requestAnimationFrame(raf); };
  requestAnimationFrame(raf);
  // links internos (#secao) passam pelo Lenis pra deslizar em vez de pular
  document.addEventListener('click', (e) => {
    const a = e.target.closest('a[href^="#"]');
    const href = a?.getAttribute('href');
    if (!href || href.length < 2) return;
    const alvo = document.querySelector(href);
    if (alvo) { e.preventDefault(); lenis.scrollTo(alvo); }
  });
  window.__lenis = lenis;
  return lenis;
}

export function palco(secao, aoMudar = () => {}) {
  const telas = Number(secao.dataset.telas) || 3;
  secao.style.height = `${telas * 100}vh`;
  secao.style.height = `${telas * 100}svh`; // ignorado onde svh não existe
  const caps = [...secao.querySelectorAll('[data-cap]')];
  let ultimo = -1;
  let visivel = true;
  const io = new IntersectionObserver(([e]) => { visivel = e.isIntersecting; }, { rootMargin: '25% 0px' });
  io.observe(secao);

  const estado = {
    p: 0,
    medir() {
      if (!visivel) return;
      const r = secao.getBoundingClientRect();
      const total = r.height - innerHeight;
      const p = limitar(total > 0 ? -r.top / total : 0);
      if (Math.abs(p - ultimo) < 0.0004) return;
      ultimo = p;
      estado.p = p;
      secao.style.setProperty('--p', p.toFixed(4));
      caps.forEach((c, j) => {
        const de = c.dataset.de !== undefined ? Number(c.dataset.de) : j / caps.length;
        const ate = c.dataset.ate !== undefined ? Number(c.dataset.ate) : (j + 1) / caps.length;
        c.classList.toggle('ativo', p >= de && (p < ate || (ate >= 1 && p >= 1)));
      });
      aoMudar(p);
    },
    destruir() { ativos.delete(estado); io.disconnect(); },
  };
  ativos.add(estado);
  if (!rodando) { rodando = true; requestAnimationFrame(quadro); }
  return estado;
}

// Pausa o desenho quando o elemento sai da tela ou a aba fica escondida (economiza bateria no celular).
export function quandoVisivel(el, aoMudar) {
  let naTela = true;
  const avisar = () => aoMudar(naTela && !document.hidden);
  const io = new IntersectionObserver(([e]) => { naTela = e.isIntersecting; avisar(); }, { rootMargin: '10% 0px' });
  io.observe(el);
  document.addEventListener('visibilitychange', avisar);
  return () => { io.disconnect(); document.removeEventListener('visibilitychange', avisar); };
}
