# Arquétipo — Agência e estúdio criativo

> **Norte:** o site é a primeira peça do portfólio. Ele prova o que o estúdio sabe fazer.

Regras globais em `CLAUDE.md` ("Sites premium"). Este arquivo diz como elas ficam neste nicho.
No site estático, os mundos equivalentes são 16 (Cartaz tipográfico), 3 (Cor cheia), 12 (Quadrinho) e 15
(Cartografia), em `.claude/skills/site-premium/mundos.md`.

## Quando usar

- Agência, estúdio de design, produtora de vídeo, fotógrafo, arquiteto autoral, portfólio, festival, evento
- Quem visita é do meio ou contrata criatividade: julga o site como julgaria um trabalho
- A prova mais forte é o próprio trabalho, grande, e a ousadia de como ele é mostrado

**Não usar** quando o cliente final é leigo e quer achar telefone e preço rápido: liberdade demais vira
obstáculo. Aqui a nota de ousadia é 4 ou 5; abaixo disso, outro arquétipo.

## Cores, cada uma com seu papel

Dois neutros e uma cor violenta. O trabalho traz o resto.

| Papel | Valor | Contraste | Uso |
|---|---|---|---|
| Preto | `#0c0c0c` | — | Fundo de um tema |
| Papel | `#efefe9` | 17,0:1 com o preto | Fundo do outro tema |
| Cinza no preto | `#8c8c86` | 5,8:1 | Texto secundário no tema escuro |
| Cinza no papel | `#62625c` | 5,3:1 | Texto secundário no tema claro |
| Destaque | um só | ver abaixo | Um bloco inteiro, o cursor, um link. Chapado |

Destaques: ácido `#d7ff3e` (17,0:1 no preto; texto sobre ele sempre preto), laranja `#ff3b00` (5,5:1 no
preto e com texto preto), azul `#2b3bff` (5,7:1 no papel; texto sobre ele em papel).

O tema inverte entre seções (preto → papel → destaque), e cada trabalho pode trazer a própria cor numa
variável `--caso` que tinge a página enquanto ele está em foco.

## Tipografia

A letra é a imagem principal.

- **Título com personalidade:** Unbounded, Syne, Archivo com largura expandida, Big Shoulders Display ou
  Space Grotesk. Como contraponto, uma serifa em itálico (Instrument Serif) numa palavra
- Tamanho de cartaz: `clamp(4rem, 16vw, 18rem)`, entrelinha de 0,82 a 0,9, espaçamento −0,05em. Pode
  cortar na borda da tela, desde que continue legível
- Misturar peso, largura e itálico dentro do mesmo título é permitido; mais de duas famílias, não
- **Mono** pros índices: "(01)", ano, categoria, coordenada, crédito. 12 a 13 px, maiúsculas
- Corpo de 17 a 20 px, entrelinha 1,45, em coluna estreita e deslocada

## Cursor customizado adaptativo

`CustomCursor` com `blend` ligado: o disco branco em `mix-blend-mode: difference` inverte o que está
embaixo e continua visível em qualquer fundo, sem trocar de cor por seção.

```tsx
<CustomCursor blend size={14} mediaSize={112} />

<a href="/trabalhos/caso" data-cursor="View">…</a>
<div data-cursor="Drag">…carrossel…</div>
<video data-cursor="Play" />
```

- O cursor diz o que o clique faz: "View" no trabalho, "Drag" no que arrasta, "Play" no filme, "Next" na
  troca de caso. Rótulo com até 6 letras
- Cresce pra 96 a 120 px sobre mídia; encolhe ao pressionar; some sobre campo de texto
- Estica na direção do movimento (já vem ligado). Mola 500/40 na posição: atraso perceptível, sem ficar
  pra trás
- O cursor nativo continua existindo, a não ser que `hideNative` seja ligado de propósito
- Em toque não existe cursor: a informação do rótulo precisa estar também no próprio elemento

## Distorção em shader

A imagem reage: ao ponteiro, à velocidade da rolagem e à troca de trabalho.

| Efeito | O que move | Limite |
|---|---|---|
| Onda no hover | As coordenadas da textura ondulam a partir do ponteiro | Amplitude até 1,2% da imagem |
| Separação de cor | Vermelho e azul se afastam conforme a velocidade | Até 2% |
| Dobra na rolagem | Os vértices do plano curvam com a velocidade do Lenis | Volta ao repouso com mola 170/26 |
| Troca líquida | Ruído mistura a imagem que sai com a que entra | 0,9 a 1,4 s |
| Texto como textura | O título vira textura e escorre | Só no título da abertura |

Como montar: um único `<Canvas>` fixo cobrindo a tela; cada `<img>` do HTML ganha um plano na mesma
posição e tamanho (ler com `getBoundingClientRect` no `useFrame`). A imagem do HTML continua lá, com
opacidade 0, pro Google, pro leitor de tela e pro fallback.

```glsl
uniform sampler2D uMap;
uniform vec2 uMouse;     // ponteiro em coordenadas da imagem (0 a 1)
uniform float uHover;    // 0 a 1, com mola
uniform float uVel;      // velocidade da rolagem, normalizada (-1 a 1)
uniform float uTime;
varying vec2 vUv;

void main() {
  vec2 uv = vUv;
  float d = distance(uv, uMouse);
  float onda = sin(d * 18.0 - uTime * 3.0) * 0.012 * uHover * smoothstep(0.5, 0.0, d);
  uv += normalize(uv - uMouse + 1e-4) * onda;
  float desvio = uVel * 0.02;
  vec3 cor = vec3(
    texture2D(uMap, uv + vec2(desvio, 0.0)).r,
    texture2D(uMap, uv).g,
    texture2D(uMap, uv - vec2(desvio, 0.0)).b
  );
  gl_FragColor = vec4(cor, 1.0);
  #include <colorspace_fragment>
}
```

No vértice, a dobra: `pos.y += sin(uv.x * 3.14159) * uVel * 0.3;` (plano com pelo menos 16 × 16
segmentos). A velocidade vem de `useSmoothScroll().lenis?.velocity`, limitada e amortecida.

- Em repouso a imagem é a imagem: distorção zero sem ponteiro e sem rolagem
- FPS abaixo de 30, sem WebGL ou movimento reduzido: o canvas sai e as imagens do HTML voltam, com
  hover em CSS (escala 1,04 e `clip-path`)
- No celular: só a dobra na rolagem, sem onda

## Layout livre

Livre não é solto: existe um sistema, e ele é quebrado de propósito em pontos escolhidos.

- A grade de 12 colunas continua embaixo. Os elementos ocupam larguras irregulares (5, 3, 7, 2) e
  começam em colunas diferentes a cada linha
- **Sobreposição:** o título passa por cima da imagem (`mix-blend-mode: difference`) ou por trás dela
- **Índice de trabalhos:** lista só de nomes em corpo gigante; apontar um nome mostra a imagem dele
  seguindo o cursor
- **Seção horizontal:** `PinnedSection` com os painéis deslizando em `x` no scrub; no celular vira
  carrossel de arrastar com encaixe
- **Galeria espalhada:** imagens em posições e tamanhos variados (em `vw`), cada uma arrastável com mola
- **Pilha:** cartões que grudam no topo e se empilham conforme a rolagem
- **Faixa gigante:** uma frase correndo na largura toda, na velocidade da rolagem
- Rótulos girados 90°, numeração nas margens, linhas finas marcando a grade à vista
- Altura de seção variável: uma de 60% da tela ao lado de uma de 300%

No celular o layout livre vira uma coluna forte com dois recuos alternados (16 e 56 px) e imagens
sangrando. Empilhar tudo centralizado é desistir do conceito.

## Movimento

| O quê | Como |
|---|---|
| Título da abertura | `SplitReveal` por caractere, intervalo de 20 ms, subindo de trás da máscara |
| Entrada do site | Só se houver carga real: contador de 0 a 100 honesto, até 1,5 s, depois cortina em `clip-path` |
| Troca de página | Cortina na cor do próximo caso, 0,9 s |
| Item de menu e link | Ímã com `MagneticButton variant="outline"` ou mola 260/20 no texto |
| Peça de brincar (galeria, adesivo) | Mola elástica 120/14: aqui pode quicar |
| Imagens na rolagem | Dobra e separação de cor pela velocidade |
| Rolagem | Lenis com `lerp` 0,09 |

## Componentes do arsenal

- `CustomCursor`: sempre, com `blend`
- `SmoothScrollContainer` + `PinnedSection` (seção horizontal, pilha) + `SplitReveal` (títulos de cartaz)
- `MagneticButton`: nos itens de menu e no contato gigante, `strength` de 0,4 a 0,5
- `Hero3DCanvas`: quando o estúdio trabalha com 3D ou identidade. `shape="knot"`, `dispersion` alto
  (0,06 a 0,08), `palette` com o destaque, `scale` de 1 a 1,2 e `veil={0}`: aqui o objeto pode disputar
  com o título, desde que o título continue legível

## Layout da página

Abertura (manifesto em letra de cartaz ou o filme do estúdio) → trabalhos escolhidos (índice ou galeria
espalhada, de 4 a 8, não todos) → o que o estúdio faz (lista seca) → quem é (retratos de verdade) →
clientes e prêmios (lista em mono) → contato como link gigante ("Vamos conversar").

## Assinaturas (escolher uma ou duas)

1. Índice de trabalhos em que o nome chama a imagem
2. Imagens que dobram com a velocidade da rolagem
3. Troca líquida entre um caso e outro
4. Título de cartaz atravessando a tela, cortado pela borda
5. Seção horizontal fixada com os casos passando
6. Rodapé com o contato ocupando a tela inteira

**Pra dois sites não saírem iguais, variar:** a letra do título, o destaque, a estrutura da lista de
trabalhos (índice, espalhada, pilha, horizontal), o efeito do shader e o que o cursor diz.

## Piso de usabilidade

Ousadia não desculpa site que não se usa.

- Menu alcançável em qualquer ponto; cada trabalho é um `<a>` de verdade, com endereço próprio
- Texto selecionável, contraste dentro da regra, foco visível mesmo com cursor customizado
- A roda do mouse nunca muda de sentido sem aviso: seção horizontal só fixada, com indicação de avanço
- Som desligado por padrão; vídeo com controle
- Sem tela de carregamento de mentira

## Faça e não faça

| Faça | Não faça |
|---|---|
| Uma cor violenta, chapada, em bloco inteiro | Três destaques ou degradê |
| Letra de 16vw cortando a borda | Título tímido centralizado |
| Quebrar a grade em 2 ou 3 pontos escolhidos | Tudo solto, sem alinhamento nenhum |
| Distorção que volta ao repouso | Imagem tremendo o tempo todo |
| 4 a 8 trabalhos bem mostrados | Parede com 40 miniaturas |
| Cursor que informa ("View", "Drag") | Cursor enfeitado que esconde o nativo e não diz nada |

## Tokens (Tailwind 4)

```css
@theme {
  --color-preto: #0c0c0c;
  --color-papel: #efefe9;
  --color-cinza-no-preto: #8c8c86;
  --color-cinza-no-papel: #62625c;
  --color-destaque: #d7ff3e;
  --font-display: var(--font-titulo), ui-sans-serif, system-ui, sans-serif;
  --font-mono: var(--font-indice), ui-monospace, monospace;
  --text-cartaz: clamp(4rem, 16vw, 18rem);
  --ease-saida: cubic-bezier(0.16, 1, 0.3, 1);
  --ease-cortina: cubic-bezier(0.76, 0, 0.24, 1);
}
```

## Antes de entregar

- [ ] Trocando o logo, o site não serviria pra outro estúdio
- [ ] Dá pra navegar tudo por teclado e em toque, sem cursor e sem shader
- [ ] Sem ponteiro e sem rolagem, nenhuma imagem está distorcida
- [ ] No celular o layout continua assimétrico
- [ ] Cada trabalho tem endereço próprio e abre em menos de 2,5 s
