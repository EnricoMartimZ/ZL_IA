# Mazy Creative Project — formato do projeto

> **Situação:** formato 1.0 implementado em 11/11/2026: forma, regras da seção 3, desenho e exportação.
> **Arquivo:** `project.mazy.json`, na pasta do projeto.
> **Documentos irmãos:** [arquitetura](CREATIVE_ENGINE_ARCHITECTURE.md) ·
> [roadmap e testes](CREATIVE_ENGINE_ROADMAP.md) · [decisões](ARCHITECTURE_DECISIONS.md)

O Mazy Creative Project é um arquivo JSON que descreve uma peça animada inteira: de quem é, com que
marca, em que formato, quais cenas, o que há em cada cena, como cada coisa se move e como exportar.
O Claude escreve esse arquivo; o editor web abre o mesmo arquivo.

O schema mora em um lugar só:
[`creative-engine/core/schema/mazy-creative-project.schema.json`](../../creative-engine/core/schema/mazy-creative-project.schema.json).
O exemplo da seção 6 é o mesmo arquivo de
[`creative-engine/fixtures/projects/motion-ad-4-scenes/`](../../creative-engine/fixtures/projects/motion-ad-4-scenes/project.mazy.json),
e um teste do motor falha se os dois deixarem de ser iguais.

---

## 1. Convenções

| Assunto | Regra |
|---|---|
| **Tempo** | Sempre em quadros inteiros. Segundos = quadros ÷ `fps`. 15 s a 30 fps são 450 quadros |
| **Medidas** | Pixels da composição. Origem no canto superior esquerdo, `x` para a direita, `y` para baixo |
| **Tempo da camada** | `startFrame` conta do início da **cena**. Keyframes contam do início da **camada** |
| **Ordem** | A ordem de `scenes` é a ordem do vídeo. A ordem de `layers` é o empilhamento: a primeira fica no fundo |
| **Ids** | Minúsculas, números e hífen, começando por letra. Cena e camada têm id único no projeto inteiro; animação, único dentro da camada |
| **Cores** | `#RRGGBB`, `#RRGGBBAA` ou referência à marca: `brand.background`, `brand.text`, `brand.accent`, `brand.darkBase`, `brand.secondary.0` |
| **Fontes** | `brand.heading`, `brand.body` ou o nome de uma família declarada em `brand.fonts` |
| **Arquivos** | Caminho relativo à pasta do projeto. Caminho absoluto, `..` e endereço da internet são recusados |
| **Campo desconhecido** | Erro. O formato não tem "campo livre" |
| **Nomes** | Campos e valores fixos em inglês (`durationFrames`, `fade`). Textos, nomes de cena e mensagens em português |

---

## 2. Estrutura

```
project.mazy.json
├── schemaVersion      versão do formato
├── project            id, nome, tipo, datas, revisão e o briefing
├── clientId           slug do cliente (null = próprio negócio)
├── brand              cores com papel, fontes e logos (cópia do marca.json)
├── composition        largura, altura, fps, duração total, fundo, área segura
├── assets[]           imagens, logos e fontes usados
├── scenes[]           as cenas, em ordem
│   ├── beat           papel no roteiro: gancho, produto, oferta, prova, prazo, chamada
│   ├── transitionIn   como a cena entra sobre a anterior
│   └── layers[]       as camadas, de baixo para cima
│       ├── box        posição e tamanho
│       ├── transform  escala, rotação e ponto fixo
│       ├── opacity
│       ├── text | image | shape | logo     o conteúdo, conforme o tipo
│       ├── animations[]                    entradas e saídas prontas
│       └── keyframes                       trilhas por propriedade
└── export             MP4, H.264, qualidade, nome do arquivo
```

### Campos da raiz

| Campo | Obrigatório | O que é |
|---|---|---|
| `schemaVersion` | sim | `MAJOR.MINOR.PATCH`. Este schema aceita `1.0.x` |
| `project` | sim | `id` (slug), `name`, `kind` (`motion-ad`), `createdAt`, `updatedAt`, `revision`; opcionais `description` e `brief` |
| `clientId` | sim | Slug do cliente, ou `null`. Nunca o nome de exibição |
| `brand` | sim | `colors` (`background`, `text`, `accent`; opcionais `darkBase`, `secondary`), `fonts` (`heading`, `body`), `logos` (`primary`, `onDark`, `onLight`, todos opcionais), `source`, `syncedAt` |
| `composition` | sim | `width`, `height` (pares), `fps` (24, 25, 30 ou 60), `durationFrames`, `background`, `safeArea` |
| `assets` | sim | Lista (pode ser vazia) de `{ id, type: image \| logo \| font, src }` com `width`, `height`, `bytes`, `sha256`, `alt`, `provenance` opcionais |
| `scenes` | sim | Pelo menos uma cena |
| `export` | sim | `container` (`mp4`), `videoCodec` (`h264`), `pixelFormat` (`yuv420p`), `crf`; opcional `fileName` |

### Camadas

Toda camada tem `id`, `name`, `type`, `startFrame`, `durationFrames` e `box`. O bloco de conteúdo
depende do tipo, e só o bloco do próprio tipo é aceito.

| `type` | Bloco | Campos |
|---|---|---|
| `text` | `text` | `content`, `fontFamily`, `fontSize`, `color`; opcionais `fontWeight`, `lineHeight`, `letterSpacing`, `align`, `verticalAlign`, `uppercase` |
| `image` | `image` | `assetId`; opcionais `fit` (`cover`, `contain`), `focusX`, `focusY`, `borderRadius` |
| `shape` | `shape` | `kind` (`rect`, `ellipse`) e pelo menos `fill` ou `stroke`; opcional `borderRadius` |
| `logo` | `logo` | `assetId`. O logo entra sempre inteiro e sem distorção |

### Animação

**Animações prontas** (`animations`): `preset` é `fade`, `slide` ou `scale`; `role` é `in` (começa
no início da camada) ou `out` (termina no fim da camada). Várias podem agir juntas: um `fade` e um
`slide` de entrada na mesma camada dão "sobe aparecendo".

**Keyframes** (`keyframes`): uma trilha por propriedade, entre `x`, `y`, `scale`, `rotation` e
`opacity`. Cada ponto tem `frame`, `value` e, se quiser, a curva (`easing`) do trecho até o próximo
ponto.

A regra exata de como os dois se combinam está na
[arquitetura, seção 6.3](CREATIVE_ENGINE_ARCHITECTURE.md#63-regras-de-avaliação).

**Transição** (`transitionIn`): `fade`, `slide` ou `wipe`, com `durationFrames`. A duração é a
sobreposição entre a cena anterior e esta, e é descontada da duração total. Cena sem `transitionIn`
entra em corte seco.

---

## 3. Regras que o schema não expressa

O JSON Schema confere forma e tipo. As regras abaixo cruzam campos e são conferidas pelo Core
(`validateProject`), cada uma com um código de erro.

| Código | Regra |
|---|---|
| `DUPLICATE_ID` | Id de asset, cena ou camada repetido no projeto; id de animação repetido na camada |
| `DURATION_MISMATCH` | `composition.durationFrames` diferente de soma das cenas menos soma das transições |
| `FIRST_SCENE_TRANSITION` | A primeira cena tem `transitionIn` |
| `TRANSITION_TOO_LONG` | Transição maior que a cena que entra, ou que não cabe no trecho da cena anterior que sobra depois da transição de entrada dela |
| `LAYER_OUT_OF_SCENE` | `startFrame + durationFrames` da camada passa do fim da cena |
| `ANIMATION_OVERFLOW` | Entrada e saída somadas (com os atrasos) não cabem na duração da camada |
| `KEYFRAME_ORDER` | Quadros de uma trilha fora de ordem crescente ou repetidos |
| `KEYFRAME_OUT_OF_LAYER` | Keyframe em quadro igual ou maior que a duração da camada |
| `ASSET_NOT_FOUND` | `assetId` que não existe em `assets` |
| `ASSET_TYPE_MISMATCH` | Camada de logo apontando para asset que não é logo; de imagem para o que não é imagem; fonte da marca para o que não é fonte |
| `ASSET_FILE_MISSING` | O arquivo de `src` não existe na pasta do projeto (só conferido com acesso ao disco) |
| `BRAND_TOKEN_UNDEFINED` | Uso de `brand.darkBase` ou `brand.secondary.N` que a marca não define |
| `FONT_NOT_IN_BRAND` | `fontFamily` que não é `brand.heading`, `brand.body` nem família de `brand.fonts` |
| `SLIDE_WITHOUT_DIRECTION` | Animação `slide` ou transição `slide`/`wipe` sem `direction` |

`ASSET_FILE_MISSING` é conferida por quem tem acesso ao disco (`storage/`, a CLI e o exportador), não
pelo Core. `direction` é sempre o sentido do movimento: `up` quer dizer que a coisa sobe.

Avisos (não impedem gravar nem renderizar):

| Código | Regra |
|---|---|
| `TEXT_OUTSIDE_SAFE_AREA` | Caixa de texto ou de logo fora da área segura |
| `FONT_WITHOUT_FILE` | Fonte da marca sem `assetId`: o render depende da fonte instalada na máquina |
| `TEXT_TOO_SMALL` | `fontSize` abaixo de 28 px (o mínimo da `/video-reels`) |
| `UNUSED_ASSET` | Asset que nenhuma camada nem a marca usa |
| `EMPTY_SCENE` | Cena sem camada e sem fundo |

---

## 4. Versões do formato

- **PATCH** (1.0.0 → 1.0.1): correção de descrição ou de regra. Nenhum projeto muda.
- **MINOR** (1.0 → 1.1): campo novo opcional. Projeto antigo continua válido. Um motor antigo
  recusa projeto de MINOR mais nova com a mensagem "feito numa versão mais nova do motor".
- **MAJOR** (1 → 2): mudança incompatível. O Core traz uma migração (`migrateProject`) e a CLI
  grava um checkpoint antes de migrar.

Fora do 1.0, por decisão (cada item entra com MINOR própria quando for implementado): áudio e
música, camada de vídeo, legenda palavra a palavra, grupos de camadas, texto com mais de um estilo
na mesma caixa, curva de mola, animação de ênfase em laço, máscara e desfoque.

---

## 5. JSON Schema 1.0

Rascunho 2020-12 do JSON Schema. O arquivo é
[`creative-engine/core/schema/mazy-creative-project.schema.json`](../../creative-engine/core/schema/mazy-creative-project.schema.json)
e não é copiado aqui, para não haver duas versões. Quem valida é o Core
(`validateProject`, em `creative-engine/core/src/validation/`), com o Ajv em modo estrito.

Cada problema de forma sai com um código:

| Código | Quando |
|---|---|
| `SCHEMA_UNKNOWN_FIELD` | Campo que o formato não conhece, ou bloco de conteúdo de outro tipo de camada |
| `SCHEMA_REQUIRED` | Falta um campo obrigatório |
| `SCHEMA_TYPE` | Tipo errado (texto onde vai número, fração onde vai inteiro) |
| `SCHEMA_ENUM` | Valor fora da lista aceita |
| `SCHEMA_PATTERN` | Texto fora do padrão (cor, id, data, caminho de arquivo, versão) |
| `SCHEMA_RANGE` | Número, texto ou lista fora do limite |
| `SCHEMA_NO_MATCH` | Valor que não serve em nenhuma das formas aceitas ali (curva, `clientId`, forma sem `fill` nem `stroke`) |
| `SCHEMA_INVALID` | Qualquer outra regra do schema (não deve aparecer no 1.0) |

---

## 6. Exemplo: anúncio vertical de 4 cenas

1080 × 1920, 30 fps, 15 segundos. Quatro cenas (gancho, produto, oferta, chamada), 14 camadas,
textos, imagens, formas e logo, entradas e saída prontas, duas trilhas de keyframes e três
transições.

| Cena | Duração | Entra com | Começa no quadro | Termina no quadro |
|---|---|---|---|---|
| `cena-gancho` | 96 | — | 0 | 96 |
| `cena-produto` | 132 | `fade` de 12 | 84 | 216 |
| `cena-oferta` | 132 | `slide` de 12 | 204 | 336 |
| `cena-chamada` | 126 | `fade` de 12 | 324 | 450 |

Soma das cenas: 486. Menos três transições de 12: 450 quadros, que são 15 s a 30 fps.

O cliente e os textos são inventados para o exemplo. Os arquivos de `assets/` são de teste: duas
imagens e dois logos desenhados para isso e dois recortes da fonte DejaVu Sans, de licença livre.

<!-- exemplo:inicio -->
```json
{
  "schemaVersion": "1.0.0",
  "project": {
    "id": "oferta-armacoes-9x16",
    "name": "Oferta de armações — anúncio vertical",
    "description": "Exemplo do formato: anúncio de 15 s em 4 cenas pra uma ótica.",
    "kind": "motion-ad",
    "createdAt": "2026-11-11T10:00:00-03:00",
    "updatedAt": "2026-11-11T10:00:00-03:00",
    "revision": 1,
    "brief": {
      "objective": "Levar quem mora no bairro a chamar no WhatsApp ainda esta semana.",
      "audience": "Adultos que usam óculos de grau e adiam a troca.",
      "offer": "20% de desconto em armações até sexta.",
      "callToAction": "Chama no WhatsApp",
      "platforms": ["instagram-reels", "instagram-stories"]
    }
  },
  "clientId": "cliente-exemplo",
  "brand": {
    "source": "../../marca/marca.json",
    "syncedAt": "2026-11-11T10:00:00-03:00",
    "colors": {
      "background": "#F6F4EF",
      "text": "#14181F",
      "accent": "#E4572E",
      "darkBase": "#14181F",
      "secondary": ["#2E4057"]
    },
    "fonts": {
      "heading": { "family": "DejaVu Sans Bold", "assetId": "fonte-titulo", "weights": [700] },
      "body": { "family": "DejaVu Sans", "assetId": "fonte-corpo", "weights": [400] }
    },
    "logos": { "primary": "logo-escuro", "onDark": "logo-claro" }
  },
  "composition": {
    "width": 1080,
    "height": 1920,
    "fps": 30,
    "durationFrames": 450,
    "background": "brand.darkBase",
    "safeArea": { "top": 168, "right": 64, "bottom": 590, "left": 64 }
  },
  "assets": [
    { "id": "foto-rosto", "type": "image", "src": "assets/foto-rosto.jpg", "alt": "Pessoa de óculos sorrindo na loja", "width": 1080, "height": 1920, "provenance": "client" },
    { "id": "foto-armacao", "type": "image", "src": "assets/foto-armacao.jpg", "alt": "Armação sobre a bancada", "width": 800, "height": 800, "provenance": "client" },
    { "id": "logo-escuro", "type": "logo", "src": "assets/logo-escuro.svg", "provenance": "client" },
    { "id": "logo-claro", "type": "logo", "src": "assets/logo-claro.svg", "provenance": "client" },
    { "id": "fonte-titulo", "type": "font", "src": "assets/fontes/titulo-bold.woff" },
    { "id": "fonte-corpo", "type": "font", "src": "assets/fontes/corpo.woff" }
  ],
  "scenes": [
    {
      "id": "cena-gancho",
      "name": "Gancho",
      "durationFrames": 96,
      "beat": { "role": "hook", "intent": "O resultado já no primeiro quadro: rosto com os óculos novos." },
      "layers": [
        {
          "id": "gancho-foto",
          "name": "Foto de fundo",
          "type": "image",
          "startFrame": 0,
          "durationFrames": 96,
          "box": { "x": 0, "y": 0, "width": 1080, "height": 1920 },
          "image": { "assetId": "foto-rosto", "fit": "cover", "focusX": 0.5, "focusY": 0.35 },
          "keyframes": {
            "scale": [
              { "frame": 0, "value": 1, "easing": "linear" },
              { "frame": 95, "value": 1.06 }
            ]
          }
        },
        {
          "id": "gancho-veu",
          "name": "Véu escuro",
          "type": "shape",
          "startFrame": 0,
          "durationFrames": 96,
          "box": { "x": 0, "y": 820, "width": 1080, "height": 1100 },
          "opacity": 0.72,
          "shape": { "kind": "rect", "fill": "brand.darkBase" }
        },
        {
          "id": "gancho-titulo",
          "name": "Título",
          "type": "text",
          "startFrame": 0,
          "durationFrames": 96,
          "box": { "x": 64, "y": 900, "width": 952, "height": 300 },
          "text": {
            "content": "Óculos novos\nainda hoje.",
            "fontFamily": "brand.heading",
            "fontSize": 128,
            "fontWeight": 700,
            "lineHeight": 1,
            "letterSpacing": -0.03,
            "color": "#FFFFFF",
            "align": "left",
            "verticalAlign": "top"
          },
          "animations": [
            { "id": "sai", "preset": "fade", "role": "out", "durationFrames": 8, "easing": "ease-in-cubic" }
          ]
        },
        {
          "id": "gancho-apoio",
          "name": "Linha de apoio",
          "type": "text",
          "startFrame": 12,
          "durationFrames": 84,
          "box": { "x": 64, "y": 1210, "width": 952, "height": 60 },
          "text": {
            "content": "Sem esperar uma semana.",
            "fontFamily": "brand.body",
            "fontSize": 44,
            "fontWeight": 400,
            "color": "#FFFFFF"
          },
          "animations": [
            { "id": "entra-fade", "preset": "fade", "role": "in", "durationFrames": 10 },
            { "id": "entra-sobe", "preset": "slide", "role": "in", "durationFrames": 10, "easing": "ease-out-expo", "params": { "direction": "up", "distance": 40 } }
          ]
        }
      ]
    },
    {
      "id": "cena-produto",
      "name": "Produto",
      "durationFrames": 132,
      "background": "brand.background",
      "beat": { "role": "product", "intent": "Mostrar a armação e o prazo de entrega." },
      "transitionIn": { "type": "fade", "durationFrames": 12, "easing": "ease-in-out" },
      "layers": [
        {
          "id": "produto-foto",
          "name": "Foto da armação",
          "type": "image",
          "startFrame": 0,
          "durationFrames": 132,
          "box": { "x": 140, "y": 220, "width": 800, "height": 800 },
          "image": { "assetId": "foto-armacao", "fit": "cover", "borderRadius": 24 },
          "animations": [
            { "id": "entra", "preset": "scale", "role": "in", "durationFrames": 18, "delayFrames": 6, "easing": "ease-out-cubic", "params": { "scale": 0.92 } },
            { "id": "entra-fade", "preset": "fade", "role": "in", "durationFrames": 12, "delayFrames": 6 }
          ]
        },
        {
          "id": "produto-titulo",
          "name": "Título",
          "type": "text",
          "startFrame": 18,
          "durationFrames": 114,
          "box": { "x": 64, "y": 1070, "width": 952, "height": 200 },
          "text": {
            "content": "Armação + lentes\nprontas em 1 hora.",
            "fontFamily": "brand.heading",
            "fontSize": 88,
            "fontWeight": 700,
            "lineHeight": 1.05,
            "letterSpacing": -0.02,
            "color": "brand.text",
            "align": "center"
          },
          "animations": [
            { "id": "entra-fade", "preset": "fade", "role": "in", "durationFrames": 10 },
            { "id": "entra-sobe", "preset": "slide", "role": "in", "durationFrames": 12, "easing": "ease-out-expo", "params": { "direction": "up", "distance": 48 } }
          ]
        }
      ]
    },
    {
      "id": "cena-oferta",
      "name": "Oferta",
      "durationFrames": 132,
      "background": "brand.accent",
      "beat": { "role": "offer", "intent": "O desconto grande e o prazo." },
      "transitionIn": { "type": "slide", "durationFrames": 12, "direction": "left", "easing": "ease-out-expo" },
      "layers": [
        {
          "id": "oferta-numero",
          "name": "Desconto",
          "type": "text",
          "startFrame": 6,
          "durationFrames": 126,
          "box": { "x": 64, "y": 520, "width": 952, "height": 300 },
          "transform": { "anchorX": 0.5, "anchorY": 0.5 },
          "text": {
            "content": "20% OFF",
            "fontFamily": "brand.heading",
            "fontSize": 180,
            "fontWeight": 700,
            "lineHeight": 1,
            "letterSpacing": -0.04,
            "color": "#FFFFFF",
            "align": "center",
            "verticalAlign": "middle"
          },
          "animations": [
            { "id": "entra", "preset": "scale", "role": "in", "durationFrames": 14, "easing": "ease-out-back", "params": { "scale": 0.6 } },
            { "id": "entra-fade", "preset": "fade", "role": "in", "durationFrames": 8 }
          ],
          "keyframes": {
            "scale": [
              { "frame": 40, "value": 1, "easing": "ease-in-out" },
              { "frame": 55, "value": 1.05, "easing": "ease-in-out" },
              { "frame": 70, "value": 1 }
            ]
          }
        },
        {
          "id": "oferta-detalhe",
          "name": "Detalhe da oferta",
          "type": "text",
          "startFrame": 24,
          "durationFrames": 108,
          "box": { "x": 64, "y": 850, "width": 952, "height": 90 },
          "text": {
            "content": "em todas as armações",
            "fontFamily": "brand.body",
            "fontSize": 56,
            "fontWeight": 400,
            "color": "#FFFFFF",
            "align": "center"
          },
          "animations": [
            { "id": "entra-fade", "preset": "fade", "role": "in", "durationFrames": 10 }
          ]
        },
        {
          "id": "oferta-prazo-fundo",
          "name": "Etiqueta do prazo",
          "type": "shape",
          "startFrame": 48,
          "durationFrames": 84,
          "box": { "x": 290, "y": 1010, "width": 500, "height": 110 },
          "shape": { "kind": "rect", "fill": "brand.darkBase", "borderRadius": 55 },
          "animations": [
            { "id": "entra", "preset": "slide", "role": "in", "durationFrames": 12, "easing": "ease-out-expo", "params": { "direction": "up", "distance": 60 } },
            { "id": "entra-fade", "preset": "fade", "role": "in", "durationFrames": 8 }
          ]
        },
        {
          "id": "oferta-prazo",
          "name": "Prazo",
          "type": "text",
          "startFrame": 48,
          "durationFrames": 84,
          "box": { "x": 290, "y": 1010, "width": 500, "height": 110 },
          "text": {
            "content": "Só até sexta",
            "fontFamily": "brand.body",
            "fontSize": 48,
            "fontWeight": 400,
            "color": "#FFFFFF",
            "align": "center",
            "verticalAlign": "middle"
          },
          "animations": [
            { "id": "entra", "preset": "slide", "role": "in", "durationFrames": 12, "easing": "ease-out-expo", "params": { "direction": "up", "distance": 60 } },
            { "id": "entra-fade", "preset": "fade", "role": "in", "durationFrames": 8 }
          ]
        }
      ]
    },
    {
      "id": "cena-chamada",
      "name": "Chamada",
      "durationFrames": 126,
      "background": "brand.darkBase",
      "beat": { "role": "cta", "intent": "Uma ação só: chamar no WhatsApp." },
      "transitionIn": { "type": "fade", "durationFrames": 12 },
      "layers": [
        {
          "id": "chamada-logo",
          "name": "Logo",
          "type": "logo",
          "startFrame": 12,
          "durationFrames": 114,
          "box": { "x": 340, "y": 360, "width": 400, "height": 200 },
          "logo": { "assetId": "logo-claro" },
          "animations": [
            { "id": "entra-fade", "preset": "fade", "role": "in", "durationFrames": 12 }
          ]
        },
        {
          "id": "chamada-botao",
          "name": "Botão",
          "type": "shape",
          "startFrame": 24,
          "durationFrames": 102,
          "box": { "x": 140, "y": 760, "width": 800, "height": 160 },
          "shape": { "kind": "rect", "fill": "brand.accent", "borderRadius": 80 },
          "animations": [
            { "id": "entra", "preset": "scale", "role": "in", "durationFrames": 14, "easing": "ease-out-back", "params": { "scale": 0.85 } },
            { "id": "entra-fade", "preset": "fade", "role": "in", "durationFrames": 8 }
          ]
        },
        {
          "id": "chamada-texto",
          "name": "Texto do botão",
          "type": "text",
          "startFrame": 24,
          "durationFrames": 102,
          "box": { "x": 140, "y": 760, "width": 800, "height": 160 },
          "text": {
            "content": "Chama no WhatsApp",
            "fontFamily": "brand.heading",
            "fontSize": 64,
            "fontWeight": 700,
            "color": "#FFFFFF",
            "align": "center",
            "verticalAlign": "middle"
          },
          "animations": [
            { "id": "entra", "preset": "scale", "role": "in", "durationFrames": 14, "easing": "ease-out-back", "params": { "scale": 0.85 } },
            { "id": "entra-fade", "preset": "fade", "role": "in", "durationFrames": 8 }
          ]
        },
        {
          "id": "chamada-prazo",
          "name": "Lembrete do prazo",
          "type": "text",
          "startFrame": 42,
          "durationFrames": 84,
          "box": { "x": 64, "y": 980, "width": 952, "height": 70 },
          "text": {
            "content": "20% OFF em armações até sexta",
            "fontFamily": "brand.body",
            "fontSize": 40,
            "fontWeight": 400,
            "color": "#FFFFFF",
            "align": "center"
          },
          "animations": [
            { "id": "entra-fade", "preset": "fade", "role": "in", "durationFrames": 12 }
          ]
        }
      ]
    }
  ],
  "export": {
    "container": "mp4",
    "videoCodec": "h264",
    "pixelFormat": "yuv420p",
    "crf": 18,
    "fileName": "oferta-armacoes-9x16.mp4"
  }
}
```
<!-- exemplo:fim -->

---

## 7. Como o formato é conferido

Desde a etapa 1.1 a conferência é teste automatizado do motor:

```bash
npm --prefix creative-engine test
```

| Conferência | Onde |
|---|---|
| O schema compila no Ajv 8 em modo estrito (rascunho 2020-12) | ao carregar `core/src/validation/schema.js` |
| O exemplo de 4 cenas é válido, sem erro e sem aviso | `core/test/validation-schema.test.js` |
| 28 alterações do exemplo, cada uma com um erro, são recusadas com o código e o caminho esperados | `fixtures/invalid/schema.cases.json` |
| Um erro só gera um problema só (sem lista em cascata) | `core/test/validation-schema.test.js` |
| Entrada que não é projeto (`null`, número, lista, objeto vazio) é recusada sem quebrar | idem |
| Validar não altera o projeto | idem |
| O exemplo deste documento é igual ao de `fixtures/` | idem |

Os 28 erros: campo desconhecido na raiz e na camada; campo obrigatório da raiz faltando;
`schemaVersion` de outra série; `clientId` com espaço e maiúscula; `fps` fora da lista; largura ímpar;
projeto sem cenas; cena com duração zero; duração com fração de quadro; camada de texto sem o bloco
`text`; camada de texto com bloco `image`; tipo de camada inexistente; cor fora do padrão;
referência de marca inexistente; curva desconhecida; Bézier com `x` fora de 0 a 1; preset
desconhecido; trilha de propriedade não animável; keyframe sem valor; asset com caminho absoluto,
com `..` e com endereço da internet; forma sem preenchimento nem contorno; opacidade maior que 1;
exportação em outro formato; nome de arquivo com pasta; data sem fuso.

Antes de o motor existir, em 11/11/2026, o schema e o exemplo já tinham sido conferidos fora do
repositório com dois validadores (Ajv 8.20.0 e `jsonschema` 4.25.0 do Python), com o mesmo
resultado.

As regras da seção 3 têm 26 casos próprios (`fixtures/invalid/semantic.cases.json`), e um teste
falha se uma regra listada neste documento ficar sem caso. O exemplo é desenhado e exportado nos
testes do renderer: os estados de 13 quadros estão guardados em `fixtures/expected/` e o MP4 é
conferido pelo `ffprobe`.
