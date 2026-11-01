---
name: estudo-de-caso
description: >
  Transforma um cliente atendido em prova pra vender: pede o depoimento na hora certa, monta o estudo de caso
  com números reais e antes e depois, e escreve o pedido de indicação. Use sempre que o usuário disser "pede
  um depoimento", "estudo de caso", "case do cliente", "mostrar o resultado no portfólio", "pedir indicação",
  "quem esse cliente pode indicar", ou /estudo-de-caso, e ao terminar uma entrega.
---

# /estudo-de-caso — Cliente satisfeito vira a próxima venda

Prospectar frio é caro. Um dono de loja acredita muito mais em outro dono de loja da mesma cidade do que em qualquer abordagem. Por isso cada entrega termina em três coisas: depoimento, caso e indicação.

## Dependências

- **Cliente:** `clientes/<Nome>/` (`entrada.md`, contrato, antes e depois) e `/relatorio-resultados`, se houver números
- **Saída:** `clientes/<Nome>/caso/` (local)
- **Tom de voz:** `_memoria/preferencias.md`
- **Depois:** `/carrossel`, `/site-premium` (portfólio), `/proposta-servico`

---

## Workflow

### Passo 1 — Escolher a hora

- **Depoimento:** logo depois da entrega, quando o cliente está contente
- **Caso com números:** depois de 30 a 60 dias, quando já há o que medir
- **Indicação:** depois de um elogio espontâneo ou de um resultado bom. Nunca junto de uma cobrança ou com problema aberto

Se `/cobrancas` mostrar atraso ou houver reclamação aberta, resolver primeiro.

### Passo 2 — Pedir o depoimento

Escrever uma mensagem curta que dê pouco trabalho. Em áudio é mais fácil pra quem não gosta de escrever:

1. Como era antes?
2. O que mudou depois?
3. Pra quem você indicaria?

Transcrever sem melhorar o que a pessoa disse. Só corrigir erro de digitação, e mostrar o texto final pra ela aprovar.

### Passo 3 — Montar o caso

`clientes/<Nome>/caso/caso.md`, curto:

```markdown
# <cliente>
Antes: <fato conferível, com print ou data>
O que foi feito: <3 itens>
Depois: <número real ou mudança visível, com período>
Na palavra do cliente: "<depoimento aprovado>"
```

**Só número real, com a fonte anotada.** Sem dado, contar o antes e depois visível (site, Google, Instagram). Melhora que coincidiu com outra causa não vira mérito do serviço.

Versões prontas, quando fizer sentido: carrossel (`/carrossel`), bloco de prova na proposta (`/proposta-servico`), mensagem curta pra abordar o mesmo ramo em outra cidade.

**Autorização:** antes de publicar, confirmar por escrito. O contrato costuma permitir mostrar o trabalho, mas nome, foto e depoimento pedem um ok específico. Número de faturamento só com pedido expresso do cliente.

### Passo 4 — Pedir indicação

Pedido específico funciona melhor que "conhece alguém?": citar um tipo de negócio que o cliente conhece, como fornecedor, vizinho ou parceiro.

- Registrar quem foi indicado em `vendas/funil.md`, com a origem nas notas: indicação entra pela conversa, não pelo lote
- A abordagem cita quem indicou, com a autorização de quem indicou
- Recompensa, se houver, é decisão do usuário e fica combinada antes
- **Não abordar concorrente direto de um cliente ativo**, nem por indicação

Mensagens aprovadas pelo usuário no chat antes de sair. Ao final, atualizar `/aprendizado` com o que mais pesou pro cliente.

## Regras

- **Casos ficam locais.** Nome, depoimento e número de cliente nunca entram em arquivo versionado.
- **Depoimento é da pessoa.** Nunca inventar, completar ou publicar sem aprovação.
