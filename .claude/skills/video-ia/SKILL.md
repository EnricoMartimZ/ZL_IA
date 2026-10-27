---
name: video-ia
description: >
  Gera vídeos curtos com IA pra lojas: anima a foto de um produto (image-to-video), cria uma cena
  do zero (text-to-video) ou faz uma pessoa falar a partir de um retrato e um áudio (lip sync —
  apresentador, depoimento, aviso de promoção). Sempre vertical 9:16 pra reels/stories/TikTok, salvo
  pedido diferente. Usa o MCP do Higgsfield se estiver conectado, senão o kie.ai (scripts/kie.js),
  o mesmo motor do Open Higgsfield AI. Use quando o usuário pedir "vídeo com IA", "animar a foto",
  "dar movimento no produto", "vídeo do produto girando", "apresentador IA", "avatar falando",
  "fazer a foto falar", "lip sync", ou /video-ia.
---

# /video-ia — Vídeo curto gerado por IA

Gera o **material bruto** em vídeo: o produto em movimento, uma cena, uma pessoa falando. Pra montar o reels final com texto, legenda e música por cima, passar o resultado pro `/video-reels`.

## Dependências

- **Cliente:** `clientes/<Nome>/` — fotos aprovadas do `/foto-produto` em `clientes/<Nome>/fotos/`
- **Tom de voz:** `_memoria/preferencias.md` (roteiro de fala)
- **Gerador (um dos dois):**
  - MCP do Higgsfield conectado (`generate_video`, `media_upload`) — usar primeiro se disponível
  - `scripts/kie.js` com `KIE_API_KEY` no `.env`
- **Modelos:** `.claude/skills/foto-produto/modelos.md` (seções Vídeo e Pessoa falando)

---

## Modos

### 1. Produto em movimento (image-to-video)

Ponto de partida: uma foto **já aprovada** (de preferência saída do `/foto-produto` — foto ruim vira vídeo ruim).

Prompt em inglês, descrevendo **só o movimento** — a imagem já define o resto:

```
<movimento de câmera>, <movimento do produto ou do cenário>, <luz>,
smooth, realistic, product stays identical, no text, no logo changes
```

Movimentos que funcionam pra produto:
- `slow push-in towards the product` — aproximação lenta
- `slow 360 orbit around the product` — giro em volta
- `camera tilts up revealing the product` — revelação
- `steam rising` / `liquid pouring` / `fabric moving in a light breeze` — vida no cenário
- Evitar mãos manipulando o produto e texto em movimento (a IA erra dedos e letras)

```bash
node --env-file=.env scripts/kie.js bytedance/seedance-2-fast --input '{
  "prompt": "<prompt>",
  "reference_image_urls": ["@clientes/<Nome>/fotos/catalogo/<foto>.jpg"],
  "aspect_ratio": "9:16", "resolution": "480p", "duration": 5
}' --out clientes/<Nome>/videos/brutos/<nome>-teste.mp4
```

Testar em `480p`, aprovar o movimento, e só então gerar em `1080p` (ou com `bytedance/seedance-2`).

### 2. Cena do zero (text-to-video)

Pra abertura, fundo de anúncio ou ambientação ("vitrine de loja de roupas à noite com luz quente"). **Nunca** pra mostrar o produto da loja — produto inventado pela IA não é o produto que ela vende. Mesmo comando, sem imagem.

### 3. Pessoa falando (lip sync)

Retrato + áudio → vídeo da pessoa falando o áudio. Usos: dono da loja anunciando a promoção, porta-voz fixo da marca, versão em vídeo de um depoimento.

**Antes de gerar, confirmar com o usuário:**
1. A pessoa do retrato **autorizou por escrito** o uso da imagem dela pra isso (salvar a autorização em `clientes/<Nome>/autorizacoes/`)
2. O vídeo vai ser identificado como feito com IA onde a plataforma pedir (Meta e TikTok têm o rótulo "conteúdo gerado por IA")

Sem as duas, não gerar. Nunca gerar fala de pessoa pública, de cliente que não autorizou, ou depoimento que a pessoa não deu.

**Roteiro:** escrever no tom de `_memoria/preferencias.md`, até 30 s (~75 palavras), frase de gancho no começo. Mostrar pro usuário antes.

**Áudio:** a pessoa grava no celular (melhor — voz real), ou voz sintética se o usuário tiver uma ferramenta de TTS. Salvar em `clientes/<Nome>/videos/audio/`.

**Retrato:** de frente, rosto e ombros, boa luz, boca fechada, fundo simples.

```bash
node --env-file=.env scripts/kie.js omnihuman-1-5 --input '{
  "image_url": "@clientes/<Nome>/videos/retrato.jpg",
  "audio_url": "@clientes/<Nome>/videos/audio/promo.mp3",
  "output_resolution": "1080"
}' --out clientes/<Nome>/videos/brutos/promo-falando.mp4
```

Áudio acima de 60 s → `kling/ai-avatar-standard`. Já tem o vídeo e só quer trocar a fala → `volcengine/video-to-video-lip-sync`.

---

## Workflow comum

1. **Escolher o modo** pelo pedido. Se não estiver claro: "Quer (1) animar uma foto de produto, (2) uma cena sem produto, ou (3) uma pessoa falando?"
2. **Teste barato primeiro** (480p, 5 s). Mostrar e esperar aprovação.
3. **Conferir o resultado:** produto continua igual? Movimento sem deformação (produto derretendo, dedos extras, texto embaralhado)? Na fala, a boca acompanha o áudio?
4. **Versão final** na resolução de entrega.
5. **Salvar** em `clientes/<Nome>/videos/brutos/` com o prompt usado em `clientes/<Nome>/videos/prompts.md`.
6. **Oferecer o próximo passo:**
   > "Esse é o vídeo bruto. Quer que eu monte o reels com texto, legenda e música pelo `/video-reels`?"

---

## Regras

- **Custo:** vídeo é a geração mais cara. Dizer o modelo, duração e resolução antes de gerar em alta, e confirmar lotes.
- **Produto real, sempre a partir de foto real.** Text-to-video nunca representa o produto da loja.
- **Lip sync só com autorização por escrito** da pessoa do retrato e com rótulo de IA onde exigido.
- **Sem marca, logo ou personagem de terceiros.**
- **Não publicar.** A skill gera arquivo; publicação é com o usuário (ou `/aprovar-post`).
