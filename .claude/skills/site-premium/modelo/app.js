// Modelo /site-premium — comportamento da página (nav, reveal, agenda via WhatsApp).
// Trocar só o CONFIG por cliente.
(() => {
  const CONFIG = {
    whatsapp: '5500000000000', // DDI + DDD + número, só dígitos
    servicos: ['Serviço principal', 'Serviço dois', 'Serviço três', 'Outro / não sei'],
    periodos: ['Manhã', 'Tarde'],
    diasFechados: [0], // 0 = domingo, 6 = sábado
    mensagemPadrao: 'Oi! Vim pelo site e queria agendar um horário.',
  };

  const wa = (texto) => `https://wa.me/${CONFIG.whatsapp}?text=${encodeURIComponent(texto)}`;
  document.getElementById('waFlutuante').href = wa(CONFIG.mensagemPadrao);

  // nav sólida depois do hero; esconde controles do hero fora dele
  const nav = document.querySelector('.nav');
  const hero = document.getElementById('hero');
  const aoRolar = () => {
    const b = hero.getBoundingClientRect().bottom;
    nav.classList.toggle('solida', b < 80);
    document.body.classList.toggle('in-hero', b > innerHeight * 0.35);
  };
  addEventListener('scroll', aoRolar, { passive: true });
  aoRolar();

  // aparecer ao rolar
  const io = new IntersectionObserver((es) => es.forEach((e) => {
    if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); }
  }), { threshold: 0.15, rootMargin: '0px 0px -40px 0px' });
  document.querySelectorAll('.reveal').forEach((el) => io.observe(el));

  // ---------- agenda ----------
  const agenda = document.getElementById('agenda');
  const form = document.getElementById('agendaForm');
  const abrir = () => {
    agenda.classList.add('aberta');
    agenda.setAttribute('aria-hidden', 'false');
    document.body.classList.add('agenda-on');
    setTimeout(() => form.querySelector('input').focus({ preventScroll: true }), 400);
  };
  const fechar = () => {
    agenda.classList.remove('aberta');
    agenda.setAttribute('aria-hidden', 'true');
    document.body.classList.remove('agenda-on');
  };
  document.addEventListener('click', (e) => {
    if (e.target.closest('[data-abrir-agenda]')) { e.preventDefault(); abrir(); }
    if (e.target.closest('[data-fechar-agenda]')) fechar();
  });
  addEventListener('keydown', (e) => { if (e.key === 'Escape') fechar(); });

  const opcao = (nome, valor, html, marcado) =>
    `<label><input type="radio" name="${nome}" value="${valor}" ${marcado ? 'checked' : ''} required><span>${html}</span></label>`;

  document.getElementById('agServicos').innerHTML =
    CONFIG.servicos.map((s, i) => opcao('servico', s, s, i === 0)).join('');
  document.getElementById('agPeriodos').innerHTML =
    CONFIG.periodos.map((p, i) => opcao('periodo', p, p, i === 0)).join('');

  const semana = ['dom', 'seg', 'ter', 'qua', 'qui', 'sex', 'sáb'];
  const dias = [];
  const d = new Date();
  while (dias.length < 7) {
    d.setDate(d.getDate() + 1);
    if (CONFIG.diasFechados.includes(d.getDay())) continue;
    const rotulo = `${semana[d.getDay()]} ${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}`;
    dias.push(opcao('dia', rotulo, `${semana[d.getDay()]}<br>${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}`, dias.length === 0));
  }
  document.getElementById('agDias').innerHTML = dias.join('');

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const f = new FormData(form);
    const texto = `Oi! Sou ${f.get('nome')} e queria agendar *${f.get('servico')}* — ${f.get('dia')}, ${String(f.get('periodo')).toLowerCase()}. Vim pelo site.`;
    window.open(wa(texto), '_blank', 'noopener');
    fechar();
  });
})();
