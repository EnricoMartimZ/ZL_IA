---
name: publicar-site
description: >
  Coloca o site de um cliente no ar e deixa ele trabalhando: conferência final (/checar-site), deploy
  na Vercel ou Netlify, domínio próprio (Registro.br + DNS + SSL), Google Search Console com sitemap,
  link no Google Meu Negócio e no Instagram, medição de cliques, documento de entrega com todos os
  acessos — e o plano de manutenção mensal (receita recorrente). Use quando o usuário pedir "publicar
  o site", "colocar no ar", "subir o site", "configurar domínio", "apontar o domínio", "entregar o site",
  "manutenção do site", ou /publicar-site.
---

# /publicar-site — Publicação, domínio e manutenção

Site bonito que ninguém acha não vende. Essa skill faz o site do cliente aparecer (Google, Maps, Instagram) e medir o que traz — e transforma a entrega num contrato mensal.

## Dependências

- **Site:** `clientes/<Nome>/site/` (do `/site-premium`)
- **Conferência:** `/checar-site` (`scripts/checar-site.js`)
- **Contas:** Vercel ou Netlify (sua), Registro.br e Google (**do cliente** — ver regra do domínio)
- **Saída:** `clientes/<Nome>/site/ENTREGA.md`

---

## Regra do domínio e das contas

O domínio e o Google do negócio são **do cliente**, no CPF/CNPJ dele:
- Domínio registrado pelo cliente no Registro.br (ou ele te dá acesso de "contato técnico")
- Search Console, Google Meu Negócio e Analytics: propriedade do cliente, você entra como usuário
- Hospedagem pode ficar na sua conta (é o que a manutenção cobre) — combinar por escrito que, se a manutenção acabar, você transfere o projeto ou entrega os arquivos

Isso evita a pior briga de site: cliente que sai e "perde" o domínio.

---

## Workflow

### Passo 1 — Pré-voo

```bash
node scripts/checar-site.js clientes/<Nome>/site --saida clientes/<Nome>/site/CHECAGEM.md
```

Zero ❌ e conferência humana do `/checar-site` feita. Confirmar com o usuário: **o cliente aprovou esta versão?** Sem aprovação, não publicar.

Antes do deploy, no site:
- Trocar `DOMINIO` pelo domínio final em todos os arquivos (canonical, og, JSON-LD, sitemap, robots)
- `app.js` → `medicao`: Plausible (sem cookies) ou GA4/Pixel do cliente (o aviso de cookies aparece sozinho)
- Orçamento por formulário (`orcamento.formulario`): o formulário criado na conta **da empresa**, e o item do formulário colado na `privacidade.html`
- `sitemap.xml` com todas as páginas e `lastmod` de hoje

### Passo 2 — Deploy

**Vercel** (recomendado):
```bash
npx vercel deploy clientes/<Nome>/site --prod --yes --name <slug>
```
**Netlify:** app.netlify.com/drop e arrastar a pasta.

Abrir o link `.vercel.app` gerado e rodar o `checar-site` nele (URL).

### Passo 3 — Domínio

1. Cliente registra o domínio em registro.br (`.com.br` exige CPF/CNPJ)
2. Na Vercel: projeto → Settings → Domains → adicionar `dominio.com.br` e `www.dominio.com.br`. A Vercel mostra os registros exatos — usar os que ela mostrar
3. No Registro.br: "Alterar servidores DNS" → usar os da Vercel, **ou** manter o DNS do Registro.br e criar os registros que a Vercel indicou (normalmente um `A` pro domínio raiz e um `CNAME` pro `www`)
4. Esperar propagar (minutos a algumas horas). SSL (cadeado) a Vercel emite sozinha
5. Escolher a versão principal (com ou sem `www`) e redirecionar a outra pra ela

E-mail no domínio (contato@dominio.com.br): fora do escopo do site — indicar Google Workspace, Zoho ou o do provedor, se o cliente quiser.

### Passo 4 — Google e redes

- **Search Console** (search.google.com/search-console): propriedade de domínio, verificação por registro TXT no DNS; enviar `https://dominio/sitemap.xml`; pedir indexação da home
- **Teste de resultados avançados** (search.google.com/test/rich-results): colar a URL e confirmar que o JSON-LD foi lido
- **Google Meu Negócio**: campo "Site" com o domínio; botão "Agendar" apontando pro site se fizer sentido
- **Instagram**: link na bio
- **WhatsApp Business**: link no perfil
- Mandar o link num WhatsApp de teste e conferir a prévia (imagem `og` + título)

### Passo 5 — Entrega

Pôr o site em `clientes/_sites.json` (`tipo: cliente`, com `dominio`) pro `/vigia` cuidar dele. Com a entrega concluída, avisar `/entrada-cliente` e `/cobrancas`, que liberam a parcela final.

Criar `clientes/<Nome>/site/ENTREGA.md`:

```markdown
# Entrega do site — <Cliente> — <data>

- Site: https://dominio.com.br  ·  Vercel: <projeto>  ·  publicado em <data>
- Domínio: registrado em nome de <cliente> no Registro.br, vence em <data>
- DNS: <onde está> · registros: <lista>
- Search Console: propriedade do cliente (<email>), eu como usuário · sitemap enviado em <data>
- Medição: <Plausible/GA4/Pixel> · eventos: clique_whatsapp, agenda_aberta, agenda_enviada (ou orcamento_aberto, orcamento_enviado), clique_telefone, clique_rota
- Google Meu Negócio e Instagram com o link: ok
- Checagem: CHECAGEM.md (0 ❌) · PageSpeed celular: <nota>
- Pendências do cliente: <fotos, depoimentos...>
```

Mandar pro cliente um resumo curto (o que foi publicado, onde ver os números, o que ele precisa fazer) e atualizar `vendas/funil.md` / pasta do cliente.

---

## Manutenção mensal (oferecer sempre)

O site avulso paga uma vez; a manutenção paga todo mês. Oferecer junto com a entrega, como item do `_memoria/servicos.md`:

**Inclui por mês:**
- Hospedagem e domínio monitorados (avisar antes de vencer)
- Até N ajustes de texto, preço, foto ou horário
- `checar-site` no site publicado e correção do que aparecer
- Relatório de resultados do site: cliques no WhatsApp, agendamentos (ou pedidos de orçamento) enviados, visitas e buscas no Google (Search Console) — entra no `/relatorio-resultados`
- Uma melhoria por mês a partir dos números (ex: página nova de serviço que as pessoas buscam)

**Rotina mensal** (todo dia 1º, por cliente):
1. `node scripts/checar-site.js https://dominio --saida clientes/<Nome>/site/checagens/<YYYY-MM>.md`
2. Puxar os números (Plausible/GA4 e Search Console) pro `/relatorio-resultados`
3. Aplicar os ajustes pedidos no mês, rodar o checar de novo, publicar
4. Conferir vencimento do domínio

## Regras

- **Publicar só com aprovação do cliente** da versão final.
- **Domínio e contas Google no nome do cliente.**
- **Zero ❌ no checar-site** antes de publicar e depois de cada ajuste.
- **Nunca apontar o domínio sem o cliente saber** — é a cara dele na internet.
