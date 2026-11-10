// Menu de tela cheia — o painel abre como um círculo que cresce do próprio botão, os links entram um
// depois do outro e a página atrás para. É mais um lugar da marca: cabe o endereço, o horário, uma
// foto, o botão de agendar. Pra site com várias páginas; site de uma página só não precisa.
//
// <button id="abre-menu" class="menu-botao">Menu</button>
// <nav id="menu" aria-label="Menu">
//   <a href="index.html">Início</a> <a href="servicos.html">Serviços</a> …
// </nav>
// import { menu } from './tecnicas/menu.js';
// menu(document.querySelector('#abre-menu'), document.querySelector('#menu'));
//
// Cores: --menu-fundo e --menu-tinta. Esc fecha e devolve o foco ao botão; fechado, o painel fica
// `inert` (fora do Tab e do leitor de tela). Sem JavaScript os links continuam no HTML.
// Padrão dos premiados do Awwwards (menu cheio com transição por recorte).

export function menu(botao, painel, opcoes = {}) {
  const o = { textoAbrir: botao.textContent.trim() || 'Menu', textoFechar: 'Fechar', ...opcoes };
  painel.classList.add('menu-cheio');
  botao.classList.add('menu-botao');
  painel.id ||= 'menu-cheio';
  painel.inert = true;
  botao.setAttribute('aria-expanded', 'false');
  botao.setAttribute('aria-controls', painel.id);
  [...painel.querySelectorAll('a, button')].forEach((l, i) => l.style.setProperty('--i', i));
  let aberto = false;

  function abrir() {
    const r = botao.getBoundingClientRect();
    painel.style.setProperty('--mx', `${r.left + r.width / 2}px`);
    painel.style.setProperty('--my', `${r.top + r.height / 2}px`);
    aberto = true;
    painel.inert = false;
    painel.classList.add('aberto');
    botao.setAttribute('aria-expanded', 'true');
    botao.textContent = o.textoFechar;
    document.documentElement.classList.add('menu-travado');
    window.__lenis?.stop();
  }
  function fechar(devolverFoco = true) {
    if (!aberto) return;
    aberto = false;
    painel.inert = true;
    painel.classList.remove('aberto');
    botao.setAttribute('aria-expanded', 'false');
    botao.textContent = o.textoAbrir;
    document.documentElement.classList.remove('menu-travado');
    window.__lenis?.start();
    if (devolverFoco) botao.focus({ preventScroll: true });
  }
  botao.addEventListener('click', () => (aberto ? fechar() : abrir()));
  addEventListener('keydown', (e) => { if (e.key === 'Escape') fechar(); });
  painel.addEventListener('click', (e) => { if (e.target.closest('a')) fechar(false); });
  return { abrir, fechar };
}
