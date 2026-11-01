---
name: negociar
description: >
  Conduz a conversa com quem respondeu e ainda não fechou: lê a conversa, identifica a objeção real, registra
  por escrito o que foi oferecido, propõe a saída (reduzir o escopo em vez de baixar o preço) e deixa a próxima
  mensagem pronta, com a data certa de mandar. Use sempre que o usuário colar uma conversa com um lead ou disser
  "ele achou caro", "disse que vai ver", "sumiu depois que respondeu", "como eu respondo isso", "quer
  desconto", "vai falar com a esposa", "negociar", ou /negociar, mesmo sem pedir a mensagem.
---

# /negociar — Do "respondeu" ao "fechou"

Lead que respondeu é o bem mais caro do funil: custou dezenas de abordagens. A venda costuma morrer aqui por três motivos: pressa demais, oferta que só muda de preço e o combinado que ninguém escreveu. Esta skill cuida dos três.

## Dependências

- **A conversa:** colada no chat, ou lida no WhatsApp Web com o Claude in Chrome (só ler)
- **Funil:** `vendas/funil.md` · **Preços:** `_memoria/servicos.md` · **Aprendizados:** `_memoria/vendas-aprendizados.md`, se existir
- **Registro:** `vendas/propostas/<slug>/negociacao.md` (local)
- **Depois:** `/contrato`, `/aprendizado`

---

## Workflow

### Passo 1 — Registrar o que aconteceu

Criar ou atualizar `negociacao.md`:

```markdown
# Negociação: <loja>

Quem decide: <nome e papel> · Canal preferido: <texto, áudio, ligação>
Valores já passados: <o quê e quanto>
Oferecido e recusado: <lista com data>
Objeção real: <ver Passo 2>
Última mensagem: <de quem, quando>
Próximo passo: <o quê, em que data>
```

**Valor passado em áudio ou ligação não existe por escrito.** Se não souber o número, perguntar ao usuário antes de sugerir qualquer coisa: a próxima oferta depende disso.

### Passo 2 — Achar a objeção real

| O que disseram | O que costuma ser | O que fazer |
|---|---|---|
| "Tá caro" | Não vê retorno, ou a verba é menor mesmo | Perguntar o que eles esperam resolver e voltar com escopo menor |
| "Somos pequenos" | Verba curta de verdade | Oferta de entrada, parcelada, que cabe hoje e cresce depois |
| "Vou ver e te aviso" | Educação; decisão adiada | Respeitar, dar um motivo pra voltar e uma data. Não insistir |
| "Vou falar com meu sócio ou minha esposa" | Decisão dividida | Dar um resumo de 3 linhas pra pessoa repassar |
| "Já tenho alguém" ou "já tenho site" | Sem dor clara | Mostrar um fato conferível que falta no que eles têm |
| "Agora não" | Momento | Perguntar quando faz sentido e anotar a data |
| Pediu preço na primeira mensagem | Curiosidade | Entender o que precisa antes de falar número, em uma pergunta |
| Sumiu depois do interesse | Esqueceu ou esfriou | Uma mensagem com algo novo no prazo certo |

Quando houver dúvida entre duas leituras, a primeira mensagem é uma pergunta aberta, não uma oferta.

### Passo 3 — Montar a saída

**Muda o escopo, não o preço do mesmo pacote.** Desconto sem contrapartida ensina que o primeiro preço era falso. A escada, nesta ordem:

1. Parcelar o mesmo valor
2. Tirar item: do Crescimento pro Essencial, do site premium pro site simples, do site pra página simples com Google
3. Começar por um pedaço e combinar o resto pra depois
4. Trocar desconto por algo que vale (depoimento, indicação, autorização pra mostrar o caso)

O piso é a conta de `_memoria/servicos.md` (horas × valor da hora). Abaixo disso, ou em qualquer preço novo, a decisão é do usuário: a skill mostra a conta e pergunta. Oferta aprovada entra no `negociacao.md`.

### Passo 4 — Escrever a próxima mensagem

Curta, no tom do usuário, com **uma coisa só**: uma pergunta ou uma oferta. Se a pessoa prefere áudio, dar um roteiro de 30 segundos e, depois do áudio, um resumo escrito com valor e o que entra.

**Quando mandar:**

- **A última mensagem foi nossa? Esperar.** Duas mensagens sem resposta no mesmo dia, ou um "Oi?", transformam interesse em cobrança
- Quem disse que avisa: esperar o prazo de follow-up da regra do negócio (hoje, 7 dias) e mandar uma vez, com fato novo
- Quem pediu algo: responder no mesmo dia
- Sem resposta depois do follow-up: parar e deixar a porta aberta

Nada é enviado sem a aprovação do usuário no chat.

### Passo 5 — Amarrar

Atualizar `vendas/funil.md` (etapa, próximo passo com data) e `vendas/ESTADO.md`.

- **Disse sim:** resumo do combinado por escrito na mesma conversa, depois `/contrato`
- **Disse não:** `/aprendizado` com o motivo real; quem pediu pra parar nunca mais recebe mensagem

## Regras

- **Demo só com sinal real.** Prévia é trabalho: só depois de um sim a uma conversa, não pra convencer quem esfriou.
- **Nada de pressão falsa.** Sem "só hoje" ou vaga inventada. Validade de proposta vale se for real.
- **Sem falar mal de concorrente.** Mostrar o fato, deixar a pessoa concluir.
- **Exemplo real fica local.** Nenhum nome de loja neste arquivo: ele vai pro GitHub.
