# /criativo — referência dos comandos de edição

O `apply` recebe uma lista de comandos em JSON. A lista inteira vale ou não vale: um comando
recusado deixa o projeto como estava. O formato completo do projeto está em
`docs/creative-engine/CREATIVE_PROJECT_SCHEMA.md`; o que existe de animação, transição e curva sai
do `catalog`.

## Convenções

- **Tempo em quadros.** A 30 fps, 1 s = 30 quadros. `startFrame` da camada conta do início da cena
- **Medidas em pixels** de uma tela de 1080×1920, a partir do canto de cima à esquerda
- **Ids:** minúsculas, números e hífen. Cena e camada têm id único no projeto inteiro
- **Cores:** `#RRGGBB` ou `brand.background`, `brand.text`, `brand.accent`, `brand.darkBase`
- **Fontes:** `brand.heading` (títulos) e `brand.body` (corpo)
- **A lista `layers` é o empilhamento:** a primeira camada fica no fundo
- **`patch` mescla:** só o que vier é alterado; `null` apaga o campo
- **A duração total se ajusta sozinha** quando muda cena ou transição

## Camadas

Texto:

```json
{ "type": "layer.add", "sceneId": "cena-oferta", "layer": {
  "id": "oferta-numero", "name": "Desconto", "type": "text", "startFrame": 6, "durationFrames": 126,
  "box": { "x": 64, "y": 520, "width": 952, "height": 300 },
  "text": { "content": "20% OFF", "fontFamily": "brand.heading", "fontSize": 180, "fontWeight": 700,
            "lineHeight": 1, "color": "#FFFFFF", "align": "center", "verticalAlign": "middle" },
  "animations": [
    { "id": "entra", "preset": "scale", "role": "in", "durationFrames": 14, "easing": "ease-out-back", "params": { "scale": 0.6 } },
    { "id": "entra-fade", "preset": "fade", "role": "in", "durationFrames": 8 }
  ] } }
```

Foto (o asset entra antes, com `asset-add`):

```json
{ "type": "layer.add", "sceneId": "cena-gancho", "index": 0, "layer": {
  "id": "gancho-foto", "name": "Foto de fundo", "type": "image", "startFrame": 0, "durationFrames": 96,
  "box": { "x": 0, "y": 0, "width": 1080, "height": 1920 },
  "image": { "assetId": "foto-produto", "fit": "cover", "focusX": 0.5, "focusY": 0.35 } } }
```

Véu escuro pra texto sobre foto, etiqueta, botão:

```json
{ "type": "layer.add", "sceneId": "cena-gancho", "layer": {
  "id": "gancho-veu", "name": "Véu", "type": "shape", "startFrame": 0, "durationFrames": 96,
  "box": { "x": 0, "y": 820, "width": 1080, "height": 1100 }, "opacity": 0.72,
  "shape": { "kind": "rect", "fill": "brand.darkBase" } } }
```

Logo (sempre inteiro, sem distorção):

```json
{ "type": "layer.add", "sceneId": "cena-chamada", "layer": {
  "id": "chamada-logo", "name": "Logo", "type": "logo", "startFrame": 12, "durationFrames": 114,
  "box": { "x": 340, "y": 360, "width": 400, "height": 200 }, "logo": { "assetId": "logo-marca" } } }
```

Alterar, apagar, reordenar, mudar de cena:

```json
[
  { "type": "layer.update", "layerId": "oferta-numero", "patch": { "text": { "content": "30% OFF" }, "box": { "y": 500 } } },
  { "type": "layer.remove", "layerId": "gancho-apoio" },
  { "type": "layer.reorder", "layerId": "gancho-titulo", "index": 3 },
  { "type": "layer.move", "layerId": "chamada-prazo", "sceneId": "cena-oferta" }
]
```

## Animação

Entradas e saídas prontas: `fade`, `slide` (com `params.direction`: `up` quer dizer que a camada
sobe) e `scale`. Duas entradas juntas se somam: `fade` + `slide` dá "sobe aparecendo".

```json
[
  { "type": "animation.add", "layerId": "produto-titulo", "animation": { "id": "sobe", "preset": "slide", "role": "in", "durationFrames": 12, "easing": "ease-out-expo", "params": { "direction": "up", "distance": 48 } } },
  { "type": "animation.update", "layerId": "produto-titulo", "animationId": "sobe", "patch": { "durationFrames": 16 } },
  { "type": "animation.remove", "layerId": "produto-titulo", "animationId": "sobe" }
]
```

Keyframes, pra um movimento próprio (propriedades: `x`, `y`, `scale`, `rotation`, `opacity`; o
quadro conta do início da camada):

```json
[
  { "type": "keyframe.set", "layerId": "gancho-foto", "property": "scale", "frame": 0, "value": 1, "easing": "linear" },
  { "type": "keyframe.set", "layerId": "gancho-foto", "property": "scale", "frame": 95, "value": 1.06 }
]
```

## Cenas e transições

```json
[
  { "type": "scene.update", "sceneId": "cena-chamada", "patch": { "durationFrames": 150, "background": "brand.darkBase", "beat": { "role": "cta" } } },
  { "type": "scene.setTransition", "sceneId": "cena-oferta", "transition": { "type": "slide", "durationFrames": 12, "direction": "left" } },
  { "type": "scene.setTransition", "sceneId": "cena-produto", "transition": null },
  { "type": "scene.add", "index": 2, "scene": { "id": "cena-prova", "name": "Prova", "durationFrames": 90, "background": "brand.background", "beat": { "role": "proof" }, "layers": [] } },
  { "type": "scene.reorder", "sceneId": "cena-prova", "index": 1 },
  { "type": "scene.remove", "sceneId": "cena-prova" }
]
```

Transições: `fade`, `slide` e `wipe` (as duas últimas pedem `direction`). A duração da transição é
o tempo em que as duas cenas dividem a tela, e sai da duração total. `null` é corte seco.

## Projeto, marca e exportação

```json
[
  { "type": "project.update", "patch": { "name": "Oferta de inverno", "brief": { "offer": "20% em armações até sexta", "callToAction": "Chama no WhatsApp" } } },
  { "type": "export.update", "patch": { "crf": 18, "fileName": "oferta-inverno.mp4" } }
]
```

`brief.callToAction` é conferido pela crítica: a chamada tem que aparecer na última cena.

## Erros mais comuns

| Código | O que aconteceu | Como resolver |
|---|---|---|
| `LAYER_OUT_OF_SCENE` | `startFrame + durationFrames` passa do fim da cena | Encurtar a camada ou alongar a cena |
| `ANIMATION_OVERFLOW` | Entrada e saída não cabem na camada | Diminuir as durações |
| `SCHEMA_UNKNOWN_FIELD` | Campo que o formato não tem | Conferir o nome no documento do formato |
| `SCHEMA_PATTERN` em cor | Cor fora do padrão | `#RRGGBB` ou `brand.accent` e afins |
| `ASSET_NOT_FOUND` | A camada cita um asset que não foi trazido | Rodar `asset-add` antes |
| `FONT_NOT_IN_BRAND` | Fonte que não é da marca | Usar `brand.heading` ou `brand.body` |
| `TEXT_OVERFLOW` (crítica) | O texto não cabe na caixa | Diminuir a fonte, cortar palavra ou aumentar a caixa |
