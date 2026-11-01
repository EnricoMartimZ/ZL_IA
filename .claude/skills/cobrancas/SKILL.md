---
name: cobrancas
description: >
  Controla o dinheiro que os clientes devem: parcelas e mensalidades em uma tabela só (vendas/cobrancas.md), o que
  vence hoje e na semana, o que atrasou, quanto entra no mês, e a mensagem de lembrete pronta pra aprovar.
  Também dá baixa em pagamento. Use sempre que o usuário perguntar "quem me deve", "quem paga essa semana",
  "quanto entra esse mês", "a loja pagou", "caiu o Pix", "cobrar a parcela", "mensalidade atrasada", ou
  /cobrancas, e ao fechar contrato ou concluir uma entrega que libera parcela.
---

# /cobrancas — Quem paga, quanto e quando

Quem presta serviço sozinho perde dinheiro por esquecimento, não por calote. Esta tabela é a fonte da verdade do que entra: o usuário olha uma vez e sabe quem cobrar hoje.

## Dependências

- **Tabela:** `vendas/cobrancas.md` (local; criar no formato abaixo se não existir)
- **Combinado:** `clientes/<Nome>/contrato/` e `clientes/<Nome>/entrada.md`
- **Pix:** seção "Dados do contratado" de `_memoria/empresa.md`
- **Tom de voz:** `_memoria/preferencias.md`

---

## Formato de `vendas/cobrancas.md`

```markdown
# Cobranças

## Parcelas
| Cliente | O quê | Valor | Vence | Status | Pago em | Notas |
|---|---|---|---|---|---|---|

## Mensais
| Cliente | O quê | Valor | Dia | Desde | Status | Último mês pago | Notas |
|---|---|---|---|---|---|---|---|
```

- **Status de parcela:** `a vencer` · `na entrega` (sem data, vence quando a entrega fechar) · `a confirmar` (a data passou e não se sabe se pagou) · `pago` · `cancelada`
- **Status de mensal:** `aguardando início` · `ativo` · `pausado` · `cancelado`
- **Atrasado não é status:** calcular pela data de hoje, pra tabela nunca ficar desatualizada

## Workflow

### Painel (pedido geral)

Calcular pela data de hoje e mostrar:

```
ATRASADO
- <cliente> · <o quê> · R$ X · venceu há N dias → <mensagem proposta>

HOJE E ESTA SEMANA
- <cliente> · <o quê> · R$ X · <data>

A CONFIRMAR
- <cliente> · <o quê>: já pagou?

Mês: R$ X previsto · R$ Y recebido · R$ Z em aberto
Na entrega (sem data): R$ W
```

Só o que precisa de ação. Mensal entra no mês a partir de `Desde` e sai quando o `Último mês pago` já cobre o mês.

### Dar baixa ("<cliente> pagou")

Conferir qual parcela ou mensalidade é. Se o valor não bater com o combinado, perguntar antes de marcar. Marcar `pago` com a data, ou atualizar `Último mês pago`, e dizer o que falta daquele cliente. Nunca dar baixa por dedução: só com a confirmação do usuário de que o dinheiro entrou.

### Lançar

- **Contrato novo:** uma linha por parcela, com a data de cada uma, e o mensal como `aguardando início`
- **Entrega concluída:** parcela `na entrega` vira `a vencer` com a data de hoje; mensal vira `ativo`, com `Desde` no mês seguinte, conforme o contrato

### Cobrar

| Quando | Mensagem |
|---|---|
| 1 dia antes | Lembrete leve, com o valor e a chave Pix |
| 1 dia depois | "Vi que ainda não caiu, deu certo por aí?" Pode ter sido esquecimento |
| 7 dias depois | Direta e educada, perguntando quando consegue pagar |
| 15 dias depois (mensal) | Avisar que, pelo contrato, o serviço pausa até o pagamento. Antes de pausar, o usuário decide |

Cada mensagem é um rascunho: o envio é aprovado pelo usuário no chat, uma a uma. Uma conversa por cobrança, sem repetir no mesmo dia. Multa e juros existem no contrato, mas só entram se o usuário mandar.

## Regras

- **Dado financeiro é local.** Esta tabela fica em `vendas/`, fora do GitHub, e nenhum exemplo real vai pra skill.
- **Sem constrangimento.** Nada de ameaça, de expor o cliente ou de falar com terceiros sobre a dívida. Quem cobra é o usuário, com respeito: o cliente pequeno costuma atrasar por aperto, e quase sempre continua cliente.
- **Não misturar com venda.** Cobrança não leva oferta junto.
- **Combinado mudou?** Anotar em `Notas` com a data, em vez de apagar a linha.
