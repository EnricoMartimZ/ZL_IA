---
name: funil
description: >
  Painel de vendas do serviço: todas as lojas em uma tabela só (vendas/funil.md), em que etapa
  cada uma está, valor em jogo, e — o mais importante — quem precisa de follow-up hoje, com a
  mensagem pronta. Também move lojas de etapa ("<loja> respondeu", "fechou com X").
  Use quando o usuário perguntar "como tá o funil", "quem eu preciso chamar hoje", "follow-up",
  "pipeline", "status das lojas", "fulano respondeu", "fechou com", "perdi a loja X", ou /funil.
---

# /funil — Painel de vendas e follow-up do dia

Uma única fonte da verdade pro processo de venda. As outras skills de venda escrevem aqui; o `/funil` lê, organiza e diz o que fazer hoje. Venda de serviço se perde por falta de follow-up, não por proposta ruim.

## Dependências

- **Funil:** `vendas/funil.md` (criar no formato abaixo se não existir)
- **Origens:** `vendas/prospeccao/`, `vendas/diagnosticos/`, `vendas/propostas/`, `clientes/`
- **Tom de voz:** `_memoria/preferencias.md` (mensagens de follow-up)
- **Aprendizados:** `_memoria/vendas-aprendizados.md` se existir (cadência e mensagens que funcionaram)

---

## Formato de `vendas/funil.md`

```markdown
# Funil de vendas

> Atualizado em YYYY-MM-DD. Editado pelas skills de venda e pelo /funil.

| Loja | Nicho | Cidade | Etapa | Valor/mês | Último contato | Próximo passo | Data próx. passo | Notas |
|---|---|---|---|---|---|---|---|---|
| <nome da loja> | pet shop | <cidade> | proposta enviada | 990 | 2026-10-20 | cobrar resposta da proposta | 2026-10-23 | dono prefere WhatsApp à tarde |
```

Datas sempre `YYYY-MM-DD`. `Valor/mês` vazio até existir proposta.

### Etapas (em ordem)

| Etapa | Quando | Próximo passo padrão |
|---|---|---|
| a abordar | saiu do `/prospectar-lojas` | primeira mensagem — hoje |
| abordada | mandou a primeira mensagem | follow-up em 2 dias |
| respondeu | lojista respondeu | mandar diagnóstico ou marcar conversa — hoje |
| diagnóstico pronto | `/diagnostico-loja` gerou o PDF | enviar — hoje |
| diagnóstico enviado | mandou o PDF | perguntar o que achou em 2 dias |
| reunião | conversa marcada ou feita | proposta em até 1 dia após a reunião |
| proposta enviada | `/proposta-servico` | cobrar em 3 dias |
| negociando | pediu ajuste, desconto, prazo | responder em 1 dia |
| fechou | aceitou | `/novo-projeto` + onboarding — hoje |
| perdeu | disse não | `/aprendizado` — registrar motivo |
| sem resposta | 3 follow-ups sem retorno | reabrir em 60 dias |

## Workflow

### Modo 1 — Painel (`/funil` sem argumento)

1. Ler `vendas/funil.md`. Se não existir, montar a partir das pastas de origem (cada diagnóstico/proposta/cliente vira uma linha na etapa correspondente) e mostrar pro usuário antes de salvar.
2. Varrer as pastas de origem atrás de lojas que não estão no funil e oferecer adicionar.
3. Mostrar, nessa ordem:

```
FOLLOW-UP HOJE (N)
1. <loja> — proposta enviada há 4 dias → cobrar resposta
   Mensagem: "Oi, Carla! Conseguiu olhar a proposta? Se o Crescimento ficou acima do que
   vocês pensavam, dá pra começar pelo Essencial e subir depois."
2. ...

ATRASADOS (data do próximo passo já passou) — mesmo formato, mais antigos primeiro

RESUMO
a abordar 12 · abordada 5 · respondeu 2 · diagnóstico enviado 3 · proposta enviada 2 · negociando 1
Em proposta/negociação: R$ 2.970/mês · Fechados no mês: 1 (R$ 990/mês)
Taxa abordada → respondeu: 18% · proposta → fechou: 1 de 3
```

4. Uma mensagem pronta por follow-up, no tom de `_memoria/preferencias.md`, usando as `Notas` da linha. Cada follow-up traz algo novo (um dado, uma ideia, uma saída mais barata), nunca só "e aí, viu minha mensagem?".

### Modo 2 — Atualizar (`/funil <loja> <o que aconteceu>`)

Exemplos: `/funil <loja> respondeu, quer ver o diagnóstico`, `/funil <loja> fechou Crescimento`, `/funil <loja> perdeu, achou caro`.

1. Achar a linha (busca aproximada pelo nome). Se não existir, criar.
2. Mudar a etapa, `Último contato` = hoje, `Próximo passo` e `Data próx. passo` pela tabela de etapas, e anotar o que aconteceu em `Notas`.
3. Contar follow-ups sem resposta pelas notas: no terceiro, mover pra **sem resposta**.
4. Mostrar a linha antes e depois.
5. Se virou **fechou**: sugerir `/novo-projeto` pra criar a pasta do cliente e chamar `/aprendizado` pra registrar o que fez fechar.
6. Se virou **perdeu**: chamar `/aprendizado` pra registrar o motivo (o motivo de perda é a informação mais valiosa do funil).

---

## Regras

- **`vendas/funil.md` é a fonte da verdade.** As planilhas de prospecção são histórico; status vale o que está no funil.
- **Toda linha tem próximo passo com data**, exceto `fechou` e `perdeu`. Linha sem próximo passo é venda esquecida.
- **Não reescrever a tabela inteira** ao atualizar uma loja — editar só a linha.
- **Não enviar nada.** O `/funil` escreve as mensagens; quem manda é o usuário.
- **Números do resumo vêm da tabela.** Sem dado suficiente pra uma taxa (menos de 5 lojas na etapa), mostrar o número absoluto, não percentual.
