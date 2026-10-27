# Modelos de imagem e vídeo (kie.ai)

Referência pro `scripts/kie.js`, usada por `/foto-produto` e `/video-ia`. Os ids e os nomes dos
campos vêm do catálogo do Open Higgsfield AI (`src/lib/models.js`, out/2026). Os modelos mudam:
se a API recusar um campo, conferir em https://kie.ai/market antes de insistir.

Em qualquer campo de imagem, vídeo ou áudio, `"@caminho/arquivo"` faz o script subir o arquivo local.

## Imagem

| Modelo | Bom pra | Campo das referências | Máx. refs | Outros campos |
|---|---|---|---|---|
| `nano-banana-2` | **Padrão.** Foto nova ou edição mantendo o produto | `image_input` | 14 | `aspect_ratio`, `resolution` (`1K`/`2K`/`4K`), `output_format` (`jpg`/`png`) |
| `nano-banana-pro` | Máxima fidelidade (rótulo, texto na embalagem) | `image_input` | 8 | igual ao de cima |
| `google/nano-banana-edit` | Edição barata (trocar fundo, limpar foto) | `image_urls` | 10 | `aspect_ratio` |
| `gpt-image-2-image-to-image` | Edição com instrução longa, composição | `input_urls` | 10 | `aspect_ratio` |
| `gpt-image-2-text-to-image` | Imagem do zero sem referência (cenário, fundo) | — | — | `aspect_ratio` |

Proporções úteis: `4:5` (feed), `1:1` (catálogo, marketplace), `9:16` (story, reels), `16:9` (banner, site).

Exemplo — foto de celular → foto de catálogo:

```bash
node --env-file=.env scripts/kie.js nano-banana-2 --input '{
  "prompt": "...",
  "image_input": ["@clientes/<Nome>/fotos/originais/racao.jpg"],
  "aspect_ratio": "1:1", "resolution": "2K", "output_format": "jpg"
}' --out clientes/<Nome>/fotos/racao-catalogo.jpg
```

## Vídeo

| Modelo | Bom pra | Campo da imagem | Outros campos |
|---|---|---|---|
| `bytedance/seedance-2-fast` | **Padrão.** Animar foto de produto, rápido e barato | `reference_image_urls` | `aspect_ratio`, `resolution` (`480p`–`1080p`), `duration` (5/10/15) |
| `bytedance/seedance-2` | Qualidade alta (cobrado por segundo) | `reference_image_urls` | igual |
| `bytedance/seedance-1.5-pro` | Cinematográfico, já com áudio | `input_urls` | `aspect_ratio`, `resolution`, `duration` |
| `kling-3.0/video` | Controle de primeiro/último quadro | `image_urls` | `aspect_ratio`, `duration` |

Vídeo sempre `9:16` pra reels/stories/TikTok, salvo pedido diferente. Comece com `480p` ou `720p` pra
testar o movimento e só gere `1080p` no aprovado.

## Pessoa falando (lip sync)

| Modelo | Bom pra | Campos | Áudio máx. |
|---|---|---|---|
| `omnihuman-1-5` | **Padrão.** Busto com movimento natural | `image_url`, `audio_url`, `output_resolution` (`720`/`1080`) | 60 s |
| `kling/ai-avatar-standard` | Mais barato, estável | `image_url`, `audio_url` | 5 min |
| `kling/ai-avatar-pro` | Máximo realismo de rosto | `image_url`, `audio_url` | 5 min |
| `infinitalk/from-audio` | Vídeo longo a partir de um retrato | `image_url`, `audio_url`, `resolution` | — |
| `volcengine/video-to-video-lip-sync` | Trocar a fala de um vídeo que já existe | `video_url`, `audio_url`, `mode: "basic"` | — |

## Vocabulário de câmera (do Cinema Studio do Higgsfield)

Pra prompt de foto com cara de produção profissional. Montar como:
`<cena>, shot on a <câmera>, <lente>, <perspectiva>, <profundidade>, professional photography, ultra-detailed`

| Ajuste | Opções → texto no prompt |
|---|---|
| Câmera | full-frame digital cinema camera · Super 35 studio digital camera · classic 16mm film camera · grand format 70mm film camera |
| Lente | premium modern prime lens · extreme macro lens · classic anamorphic lens · vintage prime lens · warm-toned cinema prime lens · ultra-sharp clinical prime lens · halation diffusion filter |
| Distância focal | 14 mm wide-angle perspective · 35 mm natural cinematic perspective · 50 mm standard portrait perspective · 85 mm classic portrait perspective |
| Abertura | f/1.4 shallow depth of field, creamy bokeh · f/4 balanced depth of field · f/11 deep focus clarity, sharp foreground to background |

Receitas rápidas:
- **Produto em estúdio:** f/11, 50 mm, ultra-sharp clinical prime lens, soft diffused studio light
- **Produto lifestyle:** f/1.4, 35 mm, warm-toned cinema prime lens, golden hour
- **Detalhe/textura:** extreme macro lens, f/4
- **Comida:** f/1.4, 50 mm, warm lighting, shallow depth of field, editorial
