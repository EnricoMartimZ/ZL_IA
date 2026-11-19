---
name: seo-site
description: >
  SEO e GEO do site em si: planeja as palavras-chave por intenção de busca e decide as páginas ANTES de o site
  existir, escreve title, description, títulos e textos de cada página, implementa dados estruturados
  (JSON-LD), sitemap, robots e a política pra robôs de IA, audita qualquer site (pasta local ou URL) com
  achados por gravidade (crítico, alto, médio, baixo) e fecha com um relatório de SEO que o cliente leigo
  entende. Entra sozinha dentro do /site-premium, do /site-demo e do /publicar-site. Use quando o usuário
  pedir "seo do site", "auditoria de seo", "audita esse site", "o site não aparece no Google", "o site
  aparece no ChatGPT?", "otimiza o site pro Google", "title e description", "dados estruturados", "schema",
  "sitemap", "robots.txt", "llms.txt", "relatório de seo", ou /seo-site. Pesquisa de mercado, Google Meu
  Negócio, calendário de conteúdo e anúncios são do /seo.
---

# /seo-site — o site feito pra ser achado, no Google e nas IAs

SEO que entra no fim vira enfeite de `<head>`. Aqui ele entra antes: a busca decide **quais páginas o site tem**, o que cada uma responde e o que vai escrito na primeira dobra. Metadado, JSON-LD e sitemap são consequência.

Duas frentes, a mesma página:

- **SEO** (Google e Bing): a página certa pra cada busca, legível pra máquina, rápida, sem duplicata.
- **GEO** (ChatGPT, Perplexity, Gemini, Copilot): texto que responde direto, com fato conferível, e uma empresa identificada do mesmo jeito em todo lugar. O que é prática comprovada, o que é hipótese e o que é experimental está separado em `geo.md`, e essa separação vai pro relatório.

## Quem faz o quê (não repetir)

| Skill | Cuida de | Não cuida de |
|---|---|---|
| **`/seo-site`** (esta) | O site: palavras-chave por página, arquitetura, textos, metadados, dados estruturados, rastreamento, auditoria e relatório | Mercado, perfil do Google, anúncios |
| **`/seo`** | Fora do site: demanda e concorrência do nicho, Google Meu Negócio, calendário de conteúdo, Google Ads, monitoramento mensal | Mexer no site. O passo 4 dela (on-page) é esta skill |
| **`/checar-site`** | Trava de entrega dos sites do ZL_IA: texto de exemplo, WhatsApp de exemplo, console, painel de contato, cor da marca. Zero ❌ pra entregar | Estratégia, conteúdo, duplicata, robôs de IA, site de terceiros |
| **`/publicar-site`** | Deploy, domínio, Search Console, Bing, entrega | Decidir o que o site diz |

Se o `/seo` já rodou, `marketing/seo/01-pesquisa-demanda.md` e `02-analise-concorrencia.md` são a matéria-prima do plano: não pesquisar de novo.

## Dependências

- **Scripts:** `scripts/seo-site.js` (auditoria, Playwright) e `scripts/seo-arquivos.js` (sitemap, robots, llms.txt). Node 20+; se faltar o Playwright, `npm run setup`
- **Apoio:** `plano.md` (pesquisa, arquitetura, como escrever), `geo.md` (IA: o que se sabe e o que não), `stacks.md` (onde cada coisa mora em site estático, Next.js, Vite/React e outros), `relatorio.md` (modelo do relatório), `plano-exemplo.json`
- **Memória (ler antes de perguntar):** ver o Passo 1
- **Saída:** `clientes/<Nome>/seo/` (`plano.json`, `plano.md`, `AUDITORIA.md`, `RELATORIO-SEO.md`). Demonstração: `vendas/demos/<slug>/seo/`. Site do próprio negócio: `marketing/seo/site/`. Tudo fora do GitHub

## Três jeitos de entrar

| Situação | O que rodar |
|---|---|
| **Site novo** (dentro do `/site-premium`, ou projeto Next.js) | Passos 1 a 7, intercalados com a criação do site |
| **Site que já existe** (do cliente, de um prospect, ou "audita essa URL") | Passo 6 primeiro (auditoria), depois 1 a 3 só se for mexer, e 7 |
| **Demonstração** (`/site-demo`) | Versão curta: Passo 2 com uma palavra principal por página e Passo 6 com `--demo`. Sem sitemap, sem JSON-LD, sem indexação: a demo fica fora do Google de propósito |

---

## Workflow

### Passo 1 — Juntar o que já se sabe

Ler, nesta ordem, e anotar o que achou em `clientes/<Nome>/seo/plano.md`:

| Preciso de | Onde costuma estar |
|---|---|
| Nome, ramo, cidade, bairro, área atendida, horário, telefone | `clientes/<Nome>/CLAUDE.md`, `entrada.md`, `vendas/diagnosticos/<slug>/dados.md`, `vendas/demos/<slug>/coleta.md` |
| Serviços e produtos, o carro-chefe, preço "a partir de" | os mesmos, mais a proposta em `clientes/<Nome>/proposta/` |
| Quem compra e o que decide a compra | `clientes/<Nome>/conceito.md` (Passo A2 da direção criativa) |
| Diferenciais e as frases que a empresa usa | `clientes/<Nome>/marca/marca.json` (`frases`), diagnóstico |
| Avaliações reais e perguntas que os clientes fazem | diagnóstico, prints do Google |
| Demanda e concorrentes do nicho | `marketing/seo/01-*.md` e `02-*.md`, se o `/seo` já rodou |
| Site do próprio negócio | `_memoria/empresa.md`, `_memoria/servicos.md`, `_memoria/estrategia.md` |

Perguntar **só o que faltar e mudar o plano**, numa mensagem só. Normalmente sobra isto:

1. Atende só na cidade ou em quais cidades e bairros? (decide se existe página por região)
2. Qual serviço dá mais dinheiro e qual o cliente mais procura? (podem ser diferentes: os dois ganham página)
3. Quais perguntas o cliente faz antes de fechar? (viram as respostas do site)
4. Robôs de IA podem ler o site? (padrão: sim. Ver `geo.md`)

Nunca perguntar o que está na memória. Nunca inventar o que não está: sem dado, a frase não entra.

### Passo 2 — Intenção de busca e palavras-chave

Seguir o `plano.md` §1 e §2. Em resumo: listar como o cliente **procura** (não como a empresa se descreve), classificar cada busca pela intenção, conferir com busca real o que aparece hoje, e escolher pra cada página **uma** principal, 2 a 4 secundárias e as de cauda longa (perguntas).

Volume de busca: sem ferramenta paga não há número. Escrever "alto / médio / baixo (estimativa, pelo que a busca mostra)" e dizer de onde saiu. Nunca inventar número.

### Passo 3 — Arquitetura: a busca decide as páginas

`plano.md` §3. Uma página pra cada busca que tem intenção própria; nada de página pra variação da mesma busca. Sai daqui a lista de páginas com endereço curto, a principal de cada uma, e quem linka pra quem.

**Mostrar a tabela ao usuário antes de escrever texto.** No `/site-premium` isso acontece antes da direção criativa: o conceito desenha páginas que o plano já definiu.

Salvar `clientes/<Nome>/seo/plano.json` (formato em `plano-exemplo.json`) e as decisões em `plano.md`.

### Passo 4 — Textos com SEO e GEO juntos

`plano.md` §4. Pra cada página, escrever no plano: title, description, h1, a linha de apoio da primeira dobra, os h2 e as perguntas com resposta. Depois os textos da página.

O acordo com a direção criativa: **o h1 pode ser a frase do conceito**; nesse caso a linha de apoio logo abaixo diz, em texto corrido, o serviço e a cidade. O title nunca é criativo.

### Passo 5 — Implementar

Descobrir a stack antes de tocar (`stacks.md`): site estático do `/site-premium`, Next.js (App Router), Vite/React ou outra. Depois:

1. **Metadados** por página: title, description, canonical próprio, Open Graph, `twitter:card`, `lang`
2. **Dados estruturados** em JSON-LD, só com o que a página mostra: o negócio no tipo mais específico (na página inicial), `Service` ou `Product` nas páginas de oferta, `FAQPage` onde as perguntas estão visíveis, `BreadcrumbList` nas internas, `Article` com autor e data em artigo. Tabela de tipos em `stacks.md`
3. **Imagens:** nome de arquivo descritivo, WebP ou AVIF, `width` e `height`, `alt` que descreve a foto (decorativa: `alt=""`), `loading="lazy"` abaixo da dobra
4. **Links internos:** toda página recebe link de outra, com texto que diz o destino. Link externo só quando ajuda o leitor (perfil do Google, fabricante, norma)
5. **Arquivos de rastreamento** (site estático):
   ```bash
   node scripts/seo-arquivos.js clientes/<Nome>/site --dominio dominio.com.br --ia permitir
   ```
   `--ia sem-treino` ou `--ia bloquear` quando o cliente decidir assim; `--llms` só se ele quiser o `llms.txt` (experimental). Next.js: `app/sitemap.ts` e `app/robots.ts`
6. **Mudou endereço de página que já estava no ar:** redirecionamento 301 do antigo pro novo (`stacks.md`), senão o link do Google e do Instagram quebra

### Passo 6 — Auditar

```bash
# site em construção, com o plano
node scripts/seo-site.js clientes/<Nome>/site --plano clientes/<Nome>/seo/plano.json --saida clientes/<Nome>/seo/AUDITORIA.md

# site no ar (de cliente, de prospect, de qualquer um), com o teste real do Google
node scripts/seo-site.js https://dominio.com.br --psi --saida <pasta>/AUDITORIA.md

# demonstração: exige noindex e robots bloqueado
node scripts/seo-site.js vendas/demos/<slug> --demo

# projeto Next.js, Vite ou React: subir o servidor e passar o endereço, ou passar a pasta do build
node scripts/seo-site.js http://localhost:3000 --plano <plano.json>
```

Opções: `--externos` confere links pra fora; `--max 80` lê mais páginas; `--json arquivo.json` guarda os dados pro relatório.

O que ele olha: indexação (noindex, robots, sitemap), title e description (falta, tamanho, repetidos), hierarquia de títulos, conteúdo raso e duplicado, texto que só aparece com JavaScript, links internos (quebrados, órfãs, texto genérico), imagens, celular, HTML semântico, canonical, dados estruturados (inválidos e **diferentes do que a página mostra**), SEO local, robôs de IA, e, com o plano, se cada página cumpre a palavra dela. Em site publicado: HTTPS, versão com e sem `www`, página de erro que responde 200.

Gravidade:

- **Crítico** — impede rastreamento, indexação ou funcionamento. Corrigir antes de qualquer coisa
- **Alto** — custa posição ou clique. Corrigir antes de publicar
- **Médio** — corrigir nesta rodada
- **Baixo** — acabamento; listar o que ficou

Site do ZL_IA: **zero crítico e zero alto** antes de publicar. Único alto que pode ficar pro `/publicar-site` é o domínio de exemplo (`DOMINIO`), quando o domínio ainda não existe. Depois rodar o `/checar-site`, que é a trava de entrega.

O script não substitui: Teste de resultados avançados e validator.schema.org (dados estruturados), PageSpeed Insights ou Lighthouse (velocidade real), Search Console e Bing Webmaster Tools (indexação e posição). Como usar cada um, sem expor chave, em `stacks.md` §"Ferramentas".

### Passo 7 — Relatório de SEO (antes de publicar e ao fim de toda auditoria)

Montar `clientes/<Nome>/seo/RELATORIO-SEO.md` pelo `relatorio.md`: estratégia, mapa de páginas e palavras, titles e descriptions, estrutura de títulos, o que foi implementado, dados estruturados, GEO, o que foi achado e corrigido, pendências do cliente e próximos passos. Linguagem de quem explica pro dono da loja. PDF, se for mandar: `node scripts/render.js`.

Mostrar o resumo no chat e, no `/site-premium`, **antes de pedir o "ok" pra publicar**.

### Passo 8 — Guardar

- `plano.json` e `plano.md` ficam na pasta do cliente: as palavras prioritárias, as decisões (páginas que não foram feitas e por quê, política de IA, o que o cliente recusou) e a data
- Uma linha no `clientes/<Nome>/CLAUDE.md` apontando pro plano, pra próxima sessão não refazer
- Depois de publicado: anotar em `plano.md` cada teste em IA e cada leitura do Search Console, com a data. É o histórico que o `/relatorio-resultados` usa

---

## Regras

- **Nada de promessa.** Nem primeira posição, nem "vai aparecer no ChatGPT". O que se entrega é o site pronto pra ser lido; resultado depende de concorrência, tempo e do que o cliente fizer
- **Nada afirmado sem a ferramenta.** "Está indexado", "está em 3º", "a IA cita" só com print ou leitura do Search Console, do Bing ou do teste, com data. Medição local nunca vira "nota do Google"
- **Separar sempre** prática comprovada, hipótese e experimental (`geo.md`). O `llms.txt` é experimental e opcional
- **Proibido:** repetir palavra-chave pra forçar (keyword stuffing), página em massa trocando só o nome da cidade, texto escondido, mostrar uma coisa pro buscador e outra pro visitante (cloaking), comprar ou trocar link, avaliação ou depoimento inventado, dado estruturado que a página não mostra, nota do próprio negócio em `aggregateRating`, texto enganoso
- **Demonstração é intocável:** `noindex`, `Disallow: /` e ausência de sitemap na demo não são erro. Nunca "corrigir". O `seo-arquivos.js` se recusa a gerar e o `seo-site.js` exige o bloqueio
- **Dado de cliente fica local.** Plano, auditoria e relatório nunca vão pro GitHub; em arquivo versionado, só "a ótica", `<cliente>`
- **Texto é do cliente.** Tom em `_memoria/preferencias.md` e na marca dele. Palavra-chave que estraga a frase sai da frase
