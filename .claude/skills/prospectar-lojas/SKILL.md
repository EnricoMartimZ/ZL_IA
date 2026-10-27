---
name: prospectar-lojas
description: >
  Monta uma lista de lojas pra prospectar (por cidade, bairro ou nicho), pesquisa a presença
  digital pública de cada uma (Google Meu Negócio, avaliações, Instagram, site, WhatsApp) e dá
  uma nota de oportunidade — quanto a loja está perdendo de venda por falta de IA/marketing.
  Entrega planilha ordenada com o motivo de cada loja estar na lista e o gancho de abordagem.
  Use quando o usuário pedir "prospectar lojas", "achar clientes", "lista de lojas", "quem eu
  abordo", "lojas em [cidade]", "leads de [nicho]", ou /prospectar-lojas. Empresas que vendem pra outras
  empresas (indústria, distribuidora, transportadora, contabilidade...): usar /prospectar-b2b.
---

# /prospectar-lojas — Lista de lojas com nota de oportunidade

Primeiro passo do funil de venda do serviço. Não é lista fria de telefone — é lista de lojas onde dá pra apontar um problema concreto e visível, que vira o gancho da abordagem e a base do `/diagnostico-loja`.

## Dependências

- **Contexto:** `_memoria/empresa.md` (o que você vende, pra quem), `_memoria/estrategia.md` (nicho/região em foco)
- **Aprendizados:** `_memoria/vendas-aprendizados.md` se existir — priorizar nichos e ganchos que já converteram, evitar os que só deram "sem resposta"
- **Serviços:** `_memoria/servicos.md` se existir (o que você resolve — define quais problemas pontuam)
- **Pesquisa:** busca web pública (Google, Google Maps, Instagram, site da loja)
- **Histórico:** `vendas/prospeccao/` (criar se não existir) — pra não repetir loja já abordada

---

## Como rodar

```
/prospectar-lojas pet shops em Campinas
/prospectar-lojas lojas de roupa feminina zona sul SP, 20 lojas
/prospectar-lojas
```

Sem argumento, perguntar:
1. "Qual nicho? (ex: pet shop, ótica, loja de roupa, material de construção, e-commerce de cosméticos)"
2. "Qual região? (cidade, bairro, ou 'online' pra e-commerce)"
3. "Quantas lojas? (padrão: 15)"

## Workflow

### Passo 1 — Levantar candidatas

Buscar lojas do nicho na região (Google Maps, busca "nicho + cidade", diretórios, Instagram por localização). Pegar o dobro do número pedido — metade vai ser descartada.

Descartar logo de cara:
- Redes e franquias grandes (decisão não é local, não compram de freelancer)
- Lojas fechadas ou sem sinal de atividade há mais de 6 meses
- Lojas que já aparecem em `vendas/prospeccao/` como abordadas nos últimos 60 dias

### Passo 2 — Raio-X de cada loja

Pra cada candidata, levantar só o que é **público e verificável**:

| Ponto | O que olhar |
|---|---|
| Google Meu Negócio | Existe? Nota, nº de avaliações, fotos, horário, categoria certa |
| Avaliações | % respondidas, tempo desde a última resposta, reclamações repetidas |
| Instagram | Seguidores, data do último post, frequência, qualidade visual, link na bio |
| Site / loja online | Existe? Mobile ok? Descrições de produto genéricas ou copiadas? |
| WhatsApp | Tem número visível? Business com catálogo? |
| Concorrência | Quem aparece na frente no Google pra "nicho + bairro" |

Se uma informação não for encontrada, registrar "não encontrado" — nunca chutar.

### Passo 3 — Nota de oportunidade (0–100)

Quanto **maior** a nota, mais a loja precisa do serviço **e** mais fácil mostrar isso.

| Sinal | Pontos |
|---|---|
| Avaliações sem resposta (>50%) | +20 |
| Menos de 30 avaliações no Google | +10 |
| Nota no Google < 4,3 com reclamações repetidas | +10 |
| Instagram sem post há mais de 30 dias | +15 |
| Instagram ativo mas visual amador / sem padrão | +10 |
| Sem site ou site quebrado no celular | +10 |
| Descrições de produto genéricas/copiadas | +10 |
| Sem WhatsApp visível ou sem catálogo | +5 |
| Concorrente direto aparecendo na frente no Google | +10 |

Ajustar pesos se `_memoria/servicos.md` indicar que você não vende algo (ex: não faz site → não pontuar site).

Sinal de **capacidade de pagar** (não soma nota, vira coluna separada): loja física própria, mais de uma unidade, ticket médio alto do nicho, investe em anúncio (aparece na Biblioteca de Anúncios da Meta).

### Passo 4 — Gancho de abordagem

Pra cada loja, escrever **uma frase** com o problema mais visível, específico e verificável. É isso que vai na primeira mensagem.

- Bom: "Vocês têm 47 avaliações no Google e 31 estão sem resposta — a última respondida foi em março."
- Ruim: "Percebi que vocês podem melhorar a presença digital."

### Passo 5 — Planilha

Gerar `vendas/prospeccao/<YYYY-MM-DD>-<nicho>-<regiao>.xlsx` (usar a skill de XLSX) com colunas:

`Prioridade | Loja | Nota | Capacidade de pagar | Gancho | Instagram | Site | Telefone/WhatsApp | Google (nota/avaliações) | Endereço | Status`

Ordenar por nota decrescente. Coluna `Status` começa como "a abordar".

Adicionar cada loja nova em `vendas/funil.md` na etapa **a abordar** (formato em `/funil`). Loja que já está no funil não entra de novo.

Salvar também um `.md` com o mesmo conteúdo resumido (o `/atualizar` e o `/diagnostico-loja` leem mais fácil).

### Passo 6 — Entrega

Mostrar no chat o top 5 em tabela curta (loja, nota, gancho) e fechar com:

> "Planilha completa em `vendas/prospeccao/<arquivo>`. Quer que eu rode o `/diagnostico-loja` nas 3 primeiras?"

---

## Regras

- **Só dado público de empresa.** Nome, endereço, telefone comercial, redes da loja. Nada de dado pessoal do dono (CPF, telefone pessoal, endereço residencial) — LGPD.
- **Nunca inventar número.** Avaliação, seguidor, data de post: ou foi visto, ou é "não encontrado".
- **Gancho verificável.** O lojista vai conferir. Se o gancho estiver errado, a abordagem morre.
- **Qualidade > quantidade.** 10 lojas com gancho forte valem mais que 50 com "pode melhorar o Instagram".
- **Não abordar ninguém.** A skill só monta a lista. Mandar mensagem é decisão do usuário.
