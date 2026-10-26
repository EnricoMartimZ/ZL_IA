---
name: proposta-servico
description: >
  Monta a proposta comercial do serviço de IA pra uma loja, em cima do diagnóstico dela: três
  pacotes (Essencial, Crescimento, Completo) com escopo, prazo, preço e retorno estimado, mais
  próximos passos e condições. Sai em HTML + PDF com a sua identidade visual e uma mensagem de
  envio. Na primeira vez, entrevista o usuário e cria `_memoria/servicos.md` com o catálogo e os preços.
  Use quando o usuário pedir "proposta pra loja X", "montar proposta", "orçamento", "quanto cobrar
  da loja X", "fechar com a loja X", ou /proposta-servico.
---

# /proposta-servico — Proposta comercial com três pacotes

Transforma o diagnóstico em decisão. A proposta não explica o que é IA — mostra os problemas que o dono já viu no diagnóstico, o que cada pacote resolve, e quanto volta.

## Dependências

- **Contexto:** `_memoria/empresa.md`, `_memoria/preferencias.md`
- **Catálogo e preços:** `_memoria/servicos.md` (criado no Passo 0 se não existir)
- **Diagnóstico:** `vendas/diagnosticos/<slug-loja>/dados.md` e o PDF (se não existir, avisar e oferecer rodar `/diagnostico-loja` antes)
- **Visual:** `identidade/design-guide.md`
- **Render:** Playwright pra HTML → PDF (mesmo do `/diagnostico-loja`)

---

## Como rodar

```
/proposta-servico <nome da loja>
/proposta-servico <loja> — ele falou que o orçamento é até R$ 1.500/mês
```

Qualquer informação da conversa com o lojista (orçamento, prioridade, objeção) vem junto no comando ou é perguntada.

## Workflow

### Passo 0 — Catálogo de serviços (só na primeira vez)

Se `_memoria/servicos.md` não existe, entrevistar uma pergunta por vez:

1. "Quais serviços você entrega hoje ou quer vender? (ex: resposta de avaliações, gestão de Google Meu Negócio, conteúdo/carrossel, descrições de produto, anúncios, atendimento com IA no WhatsApp, relatório mensal)"
2. "Quanto tempo cada um te toma por mês, por loja?"
3. "Quanto você quer ganhar por hora, no mínimo?"
4. "Quais ferramentas pagas cada serviço usa? (valor mensal)"
5. "Cobra setup (implantação) separado? Fidelidade mínima?"

Montar `_memoria/servicos.md`:

```markdown
# Serviços

| Serviço | Entrega mensal | Horas/mês | Custo ferramentas | Preço base/mês |
|---|---|---|---|---|

## Pacotes
- **Essencial:** [serviços] — R$ X/mês
- **Crescimento:** [serviços] — R$ Y/mês
- **Completo:** [serviços] — R$ Z/mês

## Condições
- Setup: R$ ...
- Fidelidade mínima: ... meses
- Forma de pagamento: ...
```

Preço base = (horas × valor/hora + ferramentas) × margem. Mostrar a conta e pedir aprovação antes de salvar.

### Passo 1 — Ler o diagnóstico

De `dados.md`: os pontos de perda, a faixa de perda estimada, o porte da loja, a capacidade de pagar. Se o usuário trouxe informação da conversa (orçamento, o que mais incomoda o dono), isso tem prioridade.

### Passo 2 — Montar os três pacotes

Partir dos pacotes de `_memoria/servicos.md` e **ajustar à loja**:

- Cada pacote ataca pontos de perda do diagnóstico, citados pelo nome ("resolve o ponto 1 e 2 do diagnóstico")
- **Essencial:** resolve o problema mais doloroso. Preço de entrada fácil de aceitar
- **Crescimento:** o recomendado — marcado como "mais escolhido". Resolve os 3 principais pontos
- **Completo:** tudo + atendimento/escala. Serve de âncora pro Crescimento parecer razoável
- Se o lojista deu orçamento, o **Crescimento** deve caber nele ou ficar no máximo 20% acima

Pra cada pacote:
- O que está incluso (entregas mensais concretas: "30 respostas de avaliação", "8 carrosséis", "40 descrições de produto")
- O que **não** está incluso (evita briga depois)
- Prazo de implantação
- Preço mensal + setup

### Passo 3 — Retorno estimado

Por pacote, comparar com a perda estimada do diagnóstico:

```
Investimento: R$ 990/mês
Perda estimada que o pacote ataca: R$ 1.500 – R$ 2.500/mês
Recuperando um terço disso, o serviço se paga com ~X vendas a mais por mês (ticket médio R$ Y)
```

Formular como **ponto de equilíbrio** ("se paga com 9 vendas a mais por mês"), não como promessa de resultado. Nunca garantir faturamento.

### Passo 4 — Montar o documento

HTML em `vendas/propostas/<slug-loja>/proposta.html`, com `identidade/design-guide.md`. Estrutura:

```
[Logo]                                              Proposta · <loja> · <data> · válida por 15 dias

O que encontramos         3 pontos do diagnóstico, uma linha cada, com a faixa de perda
O que muda                o resultado em linguagem do dono (mais gente chegando pelo Google, etc.)

[Essencial]   [Crescimento ★ mais escolhido]   [Completo]
entregas · prazo · preço · se paga com N vendas

Como funciona             cronograma: semana 1 (acessos e setup), semana 2 ..., mês 1 (primeiro relatório)
O que preciso de vocês    acessos, fotos, 30 min de conversa inicial
Condições                 pagamento, fidelidade, cancelamento, setup

Próximo passo             "Responde qual pacote faz sentido que eu já agendo a implantação." + contato
```

Limite: 3 páginas A4.

### Passo 5 — Render e mensagem

- PDF: `vendas/propostas/<slug-loja>/proposta-<slug-loja>.pdf`
- Mensagem de envio no tom de `_memoria/preferencias.md`, curta, que puxa pra uma decisão ("Qual dos três faz mais sentido pra vocês agora?"), não pra "qualquer dúvida estou à disposição"
- Salvar `resumo.md` com pacotes, preços, data e validade (o `/relatorio-resultados` usa o pacote fechado como referência do que foi prometido)

### Passo 6 — Entrega

Mostrar no chat: os três pacotes em tabela, o caminho do PDF e a mensagem. Atualizar `Status` na planilha de prospecção pra "proposta enviada", se existir.

> "Quando ele fechar, roda `/novo-projeto` pra criar a pasta do cliente — e no fim do primeiro mês, `/relatorio-resultados`."

---

## Regras

- **Nunca prometer resultado garantido.** "Se paga com N vendas" sim; "vai aumentar 30% o faturamento" não.
- **Preço vem de `_memoria/servicos.md`.** Não inventar preço na hora. Se a loja pede desconto, ajustar escopo, não só baixar preço.
- **Escopo fechado.** Quantidades concretas e o que não está incluso. Proposta vaga gera cliente insatisfeito.
- **Três pacotes, sempre.** Um só vira "sim ou não"; três vira "qual".
- **Validade.** Toda proposta tem prazo (padrão 15 dias).
- **Não enviar nada.** A skill gera; quem manda é o usuário.
