---
name: menu
description: >
  Mostra o que o MazyOS sabe fazer, em linguagem normal e agrupado pelo objetivo (achar clientes, fechar a
  venda, entregar site, conteúdo, Google e anúncios, manter o cliente), com uma frase de exemplo pra cada
  coisa — e sugere o próximo passo olhando o funil e o foco atual. Use quando o usuário perguntar "o que você
  sabe fazer", "quais skills eu tenho", "esqueci o comando", "não lembro o nome", "me ajuda", "por onde eu
  começo", "o que eu faço agora/hoje", "menu", ou /menu.
---

# /menu — O que dá pra pedir

O usuário não precisa decorar comando nenhum: ele fala do jeito normal e a skill certa entra sozinha (o hook `.claude/hooks/gatilhos.mjs` aponta a skill a cada mensagem, pelo mapa em `.claude/gatilhos.json`). Este menu serve pra lembrar **o que existe** e **o que fazer agora**.

## Workflow

### 1. Montar o menu a partir do mapa

Ler `.claude/gatilhos.json` (é a fonte única: skill nova entra lá). Agrupar por `grupo`, na ordem em que aparecem, e mostrar cada skill numa linha só:

```
**Achar clientes**
- Empresas B2B com site ruim pra abordar — "acha metalúrgicas com site ruim em Sorocaba"
- Lojas do varejo pra oferecer o serviço — "prospecta pet shops em Campinas"
...
```

- A descrição vem de `quando`, encurtada pra caber numa linha. A frase vem do primeiro item de `exemplos`, entre aspas — é o que o usuário pode copiar e mandar
- Sem o nome técnico da skill na frente; no fim de cada grupo, uma linha discreta com os comandos (`/prospectar-b2b · /prospectar-lojas ...`) pra quem quiser usar direto
- Grupo "Organizar" por último e mais curto

### 2. Sugerir o próximo passo

Olhar, se existirem:
- `vendas/funil.md` → quem tem follow-up vencido ou pra hoje, propostas paradas há mais de 5 dias, demos enviadas sem resposta
- `_memoria/estrategia.md` → o foco atual
- `_memoria/vendas-aprendizados.md` → o nicho que mais converteu

Fechar com **até 3 sugestões concretas**, já na forma de frase que o usuário pode mandar:

> **Pra hoje:**
> 1. "Quem eu preciso chamar hoje?" — 2 follow-ups vencidos no funil
> 2. "Acha transportadoras com site ruim em Campinas" — é o nicho B2B que mais respondeu
> 3. "Monta a demo da metalúrgica" — ela pediu pra ver um exemplo

Sem funil ainda: sugerir começar por "acha empresas B2B com site ruim em <cidade>" ou "prospecta lojas em <cidade>".

## Regras

- Curto: o menu inteiro cabe numa tela. Nada de explicar como cada skill funciona por dentro
- Só sugerir o que existe no mapa. Skill que estiver em `.claude/skills/` mas faltar no `gatilhos.json`: listar no fim como "sem gatilho ainda" e oferecer adicionar
