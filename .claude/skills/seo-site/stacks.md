# Onde cada coisa mora, por tipo de projeto

Antes de alterar, descobrir a stack: `index.html` solto na pasta = estático; `package.json` com `next` = Next.js; com `vite` = Vite; `wp-content` no HTML = WordPress. O `seo-site.js` diz qual achou.

## Site estático (o padrão do `/site-premium`)

| Coisa | Onde |
|---|---|
| Title, description, canonical, Open Graph, `twitter:card` | `<head>` de cada `.html` (no modelo, os campos com `data-editar`) |
| Dados estruturados | `<script type="application/ld+json">` no `<head>`: negócio no `index.html`, `Service` + `FAQPage` + `BreadcrumbList` no `servico-*.html` |
| Página por serviço | copiar `servico.html` como `servico-<nome>.html`, ligar no card da inicial |
| Sitemap, robots, `llms.txt` | `node scripts/seo-arquivos.js <pasta> --dominio <dominio>` |
| Domínio | `DOMINIO` em todos os arquivos, trocado no `/publicar-site` |
| Redirecionamento 301 | Vercel: `vercel.json` → `{ "redirects": [{ "source": "/antigo.html", "destination": "/novo.html", "permanent": true }] }`. Netlify: arquivo `_redirects` → `/antigo.html /novo.html 301` |
| Página 404 | `404.html` na raiz (Vercel e Netlify servem com status 404) |
| Pastas de bancada (`tecnicas/demo.html`, `mostruario.html`...) | Não publicar: apagar da pasta do site as bancadas que não são usadas |

O texto já vai no HTML: é o melhor caso pra busca e pra IA.

## Next.js (App Router)

| Coisa | Onde |
|---|---|
| Title e description | `export const metadata` em cada `page.tsx`, ou `generateMetadata()` em rota dinâmica. No `layout.tsx` raiz: `metadataBase: new URL('https://dominio')` e `title: { template: '%s · <marca>', default: '...' }` |
| Canonical | `metadata.alternates.canonical` (caminho relativo, resolvido pelo `metadataBase`) |
| Open Graph | `metadata.openGraph`; imagem em `app/opengraph-image.png` (1200×630) ou `opengraph-image.tsx` |
| Sitemap | `app/sitemap.ts` devolvendo a lista de páginas com `lastModified` |
| Robots e robôs de IA | `app/robots.ts` com as `rules` (uma por robô, quando a política não for "permitir") e `sitemap` |
| noindex pontual | `metadata.robots = { index: false }` na página |
| Dados estruturados | `<script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(dados) }} />` dentro de um **Server Component** da página |
| Texto no HTML | Server Component por padrão. O que anima vai numa folha `'use client'`, mas o **texto** fica no componente de servidor (ou passa como `children`). `SplitReveal` mantém o texto original pro leitor de tela e pro robô |
| Imagens | `next/image` com `alt`, `sizes`, e `priority` só na imagem do LCP |
| Redirecionamento | `redirects()` no `next.config`, `permanent: true` |
| 404 | `app/not-found.tsx` |
| `lang` | `<html lang="pt-BR">` no `layout.tsx` |

Auditar: `npm run build && npm start`, depois `node scripts/seo-site.js http://localhost:3000`. O servidor de desenvolvimento (`npm run dev`) serve pra conferir metadado, não desempenho.

## Vite, React ou outra SPA sem servidor

Uma SPA entrega um HTML quase vazio e monta o texto com JavaScript. Consequência honesta: **um title só pra todas as rotas** e nada de texto pra robô que não executa JavaScript. A auditoria acusa como "O texto só aparece depois do JavaScript".

Saídas, da melhor pra pior:

1. Gerar as páginas no build (pré-renderização): `vite-react-ssg`, pré-renderização do React Router, ou migrar pra Astro ou Next.js
2. Se for uma página só (landing): pôr title, description, Open Graph e JSON-LD direto no `index.html` e o texto principal no HTML estático, deixando o React só pro que é interativo
3. Trocar o `<title>` por rota com JavaScript: resolve a aba do navegador, não o robô. Não entregar como SEO

Sitemap e robots: arquivos em `public/`.

## Outras (WordPress, Wix, loja pronta)

Auditar pela URL. A correção é no painel da plataforma: title e description por página, texto alternativo das imagens, redirecionamentos e o plugin de SEO (que já gera sitemap e JSON-LD). Entregar a auditoria com o caminho de cada correção no painel; não prometer o que a plataforma não deixa mudar.

## Dados estruturados: qual tipo

| Negócio ou página | `@type` |
|---|---|
| Loja ou serviço com endereço | o mais específico de schema.org/LocalBusiness: `Optician`, `AutoRepair`, `BeautySalon`, `Dentist`, `Restaurant`, `Bakery`, `PetStore`, `HomeAndConstructionBusiness`, `Electrician`, `AccountingService`... |
| Empresa sem atendimento no local, indústria, software | `Organization` (com `address`, se houver) |
| Página de serviço | `Service` com `provider`, `areaServed` e `offers` só se o preço estiver na página |
| Página de produto | `Product` com `offers`; `brand`, `sku` e medidas quando existirem |
| Perguntas visíveis na página | `FAQPage` |
| Página interna | `BreadcrumbList` |
| Artigo | `Article` ou `BlogPosting`, com `author`, `datePublished`, `dateModified` |

Três regras: só o que a página mostra; nunca `aggregateRating` ou `review` das avaliações do Google do próprio negócio; coordenadas, telefone e horário reais.

Sobre perguntas no resultado do Google: desde 2023 o Google mostra o bloco de perguntas quase só pra sites de governo e saúde. `FAQPage` continua válido e ajuda a máquina a ler pergunta e resposta, mas **não prometer** que as perguntas aparecem no resultado.

## Ferramentas de validação

| Ferramenta | Pra quê | Precisa de |
|---|---|---|
| `scripts/seo-site.js` | Tudo o que dá pra ler no site: análise **estática** mais medição local | Nada |
| PageSpeed Insights (`--psi`, ou pagespeed.web.dev) | Teste **real** do Google em celular e, quando há visitas, os Core Web Vitals de visitantes | Site publicado. Sem chave funciona com limite baixo; chave gratuita no Google Cloud (API "PageSpeed Insights") em `PAGESPEED_API_KEY` no `.env`, e rodar com `node --env-file=.env scripts/seo-site.js <url> --psi` |
| Lighthouse (`npx lighthouse <url> --preset=perf --form-factor=mobile`, ou a aba do Chrome) | Desempenho, acessibilidade e SEO em laboratório, inclusive em `localhost` | Chrome |
| Teste de resultados avançados (search.google.com/test/rich-results) | Se o Google aceita o JSON-LD | Site publicado, ou colar o código |
| validator.schema.org | Erros de schema que o teste do Google não mostra | Nada |
| Google Search Console | **Única** fonte de "está indexado", consultas, cliques e posição | Conta Google do cliente, verificação por DNS (no `/publicar-site`) |
| Bing Webmaster Tools (bing.com/webmasters) | O mesmo pro Bing e, por tabela, pro Copilot. Dá pra importar o site do Search Console em dois cliques | Conta Microsoft ou Google do cliente |

Chave e senha: sempre no `.env` (fora do GitHub), nunca em arquivo de cliente, relatório ou mensagem. Conta é do cliente; você entra como usuário.
