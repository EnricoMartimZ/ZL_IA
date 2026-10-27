// Modelo /site-premium — comportamento das páginas: nav, reveal, agenda ou pedido de orçamento,
// WhatsApp flutuante, medição de cliques e aviso de cookies (LGPD).
// Trocar só o CONFIG por cliente. Serve pra todas as páginas do site.
(() => {
  const CONFIG = {
    whatsapp: '5500000000000', // DDI + DDD + número, só dígitos
    // Como o cliente chama:
    // 'agenda'    → escolhe serviço, dia e período (loja, estética, oficina, clínica)
    // 'orcamento' → pede orçamento (B2B: indústria, distribuidora, obra, serviço pra empresa).
    //               Troca o painel e os textos marcados no HTML com data-orcamento="...".
    contato: 'agenda',
    servicos: ['Serviço principal', 'Serviço dois', 'Serviço três', 'Outro / não sei'],
    mensagemPadrao: '', // texto do WhatsApp flutuante; vazio = o padrão do modo
    agenda: {
      periodos: ['Manhã', 'Tarde'],
      diasFechados: [0], // 0 = domingo, 6 = sábado
    },
    orcamento: {
      // A primeira pergunta que o vendedor faz (ver prospectar-b2b/nichos.md). '' tira o campo.
      quantidade: 'Quantidade ou tamanho',
      exemploQuantidade: 'ex: 500 peças por mês',
      prazos: ['Urgente', 'Este mês', 'Próximos 3 meses', 'Só cotando'],
      cidade: 'Cidade da entrega', // '' tira o campo
      exemploDetalhes: 'medidas, material, norma, onde vai ser usado…',
      resposta: 'resposta em até 1 dia útil',
      // Vazio: o pedido sai pronto no WhatsApp. Com a URL de um serviço de formulário (Formspree:
      // https://formspree.io/f/xxxx · Web3Forms: https://api.web3forms.com/submit), o pedido chega no
      // e-mail da empresa e o painel pede também e-mail e telefone. Nunca em demo.
      formulario: '',
      camposFixos: {}, // vão em todo envio, ex: { access_key: 'chave-do-web3forms' }
    },
    medicao: {
      // Plausible não usa cookies: não precisa de aviso. GA4 e Pixel da Meta usam: o aviso aparece sozinho.
      plausible: '', // domínio cadastrado no Plausible, ex: 'marca.com.br'
      ga4: '',       // ex: 'G-XXXXXXXXXX'
      metaPixel: '', // ex: '123456789012345'
    },
  };

  const wa = (texto) => `https://wa.me/${CONFIG.whatsapp}?text=${encodeURIComponent(texto)}`;
  const orcamento = CONFIG.contato === 'orcamento';
  const O = CONFIG.orcamento;
  const porFormulario = orcamento && !!O.formulario;
  document.documentElement.dataset.contato = CONFIG.contato;
  window.__contato = { modo: CONFIG.contato, envio: porFormulario ? 'formulario' : 'whatsapp' };
  if (orcamento) document.querySelectorAll('[data-orcamento]').forEach((el) => { el.textContent = el.dataset.orcamento; });

  // ---------- medição ----------
  // window.medir('evento', {dados}) manda pra todas as ferramentas ligadas.
  // Eventos do modelo: clique_whatsapp, agenda_aberta, agenda_enviada, orcamento_aberto, orcamento_enviado,
  // clique_telefone, clique_loja, clique_rota
  const fila = [];
  window.medir = (evento, dados = {}) => {
    const pagina = location.pathname;
    if (window.plausible) window.plausible(evento, { props: { ...dados, pagina } });
    if (window.gtag) window.gtag('event', evento, dados);
    if (window.fbq) {
      if (evento === 'agenda_enviada') window.fbq('track', 'Schedule', dados);
      else if (evento === 'orcamento_enviado') window.fbq('track', 'Lead', dados);
      else if (evento === 'clique_whatsapp') window.fbq('track', 'Contact', dados);
      else window.fbq('trackCustom', evento, dados);
    }
    if (!window.plausible && !window.gtag && !window.fbq) fila.push([evento, dados]);
    if (location.hostname === 'localhost') console.info('[medir]', evento, dados);
  };
  window.__filaMedicao = fila;

  function carregar(src, attrs = {}) {
    const s = document.createElement('script');
    s.async = true;
    s.src = src;
    Object.entries(attrs).forEach(([k, v]) => s.setAttribute(k, v));
    document.head.appendChild(s);
  }

  const { plausible, ga4, metaPixel } = CONFIG.medicao;
  if (plausible) {
    carregar('https://plausible.io/js/script.tagged-events.js', { 'data-domain': plausible });
    window.plausible = window.plausible || function () { (window.plausible.q = window.plausible.q || []).push(arguments); };
  }

  function ligarComCookies() {
    if (ga4) {
      carregar(`https://www.googletagmanager.com/gtag/js?id=${ga4}`);
      window.dataLayer = window.dataLayer || [];
      window.gtag = function () { window.dataLayer.push(arguments); };
      window.gtag('js', new Date());
      window.gtag('config', ga4);
    }
    if (metaPixel) {
      /* eslint-disable */
      !function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,document,'script','https://connect.facebook.net/en_US/fbevents.js');
      /* eslint-enable */
      window.fbq('init', metaPixel);
      window.fbq('track', 'PageView');
    }
  }

  // ---------- aviso de cookies (só se houver GA4 ou Pixel) ----------
  const CHAVE = 'consentimento-cookies';
  const lerConsent = () => { try { return localStorage.getItem(CHAVE); } catch { return null; } };
  const salvarConsent = (v) => { try { localStorage.setItem(CHAVE, v); } catch { /* sem storage: pergunta de novo na próxima visita */ } };
  if (ga4 || metaPixel) {
    const escolha = lerConsent();
    if (escolha === 'sim') ligarComCookies();
    else if (escolha !== 'nao') {
      const aviso = document.createElement('div');
      aviso.className = 'cookies';
      aviso.setAttribute('role', 'dialog');
      aviso.setAttribute('aria-label', 'Aviso de cookies');
      aviso.innerHTML = `<p>Usamos cookies pra entender como o site é usado e melhorar os anúncios. <a href="privacidade.html">Saiba mais</a>.</p>
        <div><button class="btn btn-linha" data-cookies="nao">Recusar</button><button class="btn btn-claro" data-cookies="sim">Aceitar</button></div>`;
      document.body.appendChild(aviso);
      aviso.addEventListener('click', (e) => {
        const b = e.target.closest('[data-cookies]');
        if (!b) return;
        salvarConsent(b.dataset.cookies);
        if (b.dataset.cookies === 'sim') ligarComCookies();
        aviso.remove();
      });
    }
  }

  // cliques marcados no HTML com data-medir="evento"
  document.addEventListener('click', (e) => {
    const el = e.target.closest('[data-medir]');
    if (el) window.medir(el.dataset.medir, { origem: el.dataset.origem || 'pagina' });
  });

  // ---------- WhatsApp flutuante ----------
  const flutuante = document.createElement('a');
  flutuante.className = 'wa-flutuante';
  flutuante.href = wa(CONFIG.mensagemPadrao || (orcamento
    ? 'Olá! Vim pelo site e queria um orçamento.'
    : 'Oi! Vim pelo site e queria agendar um horário.'));
  flutuante.target = '_blank';
  flutuante.rel = 'noopener';
  flutuante.setAttribute('aria-label', 'Falar no WhatsApp');
  flutuante.dataset.medir = 'clique_whatsapp';
  flutuante.dataset.origem = 'flutuante';
  flutuante.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2zm5.3 14.1c-.2.6-1.3 1.2-1.8 1.2-.5.1-1 .2-3.3-.7-2.8-1.1-4.6-4-4.7-4.2-.1-.2-1.1-1.5-1.1-2.9s.7-2.1 1-2.4c.3-.3.6-.3.8-.3h.6c.2 0 .4 0 .6.5l.9 2.1c.1.2.1.4 0 .5l-.4.6-.4.4c-.1.2-.3.3-.1.6.2.3.8 1.3 1.7 2.1 1.2 1 2.1 1.3 2.4 1.5.3.1.5.1.7-.1l.9-1.1c.2-.3.4-.2.7-.1l2 1c.3.1.5.2.5.3.1.2.1.8-.1 1.3z"/></svg>';
  document.body.appendChild(flutuante);

  // ---------- nav sólida depois do hero (páginas sem hero: sólida sempre) ----------
  const nav = document.querySelector('.nav');
  const hero = document.getElementById('hero');
  const aoRolar = () => {
    if (!hero) {
      nav.classList.add('solida');
      document.body.classList.remove('in-hero');
      return;
    }
    const b = hero.getBoundingClientRect().bottom;
    nav.classList.toggle('solida', b < 80);
    document.body.classList.toggle('in-hero', b > innerHeight * 0.35);
  };
  addEventListener('scroll', aoRolar, { passive: true });
  aoRolar();

  // ---------- aparecer ao rolar ----------
  const io = new IntersectionObserver((es) => es.forEach((e) => {
    if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); }
  }), { threshold: 0.15, rootMargin: '0px 0px -40px 0px' });
  document.querySelectorAll('.reveal').forEach((el) => io.observe(el));

  // ---------- agenda ou pedido de orçamento (o mesmo painel lateral) ----------
  const campo = (rotulo, attrs, opcional) =>
    `<label class="campo"><span>${rotulo}${opcional ? ' <small>opcional</small>' : ''}</span><input ${attrs}></label>`;
  const painelAgenda = `
      <fieldset><legend>Serviço</legend><div class="opcoes" data-grupo="servico"></div></fieldset>
      <fieldset><legend>Dia</legend><div class="opcoes dias" data-grupo="dia"></div></fieldset>
      <fieldset><legend>Período</legend><div class="opcoes" data-grupo="periodo"></div></fieldset>
      ${campo('Seu nome', 'name="nome" required autocomplete="name"')}
      <button class="btn btn-ouro largo" type="submit">Confirmar no WhatsApp</button>
      <p class="nota-mono">horário confirmado pela equipe</p>`;
  const painelOrcamento = `
      <fieldset><legend>O que você precisa</legend><div class="opcoes" data-grupo="servico"></div></fieldset>
      ${O.quantidade ? campo(O.quantidade, `name="quantidade" placeholder="${O.exemploQuantidade}"`, true) : ''}
      <fieldset><legend>Prazo</legend><div class="opcoes" data-grupo="prazo"></div></fieldset>
      ${campo('Empresa', 'name="empresa" required autocomplete="organization"')}
      ${campo('Seu nome', 'name="nome" required autocomplete="name"')}
      ${porFormulario ? campo('E-mail', 'name="email" type="email" required autocomplete="email"')
        + campo('WhatsApp ou telefone', 'name="telefone" type="tel" required autocomplete="tel"') : ''}
      ${O.cidade ? campo(O.cidade, 'name="cidade" autocomplete="address-level2"', true) : ''}
      <label class="campo"><span>Detalhes <small>opcional</small></span><textarea name="detalhes" rows="3" placeholder="${O.exemploDetalhes}"></textarea></label>
      <input class="mel" name="_gotcha" tabindex="-1" autocomplete="off" aria-hidden="true">
      <button class="btn btn-ouro largo" type="submit">${porFormulario ? 'Enviar pedido' : 'Enviar pedido no WhatsApp'}</button>
      <p class="nota-mono">${O.resposta}</p>
      ${porFormulario ? '<p class="nota-lgpd">Usamos esses dados só pra responder este pedido. <a href="privacidade.html">Privacidade</a></p>' : ''}
      <p class="pedido-erro" role="alert" hidden>Não deu pra enviar agora. <a data-wa-pedido target="_blank" rel="noopener">Manda pelo WhatsApp</a> que chega igual.</p>
      <div class="pedido-ok" role="status" hidden>
        <h3 data-ok-titulo></h3>
        <p>A gente responde por e-mail ou telefone, ${O.resposta}.</p>
        <a class="btn btn-linha largo" data-wa-pedido target="_blank" rel="noopener" data-medir="clique_whatsapp" data-origem="pedido">Falar agora no WhatsApp</a>
      </div>`;
  const agenda = document.createElement('aside');
  agenda.className = 'agenda';
  agenda.setAttribute('aria-hidden', 'true');
  agenda.innerHTML = `
    <div class="agenda-fundo" data-fechar-agenda></div>
    <form class="agenda-painel">
      <header><p class="eyebrow">${orcamento ? 'Pedir orçamento' : 'Agendar'}</p><button type="button" class="fechar" data-fechar-agenda aria-label="Fechar">×</button></header>
      ${orcamento ? painelOrcamento : painelAgenda}
    </form>`;
  document.body.appendChild(agenda);
  const form = agenda.querySelector('form');

  const opcao = (nome, valor, html, marcado) =>
    `<label><input type="radio" name="${nome}" value="${valor}" ${marcado ? 'checked' : ''} required><span>${html}</span></label>`;
  const grupo = (g) => form.querySelector(`[data-grupo="${g}"]`);
  grupo('servico').innerHTML = CONFIG.servicos.map((s, i) => opcao('servico', s, s, i === 0)).join('');

  if (orcamento) {
    // prazo sem resposta pronta: o vendedor quer saber a verdade
    grupo('prazo').innerHTML = O.prazos.map((p) => opcao('prazo', p, p, false)).join('');
  } else {
    grupo('periodo').innerHTML = CONFIG.agenda.periodos.map((p, i) => opcao('periodo', p, p, i === 0)).join('');
    const semana = ['dom', 'seg', 'ter', 'qua', 'qui', 'sex', 'sáb'];
    const dd = (n) => String(n).padStart(2, '0');
    const dias = [];
    const d = new Date();
    while (dias.length < 7) {
      d.setDate(d.getDate() + 1);
      if (CONFIG.agenda.diasFechados.includes(d.getDay())) continue;
      const data = `${dd(d.getDate())}/${dd(d.getMonth() + 1)}`;
      dias.push(opcao('dia', `${semana[d.getDay()]} ${data}`, `${semana[d.getDay()]}<br>${data}`, dias.length === 0));
    }
    grupo('dia').innerHTML = dias.join('');
  }

  // serviço pré-selecionado: <button data-abrir-agenda data-servico="Serviço dois">
  const abrir = (servico) => {
    if (form.classList.contains('enviado')) { // pedido novo depois de um enviado
      form.reset();
      form.classList.remove('enviado');
      form.querySelector('.pedido-ok').hidden = true;
    }
    if (servico) {
      const r = form.querySelector(`input[name="servico"][value="${CSS.escape(servico)}"]`);
      if (r) r.checked = true;
    }
    agenda.classList.add('aberta');
    agenda.setAttribute('aria-hidden', 'false');
    document.body.classList.add('agenda-on');
    window.medir(orcamento ? 'orcamento_aberto' : 'agenda_aberta', { servico: servico || '' });
    setTimeout(() => form.querySelector('input:checked, input').focus({ preventScroll: true }), 400);
  };
  const fechar = () => {
    agenda.classList.remove('aberta');
    agenda.setAttribute('aria-hidden', 'true');
    document.body.classList.remove('agenda-on');
  };
  document.addEventListener('click', (e) => {
    const b = e.target.closest('[data-abrir-agenda]');
    if (b) { e.preventDefault(); abrir(b.dataset.servico); }
    if (e.target.closest('[data-fechar-agenda]')) fechar();
  });
  addEventListener('keydown', (e) => { if (e.key === 'Escape') fechar(); });

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const f = new FormData(form);
    const v = (k) => String(f.get(k) || '').trim();
    if (!orcamento) {
      const texto = `Oi! Sou ${v('nome')} e queria agendar *${v('servico')}* — ${v('dia')}, ${v('periodo').toLowerCase()}. Vim pelo site.`;
      window.medir('agenda_enviada', { servico: v('servico') });
      window.open(wa(texto), '_blank', 'noopener');
      fechar();
      return;
    }

    if (v('_gotcha')) return; // campo invisível preenchido = robô
    const respostas = [
      ['Empresa', v('empresa')], ['Nome', v('nome')], ['Preciso de', v('servico')], [O.quantidade, v('quantidade')],
      ['Prazo', v('prazo')], [O.cidade, v('cidade')], ['Detalhes', v('detalhes')],
    ].filter(([rotulo, valor]) => rotulo && valor);
    const texto = ['Olá! Vim pelo site e queria um orçamento.', ...respostas.map(([r, x]) => `*${r}:* ${x}`)].join('\n');
    form.querySelectorAll('[data-wa-pedido]').forEach((a) => { a.href = wa(texto); });
    const medirEnvio = (canal) => window.medir('orcamento_enviado', { servico: v('servico'), prazo: v('prazo'), canal });

    if (!porFormulario) {
      medirEnvio('whatsapp');
      window.open(wa(texto), '_blank', 'noopener');
      fechar();
      return;
    }

    // formulário: chega no e-mail da empresa; "email" vira o responder-para no Formspree e no Web3Forms
    const botao = form.querySelector('[type="submit"]');
    const erro = form.querySelector('.pedido-erro');
    const assunto = `Pedido de orçamento: ${v('servico')} · ${v('empresa')}`;
    const dados = {
      ...Object.fromEntries(respostas), email: v('email'), Telefone: v('telefone'), 'Página': location.href,
      [/web3forms/.test(O.formulario) ? 'subject' : '_subject']: assunto, ...O.camposFixos,
    };
    botao.disabled = true;
    botao.textContent = 'Enviando…';
    erro.hidden = true;
    try {
      const r = await fetch(O.formulario, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify(dados),
      });
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      medirEnvio('formulario');
      form.querySelector('[data-ok-titulo]').textContent = `Pedido recebido, ${v('nome').split(' ')[0]}.`;
      form.querySelector('.pedido-ok').hidden = false;
      form.classList.add('enviado');
      form.scrollTop = 0;
    } catch {
      erro.hidden = false; // o link do WhatsApp já leva o pedido inteiro
      erro.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    } finally {
      botao.disabled = false;
      botao.textContent = 'Enviar pedido';
    }
  });
})();
