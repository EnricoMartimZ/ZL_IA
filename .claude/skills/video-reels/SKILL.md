---
name: video-reels
description: >
  Monta reels, stories e TikToks verticais (1080x1920, 9:16) pra lojas com o HyperFrames da HeyGen
  (HTML renderizado em MP4): oferta, lançamento de produto, antes/depois, dica, depoimento, contagem
  pra data comemorativa. Roteiro com gancho no primeiro segundo, texto dentro da área segura do app,
  legenda animada, identidade da marca e música. Também faz em lote — um modelo, um vídeo por produto
  a partir de uma planilha. Use quando o usuário pedir "reels", "vídeo pro instagram", "vídeo pro
  tiktok", "story em vídeo", "vídeo da promoção", "vídeo de oferta", "transformar o carrossel em
  vídeo", "um vídeo por produto", ou /video-reels.
---

# /video-reels — Reels e TikToks verticais com HyperFrames

O HyperFrames (github.com/heygen-com/hyperframes) transforma HTML + animação em MP4 sempre igual — o mesmo jeito que o `/carrossel` transforma HTML em PNG, só que com tempo. Essa skill é a **camada de negócio**: o que um vídeo de loja precisa dizer e em que ordem. A parte técnica (formato dos arquivos, animação, render) segue as skills oficiais do HyperFrames.

## Dependências

- **Node 22+ e FFmpeg** instalados (`node -v`, `ffmpeg -version`). Sem FFmpeg o render não roda — avisar e passar o comando de instalação do sistema do usuário
- **Skills oficiais do HyperFrames** (uma vez): `npx hyperframes skills update` — instala `/hyperframes`, `/hyperframes-cli`, `/hyperframes-registry` e `/media-use`. **Ler o `/hyperframes` antes de escrever qualquer composição** — ele tem o contrato de render (o que quebra o vídeo)
- **Marca:** `identidade/design-guide.md` (ou o da loja cliente) — cores e fontes viram variáveis do vídeo
- **Tom de voz:** `_memoria/preferencias.md`
- **Material:** fotos do `/foto-produto`, vídeos brutos do `/video-ia`, carrosséis do `/carrossel`, logo da loja
- **Saída:** `clientes/<Nome>/videos/<slug>/` ou `marketing/videos/<slug>/` (vídeos do próprio negócio)

---

## Como rodar

```
/video-reels <loja> — promoção de banho e tosa, 20% até sexta
/video-reels transforma o carrossel "5 erros na ração" em reels
/video-reels um vídeo de oferta pra cada produto de dados/ofertas-black-friday.csv
```

## Tipos de vídeo de loja

| Tipo | Duração | Estrutura (batidas) |
|---|---|---|
| **Oferta** | 8–15 s | Gancho com o benefício → produto → preço/desconto grande → prazo → CTA |
| **Produto** | 10–20 s | Gancho (problema ou resultado) → produto em uso → 2–3 diferenciais → CTA |
| **Antes/depois** | 6–12 s | "Antes" já no quadro 0 → virada → "depois" → CTA |
| **Dica** | 15–30 s | Pergunta-gancho → 3 dicas (1 por batida) → "salva pra depois" → CTA |
| **Depoimento** | 10–20 s | Frase mais forte do cliente → nota/estrelas → nome → CTA |
| **Contagem** | 6–10 s | "Faltam X dias" → o que vem → CTA (lembrete, link) |

CTA de loja é concreto: "chama no WhatsApp", "link na bio", "passa na loja — Rua X, 123". Nunca "saiba mais".

## Workflow

### Passo 1 — Roteiro (antes de qualquer código)

Escrever as batidas em texto, com tempo:

```
0,0–1,5 s  GANCHO   "Seu pet volta cheiroso por 7 dias"   (foto do cachorro pós-banho)
1,5–4,0 s  PRODUTO  Banho + tosa higiênica                 (vídeo bruto do /video-ia)
4,0–7,0 s  OFERTA   20% OFF — R$ 64 → R$ 51               (preço grande)
7,0–9,0 s  PRAZO    Só até sexta                           
9,0–11 s   CTA      Agenda no WhatsApp (19) 9xxxx-xxxx     (logo)
```

Regras do roteiro (vêm do guia de vídeo vertical do HyperFrames):
- **O quadro 0 é a capa e o gancho:** rosto, resultado ou uma frase forte já na tela. Nunca tela preta, nunca logo abrindo
- Muita gente assiste **sem som**: o texto na tela conta a história sozinho
- Batidas de 1–2 s, algo novo a cada 2–4 s, a recompensa antes do usuário arrastar
- Até ~5 palavras por linha de afirmação: cortar palavras, nunca diminuir a fonte. Nada abaixo de 28 px

**CHECKPOINT:** mostrar o roteiro e esperar aprovação.

### Passo 2 — Projeto

```bash
npx hyperframes init clientes/<Nome>/videos/<slug>
```

Compor seguindo o `/hyperframes` e estas medidas de 9:16 (1080×1920):
- **Nada nos 168 px de cima** (barra do app)
- **Todo texto e o produto entre 168 e 1330 px** de altura
- **Abaixo de 1330 px só textura/fundo** (legenda do post, @ e botões ficam ali)
- Nada embaixo da coluna de botões da direita
- Títulos ~1,35× maiores que num vídeo horizontal

Antes de desenhar transição, legenda animada, preço ou título na mão, procurar pronto no catálogo (`/hyperframes-registry`, `npx hyperframes catalog`). Copy, cores, preço, prazo e fotos viram **variáveis** da composição — é isso que permite o lote do Passo 5.

### Passo 3 — Mídia e som

- Fotos e vídeos do produto: sempre **reais da loja** (originais ou do `/foto-produto` e `/video-ia`). Nunca produto inventado
- Logo: o arquivo da loja, nunca redesenhado
- Música: trilha do próprio cliente, ou pelo `/media-use` (catálogo HeyGen ou opções gratuitas). Vídeo de oferta com música animada; dica com trilha calma. Sem trilha disponível → entregar sem música e dizer como colocar
- Narração (opcional): `npx hyperframes tts` (voz local gratuita) ou voz gravada pelo dono. Com narração, legenda queimada palavra por palavra (`references/captions.md` do `/hyperframes`)

### Passo 4 — Conferir e renderizar

```bash
npx hyperframes check --json          # corrigir todo erro
npx hyperframes preview               # mostrar pro usuário aprovar
npx hyperframes render --quality delivery --output clientes/<Nome>/videos/<slug>/<slug>.mp4
```

Só renderizar a versão final depois de o usuário aprovar o preview. Conferir o MP4: duração certa, abre, primeiro quadro é o gancho.

### Passo 5 — Lote (um vídeo por produto)

Com o vídeo-modelo aprovado e as informações em variáveis, montar o JSON a partir da planilha da loja:

```json
{ "rows": [
  { "name": "racao-premium-15kg", "produto": "Ração Premium 15 kg", "preco_de": "R$ 289", "preco_por": "R$ 239", "foto": "assets/racao.jpg" },
  { "name": "areia-sanitaria", "produto": "Areia Sanitária 12 kg", "preco_de": "R$ 59", "preco_por": "R$ 45", "foto": "assets/areia.jpg" }
]}
```

```bash
npx hyperframes render --batch ofertas.json --output "renders/{name}.mp4" --batch-concurrency 1 --strict-variables
```

Abrir 2–3 vídeos do lote antes de entregar (nome longo estoura linha, foto com fundo diferente).

### Passo 6 — Entrega

Salvar ao lado do MP4:
- `roteiro.md` — o roteiro aprovado
- `legenda.md` — legenda do post no tom da marca (gancho + CTA + 3–5 hashtags locais)

Mostrar no chat: caminho do MP4, duração, e a legenda.

---

## Regras

- **Ler o `/hyperframes` oficial antes de compor.** O contrato dele (tempos, timeline pausada, nada aleatório) é o que faz o render funcionar.
- **Gancho no quadro 0.** Vídeo que começa com logo perde a pessoa no primeiro segundo.
- **Área segura sempre.** Texto embaixo da barra ou dos botões do app some.
- **Produto real.** Foto/vídeo da própria loja; IA só no cenário.
- **Preço e prazo conferidos com o dono** antes do render. Preço errado em vídeo vira problema com cliente e com o PROCON.
- **Não publicar.** A skill gera o MP4 e a legenda; quem posta é o usuário.
