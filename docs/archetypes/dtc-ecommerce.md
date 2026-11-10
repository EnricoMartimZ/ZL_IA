# Arquétipo — Marca direta ao consumidor (DTC)

> **Norte:** o produto na mão do cliente em três segundos e o botão de comprar sempre à vista.

Regras globais em `CLAUDE.md` ("Sites premium"). Este arquivo diz como elas ficam neste nicho.
No site estático, os mundos equivalentes são 19 (Vitrine viva), 3 (Cor cheia), 21 (Empório) e 23
(Figurinhas), em `.claude/skills/site-premium/mundos.md`.

## Quando usar

- Marca própria vendendo pela internet: cosmético, bebida, alimento, suplemento, moda, acessório, casa
- Quem compra chega do anúncio ou do Instagram, no celular, com pouca paciência
- A prova mais forte é o produto bem mostrado, a avaliação de quem comprou e a garantia

**Não usar** pra catálogo com milhares de itens (aí é busca e filtro, não vitrine) nem pra venda por
orçamento.

## Conversão primeiro

Toda decisão visual passa por uma pergunta: isso aproxima ou afasta o clique em comprar?

**Na primeira dobra, sem rolar:** o produto, o benefício em até 8 palavras, o preço, a chamada principal
e a prova (estrelas com a quantidade de avaliações).

**A caixa de compra**, nesta ordem: nome → avaliação → preço (e parcela) → variação (cor, sabor, tamanho)
→ quantidade → botão → linha de confiança (frete, troca, pagamento seguro).

**A chamada principal:**

- Uma por tela. Altura mínima de 52 px, largura total no celular
- Texto com verbo e resultado, de preferência com o preço: "Adicionar à sacola · R$ 129". Nunca "Saiba mais"
- Contraste do texto com o botão ≥ 4,5:1 e do botão com a página ≥ 3:1
- No celular, barra fixa embaixo (64 px mais a área segura do aparelho) com preço e botão, que aparece
  quando o botão original sai da tela
- Depois do clique: o botão confirma ("Adicionado") por 1,2 s, a miniatura voa pra sacola e o contador pulsa

**Objeções respondidas na página**, não escondidas: prazo e custo do frete, troca, composição, como
usar, comparação com a alternativa, perguntas frequentes.

## Cores, cada uma com seu papel

| Papel | Valor | Contraste | Uso |
|---|---|---|---|
| Fundo (papel) | `#fffdf8` | — | A página |
| Tinta | `#111111` | 18,6:1 no papel | Texto, preço, botão padrão |
| Apoio | `#5c5c5c` | 6,6:1 no papel | Descrição, legenda |
| Cor do produto | uma por item | — | Fundo da seção daquele item, misturado a 12–20% com o papel |
| Confirmação | `#0a7d45` | 5,1:1 no papel | "Em estoque", "Adicionado" |
| Oferta | `#c8102e` | 5,8:1 no papel | Preço promocional. Só nele |

Três botões que passam no contraste:

| Botão | Texto | Contraste | Observação |
|---|---|---|---|
| Tinta `#111111` | `#ffffff` | 18,9:1 | O mais seguro. Padrão |
| Laranja `#ff4f18` | `#111111` | 5,7:1 | Texto branco dá 3,3:1 e reprova |
| Amarelo `#ffd60a` | `#111111` | 13,4:1 | Some no papel (1,4:1): precisa de contorno em tinta |

A página veste a cor do produto escolhido: trocar a variação troca o fundo da seção, com
`color-mix(in oklab, var(--produto) 16%, #fffdf8)` e transição de 400 ms.

## Tipografia

- **Título:** grotesca com peso, larga ou condensada: Bricolage Grotesque, Archivo (com eixo de largura),
  Familjen Grotesk ou Anton. Peso de 700 a 900, entrelinha de 0,9 a 1,0
- **Corpo:** DM Sans, Inter ou a própria grotesca em peso 400, 16 px, entrelinha 1,5
- **Preço:** peso 600, algarismos tabulares, pelo menos 1,25× o corpo. Preço antigo riscado em apoio
- Título da primeira dobra: `clamp(2.5rem, 8vw, 6.5rem)`. No celular cabe em até 3 linhas
- Selo e etiqueta: maiúsculas, 12 px, espaçamento 0,06em

## Galeria 3D interativa

O cliente não pode pegar o produto, então a galeria faz esse papel. Quatro caminhos, do mais barato ao
mais caro:

| Caminho | Como | Quando |
|---|---|---|
| Giro em sequência | 36 a 72 fotos em WebP; arrastar troca o quadro, com inércia e mola no fim | Há fotos do produto girando. É o mais fiel |
| Vitrine em arco | Fotos recortadas num arco ou roda em 3D por CSS, arrasto com mola (Motion) | Várias variações do mesmo produto |
| Modelo 3D | `.glb` com Draco, até 1,5 MB, em React Three Fiber: girar, trocar a cor do material, pontos de detalhe | Existe o modelo ou vale mandar fazer |
| Embalagem de vidro | `Hero3DCanvas` como objeto de vidro com a cor do produto na `palette`, deslocado com `offset` pra dar lugar à caixa de compra | Cosmético e bebida, na primeira dobra |

Regras de toda galeria:

- Nunca atrasa a compra: a caixa de compra fica ao lado (computador) ou logo abaixo (celular)
- A primeira imagem é estática, é o LCP e vem com `priority`. O 3D carrega depois, por cima
- No celular o modelo 3D só carrega quando a pessoa toca em "Girar em 3D"
- Arrasto com `touch-action: pan-y`, limite de 6 px antes de capturar, setas no teclado e miniaturas
- FPS abaixo de 30 ou sem WebGL: cai pro carrossel de fotos, sem aviso
- Zoom por toque duplo ou lupa; a foto ampliada tem pelo menos 2× a resolução

As peças `roda.js`, `esteira.js`, `profundidade.js` e `carta.js` da skill `/site-premium` são a versão
sem build dessas ideias e servem de referência de comportamento.

## Chamada magnética

`MagneticButton` na chamada principal da primeira dobra e na final:

```tsx
<MagneticButton strength={0.35} radius={72} background="#111111" color="#ffffff" fill="#ff4f18" fillColor="#111111">
  Adicionar à sacola · R$ 129
</MagneticButton>
```

- Um botão magnético por tela. Dois disputam o ponteiro
- `strength` de 0,3 a 0,4 e `radius` de 60 a 80 px
- O preenchimento entra por onde o ponteiro entrou: `fill` com `fillColor` também precisa passar no
  contraste (aqui, tinta sobre laranja, 5,7:1)
- Em toque o ímã se desliga sozinho; a barra fixa do celular nunca é magnética

## Movimento

| O quê | Como |
|---|---|
| Hover em produto | Mola viva 260/20: sobe 4 px e troca pra segunda foto |
| Adicionar à sacola | Miniatura voa em arco até a sacola (mola), contador pulsa uma vez |
| Benefícios | `PinnedSection`: o produto fica parado e os três benefícios passam |
| Composição | Na rolagem, o produto "se desmonta" em ingredientes (scrub) |
| Avaliações | Faixa correndo devagar, para no hover e no foco |
| Troca de variação | Cor do fundo em 400 ms; a foto troca com `SplitReveal` no nome |
| Título | `SplitReveal` por palavra, intervalo de 40 ms |

Nada que anima pode atrasar o toque: INP ≤ 200 ms vale mais que qualquer efeito.

## Layout

Ordem que vende: primeira dobra com caixa de compra → faixa de prova (nota, imprensa, quantidade
vendida, com fonte) → três benefícios com o produto fixado → como usar ou do que é feito → comparação
com a alternativa (tabela) → avaliações com foto de cliente → combo ou oferta → perguntas → chamada
final com a garantia.

## Assinaturas (escolher uma ou duas)

1. O produto gira com o dedo já na primeira dobra
2. A página troca de cor com a variação escolhida
3. O produto fixado enquanto os benefícios passam em volta
4. A miniatura que voa pra sacola
5. Nome do produto gigante atrás da foto recortada (a classe `.sanduiche` do estático)
6. Roda de sabores com o do meio em foco

**Pra dois sites não saírem iguais, variar:** a grotesca, a cor de cada produto, o caminho da galeria,
a forma do botão (pílula, bloco ou etiqueta) e a assinatura.

## Celular e desempenho

- Desenhar a caixa de compra primeiro em 375 px; o polegar alcança o botão sem trocar a pegada
- Imagem do produto em AVIF, 3 tamanhos, fundo liso pra pesar pouco
- Esqueleto com a altura final em tudo que carrega depois: CLS ≤ 0,05
- Sem janela que salta nos primeiros 10 s; sem carrossel automático na primeira dobra

## Faça e não faça

| Faça | Não faça |
|---|---|
| Botão com verbo, resultado e preço | "Saiba mais", "Clique aqui" |
| Um estilo de botão principal e um secundário | Três cores de botão na mesma tela |
| Frete e troca ditos antes do carrinho | Custo que só aparece no fim |
| Avaliação real, com nome e data | Depoimento inventado, contagem regressiva falsa |
| Texto `#111111` sobre laranja `#ff4f18` (5,7:1) | Texto branco sobre laranja (3,3:1 reprova) |
| Galeria que cai pra fotos se o aparelho não aguenta | 3D obrigatório travando o celular |

## Tokens (Tailwind 4)

```css
@theme {
  --color-fundo: #fffdf8;
  --color-tinta: #111111;
  --color-apoio: #5c5c5c;
  --color-acao: #111111;
  --color-acao-texto: #ffffff;
  --color-preenchimento: #ff4f18;
  --color-confirmacao: #0a7d45;
  --color-oferta: #c8102e;
  --font-display: var(--font-titulo), ui-sans-serif, system-ui, sans-serif;
  --font-sans: var(--font-texto), ui-sans-serif, system-ui, sans-serif;
  --radius-botao: 999px;
  --radius-cartao: 20px;
  --ease-saida: cubic-bezier(0.16, 1, 0.3, 1);
}
```

## Antes de entregar

- [ ] Produto, benefício, preço, botão e prova cabem na primeira dobra de 375 × 812
- [ ] O botão de comprar está visível em qualquer ponto da página no celular
- [ ] Todo botão passa em 4,5:1, inclusive no estado preenchido
- [ ] A galeria funciona por toque, por teclado e sem WebGL
- [ ] Frete, troca e garantia aparecem antes do carrinho
