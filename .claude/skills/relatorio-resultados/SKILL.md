---
name: relatorio-resultados
description: >
  Gera o relatório mensal de resultados pra uma loja cliente: o que foi entregue (vs o pacote
  contratado), antes e depois nos indicadores (avaliações, Google Meu Negócio, Instagram, site,
  mensagens, vendas), retorno estimado do serviço e plano do próximo mês. Sai em HTML + PDF com
  a sua identidade visual e mensagem de envio. É o que mantém o cliente pagando e justifica reajuste.
  Use quando o usuário pedir "relatório do cliente X", "relatório mensal", "resultados da loja X",
  "fechamento do mês do cliente", "mostrar resultado pro cliente", ou /relatorio-resultados.
---

# /relatorio-resultados — Relatório mensal pro lojista

O cliente não cancela serviço que ele vê funcionando. Esse relatório mostra, em uma leitura de 3 minutos, o que foi feito, o que mudou e o que vem — com número de antes e depois.

## Dependências

- **Contexto:** `_memoria/empresa.md`, `_memoria/preferencias.md`
- **Pasta do cliente:** `clientes/<Nome>/` (criada por `/novo-projeto`; confirmar a convenção no `CLAUDE.md` da raiz)
- **O que foi vendido:** `vendas/propostas/<slug-loja>/resumo.md` (pacote fechado, entregas prometidas)
- **Linha de base:** `vendas/diagnosticos/<slug-loja>/dados.md` (números do diagnóstico = o "antes" do mês 1)
- **Histórico:** `clientes/<Nome>/resultados/` (relatórios anteriores)
- **Entradas do mês:** exports e prints que o usuário soltar em `dados/` ou na pasta do cliente (Google Meu Negócio, Instagram Insights, Analytics, Shopify/Nuvemshop, Google/Meta Ads)
- **Visual:** `identidade/design-guide.md`
- **Modelo:** `.claude/skills/relatorio-resultados/modelo.html`
- **Render:** `scripts/render.js` (se faltar o Playwright, `npm run setup` na raiz)

---

## Como rodar

```
/relatorio-resultados <loja> outubro
/relatorio-resultados <loja>
```

Sem mês, usar o mês anterior ao atual.

## Workflow

### Passo 1 — Localizar o cliente e a base de comparação

1. Achar a pasta do cliente e o `resumo.md` da proposta fechada
2. Base de comparação:
   - Mês 1: números do diagnóstico (`dados.md`)
   - Mês 2 em diante: o relatório do mês anterior em `clientes/<Nome>/resultados/` **e** o diagnóstico (mostrar a evolução desde o início)

Se não houver base nenhuma, avisar que esse relatório vira a linha de base.

### Passo 2 — Coletar os números do mês

Pedir ao usuário só o que falta, numa lista única (não uma pergunta por vez):

> "Pra fechar o mês da [loja] preciso de: (1) print ou export do Google Meu Negócio — desempenho do mês, (2) Instagram Insights do mês, (3) vendas do mês se o dono passar, (4) export de ads se tiver campanha. Solta em `dados/` e me avisa."

Coletar sozinho o que for público: nota e nº de avaliações no Google, % respondidas, posts publicados no Instagram, seguidores.

### Passo 3 — O que foi entregue

Comparar o entregue com o prometido no pacote:

| Entrega | Prometido | Feito |
|---|---|---|
| Respostas de avaliação | todas em até 24h | 23 de 23 |
| Carrosséis | 8 | 8 |
| Descrições de produto | 40 | 40 |

Levantar o "feito" das pastas do cliente (peças em `conteudo/`, respostas salvas, etc.) e confirmar com o usuário. Se algo ficou abaixo do prometido, mostrar e explicar — não esconder.

### Passo 4 — Antes e depois

Só indicadores ligados ao pacote contratado. Tabela:

| Indicador | Início (diagnóstico) | Mês anterior | Este mês | Variação |
|---|---|---|---|---|
| Nota no Google | 4,1 | 4,2 | 4,4 | ▲ |
| Avaliações | 47 | 58 | 71 | +13 |
| % respondidas | 34% | 100% | 100% | — |
| Visualizações do perfil no Google | ... | ... | ... | |
| Pedidos de rota / ligações (GMB) | ... | ... | ... | |
| Alcance Instagram | ... | ... | ... | |
| Mensagens no WhatsApp/Direct | ... | ... | ... | |
| Vendas (se informado) | ... | ... | ... | |

Escolher **um destaque do mês**: o número que mais melhorou e que o dono entende sem explicação.

### Passo 5 — Retorno do serviço

Ligar indicador a dinheiro com conta transparente, quando houver base:

```
Pedidos de rota no Google: +38 vs início
Se ~20% viram compra × ticket médio R$ 120 ≈ R$ 900 em vendas no mês
Investimento no serviço: R$ 990
```

- Sempre marcado como estimativa, premissas visíveis
- Se o dono passou vendas reais, usar elas e dizer que são reais
- Se ainda não dá pra ligar a dinheiro (mês 1, pouco dado), dizer isso honestamente e mostrar os indicadores que antecedem venda

### Passo 6 — Próximo mês

3 ações concretas, ligadas ao que os números mostraram ("as reclamações sobre demora no banho caíram — próximo mês: post mostrando o novo horário de agendamento").

Se o cliente está consistentemente bem e usando pouco do pacote, ou pedindo coisa fora do escopo: sinalizar **oportunidade de upgrade** — só no resumo interno pro usuário, não no PDF.

### Passo 7 — Documento e render

Copiar `modelo.html` dessa skill pra `clientes/<Nome>/resultados/<YYYY-MM>/relatorio.html`, aplicar as cores de `identidade/design-guide.md` e preencher os `{{CAMPOS}}` (nenhum pode sobrar). Estrutura do modelo:

```
[Logo]                                         Resultados · <loja> · <mês/ano>

Destaque do mês           1 número grande + 1 frase
O que fizemos             tabela entregue vs prometido
Como evoluiu              tabela antes/depois (setas, cores de alta/queda)
Quanto voltou             conta do retorno (ou "ainda em formação" no mês 1)
Próximo mês               3 ações
```

Limite: 2 páginas. PDF:

```bash
node scripts/render.js clientes/<Nome>/resultados/<YYYY-MM>/relatorio.html --pdf clientes/<Nome>/resultados/<YYYY-MM>/resultados-<slug>-<YYYY-MM>.pdf
```

Salvar `clientes/<Nome>/resultados/<YYYY-MM>/dados.md` com frontmatter:

```yaml
---
cliente: <Nome>
mes: YYYY-MM
pacote: <pacote>
nota_google: 0.0
avaliacoes_total: 0
pct_respondidas: 0
vendas_informadas: null
retorno_estimado: null
---
```

Esse frontmatter alimenta a comparação do mês seguinte.

### Passo 8 — Entrega

Mostrar no chat: destaque, tabela antes/depois resumida, caminho do PDF, e a mensagem de envio pro cliente (curta, começando pelo destaque). Separado, só pro usuário: alertas (entrega abaixo do prometido, indicador caindo, oportunidade de upgrade).

Se o mês trouxe um resultado forte (ou um problema que ameaça a renovação), oferecer registrar em `/aprendizado` — é o que mostra quais entregas realmente geram resultado por nicho.

---

## Regras

- **Nunca inventar número.** Sem dado, a linha fica "sem dado este mês" — e o próximo passo é combinar com o cliente como coletar.
- **Não esconder mês ruim.** Indicador caiu? Mostrar, explicar o provável motivo e o que muda. Relatório que só mostra coisa boa perde credibilidade.
- **Só o que foi vendido.** Não encher com indicador que não tem a ver com o pacote.
- **Linguagem do dono.** "Gente que pediu rota pra loja", não "direction requests". Seguir `_memoria/preferencias.md`.
- **Não enviar nada.** A skill gera; quem manda é o usuário.
