# Hero em sequência — como gerar as cenas com IA

O hero em sequência (`data-modo="sequencia"`, `hero-seq.js`) conta a transformação com **5 a 7 imagens da mesma cena**, geradas por IA, costuradas com transições em WebGL. Aprendido com a segunda versão de um site de referência, que trocou o 3D por isso e ficou melhor:

- **Parece foto de verdade**, não render — o cliente se reconhece
- **Sem modelo 3D**: nada de licença de .glb, nada de produto de marca, nada de Blender
- **Leve** (~1,5 MB no total em WebP) e roda em qualquer celular
- Muda de nicho trocando só as imagens e os textos

O segredo não é a transição, é a **consistência**: mesma câmera, mesmo objeto, mesma luz em todas as cenas. Se o carro muda de modelo entre a cena 2 e a 3, a mágica quebra.

---

## 1. Roteiro de cenas

Antes de gerar, escrever a história em cenas. Estrutura que funciona (a mesma do modelo):

| # | Cena | Plano | Transição que entra | O que significa |
|---|---|---|---|---|
| 1 | Lugar vazio, luz apagando/acendendo | aberto | `acender` | "chegou no lugar certo" |
| 2 | O **antes** (sujo, gasto, bagunçado) | aberto | `cruzar` | o problema do cliente |
| 3 | O **depois**, mesma câmera | aberto | `linha` | a limpeza/o serviço |
| 4 | Close de um detalhe **antes** do acabamento | close | `mergulho` | "olha de perto" — mostra cuidado técnico |
| 5 | O mesmo close **acabado** | close | `circulo` | polimento, ajuste, conserto |
| 6 | Entrega num clima especial (pôr do sol, vitrine, luz quente) | aberto | `cruzar` | o resultado que o cliente leva |

Exemplos por nicho:

| Nicho | Antes (2) | Depois (3) | Close antes (4) | Close depois (5) | Entrega (6) |
|---|---|---|---|---|---|
| Estética automotiva | SUV coberto de lama no box | o mesmo SUV preto brilhando | capô com marcas circulares (swirls) | capô espelhado com gota d'água | carro no pôr do sol na porta do estúdio |
| Sapataria / limpeza de tênis | tênis branco encardido na bancada | o mesmo tênis limpo | sola amarelada | sola branca | tênis na prateleira com luz de vitrine |
| Joalheria / relojoaria | anel oxidado na bandeja | anel polido | riscos no aro | aro espelhado | anel na caixa de presente |
| Barbearia | cliente de costas, cabelo crescido (sem rosto) | corte feito | nuca irregular | degradê perfeito | cliente saindo, luz de neon (sem rosto) |
| Pet shop (banho e tosa) | cachorro molhado e embolado na banheira | cachorro seco e escovado | pelo embolado | pelo solto e brilhante | cachorro com lacinho na recepção |
| Limpeza de estofados | sofá manchado | sofá limpo | mancha no tecido | tecido limpo com gota repelida | sala arrumada com luz de fim de tarde |
| Ótica | óculos embaçados e tortos na mesa | óculos novos alinhados | lente riscada | lente nítida refletindo a vitrine | óculos na vitrine iluminada |

Pessoas: nunca rosto identificável gerado por IA de "cliente". De costas, mãos, ou sem pessoas.

## 2. Gerar com consistência

**Regra:** gerar a cena 3 (o depois, plano aberto) **primeiro**, aprovar, e criar todas as outras **editando ela** — passando a imagem como referência. É assim que o objeto e a câmera ficam iguais.

Com o `scripts/kie.js` (modelos em `.claude/skills/foto-produto/modelos.md`), formato 16:9, 2K:

```bash
# cena 3 — base (texto pra imagem)
node --env-file=.env scripts/kie.js nano-banana-2 --input '{
  "prompt": "<cena 3 em inglês: objeto, lugar, luz, câmera>, photorealistic, shot on a full-frame digital cinema camera, 35mm, f/4, professional photography",
  "aspect_ratio": "16:9", "resolution": "2K", "output_format": "jpg"
}' --out clientes/<Nome>/site/img/seq/bruto/3-depois.jpg

# cena 2 — o antes, editando a base
node --env-file=.env scripts/kie.js nano-banana-2 --input '{
  "prompt": "Same exact photo, same camera angle, same framing, same lighting. Only change: <o que muda — ex: the car is now covered in dried mud and dust>. Keep everything else identical.",
  "image_input": ["@clientes/<Nome>/site/img/seq/bruto/3-depois.jpg"],
  "aspect_ratio": "16:9", "resolution": "2K", "output_format": "jpg"
}' --out clientes/<Nome>/site/img/seq/bruto/2-antes.jpg
```

Mesma receita pra cena 1 ("the studio is now empty, lights dimmed"), cena 6 ("same car, now the garage door is open and golden sunset light comes in") e os closes ("extreme close-up of the hood of this same car, macro lens, <defeito ou acabamento>"). Pros closes 4 e 5: gerar a 5 a partir da 4 ("same close-up, now perfectly polished, mirror finish"), pra baterem entre si.

Também funciona com o Higgsfield (MCP), o Google Flow/Imagen ou qualquer gerador que aceite imagem de referência.

Conferir lado a lado antes de seguir: objeto igual, horizonte na mesma altura, luzes no mesmo lugar. Diferença pequena some na transição; diferença grande (roda diferente, prédio que aparece) fica feia — regerar.

## 3. Preparar as imagens

- Todas com **a mesma proporção** (16:9) e o mesmo tamanho (~1600–1920 px de largura)
- O assunto **no centro, um pouco abaixo do meio** — no celular a tela corta as laterais
- Converter pra WebP (~150–300 KB cada):
  ```bash
  for f in clientes/<Nome>/site/img/seq/bruto/*.jpg; do convert "$f" -resize 1800x -quality 80 "clientes/<Nome>/site/img/seq/$(basename "${f%.jpg}").webp"; done
  ```
- Apagar as `exemplo-cena-*.webp` do modelo e a pasta `bruto/` antes de publicar

## 4. Configurar o `hero-seq.js`

No `CONFIG`:
- `cenas`: os arquivos, na ordem da história
- `proporcao`: largura/altura das imagens (16/9)
- `passos`: a linha do tempo. Ajustar principalmente:
  - `foco` — o ponto de interesse de cada passo (x, y de 0 a 1 na imagem). Pra achar: abrir a imagem, posição do ponto ÷ tamanho da imagem
  - `centro` do `circulo` — onde o polimento começa (um reflexo, o defeito)
  - `foco` do `mergulho` — pra onde a câmera mergulha (o capô, a sola, o aro)
  - `capitulo` — o nome de cada etapa na barra de baixo
- Total ideal: **18 a 25 segundos**, e o loop recomeça

No `index.html`, um bloco `.beat` por capítulo, na mesma ordem. Copy de cada beat:
- Título em **duas frases curtas** (até ~15 caracteres cada), a segunda em contorno: "HORA DE / LAVAR." · "SWIRLS FORA. / BRILHO SELADO." · "CHAVE NA MÃO. / QUEIXO NO CHÃO."
- Uma linha técnica embaixo, em mono: o que realmente acontece na etapa
- Alternar `beat-esq` / `beat-dir`; o último leva o botão de agendar

Conferir cada etapa parada: no console do navegador, `__hero.pausar(); __hero.ir(10)` (segundos).

## 5. Honestidade

- Rótulo no hero, sempre: **"Imagens geradas por IA · ilustrativas"** (`.tag-ia`)
- O resto do site (serviços, estúdio, Instagram) com **fotos reais**
- O objeto gerado é genérico — nada de marca/modelo reconhecível (carro de fábrica famosa, tênis de marca) e nada que prometa um resultado que a loja não entrega

## Variação: vídeo de verdade

Com as cenas prontas, dá pra gerar vídeos curtos entre elas (modelo com primeiro e último quadro, ex: `kling-3.0/video` no `/video-ia`) e trocar as transições por vídeo. Fica mais rico, mas pesa 5–15 MB e custa mais. A versão com transições em WebGL é o padrão: leve, barata e já impressiona.
