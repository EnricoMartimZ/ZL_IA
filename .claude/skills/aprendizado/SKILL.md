---
name: aprendizado
description: >
  Registra por que uma venda fechou ou foi perdida (e resultados marcantes de clientes) em
  `_memoria/vendas-aprendizados.md`, e a cada 5 registros sintetiza os padrões — quais nichos,
  ganchos, pontos de perda, pacotes e respostas a objeções funcionam. As skills de venda leem
  esse arquivo, então o sistema vende melhor a cada negócio. Use quando o usuário disser
  "fechei com", "perdi a loja", "ele disse não porque", "o que tenho aprendido", "o que funciona
  nas vendas", "registrar aprendizado", ou /aprendizado. Também chamada pelo /funil ao fechar ou perder.
---

# /aprendizado — Memória de vendas que melhora o sistema

Cada venda fechada ou perdida ensina alguma coisa. Sem registro, a lição some. Essa skill guarda o motivo em formato que as outras skills conseguem usar, e de tempos em tempos transforma registros soltos em regras.

## Dependências

- **Arquivo:** `_memoria/vendas-aprendizados.md` (criar no formato abaixo se não existir)
- **Contexto da loja:** linha em `vendas/funil.md`, diagnóstico em `vendas/diagnosticos/<slug>/`, proposta em `vendas/propostas/<slug>/`
- **Quem lê depois:** `/prospectar-lojas`, `/diagnostico-loja`, `/proposta-servico`, `/funil`

---

## Formato de `_memoria/vendas-aprendizados.md`

```markdown
# Aprendizados de vendas

> Registrado pelo /aprendizado. As skills de venda leem esse arquivo.

## O que funciona (síntese)

> Atualizado em YYYY-MM-DD a partir de N registros.

- **Nichos:** ...
- **Ganchos que geram resposta:** ...
- **Pontos de perda que mais pesam:** ...
- **Pacote que mais fecha / faixa de preço aceita:** ...
- **Objeções frequentes e a resposta que funcionou:** ...
- **O que evitar:** ...

## Registros

### YYYY-MM-DD — <Loja> — fechou | perdeu | resultado
- **Nicho / cidade:**
- **Gancho da abordagem:**
- **Etapa onde decidiu:**
- **Pacote / valor:**
- **Motivo (nas palavras do lojista):**
- **Objeções que apareceram e como respondi:**
- **O que faria diferente:**
```

## Workflow

### Passo 1 — Coletar

Puxar o que já existe (funil, diagnóstico, proposta) e perguntar só o que falta, **numa mensagem só**:

> "Pra registrar a [loja]: (1) qual foi o motivo, do jeito que ele falou? (2) apareceu alguma objeção — e o que você respondeu? (3) tem algo que você faria diferente?"

Se for **fechou**, perguntar também: "o que você acha que fez ele decidir — o diagnóstico, o preço, a conversa, a urgência?"

Se for **resultado** (vindo do `/relatorio-resultados`): qual entrega gerou o resultado, número antes e depois, nicho.

### Passo 2 — Registrar

Adicionar o registro no topo da seção `## Registros` (mais recente primeiro). Motivo nas palavras do lojista entre aspas quando possível — "achou caro" e "não viu valor" são aprendizados diferentes.

Mostrar o registro pro usuário antes de salvar.

### Passo 3 — Sintetizar (a cada 5 registros novos, ou quando pedido)

Contar registros desde a última data da síntese. A partir de 5 novos, reescrever **só** a seção `## O que funciona (síntese)`:

- Padrões que aparecem em **pelo menos 2** registros. Um caso isolado é anedota, não regra
- Sempre com contagem: "pet shops: 3 de 4 propostas fecharam" — nunca "pet shops convertem bem"
- Separar o que é forte (vários casos) do que ainda é hipótese
- Incluir o que **não** funciona — tão útil quanto o que funciona

Mostrar o antes e depois da síntese e pedir aprovação.

### Passo 4 — Sugerir ajustes nas skills

Se a síntese mostrar algo que muda o comportamento de uma skill (ex: "lojas sem Instagram nunca fecham" → `/prospectar-lojas` deveria descartar ou pontuar menos), propor a mudança concreta no `SKILL.md` correspondente, com o trecho antes e depois. Só editar com aprovação.

### Modo consulta — `/aprendizado` sem loja

Mostrar a síntese atual, quantos registros existem, taxa de fechamento por nicho e as 3 lições mais fortes. Se houver 5+ registros desde a última síntese, oferecer sintetizar.

---

## Regras

- **Motivo real, não desculpa.** "Não tinha orçamento" muitas vezes é "não vi valor". Se o contexto sugerir isso, perguntar.
- **Perda vale tanto quanto ganho.** Não pular registro de venda perdida.
- **Síntese só com evidência.** Mínimo 2 casos pra virar padrão; sempre com contagem.
- **Não editar skills sozinho.** Propor a mudança; editar só com aprovação.
- **Sem dado pessoal sensível** do lojista. Nome da loja e do contato comercial bastam.
