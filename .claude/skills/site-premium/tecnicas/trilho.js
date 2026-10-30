// Trilho — índice preso na lateral: cada capítulo é um traço, o atual abre e mostra o nome, e cada
// um pode ter a sua cor. Dá mapa a sites longos e faz a história parecer maior do que uma lista de seções.
//
// <section id="processo" data-capitulo="Processo" data-cor="#7fd8ff">…</section>
//
// import { trilho } from './tecnicas/trilho.js';
// trilho();
//
// Fica fora do celular (a tela é estreita demais pra ele não atrapalhar).

export function trilho(opcoes = {}) {
  const o = { seletor: '[data-capitulo]', ...opcoes };
  const secoes = [...document.querySelectorAll(o.seletor)];
  if (!secoes.length) return null;
  const nav = document.createElement('nav');
  nav.className = 'trilho';
  nav.setAttribute('aria-label', 'Capítulos');
  nav.innerHTML = secoes.map((s, i) => {
    if (!s.id) s.id = `capitulo-${i + 1}`;
    const cor = s.dataset.cor ? ` style="--cor:${s.dataset.cor}"` : '';
    return `<a href="#${s.id}"${cor}><i></i><span>${s.dataset.capitulo}</span></a>`;
  }).join('');
  document.body.append(nav);
  const links = [...nav.querySelectorAll('a')];
  // uma linha no meio da tela: a seção que a cruza é a atual
  const io = new IntersectionObserver((itens) => {
    itens.forEach((e) => {
      if (!e.isIntersecting) return;
      links.forEach((a) => a.classList.toggle('atual', a.hash === `#${e.target.id}`));
    });
  }, { rootMargin: '-50% 0px -50% 0px' });
  secoes.forEach((s) => io.observe(s));
  return nav;
}
