# Técnicas — o "truque" de cada site

Peças de movimento prontas e testadas pra montar a experiência que o **conceito** pede (`../direcao.md`).
Cada site usa **uma técnica-assinatura**, no máximo duas. Elas não têm cor nem fonte: isso vem do
mundo escolhido (`../mundos.md`).

Quatro bancadas de teste, com tudo funcionando: `demo.html` (as primeiras técnicas), `mostruario.html` (os mundos 09 a 18, cada um com a sua técnica), `objetos.html` (esteira, varal, folha, placar e pontilhado) e `arsenal.html` (roda, medida, carta, troca, lista viva, profundidade, cursor, lupa, menu e o acabamento novo).

Rodar de dentro da pasta `mazyos`, senão a pasta não é achada e toda página dá 404:

```bash
python3 -m http.server 4174 --directory .claude/skills/site-premium/tecnicas   # → http://localhost:4174/objetos.html
```

## Como entram num site

1. Copiar a pasta `tecnicas/` pra dentro do site (`clientes/<Nome>/site/tecnicas/`).
2. No `<head>`: `<link rel="stylesheet" href="tecnicas/tecnicas.css">` e o importmap do three (já está no `modelo/index.html`).
3. A história vira **palcos**: uma seção alta (`data-telas` = quantas telas de rolagem dura) com um quadro preso na tela. A rolagem é a linha do tempo.

```html
<section class="palco" data-telas="4" id="historia">
  <div class="palco-quadro" id="quadro">
    <div class="cap" data-cap>…capítulo 1…</div>
    <div class="cap" data-cap>…capítulo 2…</div>
  </div>
</section>
<script type="module">
  import { palco, rolagemSuave } from './tecnicas/palco.js';
  import { fluxo } from './tecnicas/fluxo.js';
  rolagemSuave();
  const f = fluxo(document.querySelector('#quadro'), { /* cores do mundo */ });
  palco(document.querySelector('#historia'), f.progresso);
</script>
```

Toda técnica devolve `progresso(p)` (p de 0 a 1). Dá pra ligar duas ao mesmo palco, ou só uma fatia dele:
`import { local } from './tecnicas/palco.js'` e `(p) => linhas.progresso(local(p, 0.3, 0.8))`.

## Catálogo

| Técnica | Arquivo | O que faz | Combina com | Peso |
|---|---|---|---|---|
| **Palco** | `palco.js` | Seção presa na tela + progresso da rolagem + capítulos (`data-cap`) + rolagem macia (Lenis) + `--p` no CSS | Base de todas | ~13 KB (Lenis) |
| **Fluxo** | `fluxo.js` | Milhares de linhas num campo de corrente; "temperatura" muda de caótico/quente pra laminar/frio | Ar, vento, água, calor, rota: climatização, ventilação, piscina, transporte, irrigação | Canvas 2D, roda em celular |
| **Partículas** | `particulas.js` | 9–26 mil pontos que mudam de forma: nuvem → palavra da marca → anéis → esfera → silhueta da peça (PNG) | O que não se fotografa: energia, sinal, química, som, dados, tecnologia, limpeza (poeira que vira brilho) | WebGL (three) |
| **Linhas** | `linhas.js` | SVG que se desenha traço a traço; cotas e rótulos aparecem; `construcao()` põe grade, compasso e diagonais | Quem projeta e constrói: arquitetura, engenharia, serralheria, marcenaria, móveis planejados, gesso, elétrica | SVG, levíssimo |
| **Zoom contínuo** | `zoom.js` | Mergulho sem corte de uma cena na próxima (a próxima já está dentro da anterior) | Processo e escala: do bairro à bancada ao detalhe; da obra ao acabamento; da fazenda ao produto | CSS, leve (imagens pesam) |
| **Raio-X** | `raiox.js` | Foto por fora; lente que segue o mouse/dedo mostra por dentro; "+" com ficha técnica; botão liga o raio-X na tela toda | Produto/equipamento cujo valor está dentro: ar-condicionado, máquinas, fechaduras, painéis, colchões, carros | 2 imagens |
| **Texto** | `texto.js` | Títulos que entram palavra a palavra (`data-dividir`), rótulos que se decodificam (`data-embaralhar`), números que contam (`data-contar`), blocos que sobem (`data-revelar`) | Todo site (é acabamento, não assinatura) | Levíssimo |
| **HUD** | `tecnicas.css` | Cantos, cruzes, réguas e rótulos mono por cima de qualquer quadro (`.hud`, `.hud-cruz`, `.hud-linha-h/v`, `.hud-rotulo`) | Mundos Instrumento, Planta, Laboratório, Galeria pintada | CSS |
| **Superfície** | `superficie.js` | A foto vira matéria: relevo com luz seguindo o dedo, água, vidro canelado ou ar quente, sem 3D nem mapa extra | Pedra, metal, couro, madeira, piscina, vidraçaria, churrasqueira, solda | WebGL puro, sem three |
| **Pincel** | `pincel.js` | O visitante passa o dedo e descobre o "depois": limpa, pinta, revela. Com palco, pinta sozinho pela rolagem | Limpeza, higienização, pintura, funilaria, reforma, gráfica, dentista | Canvas 2D |
| **Controle** | `controle.js` | Arrastar um valor (reta ou dial) muda a cena e já monta a mensagem do WhatsApp com o número | Conta de luz, termostato, metragem, convidados, plano | Levíssimo, com teclado |
| **Território** | `territorio.js` | Mapa pra arrastar e aproximar, com pontos, fichas e estados. Com palco, vira passeio guiado | Loteamento, condomínio, rede de lojas, fazenda, turismo | CSS + imagem ou SVG |
| **Arrastar** | `arrastar.js` | `faixa()`: fileira com inércia. `mesa()`: objetos soltos pra pegar e mover | Obras, cases, catálogo, cardápio; fotos, amostras | Levíssimo |
| **Vinhetas** | `vinhetas.js` | Página de HQ lida pela rolagem: a câmera guia de quadro em quadro e no fim mostra a página toda | Marcas com humor e história: cerveja, hamburgueria, escola | CSS |
| **Luz** | `luz.js` | O dia passa na tela: mancha de sol, sombra de folhas e cor da página mudam da manhã à noite | Padaria, café, pousada, decoração, "um dia com" | CSS, levíssimo |
| **Sequência** | `sequencia.js` | Vídeo que anda com a rolagem (quadros em canvas ou `<video>`) | Processo filmado: solda, corte, forno, drone | 4–8 MB por 120 quadros |
| **Abertura** | `abertura.js` | Logo se desenha, porcentagem real, cortina abre o site. Uma vez por visita, nunca segura além do `maximo` | Acabamento de qualquer site | Levíssimo |
| **Trilho** | `trilho.js` | Índice lateral preso, um traço por capítulo com a sua cor. Fora do celular | Sites longos de produto ou serviço | Levíssimo |
| **Física** | `fisica.js` | Mola, balanço, laço que dorme, arremesso e voo do objeto até a ficha. Base de toda peça que reage ao dedo | Módulos novos | Levíssimo |
| **Esteira** | `esteira.js` | Produtos girando numa pista com perspectiva falsa: para sob o mouse, gira com inércia, abre ficha e pede | Restaurante, pizzaria, padaria, doceria, adega | SVG + DOM, sem WebGL |
| **Varal** | `varal.js` | Objetos pendurados num trilho ou corda que balançam com o arrasto; acendem ou viram | Iluminação, moda, galeria, equipe, obras | Levíssimo |
| **Folha** | `folha.js` | A foto vira papel: a beira enrola sobre um cilindro, mostra o verso e faz sombra | Cardápio, catálogo, gráfica, papelaria | WebGL puro, sem three |
| **Pontilhado** | `pontilhado.js` | Nome enorme em retícula, cortado pela borda, que abre caminho em volta do dedo | Rodapé de qualquer site | Canvas 2D |
| **Placar** | `placar.js` | `odometro()`: tambores que giram no vácuo. `palhetas()`: quadro de aeroporto | Transportadora, oficina, rodoviária, bar | Levíssimo |
| **Roda** | `roda.js` | Produtos numa roda com o centro abaixo da tela: o do meio em foco, os vizinhos inclinados e desfocados, a frase da marca em curva girando ao contrário e o disco tomando a cor de cada item. Dedo, setas ou rolagem | Conservas, cervejas, cosméticos, vinhos, cafés, hambúrgueres: linha de 5 a 12 produtos com rótulo bonito | DOM + CSS, sem WebGL |
| **Medida** | `medida.js` | `numeros()`: um número por tela, gigante, contando até o valor, com anel de marcas e o produto atrás. `regua()`: o progresso da página na unidade do ofício (°C, km, andares, horas) | Indústria, autopeças, usinagem, transportadora, energia, construção: quem vende especificação e capacidade | Levíssimo |
| **Carta** | `carta.js` | Figurinha que inclina com o dedo, ganha película holográfica e vira pra mostrar a ficha | Equipe, time, pratos da casa, carros do estoque, lotes, obras entregues | CSS + mola |
| **Troca** | `troca.js` | Uma foto vira a outra com matéria: mancha de tinta que nasce no toque, queima, persiana ou íris. Também anda pela rolagem | Galeria de obras, antes e depois, hero com várias fotos | WebGL puro; sem ele, desvanece |
| **Lista viva** | `lista.js` | Apontar um item da lista monta a cena dele ao lado, e a anterior tomba e cai | Cardápio, serviços, linhas de produto, planos | Levíssimo |
| **Profundidade** | `profundidade.js` | `fila()`: os itens em fila pro fundo da tela; a rolagem traz o próximo pro foco. Modos passarela e túnel | Looks, modelos, pratos, cases, linha do tempo | CSS. Desfoque custa: até 12 itens |
| **Cursor** | `cursor.js` | `cursor()`: rótulo que diz o que o clique faz e botões com ímã. `rastro()`: fotos no caminho do mouse. `lupa()`: segurar pra ampliar, com mouse ou dedo | Acabamento de site visto no computador; lupa em produto com detalhe | Levíssimo |
| **Menu cheio** | `menu.js` | Menu de tela cheia que abre em círculo a partir do botão, com os links entrando em fila | Site com várias páginas | CSS |
| **Acabamento** | `tecnicas.css`, `texto.js` | `.grao` (grão de filme), `.pilha` (cartões que empilham), `.bento` (blocos de tamanhos diferentes), `.placa` (alumínio parafusado), `.sanduiche` (palavra gigante atrás do objeto e o contorno dela na frente), `.selo-giro` (selo redondo com o texto girando), `.meio-tom` (foto em retícula de jornal), `.vidro` (vidro fosco com fio de luz), `.dois-pesos` (grotesca pesada e serifada leve na mesma frase), `data-letreiro` (faixa sem fim), troca de página com `@view-transition` | Qualquer mundo | CSS |

### Material que cada uma precisa

- **Fluxo:** só as cores do mundo (`quente`, `frio`, `fundo`) e de onde o ar sai (`origem`, `direcao`).
- **Partículas:** as formas. Pra silhueta de peça: PNG com fundo transparente (recortar a foto real, ou gerar por IA e recortar). Texto usa a fonte da marca, que precisa estar carregada.
- **Linhas:** um SVG com **traços** (stroke), não contornos. Fontes: planta real do cliente redesenhada, vetor do produto, desenho gerado por código. Cada traço é um elemento; a ordem do arquivo é a ordem do desenho.
- **Zoom contínuo — imagens em cadeia.** Todas na mesma proporção (16:10 padrão). Gerar **de dentro pra fora**:
  1. Gerar a última cena (o detalhe) em alta resolução.
  2. Pra cada cena anterior: reduzir a imagem seguinte `fator` vezes (3,5), colar no centro de uma tela vazia do mesmo tamanho e pedir ao modelo de imagem pra **completar em volta** (outpainting) com a cena mais aberta. O centro tem que continuar idêntico.
  3. Conferir: recortar o centro (1/3,5) da cena N, ampliar e comparar com a cena N+1.
  Sem como fazer outpainting: gerar as cenas soltas e usar `moldura: true` (vira um quadro dentro do outro, com troca suave). Fica bonito, mas não é o plano-sequência.
- **Raio-X — par fora/dentro com o mesmo enquadramento.** Foto real (ou gerada) por fora → editar a mesma imagem pedindo a versão em corte/transparente mostrando os componentes, sem mexer em câmera e contorno. Pontos `x`/`y` em % da imagem. Rotular "ilustração" quando o "dentro" for gerado.
- **Superfície:** foto de textura de perto, bem iluminada e sem gente (o claro vira alto e o escuro vira fundo). Pedir ao cliente a foto da pedra, da chapa, do couro; 1600 px bastam.
- **Pincel:** par antes/depois com o mesmo enquadramento, como no raio-X, ou uma cor sólida no `antes` pra pintar do zero.
- **Território:** planta real redesenhada em SVG (fica leve e nítida em qualquer zoom) ou imagem de pelo menos 2400 px. Lote, unidade ou loja com estado real: mapa desatualizado vende o que não existe.
- **Vinhetas:** a arte de cada vinheta no mesmo traço. Página com tamanho fixo em px (1200 × 1500 funciona), porque a câmera é quem encaixa na tela.
- **Sequência:** comandos de `ffmpeg` no topo do `sequencia.js`. No bruto, câmera parada ou movimento lento: tremido de celular fica pior quando o visitante controla o tempo.
- **Abertura:** logo em SVG. Precisa do `<script>` no `<head>` descrito no topo do arquivo, senão o site pisca antes da cortina.
- **Esteira:** foto do produto de cima, recortada num quadrado transparente, todas com a mesma luz. 6 a 10 itens: com menos, a pista fica vazia.
- **Varal:** objeto recortado com o ponto de pendurar no centro do topo, que é o eixo do balanço.
- **Folha:** imagens do mesmo site, na proporção do quadro. Precisam de contraste: página clara demais some contra o verso.
- **Roda:** produto recortado sem fundo, de frente, todos do mesmo ângulo e com a mesma luz, e uma cor de fundo por item (a do rótulo, escurecida). 5 a 12 itens.
- **Medida:** os números com a fonte de cada um (catálogo, laudo, placa da máquina) e a peça pra ficar atrás: foto recortada, vídeo curto ou desenho técnico.
- **Carta:** retrato ou foto do item em pé (5:7), a mesma luz em todas. Com gente, autorização de imagem.
- **Troca:** 3 a 6 fotos do próprio site (ou de domínio com CORS liberado), de qualquer proporção.
- **Lista viva:** uma cena por item, todas no mesmo enquadramento: foto, vídeo curto em laço ou SVG animado.
- **Profundidade:** itens recortados dão a ilusão de fundo; foto retangular entra como cartão.
- **Lupa:** a mesma foto em versão grande (`data-grande`, uns 2.400 px), senão a lente amplia borrão.

O que faltar dessa lista vira um **pedido de imagens** ao usuário (`../imagens.md`), com o prompt pronto. Não tapar buraco com banco de imagem nem seguir com a caixa vazia.

## Receitas que ainda não estão prontas (montar quando o conceito pedir)

Escrever como módulo novo aqui, com `progresso(p)`, e pôr na bancada `mostruario.html`:

- **Som**: tela de entrada "com som / sem som"; ambiente sutil + clique. Só quando o produto *é* som/sensação (áudio, spa, música). Nunca tocar sem o clique.
- **Nuvem de pontos**: foto de drone ou scan como pontos 3D, com a altura vinda do arquivo LIDAR ou da claridade da imagem. Terraplenagem, agrimensura, loteamento. Base: `particulas.js`.
- **Galeria em disco 3D**: anel de cartões girando em CSS 3D. Cardápio, modelos, coleção.
- **Revelação por rolagem**: a imagem se desenha sob uma máscara de pincel, como uma pintura sendo feita. Base: `pincel.js`.
- **Rodapés-objeto**: folha rasgada presa com alfinete, envelope com barbante, tíquete destacável, assinatura escrita. Base: `linhas.js` e `clip-path`.
- **Metrô de marcos**: linhas de metrô com a foto em cada estação, pra história da empresa ou etapas da obra. Base: `linhas.js`.
- **Escrita à mão**: uma palavra que se escreve traço a traço, como o "hello" da Apple. Base: `linhas.js`.
- **Fundos em shader**: metal líquido, retícula, ASCII, topografia, nanquim. Só quando a matéria for a da empresa.
- **Prateleira que vira página**: os produtos numa prateleira; o tocado sai voando (`voar()`), gira enquanto o rótulo dá a volta e a página dele se monta em volta. Dá pra desenhar os frascos em SVG, sem foto. Base: `fisica.js` e `@view-transition`.
- **Colinas no rodapé**: camadas de morro pintadas em canvas sobem com a rolagem e a mais próxima vira o chão dos links. Sítio, agro, turismo, paisagismo. Base: `palco.js`.
- **Caderno em 3D**: uma dupla de páginas aberta no meio e as outras em pé dos lados; virar traz a próxima. Recados à mão, fotos coladas com fita. Base: `folha.js`.
- **Baralho que tomba**: cartões em pé; a rolagem derruba o da frente no chão e o de trás sobe. Base: `profundidade.js` com `rotateX`.
- **Revoada**: partículas voando como bando de pássaros que pousam formando o nome. Base: `particulas.js`.
- **Coluna fixa com desenho que evolui**: a metade esquerda parada, com o índice e um desenho isométrico em linha que muda a cada seção; a direita rola. Base: `linhas.js` e `position: sticky`.
- **Botão-bloco que vira formulário**: um bloco de cor preso no canto acompanha a página e, no fim, se abre no pedido de orçamento. Base: `position: sticky`.
- **Vidro que entorta**: refração de verdade na beira (filtro SVG `feDisplacementMap`), que só o Chrome desenha. `.vidro` é a versão que funciona em todos.

### Trechos prontos do acabamento novo

```html
<!-- sanduíche: a palavra duas vezes, a segunda só em contorno, por cima do objeto -->
<div class="sanduiche">
  <p class="sanduiche-palavra">POLIDO</p>
  <img class="sanduiche-objeto" src="img/peca.png" alt="…">
  <p class="sanduiche-palavra sanduiche-contorno" aria-hidden="true">POLIDO</p>
</div>

<!-- selo redondo: o texto corre em volta, o miolo é livre -->
<span class="selo-giro">
  <svg viewBox="0 0 120 120" aria-hidden="true"><path id="volta" d="M60 60 m-44 0 a44 44 0 1 1 88 0 a44 44 0 1 1 -88 0" fill="none"/>
    <text><textPath href="#volta">feito na casa · desde 1987 · </textPath></text></svg>
  <b>★</b>
</span>

<div class="meio-tom" style="--ponto: 5px"><img src="img/fabrica.webp" alt="…"></div>
<h1 class="dois-pesos">Ferro <em>e fogo</em></h1>
<div id="regua" class="contraste"></div>   <!-- .contraste: inverte sozinha em site que alterna claro e escuro -->
```

## Padrão de peça premiada

Lido no código de duas peças do 21st.dev. É o que separa "tem animação" de "parece um objeto de verdade". Toda técnica nova segue isso.

**Peso**
- Tempo em passos de ~17 ms e `dt` limitado: a física não explode em celular lento. `laco()` faz isso.
- O laço dorme quando nada se mexe e para fora da tela e com a aba escondida.
- Mola sem passar do ponto pra ir a um lugar, com balanço pra levantar ou pendurar. A mesma velocidade não serve pras duas.
- Mola só se aproxima: mirar além do destino e parar nele faz a peça chegar andando. Sair mais rápido que chegar.
- Ao soltar, passar a velocidade do dedo pra física: não pode ter emenda. Arremesso é média de velocidade, e segurar parado antes de soltar cancela o impulso.

**Mão**
- Só vira arrasto depois de 6 px e se andou mais de lado que de pé. `touch-action: pan-y` no resto: a página continua rolando.
- Objeto que se move embaixo de um mouse parado precisa de teste por conta a cada quadro: o navegador só avisa quando o mouse anda.
- Depois de soltar, nada reage ao mouse até ele andar de novo.
- No toque, o primeiro toque levanta e o segundo abre. Com mouse, passar levanta e clicar abre.
- O canto reage antes do clique: passar perto da beira já levanta um pouco a folha.

**Parecer físico**
- Volume em camadas: sombra borrada, lateral (a mesma forma descida), tampo, detalhes, fio de luz branco de menos de 1 px por cima.
- Escurecer só o objeto com `mask: url(foto.png)`, não um retângulo por cima.
- Perspectiva falsa (escala e achatamento por conta) em vez de 3D, quando basta: roda em qualquer celular.
- Grão preso à matéria, não à tela: o grão do papel anda com o papel.
- Abrir a ficha: o objeto voa em arco de onde estava até lá (`voar()`) e a miniatura some enquanto isso.

**Não quebrar**
- Teclado completo: uma parada de Tab no grupo, setas pra andar, Enter abre, Esc fecha, foco volta ao objeto. `<dialog>` resolve a maior parte.
- Decoração com `aria-hidden` e uma região `aria-live` dizendo o que está na mão.
- "Reduzir movimento" muda o comportamento em vez de desligar: passa a andar item por item.
- Botão de pausa em tudo que se move sozinho. Autoplay pausa onde a pessoa vai agir e para de vez quando ela assume.
- Começar a desenhar na primeira imagem que chegar. Imagem quebrada custa um item, nunca a peça inteira, e sem WebGL mostra a foto.
- Medir o tamanho do próprio bloco com `ResizeObserver`, não o da tela: a peça funciona em coluna estreita.
- Cor com `color-mix` a partir de tinta e fundo: a peça herda o tema do cliente sozinha.

## Regras

- **Uma assinatura.** Duas técnicas de impacto brigam pela atenção. O resto do site é quieto.
- **Celular primeiro:** testar 390 px em pé. Partículas e fluxo já reduzem a quantidade; conferir se o assunto aparece.
- **`prefers-reduced-motion`:** as técnicas param de animar sozinhas; o conteúdo tem que continuar legível.
- **Sem WebGL** (raro): partículas não aparecem. O palco e o texto continuam: o capítulo precisa se sustentar só com texto/foto.
- Pausam fora da tela e com a aba escondida (bateria).
- CDN com versão fixa (three 0.160.0, lenis 1.1.13). Não trocar sem testar a bancada.
