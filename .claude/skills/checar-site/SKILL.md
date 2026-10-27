---
name: checar-site
description: >
  Confere um site antes de entregar ou publicar: erros no console, arquivos que não carregam, texto de
  exemplo esquecido do modelo (MARCA, Serviço dois, WhatsApp 0000...), SEO (título, description, h1,
  canonical, JSON-LD, sitemap, robots), imagens (quebradas, sem alt, pesadas), rolagem lateral no celular
  e peso da página. Roda em pasta local ou em site publicado e devolve relatório com o que bloqueia e o
  que vale corrigir. Use quando o usuário pedir "confere o site", "checar site", "tá pronto pra entregar?",
  "revisa o site", "o site tem erro?", antes de /publicar-site, ou /checar-site.
---

# /checar-site — Conferência antes de entregar

Evita o constrangimento de o cliente achar "Serviço dois" no site dele, ou de o botão do WhatsApp mandar mensagem pro número de exemplo.

## Dependências

- `scripts/checar-site.js` (Playwright — se faltar, `npm run setup` na raiz)

## Como rodar

```bash
node scripts/checar-site.js clientes/<Nome>/site --saida clientes/<Nome>/site/CHECAGEM.md
node scripts/checar-site.js https://dominio.com.br            # site publicado
node scripts/checar-site.js vendas/demos/<slug> --demo         # demonstração: exige noindex
```

Ele abre cada página (segue os links internos) em desktop 1440 px e celular 390 px.

## O que ele confere

| Bloqueia (❌) | Vale corrigir (⚠️) |
|---|---|
| Erro no console, arquivo 404 | Título fora de 25–65 caracteres, description fora de 70–160 |
| Texto de exemplo do modelo (busca no texto original, no JSON-LD e nos alt) | Mais de um `<h1>`, sem canonical, sem favicon, sem og:image |
| WhatsApp ou telefone de exemplo (`0000...`) | Imagem sem alt, sem `loading="lazy"` abaixo da dobra, grande demais |
| Imagem quebrada, rolagem lateral no celular | Página acima de 5 MB ou lenta |
| JSON-LD inválido; página sem `<title>`, description ou `<h1>` | `aggregateRating` no JSON-LD (contra as regras do Google) |
| `noindex` em site de cliente / **falta** de noindex em demo | Página fora do sitemap; sem robots.txt |
| robots.txt bloqueando o site; sitemap com `DOMINIO` | Link `_blank` sem `rel="noopener"` |

## Workflow

1. Rodar o script na pasta (ou URL) e ler o relatório
2. Corrigir **todos os ❌**. Os ⚠️: corrigir os que levam menos de 5 min; listar o resto pro usuário
3. Rodar de novo até sair "✅ Nada bloqueando a entrega"
4. Conferência humana que o script não faz — abrir o site e checar:
   - [ ] O 3D (ou a foto do hero) está bonito no celular e não cobre o título
   - [ ] A agenda (ou o pedido de orçamento) abre e o WhatsApp que abre é o **do cliente**, com a mensagem certa. Orçamento por formulário: mandar um pedido de teste no site publicado e ver chegar no e-mail da empresa
   - [ ] Preços, horários e endereço batem com o que o cliente passou
   - [ ] Fotos são reais (ou marcadas como ilustrativas) e todas autorizadas
   - [ ] O texto soa como o cliente fala (`_memoria/preferencias.md` do cliente)
5. Site publicado: rodar também o PageSpeed Insights (pagespeed.web.dev) — mede celular fraco e rede lenta, o que o script não simula. Meta: 80+ em desempenho no celular

## Regras

- **Não entregar com ❌.** Sem exceção.
- **Não esconder aviso.** O que ficou sem corrigir vai pro usuário, com o motivo.
- O relatório (`CHECAGEM.md`) fica na pasta do site — vira histórico da entrega.
