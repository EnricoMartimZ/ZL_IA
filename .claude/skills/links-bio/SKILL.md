---
name: links-bio
description: >
  Cria a página de links da bio do Instagram de uma loja: leve, com a marca dela, o WhatsApp em destaque e os
  links que importam, publicada num endereço próprio, no lugar de Linktree. Use sempre que o usuário pedir
  "página de links", "link da bio", "linktree", "arrumar a bio do Instagram", "links do Instagram", ou
  /links-bio, inclusive quando isso vier como parte de um pacote já vendido.
---

# /links-bio — A página da bio

Quem chega pelo Instagram está no celular e quer falar com a loja. A página tem um trabalho só: levar a pessoa pro WhatsApp em um toque, e o resto fica como opção.

## Dependências

- **Marca:** `clientes/<Nome>/marca/` (`/identidade-loja`). Sem ela, rodar antes: cor inventada não entra
- **Modelo:** `.claude/skills/links-bio/modelo.html`
- **Saída:** `clientes/<Nome>/link-bio/` (local)
- **Conferir e publicar:** `/checar-site`, `/publicar-site`

---

## Workflow

### Passo 1 — Levantar

Conferir cada dado antes de usar: nome como o cliente reconhece, frase curta, WhatsApp, endereço, link do perfil no Google, @ do Instagram, site. **Abrir cada link**: um link quebrado na bio custa o cliente que ia chamar.

### Passo 2 — Montar

Copiar o modelo pra pasta do cliente, trocar os `{{CAMPOS}}` e aplicar a marca.

- **Máximo de 5 ou 6 links, um deles em destaque.** Mais que isso, ninguém escolhe. O primeiro é sempre a ação que dá dinheiro (pedir orçamento, agendar, cardápio)
- A mensagem do WhatsApp já vai escrita (`{{MENSAGEM_URL}}`, com `encodeURIComponent`) e diz que veio do Instagram, pra loja saber de onde veio
- Sem site ainda: tirar o link em vez de apontar pra algo em construção
- Sem o Google ajustado: usar o link do Maps só depois de conferir que abre a loja certa
- Logo em `img/logo.webp` e favicon: o arquivo real, nunca recriado

### Passo 3 — Conferir no celular

Rodar `/checar-site` e abrir em 390 px: tudo cabe sem rolar pro lado, os botões têm pelo menos 44 px de altura, o WhatsApp abre com a mensagem certa, contraste legível.

### Passo 4 — Publicar

Publicar pelo fluxo do `/publicar-site`. O melhor endereço é `dominio.com.br/links`, quando houver site; sem site, um endereço curto gratuito. Só depois de aprovar com o cliente, trocar a bio do Instagram (por ele, ou por quem tiver o acesso) e conferir pelo próprio Instagram, no celular.

## Regras

- **Sem bibliotecas.** A página é um arquivo só e abre instantaneamente.
- **Sem texto inventado.** Slogan, horário e serviço vêm do cliente.
- **Demonstração:** se for antes da venda, com faixa de demonstração e `noindex`, como no `/site-demo`.
