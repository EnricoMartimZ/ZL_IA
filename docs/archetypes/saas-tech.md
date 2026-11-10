# Arquétipo — SaaS e tecnologia

> **Norte:** o produto trabalhando no escuro, com luz só onde importa.

Regras globais em `CLAUDE.md` ("Sites premium"). Este arquivo diz como elas ficam neste nicho.
No site estático, os mundos equivalentes são 17 (Produto vivo), 6 (Instrumento) e 2 (Laboratório), em
`.claude/skills/site-premium/mundos.md`.

## Quando usar

- Software, API, plataforma de IA, fintech, ferramenta B2B, infraestrutura, segurança
- Quem decide é técnico ou compara três abas abertas: quer ver o produto, o número e o preço
- A prova mais forte é o produto funcionando, uma métrica ou o logo de quem já usa

**Não usar** quando o comprador é leigo e o produto é serviço de gente (aí o escuro técnico afasta), ou
quando a marca do cliente é clara e colorida: nesse caso inverter os tons e manter só a estrutura.

## Cores, cada uma com seu papel

| Papel | Valor | Contraste no fundo | Uso |
|---|---|---|---|
| Fundo | `#09090b` | — | A página inteira. Nunca preto puro |
| Superfície | `#111113` | — | Cartão, painel, bloco de código |
| Superfície alta | `#18181b` | — | Menu, hover de linha, campo |
| Borda | `rgb(255 255 255 / 0.08)` | — | Toda divisão. 1 px, sempre |
| Borda acesa | `rgb(255 255 255 / 0.16)` | — | Hover e foco |
| Tinta | `#fafafa` | 19,1:1 | Título e número |
| Apoio | `#a1a1aa` | 7,8:1 | Texto corrido |
| Discreto | `#71717a` | 4,1:1 | Só rótulo grande ou enfeite. Nunca parágrafo |
| Destaque | um só, da marca | ver abaixo | Botão principal, estado ativo, o halo |

Destaques que funcionam no escuro (texto do botão sempre `#09090b`): lima `#c8ff4d` (16,9:1), ciano
`#5eead4` (13,5:1), âmbar `#ffb224` (11,0:1), azul `#5b8cff` (6,3:1). Um por site. Roxo com azul em
degradê é o clichê do nicho: só se for a cor real da marca, e chapado.

## Halos de luz

O halo é a única "iluminação" da página. Ele aponta pro que importa (o título, o cartão do plano
recomendado, o produto) e não enfeita canto vazio.

```css
.halo {
  position: absolute; width: min(70vw, 900px); aspect-ratio: 1; border-radius: 50%;
  background: radial-gradient(closest-side, rgb(from var(--destaque) r g b / 0.22), transparent 72%);
  pointer-events: none;
}
```

- É `radial-gradient`, nunca `filter: blur()` em elemento grande: o degradê já é macio e não custa GPU
- No máximo 2 por dobra, opacidade até 0,25, sempre atrás do conteúdo (`z-index: -1` num contexto isolado)
- Respira devagar (opacidade de 0,6 a 1 em 6 s) ou segue o ponteiro com mola 170/26. Nunca os dois
- Conferir o contraste do texto **com o halo atrás**, não só no fundo liso

## Micro-bordas iluminadas

A borda de 1 px é a assinatura do nicho. Quatro níveis, do mais calmo ao mais chamativo:

```css
/* 1. Fio com luz de cima: o padrão de todo cartão */
.fio { border: 1px solid rgb(255 255 255 / 0.08); box-shadow: inset 0 1px 0 rgb(255 255 255 / 0.06); }

/* 2. Borda em degradê: acende em cima e apaga embaixo */
.borda-luz { position: relative; border-radius: 16px; background: #111113; }
.borda-luz::before {
  content: ""; position: absolute; inset: 0; padding: 1px; border-radius: inherit; pointer-events: none;
  background: linear-gradient(180deg, rgb(255 255 255 / 0.18), rgb(255 255 255 / 0.04) 40%, transparent);
  mask: linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0);
  mask-composite: exclude;
}

/* 3. Holofote: a borda acende onde o ponteiro está (--mx e --my vêm do pointermove) */
.borda-holofote::before {
  background: radial-gradient(240px circle at var(--mx) var(--my), rgb(from var(--destaque) r g b / 0.7), transparent 60%);
}

/* 4. Feixe: um ponto de luz dá a volta no cartão. Só no cartão mais importante da página */
@property --giro { syntax: "<angle>"; inherits: false; initial-value: 0deg; }
.borda-feixe::before {
  background: conic-gradient(from var(--giro), transparent 0 80%, var(--destaque) 92%, transparent);
  animation: giro 5s linear infinite;
}
@keyframes giro { to { --giro: 360deg; } }
```

Os níveis 3 e 4 reaproveitam o `::before` com máscara do nível 2. Raio de 12 a 16 px em cartão, 8 px em
campo e botão, 999 px só em etiqueta. Sombra projetada quase não existe aqui: a profundidade vem da
borda e do tom da superfície.

## Tipografia

- **Sans:** Geist, Inter Tight ou Space Grotesk, peso 500 a 600 no título e 400 no corpo
- **Mono:** Geist Mono, JetBrains Mono ou IBM Plex Mono. É a voz técnica: rótulo acima do título, número,
  métrica, código, atalho de teclado, versão, etiqueta de status. Até 15% do texto da página. Nunca em
  parágrafo
- Título da primeira dobra: `clamp(2.75rem, 6vw + 1rem, 5.5rem)`, entrelinha 1,0, espaçamento −0,04em
- Título de seção: `clamp(2rem, 3vw + 1rem, 3.25rem)`, entrelinha 1,1, espaçamento −0,03em
- Corpo: 16 a 17 px, entrelinha 1,6, cor de apoio, até 62 caracteres por linha
- Rótulo mono: 12 px, maiúsculas, espaçamento 0,08em. Número sempre com `font-variant-numeric: tabular-nums`
- Degradê no texto: no máximo uma palavra da página, de tinta pra apoio (nunca arco-íris)

## Layout

Largura de 1.200 px, 12 colunas, vão de 24 px. Grade de pontos ou de linhas no fundo, apagando nas
bordas com máscara radial. Blocos em **bento**: células de tamanhos diferentes, cada uma com uma
microdemonstração funcionando. Três cartões iguais lado a lado é proibido.

Ordem que vende: promessa com o produto à vista → logos de quem usa → três capacidades em bento → como
funciona (seção fixada, um passo por vez) → números → integrações ou código → depoimentos com cargo →
planos → perguntas → chamada final.

## Movimento

| O quê | Como |
|---|---|
| Título da primeira dobra | `SplitReveal` por caractere, intervalo de 15 ms, uma vez |
| "Como funciona" | `PinnedSection` de 2 a 3 telas; o passo ativo acende a borda |
| Cartão no hover | Mola 260/20, sobe 2 px, borda vai pra "acesa". Sem escala |
| Número | Conta de 0 ao valor em 1,2 s quando entra na tela |
| Código e terminal | Digita a 30 a 50 caracteres por segundo, cursor piscando |
| Linhas da grade | Desenham-se com `scaleX` na entrada da seção |
| Rolagem | Lenis com `lerp` 0,1 |

## Componentes do arsenal

- `Hero3DCanvas`: `background="#09090b"`, `palette` com o destaque e dois neutros frios, `shape="knot"`,
  `dispersion` de 0,03 a 0,05. O objeto fica atrás do título e nunca disputa com ele: `veil` de 0,3 a
  0,5 com título centralizado, ou `offset={[0.5, 0]}` com o texto à esquerda
- `SmoothScrollContainer` + `PinnedSection` + `SplitReveal`: na página toda
- `MagneticButton`: só na chamada principal, `background` com o destaque e `color="#09090b"`
- `CustomCursor`: em geral não. Produto sério dispensa. Só em demonstração com vídeo ("Play")

## Assinaturas (escolher uma ou duas)

1. O produto de verdade na primeira dobra, montado em HTML, respondendo ao ponteiro
2. Terminal que digita o comando e mostra a resposta
3. Bento em que cada célula roda sozinha
4. Feixe de luz na borda do plano recomendado
5. Objeto de vidro refratando a cor da marca
6. Faixa de métricas ao vivo em mono (latência, requisições, disponibilidade), com dado real

**Pra dois sites não saírem iguais, variar:** a cor do destaque, o raio (6, 12 ou 16 px), a textura do
fundo (grade, pontos, ruído ou nada), o tipo de primeira dobra (3D, produto, código ou só tipografia), a
densidade (arejado ou painel cheio) e quanto de mono aparece.

## Celular e desempenho

- Bento vira uma coluna, na ordem de importância, sem perder as microdemonstrações principais
- Cabeçalho fixo com fundo sólido a 92%, sem `backdrop-filter` sobre conteúdo que rola
- Holofote e feixe desligados em ponteiro grosso; fica o fio com luz de cima
- `Hero3DCanvas` cai sozinho pro pôster; conferir se o pôster segura a dobra

## Faça e não faça

| Faça | Não faça |
|---|---|
| Borda de 1 px a 8% de branco em toda divisão | Sombra preta grande em fundo escuro |
| Um destaque, em até 10% da tela | Dois destaques ou degradê de três cores |
| Mono em rótulo e número | Parágrafo em mono |
| Produto real ou demonstração em HTML | Print borrado ou ilustração genérica de painel |
| Número com fonte e data | "10x mais rápido" sem prova |
| Texto de apoio em `#a1a1aa` | Parágrafo em `#71717a` (4,1:1 reprova) |

## Tokens (Tailwind 4)

```css
@theme {
  --color-fundo: #09090b;
  --color-superficie: #111113;
  --color-superficie-alta: #18181b;
  --color-borda: rgb(255 255 255 / 0.08);
  --color-borda-acesa: rgb(255 255 255 / 0.16);
  --color-tinta: #fafafa;
  --color-apoio: #a1a1aa;
  --color-discreto: #71717a;
  --color-destaque: #c8ff4d;
  --font-sans: var(--font-geist-sans), ui-sans-serif, system-ui, sans-serif;
  --font-mono: var(--font-geist-mono), ui-monospace, monospace;
  --radius-cartao: 16px;
  --radius-controle: 8px;
  --ease-saida: cubic-bezier(0.16, 1, 0.3, 1);
}
```

## Antes de entregar

- [ ] O produto aparece funcionando antes da primeira rolagem
- [ ] Um único destaque, e o texto sobre ele é `#09090b`
- [ ] Nenhum parágrafo abaixo de 4,5:1, conferido com o halo atrás
- [ ] Toda divisão é borda de 1 px; nenhuma sombra de enfeite
- [ ] Sem os holofotes e sem o 3D a página continua bonita
