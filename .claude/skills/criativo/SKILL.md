---
name: criativo
description: >
  Cria e edita anúncios animados verticais (1080x1920, 30 fps, 15 s em 4 cenas) com o Creative
  Engine do ZL_IA: um projeto em JSON que o Claude monta por comandos e que também abre num editor
  web pra ajustar à mão. Roteiro em batidas, marca da loja, textos, fotos, formas e logo, entradas,
  saídas e transições, crítica por regras, variações e exportação em MP4. Use quando o usuário pedir
  "criativo", "anúncio animado", "anúncio em vídeo", "motion", "abrir no editor", "variações do
  anúncio", "crítica do criativo", ou /criativo. Pra reels com legenda animada, música ou lote por
  planilha, usar /video-reels.
---

# /criativo — Anúncio animado que também abre no editor

O Creative Engine (`creative-engine/`) guarda a peça num arquivo só, o `project.mazy.json`. O Claude
cria e altera esse arquivo por comandos; o usuário abre o mesmo arquivo no editor web e ajusta à
mão. Esta skill é a **direção criativa**: o que o anúncio diz, em que ordem, com que cara. A parte
técnica é da CLI.

## Quando é esta skill e quando é a /video-reels

| Pedido | Skill |
|---|---|
| Anúncio que o usuário vai querer ajustar à mão, variar ou reaproveitar | `/criativo` |
| Peça só com texto, foto, forma e logo, sem trilha | `/criativo` |
| Reels com legenda palavra a palavra, música ou narração | `/video-reels` |
| Um vídeo por produto a partir de uma planilha | `/video-reels` |
| Vídeo bruto do `/video-ia` como fundo | `/video-reels` (o formato 1.0 daqui não tem camada de vídeo) |

## Dependências

- **Node 22** (`node -v`) e, pra exportar, **FFmpeg**. A CLI avisa o que falta e sai com código 3
- **Motor instalado** (uma vez): `npm --prefix creative-engine install`
- **Marca:** `clientes/<Nome>/marca/marca.json` do `/identidade-loja`. Sem ela, rodar o `/identidade-loja` antes. Criativo do próprio negócio: `identidade/design-guide.md`
- **Tom de voz:** `_memoria/preferencias.md`
- **Material:** fotos reais da loja (originais ou do `/foto-produto`) e o logo em arquivo
- **Saída:** `clientes/<Nome>/criativos/<slug>/` ou `marketing/criativos/<slug>/` (próprio negócio). As duas ficam só neste computador
- **Referência dos comandos:** `referencia.md`, nesta pasta

A CLI é sempre:

```bash
node creative-engine/cli/mazy-creative.js <comando> <pasta-do-projeto> [opções] --source claude
```

`--source claude` vai em todo comando que grava: é o que registra no histórico quem mexeu.

---

## Workflow

### Passo 1 — Roteiro (antes de qualquer comando)

Escrever as batidas, com tempo e o que aparece. O modelo tem 4 cenas e 15 s:

```
0,0–3,2 s   GANCHO    "Óculos novos ainda hoje."        (foto do resultado, já no quadro 0)
2,8–7,2 s   PRODUTO   Armação + lentes em 1 hora        (foto do produto)
6,8–11,2 s  OFERTA    20% OFF · só até sexta            (número grande na cor da marca)
10,8–15 s   CHAMADA   Chama no WhatsApp                 (logo + uma ação só)
```

Regras do roteiro:
- **O quadro 0 é o gancho:** resultado, rosto ou frase forte. Nunca logo abrindo, nunca tela vazia
- **Uma ideia por cena.** Muita gente assiste sem som: o texto conta a história sozinho
- **Até ~5 palavras por linha** em fonte grande. Cortar palavra, não diminuir a fonte. Nada abaixo de 28 px
- **A última cena tem uma ação só**, concreta: "Chama no WhatsApp", "Passa na loja". Nunca "saiba mais"
- **Produto real:** foto da própria loja. IA só no cenário
- **Preço e prazo conferidos com o dono** antes de exportar

**CHECKPOINT:** mostrar o roteiro e esperar aprovação.

### Passo 2 — Criar o projeto

```bash
node creative-engine/cli/mazy-creative.js new clientes/<Nome>/criativos/<slug> --name "<nome da peça>" --client <slug-do-cliente> --brand clientes/<Nome>/marca/marca.json --source claude
```

`--client` é um slug (minúsculas e hífen), não o nome de exibição. O comando importa cores, fontes
e logo e lista o que a marca não trouxe. Se faltar o arquivo da fonte, pedir ao usuário ou avisar
que o render vai depender da fonte instalada.

Trazer cada foto pro projeto (o arquivo é copiado pra `assets/`):

```bash
node creative-engine/cli/mazy-creative.js asset-add <pasta> <arquivo> --id foto-produto --provenance client --source claude
```

### Passo 3 — Montar as cenas por comandos

Escrever os comandos num arquivo (`<pasta>/ops.json`) e aplicar. Tudo ou nada: se um comando for
recusado, o projeto fica como estava e a resposta diz qual e por quê.

```bash
node creative-engine/cli/mazy-creative.js apply <pasta> --ops <pasta>/ops.json --dry-run
```

```bash
node creative-engine/cli/mazy-creative.js apply <pasta> --ops <pasta>/ops.json --label "cenas do roteiro" --source claude
```

Medidas do 9:16 (1080×1920), já no modelo como `safeArea`:
- **Nada nos 168 px de cima** nem **abaixo de 1330 px** (barra e botões do aplicativo)
- Texto e produto entre 168 e 1330 de altura, com 64 px de margem dos lados
- Cor sempre pela marca (`brand.accent`, `brand.text`, `brand.background`, `brand.darkBase`) ou branco

Pra saber o que existe (animações, transições, curvas, comandos): `catalog`. Pra ver como o projeto
ficou sem ler o JSON inteiro: `inspect <pasta>`. Exemplos de comando: `referencia.md`.

**Pedido grande:** escrever o `ops.json`, rodar com `--dry-run`, mostrar o resumo e só então aplicar.

### Passo 4 — Olhar e criticar (obrigatório antes de exportar)

```bash
node creative-engine/cli/mazy-creative.js critique <pasta>
```

```bash
node creative-engine/cli/mazy-creative.js contact-sheet <pasta>
```

1. **Regras:** corrigir todo `✗` (crítico) e `!` (aviso) da crítica. Texto que não cabe na caixa, contraste baixo, gancho fora do quadro 0 e falta de chamada aparecem aqui
2. **Olhar:** abrir a folha de contato (`renders/folha-de-contato.png`) e julgar o que regra não mede:
   - O texto sobre foto dá pra ler? (a crítica marca `CONTRAST_NOT_MEASURED` nesses)
   - Cada cena tem um ponto de atenção só? O olho sabe pra onde ir?
   - A foto está bem cortada? O produto aparece inteiro?
   - Parece a marca da loja, ou parece modelo?
   - Lendo só os textos, na ordem, a oferta fica clara?
3. Gravar o resultado em `<pasta>/critica.md`, em duas partes: **Regras** (a saída do `critique`) e **Olhar** (o que foi visto e o que mudou por causa disso)

Pra ver um quadro específico: `frame <pasta> --at <quadro>`.

**CHECKPOINT:** mostrar a folha de contato e esperar aprovação.

### Passo 5 — Ajuste à mão (se o usuário quiser)

```bash
node creative-engine/cli/mazy-creative.js edit <pasta>
```

Abre o editor no navegador (palco, timeline, inspector, assets, histórico). O editor grava sozinho.
Se o Claude gravar enquanto o editor está aberto, o editor recarrega; se os dois mexeram ao mesmo
tempo, o editor pergunta qual fica. Depois que o usuário mexer, **reler com `inspect`** antes de
qualquer novo comando.

### Passo 6 — Variações (opcional)

```bash
node creative-engine/cli/mazy-creative.js variations <pasta> --axis entrada --count 3
```

Eixos: `entrada` (como as coisas aparecem) e `ritmo` (animações mais curtas ou mais longas). Cada
variante vira um projeto irmão em `<pasta>/variantes/<id>/`, com a lista do que mudou. Texto
alternativo (título A e B) é com o Claude: copiar a pasta e aplicar um `layer.update`.

### Passo 7 — Exportar e entregar

```bash
node creative-engine/cli/mazy-creative.js render <pasta>
```

O comando confere o MP4 (medidas, taxa, número de quadros, codec) antes de dizer que terminou. O
anúncio de 15 s leva cerca de um minuto. Rascunho rápido: `--crf 28` ou `--range 0-89`.

Guardar uma versão com nome quando o cliente aprovar:

```bash
node creative-engine/cli/mazy-creative.js version <pasta> --label "aprovada pelo cliente" --source claude
```

Salvar ao lado do projeto: `roteiro.md` (o roteiro aprovado) e `legenda.md` (legenda do post no tom
da marca: gancho, chamada e 3 a 5 hashtags locais). Mostrar no chat o caminho do MP4, a duração e a
legenda.

---

## Editar o JSON direto

O caminho normal é o `apply`. Se for mesmo preciso editar o `project.mazy.json` à mão:

1. `checkpoint <pasta> --label "antes de editar à mão" --source claude`
2. editar
3. `validate <pasta>`
4. se a validação falhar e não der pra corrigir: `rollback <pasta>`

Nunca deixar o arquivo inválido: o editor e o render recusam.

## Desfazer

`history <pasta>` lista os pontos guardados. Todo `apply` guarda um antes de gravar e diz o id.
`rollback <pasta> --to <id>` volta, e guarda antes o estado atual: dá pra desfazer o desfazer.

---

## Regras

- **Roteiro aprovado antes de montar; folha de contato aprovada antes de exportar.**
- **Gancho no quadro 0, chamada na última cena.**
- **Área segura sempre.** Texto embaixo da barra ou dos botões do aplicativo some.
- **Só cor e fonte da marca.** A crítica aponta o que fugir.
- **Produto real**, de foto real. Preço e prazo conferidos com o dono.
- **Toda gravação com `--source claude`.**
- **Nada de cliente fora da pasta do cliente.** O projeto, as fotos e o MP4 ficam em `clientes/<Nome>/criativos/` ou `marketing/criativos/`, que não vão pro GitHub.
- **Não publicar.** A skill entrega o MP4 e a legenda; quem posta é o usuário.
