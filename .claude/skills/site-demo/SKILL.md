---
name: site-demo
description: >
  Monta um site de demonstração pra uma loja ANTES de vender: usa o que é público (nome, serviços, fotos,
  avaliações do Google, endereço) e o modelo do /site-premium, marca tudo como demonstração (faixa,
  noindex, robots bloqueado), publica num link discreto e escreve a mensagem pra mandar pro dono. O
  dono vê a própria marca num site caro antes de pagar. Use quando o usuário pedir "site demo",
  "prévia do site", "faz um site de exemplo pra loja X", "mostrar como ficaria o site", "site de
  apresentação", ou /site-demo.
---

# /site-demo — Site de demonstração pra abrir a venda

O dono da loja não compra "um site". Ele compra quando vê **o site dele** pronto. A demo é a versão de site do `/diagnostico-loja`: um presente que abre a conversa.

## Dependências

- **Loja:** linha em `vendas/funil.md` / planilha de `vendas/prospeccao/`, diagnóstico em `vendas/diagnosticos/<slug>/` se existir
- **Modelo:** `.claude/skills/site-premium/modelo/` e as regras de `.claude/skills/site-premium/design.md`
- **Conferência:** `scripts/checar-site.js --demo`
- **Saída:** `vendas/demos/<slug>/` (fora de `clientes/`: ainda não é cliente)

---

## Limites (ler antes de começar)

A demo usa a marca de outra empresa sem ela ter pedido. Ela só é aceitável se for **claramente uma proposta**, não algo que se passa pelo site oficial:

- Faixa fixa no topo, sempre visível: **"Não é o site oficial · demonstração feita por <seu negócio> para <loja>"** (o aviso vem primeiro: no celular a faixa corta o fim)
- `<meta name="robots" content="noindex, nofollow">` em todas as páginas e `robots.txt` com `Disallow: /` — **não pode aparecer no Google**
- Link discreto, sem o nome da loja como domínio (`demo-<slug>-<4 letras aleatórias>.vercel.app`), mandado só pro dono
- Nada de domínio parecido com o da loja, nada de anúncio, nada de divulgar o link
- Sem medição (GA4, Pixel), sem formulário que colete dado de quem visita
- **Tira do ar** em 30 dias, ou na hora se o dono pedir
- Fotos: preferir as que a loja já publica (Google/Instagram) e não as editar de forma que pareça outra coisa. Usar só na demo — no site de verdade, usar só com autorização
- Avaliações: só reais, copiadas do Google, com nome abreviado
- Nada de preço inventado: sem preço confirmado, tirar o preço da demo

Se a loja for de rede/franquia ou já tiver site novo e bom: não fazer demo (não converte e pode incomodar).

---

## Workflow

### Passo 1 — Coleta (só público)

Do Google Meu Negócio, Instagram e site atual (se houver):
- Nome exato, nicho, cidade, endereço, horário, telefone/WhatsApp comercial
- Serviços e o carro-chefe (o que mais aparece nos posts e avaliações)
- 4–6 fotos boas que a loja publicou (local, trabalho, equipe — sem cliente identificável)
- 3 avaliações reais, as mais específicas
- **Identidade:** rodar o `/identidade-loja` → `vendas/marcas/<slug>/` (cores, logo, fontes, frases). Sem site, pedir ao usuário prints do Instagram, do logo e da fachada — **não escolher cor pelo nome da loja**
- O diferencial que eles mesmos repetem ("desde 1998", "atendimento em casa", "laboratório próprio")

Salvar em `vendas/demos/<slug>/coleta.md`, com a fonte de cada item. Prospect B2B (veio do `/prospectar-b2b`): `contato: 'orcamento'` no `app.js` (troca o painel e os botões pra "Pedir orçamento"), com a pergunta do nicho em `orcamento.quantidade` (tabela em `prospectar-b2b/nichos.md`) e `formulario` **vazio**, e usar os prints da auditoria como "antes" na mensagem. Anotar também a coordenada da porta (Google Maps) — com ela o `scripts/mapa-ruas.js` gera o mapa animado do bairro da loja, que impressiona muito na demo.

### Passo 2 — Escolher o hero

- **Foto** (`data-modo="foto"`) — padrão da demo: mais rápido, usa a melhor foto real da loja
- **Sequência** (`data-modo="sequencia"`) — cenas geradas por IA (`.claude/skills/site-premium/cenas.md`). É o que mais impressiona e foi o que o site de referência usou; custa algumas gerações de imagem. Vale pra lojas com bom potencial de fechar (nota alta na prospecção). Rótulo "imagens geradas por IA · ilustrativas" obrigatório

Tema: claro ou escuro conforme a marca (`design.md` §1).

### Passo 3 — Montar

1. Copiar `.claude/skills/site-premium/modelo/` pra `vendas/demos/<slug>/`
2. Preencher como no `/site-premium` Passo 3 — com os dados da coleta. Pode cortar seções sem material (galeria com menos fotos, sem `servico.html`)
3. **Marcar como demo:**
   - Em todas as páginas: trocar `<meta name="robots" content="index, follow">` por `noindex, nofollow`; apagar o `<link rel="canonical">` e o JSON-LD
   - `<body class="demo ...">` e, logo depois de `<body>`, a faixa (o estilo já está no `estilo.css`):
     ```html
     <div class="faixa-demo">Não é o site oficial · demonstração feita por <b>SEU NEGÓCIO</b> para <b>LOJA</b></div>
     ```
   - `robots.txt` → `User-agent: *` / `Disallow: /`; apagar `sitemap.xml`
   - `app.js` → `medicao` vazio
   - WhatsApp da agenda (ou do orçamento): o **comercial da loja** (o dono testa e vê a mensagem chegando). Orçamento sempre pelo WhatsApp: `orcamento.formulario` vazio
   - Trocar o rótulo do rodapé `aviso` por "Demonstração · fotos publicadas pela própria loja"
4. Apagar `privacidade.html` e o link dela (a demo não coleta nada)

### Passo 4 — Conferir

```bash
node scripts/checar-site.js vendas/demos/<slug> --demo --marca vendas/marcas/<slug>/marca.json --saida vendas/demos/<slug>/CHECAGEM.md
```

Zero ❌. Abrir no celular e no desktop e olhar como o dono vai olhar: o nome dele está certo? A foto mais bonita está no topo?

### Passo 5 — Publicar o link (com OK do usuário)

```bash
npx vercel deploy vendas/demos/<slug> --yes --name demo-<slug>-<4 letras>
```

(Ou arrastar a pasta no app.netlify.com/drop.) Anotar o link e a **data de expiração (hoje + 30 dias)** em `vendas/demos/<slug>/coleta.md`.

### Passo 6 — Mensagem e funil

Mensagem curta, no tom de `_memoria/preferencias.md`, pro canal onde a loja responde (WhatsApp comercial ou DM):

> "Oi, [nome]! Sou [você], faço sites pra lojas aqui de [cidade]. Montei uma prévia de como poderia ficar o site da [loja], usando as fotos e avaliações que vocês já têm: [link]. É só uma demonstração, ninguém mais tem o link. Se curtir, te mostro o que dá pra fazer — se não, sem problema, tiro do ar."

Atualizar `vendas/funil.md`: etapa **demo enviada**, próximo passo em 2 dias. Se responder: `/proposta-servico` com o pacote de site. Se não fechar em 30 dias: tirar do ar (`npx vercel remove demo-<slug>-<letras> --yes`) e registrar no `/aprendizado`.

---

## Regras

- **Sempre marcada como demo** — faixa, noindex, robots. O `checar-site --demo` falha sem isso.
- **Nunca se passar pelo site oficial**, nunca anunciar, nunca divulgar o link.
- **Só dado público e real.** Nada inventado (avaliação, preço, número).
- **Tirar do ar** em 30 dias ou quando o dono pedir — e tirar mesmo.
- **Publicar só com OK do usuário.**
