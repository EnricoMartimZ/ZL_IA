# Arquétipo — Luxo

> **Norte:** quase nada acontece, e tudo foi escolhido.

Regras globais em `CLAUDE.md` ("Sites premium"). Este arquivo diz como elas ficam neste nicho.
No site estático, os mundos equivalentes são 18 (Luxo silencioso), 8 (Editorial impresso), 9 (Luz
natural) e 14 (Museu de objetos), em `.claude/skills/site-premium/mundos.md`.

## Quando usar

- Joalheria, alta costura, relojoaria, arquitetura e interiores, hotel-boutique, gastronomia autoral,
  imóvel de alto padrão, clínica premium, vinho, perfumaria
- O cliente não compara preço: quer sentir que está no lugar certo. Decide devagar, muitas vezes por
  atendimento pessoal
- A prova mais forte é a matéria (a foto de perto), a origem e o nome de quem faz

**Não usar** quando a venda depende de volume, oferta ou urgência: silêncio não vende promoção.

## Cores, cada uma com seu papel

Neutros quentes. Branco puro e preto puro não entram: esfriam a página.

| Papel | Valor | Contraste no fundo | Uso |
|---|---|---|---|
| Fundo (osso) | `#f4efe6` | — | A página |
| Superfície (pergaminho) | `#ebe4d8` | — | Faixa alternada, legenda de imagem |
| Tinta | `#1c1917` | 15,3:1 | Título e corpo |
| Apoio | `#6b6157` | 5,3:1 | Legenda, rótulo, texto secundário |
| Fio | `rgb(28 25 23 / 0.14)` | — | Linha de 1 px entre blocos |
| Destaque | um só | ver abaixo | Um link, um fio, uma inicial. Até 3% da tela |

Destaques: bronze `#7a5c34` (5,4:1), vinho `#5b1f24` (11,0:1), verde-garrafa `#2f3b33` (10,2:1). O taupe
claro `#8a7f72` dá só 3,4:1 no osso: serve pra fio e enfeite, nunca pra texto.

**Seção noturna** (uma por página, no máximo): fundo `#1c1917`, tinta `#f4efe6` (15,3:1), apoio
`#b5aa9b` (7,7:1).

## Tipografia

- **Serifa editorial de alto contraste** no título: Bodoni Moda, Cormorant Garamond, Playfair Display,
  Instrument Serif ou Fraunces (com eixo óptico). Peso 300 a 400: quanto maior o corpo, mais leve o peso
- Uma palavra em itálico por título, a que carrega o sentido. Nunca o título inteiro
- Título da primeira dobra: `clamp(3rem, 9vw, 9rem)`, entrelinha 0,95, espaçamento −0,02em
- **Sans discreta** no corpo e nos rótulos: Hanken Grotesk, Manrope ou Inter. Corpo de 16 a 17 px,
  entrelinha 1,7, coluna estreita (até 38 caracteres no texto de abertura, até 60 no corrido)
- Rótulo: 11 a 12 px, maiúsculas, espaçamento de 0,18 a 0,24em, cor de apoio
- Numeração de coleção em algarismos romanos ou com dois dígitos ("N° 04")
- Sem negrito no corpo. Ênfase é itálico ou espaço

## Assimetria

A grade tem 12 colunas, mas o conteúdo nunca ocupa o centro exato.

- O bloco de texto ocupa 5 a 6 colunas e começa na coluna 2 ou na 7. O outro lado fica vazio de propósito
- Imagens de proporções diferentes na mesma seção (4:5 ao lado de 3:4 ou 16:9), desalinhadas em altura
  por 8 a 16% da tela
- Um elemento por dobra atravessa o limite: a legenda que invade a foto, o título que passa da margem
- Margem lateral de pelo menos 8vw. Respiro entre seções de 160 a 240 px no computador e de 96 a 120 px
  no celular
- Raio de 0 a 2 px. Sem cartão, sem sombra, sem ícone decorativo. O que separa é espaço e fio de 1 px
- No celular a assimetria continua: recuo alternado de 16 e 48 px, imagem sangrando de um lado só

## Movimento lento

Tudo acontece como se alguém estivesse virando a página com cuidado.

| O quê | Como |
|---|---|
| Rolagem | Lenis com `lerp` de 0,06 a 0,08 (mais pesada que o padrão) |
| Imagem entrando | `clip-path: inset(100% 0 0 0)` até `inset(0)` com escala de 1,15 a 1, em 1,6 s |
| Título | `SplitReveal` por linha (`by="lines"`), intervalo de 120 ms, duração de 1,4 s |
| Texto de abertura | `SplitReveal` em `mode="scrub"`: as palavras escurecem conforme a rolagem |
| Parallax | Até 8% de diferença entre imagem e moldura. Mais que isso vira truque |
| Hover em imagem | Escala de 1 a 1,03 em 1,2 s. Nada salta |
| Mola (ponteiro e arrasto) | Superamortecida: rigidez de 60 a 90, amortecimento de 20 a 26, massa 1,2. Sem quique |
| Troca de página | Véu na cor do fundo, 0,8 s |
| Curva | `cubic-bezier(0.22, 1, 0.36, 1)` em tudo que não é mola |

Duração de 1,2 a 2,4 s nas entradas. Um movimento por vez na tela: se a imagem está entrando, o texto
espera.

## Layout

Ordem que conduz: capa (uma imagem e o nome) → manifesto (uma frase em corpo grande) → coleção ou obra
(galeria assimétrica) → a matéria de perto → o ateliê ou a história → atendimento → contato discreto.

A chamada nunca grita. "Agendar visita", "Solicitar atendimento", "Conhecer a coleção": texto com fio
embaixo ou botão de contorno fino, um por tela. Preço aparece pequeno, depois da peça, ou como "sob
consulta".

## Componentes do arsenal

- `SmoothScrollContainer` com `lerp={0.07}`; `SplitReveal` por linha nos títulos
- `PinnedSection`: uma vez, pra matéria de perto (a imagem fica e as legendas passam)
- `Hero3DCanvas`: raro. Quando o produto é vidro, líquido ou pedra: `shape="sphere"`, `frost` de 0,3 a
  0,5, `speed={0.2}`, `palette` em tons quentes, `background="#f4efe6"`, deslocado com `offset` pra
  manter a assimetria. Na dúvida, um filme parado vale mais
- `MagneticButton`: `variant="outline"`, `strength={0.15}`. Atração quase imperceptível
- `CustomCursor`: ponto pequeno, `blend={false}`, rótulo em itálico ("Ver", "Arrastar"). `mediaSize` até 80

## Assinaturas (escolher uma)

1. Capa com uma única imagem e o nome em serifa enorme, cortado pela borda da tela
2. Galeria em que cada peça tem proporção e posição próprias, como numa parede
3. Texto de manifesto que escurece palavra por palavra na rolagem
4. A matéria de perto fixada na tela enquanto as legendas passam ao lado
5. Índice da coleção como sumário de livro, com número de página

**Pra dois sites não saírem iguais, variar:** a serifa, o destaque, a direção do recuo, a proporção
dominante das fotos, se há seção noturna e qual peça ganha a tela inteira.

## Celular e desempenho

- A foto é o site: AVIF em 3 tamanhos, `sizes` correto, a da capa com `priority`
- Sem vídeo em tela cheia no 4G: pôster primeiro, vídeo depois de 1 s parado na tela
- As entradas lentas continuam, o parallax sai

## Faça e não faça

| Faça | Não faça |
|---|---|
| Uma chamada por tela, em voz baixa | Selo de desconto, contagem regressiva, ponto de exclamação |
| Fundo osso `#f4efe6` e tinta `#1c1917` | Branco puro com preto puro |
| Raio de 0 a 2 px e fio de 1 px | Cartão arredondado com sombra |
| Entrada de 1,2 a 2,4 s, uma por vez | Mola que quica, vários elementos piscando |
| Texto de apoio em `#6b6157` (5,3:1) | Texto em taupe claro `#8a7f72` (3,4:1 reprova) |
| Foto real, de perto, com luz lateral | Banco de imagem e ícone de linha |

## Tokens (Tailwind 4)

```css
@theme {
  --color-fundo: #f4efe6;
  --color-superficie: #ebe4d8;
  --color-tinta: #1c1917;
  --color-apoio: #6b6157;
  --color-fio: rgb(28 25 23 / 0.14);
  --color-destaque: #7a5c34;
  --font-serif: var(--font-display), "Times New Roman", serif;
  --font-sans: var(--font-texto), ui-sans-serif, system-ui, sans-serif;
  --radius-padrao: 2px;
  --ease-lento: cubic-bezier(0.22, 1, 0.36, 1);
  --duracao-entrada: 1.6s;
}
```

## Antes de entregar

- [ ] Em qualquer dobra, contando os elementos, sobram menos de sete
- [ ] Nenhum bloco está centralizado por padrão: o recuo foi decidido
- [ ] Nenhuma animação dura menos de 0,8 s nem quica
- [ ] Uma chamada por tela, sem urgência
- [ ] A página fica de pé só com as fotos e a serifa, sem efeito nenhum
