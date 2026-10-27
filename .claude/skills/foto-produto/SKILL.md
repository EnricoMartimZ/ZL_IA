---
name: foto-produto
description: >
  Transforma fotos de celular de produtos de uma loja em fotos profissionais com IA — fundo de
  catálogo, cena lifestyle, versão sazonal (Black Friday, Natal, Dia das Mães) — mantendo o produto
  idêntico. Funciona em lote (um catálogo inteiro), em proporções pra feed, story, marketplace e site.
  Usa o MCP do Higgsfield se estiver conectado, senão o kie.ai (scripts/kie.js), o mesmo motor do
  Open Higgsfield AI. Use quando o usuário pedir "foto de produto", "melhorar as fotos da loja",
  "foto profissional", "trocar o fundo", "foto pro catálogo", "foto pro marketplace",
  "foto lifestyle", "fotos com IA", ou /foto-produto.
---

# /foto-produto — Fotos profissionais de produto com IA

Uma das entregas mais fáceis de vender pra loja: o dono manda a foto torta do celular e recebe foto de catálogo. É visível, rápido e o antes/depois vende sozinho (vira prova no `/diagnostico-loja` e no `/relatorio-resultados`).

## Dependências

- **Cliente:** pasta `clientes/<Nome>/` (se for pra um cliente) — fotos originais em `clientes/<Nome>/fotos/originais/`
- **Visual:** `identidade/design-guide.md` da loja (no `CLAUDE.md` do cliente, se houver) — cores pra fundo e cenário
- **Gerador (um dos dois):**
  - MCP do Higgsfield conectado (ferramentas `generate_image`, `media_upload`) — usar primeiro se estiver disponível
  - `scripts/kie.js` com `KIE_API_KEY` no `.env`
- **Modelos e vocabulário de câmera:** `modelos.md` nesta pasta

---

## Como rodar

```
/foto-produto <loja> — as 12 fotos em clientes/<Nome>/fotos/originais, fundo branco pro catálogo
/foto-produto essa foto do tênis, versão lifestyle pra feed
/foto-produto Black Friday pras 5 mais vendidas da ótica
```

## Workflow

### Passo 1 — Entender o pedido

Definir, perguntando só o que faltar:

| Ponto | Opções |
|---|---|
| Estilo | **catálogo** (fundo neutro, produto inteiro) · **lifestyle** (produto em uso, cenário) · **sazonal** (data comemorativa) · **detalhe** (textura, acabamento) |
| Destino | feed `4:5` · catálogo/marketplace `1:1` · story/reels `9:16` · site/banner `16:9` |
| Quantidade | uma foto ou o lote todo |

Marketplace (Mercado Livre, Shopee, Amazon) exige fundo **branco puro** e produto ocupando ~85% da imagem: avisar e seguir isso.

### Passo 2 — Conferir as originais

Abrir cada foto original e checar: produto inteiro no quadro, foco, rótulo legível. Foto ruim demais (desfocada, cortada, escura a ponto de sumir detalhe) → pedir outra. A IA melhora a foto, não inventa o que não aparece.

### Passo 3 — Prompt

Montar em inglês, nesta ordem:

```
<o produto exatamente como na referência: tipo, cor, material, marca visível>,
<cenário do estilo escolhido>,
shot on a <câmera>, <lente>, <perspectiva>, <profundidade>,
<luz>, professional product photography, ultra-detailed.
Keep the product identical to the reference image: same shape, colors, label, text and proportions.
```

Receitas de câmera em `modelos.md`. Cenário lifestyle e sazonal: usar as cores do design-guide da loja e o público dela (`_memoria/empresa.md` do cliente).

**Sempre** terminar com a frase de manter o produto idêntico.

### Passo 4 — Testar com uma foto antes do lote

Gerar **uma** foto, mostrar pro usuário ao lado da original. Só rodar o lote depois da aprovação do estilo — gerar 30 fotos num estilo que o cliente não quer é dinheiro jogado fora.

**Com Higgsfield MCP:** subir a original (`media_upload`) e gerar com `generate_image` usando a imagem como referência, mesmo prompt e proporção.

**Com kie.ai:**

```bash
node --env-file=.env scripts/kie.js nano-banana-2 --input '{
  "prompt": "<prompt>",
  "image_input": ["@clientes/<Nome>/fotos/originais/<foto>.jpg"],
  "aspect_ratio": "1:1", "resolution": "2K", "output_format": "jpg"
}' --out clientes/<Nome>/fotos/<estilo>/<foto>.jpg
```

Rótulo com muito texto ou marca pequena → `nano-banana-pro`. Só trocar fundo → `google/nano-banana-edit` (mais barato).

### Passo 5 — Conferência do produto (obrigatória)

Pra cada foto gerada, comparar com a original:

- Formato, cor, quantidade de itens, rótulo e texto **iguais**
- Nada adicionado ao produto (acessório, brinde, selo que não existe)
- Nada removido (alça, tampa, detalhe)

Se mudou o produto: regerar com o prompt reforçando o detalhe que mudou. Se depois de 2 tentativas ainda mudar, trocar pra `nano-banana-pro` ou avisar o usuário. **Foto que muda o produto não vai pro cliente** — é propaganda enganosa (CDC, art. 37).

### Passo 6 — Lote e organização

Rodar o resto do lote com o prompt aprovado, trocando só a descrição do produto. Salvar:

```
clientes/<Nome>/fotos/
  originais/                 ← o que a loja mandou
  catalogo/  lifestyle/  sazonal-<data>/
  antes-depois/              ← 2–3 pares escolhidos, pra relatório e portfólio
  prompts.md                 ← prompt aprovado por estilo, pra repetir no mês que vem
```

### Passo 7 — Entrega

Mostrar no chat: 2–3 pares antes/depois, quantas fotos saíram, onde estão, e o custo aproximado (nº de gerações × modelo).

> "Os pares antes/depois ficaram em `antes-depois/` — vale usar no relatório do mês e (com autorização da loja) no teu portfólio."

---

## Regras

- **Produto idêntico, sempre.** A IA muda o cenário, nunca o produto.
- **Uma de teste antes do lote.** Sem exceção.
- **Sem pessoas reais identificáveis** em cena lifestyle, a não ser foto real fornecida com autorização.
- **Não gerar logo ou marca de terceiros** que não estejam no produto original.
- **Custo:** cada geração é cobrada pelo provedor. Antes de lotes grandes (20+), dizer o número de gerações e confirmar.
