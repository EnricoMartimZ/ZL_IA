# Mundos — sistemas visuais completos

Um mundo é a combinação de **paleta, tipografia, layout, movimento e detalhes** que faz um site ter cara própria.
O conceito (`direcao.md`) escolhe o mundo; a marca do cliente (`/identidade-loja`) dá as cores e a voz dentro dele.
Mundo não é tema de cor: dois sites no mesmo mundo com marcas diferentes ainda são parecidos demais, então
**nunca dois sites seguidos no mesmo mundo** (ver o registro em `direcao.md`).

Fontes: só Google Fonts ou a fonte da própria marca (com licença). As referências pagas viram equivalentes livres.

---

## 1. Noturno cinematográfico — o modelo original

- **Sensação:** filme de produto à noite. Restrição, brilho, drama.
- **Quando:** estética automotiva, barbearia, bar, tatuagem, som automotivo, luxo noturno.
- **Paleta:** quase preto (`#07080b`) + **uma** cor de destaque da marca em degradê sutil + uma segunda só como brilho de fundo.
- **Tipo:** display pesada itálica em MAIÚSCULAS 9–10vw (Archivo 900 itálico, Big Shoulders Display) + mono técnica (JetBrains Mono). Segunda linha do título em contorno.
- **Layout:** hero em capítulos com barra de play; faixa de 4 números; grade de serviços com linhas finas compartilhadas.
- **Movimento:** o hero é o show, o resto quieto (sobe 28 px e aparece).
- **Técnicas:** sequência de cenas de IA (`hero-seq.js`), 3D (`hero3d.js`), mapa noturno (`mapa.js`).
- **É o `modelo/` como está.** Detalhes em `design.md`.

## 2. Laboratório — a ciência por trás

- **Sensação:** ficha técnica bonita. Precisão, prova, confiança. Inspiração: nfinitepaper.com.
- **Quando:** indústria, química, tratamento de água, energia solar, laboratório, dedetização técnica, odontologia, ar-condicionado técnico.
- **Paleta:** começa escuro (a ciência acontecendo) e vira **creme/off-white** (`#f6f3ec`) com texto grafite nos capítulos de prova. Destaque da marca só em dados e no botão.
- **Tipo:** grotesca neutra e grande em caixa normal (Inter Tight 400–600, Geist, Manrope) + mono pra dados (Geist Mono, IBM Plex Mono). Títulos frases inteiras, ponto final, sem maiúsculas gritando.
- **Layout:** **especificações como desenho**: tabela de duas colunas em mono (`UMIDADE  < 0,3 g/m²/dia`) com linha fina entre itens; afirmações gigantes centralizadas ("40% menos carbono."); selos de certificação em linha.
- **Movimento:** a técnica explica o processo (partículas formando camadas, fluxo, linhas). Troca escuro→claro na rolagem.
- **Técnicas:** partículas, fluxo, linhas; texto que decodifica nos rótulos.
- **Detalhe de marca:** etiqueta de amostra ("AMOSTRA 01 · LOTE 2026") em mono.

## 3. Cor cheia — estúdio pop

- **Sensação:** confiança total na marca. Energia, humor, produto como herói. Inspiração: buttermax.net.
- **Quando:** marca com cor forte e jovem: gráfica, comunicação visual, food, sorveteria, pet shop moderno, loja de eletrônicos, academia.
- **Paleta:** **a cor da marca ocupa a tela inteira** (fundo), texto quase preto; seções alternam cor cheia ↔ preto. Esquece "uma cor só em detalhes".
- **Tipo:** grotesca pesada e larga gigante (Bricolage Grotesque 800, Archivo Black, Familjen Grotesk) misturada com uma **assinatura manuscrita/script** na mesma palavra (logo, ou Caveat/Reenie Beanie bem usada) + mono minúscula pros rótulos.
- **Layout:** palavra da marca enorme atravessando a tela; produto/objeto recortado (foto PNG ou 3D) sobreposto ao texto; cards de serviço como "fichas" com objeto em cada.
- **Movimento:** a câmera **entra no objeto** (zoom contínuo nas texturas do produto); ícones animados no topo (logo que se mexe).
- **Técnicas:** zoom contínuo (moldura ou cadeia), raio-X, partículas formando o logo; preloader com o símbolo da marca se deformando.
- **Detalhe de marca:** loader com o símbolo "derretendo"/se montando.

## 4. Galeria pintada — a metáfora contada como quadro

- **Sensação:** museu, cinema de autor. Poucas palavras, muito significado. Inspiração: pear.no.
- **Quando:** serviço de confiança e relação longa: contabilidade, advocacia, consultoria, arquitetura, clínica, escola, imobiliária de alto padrão.
- **Paleta:** a das imagens (pintura, foto editorial). Interface quase invisível: branco/creme e grafite, linhas finíssimas.
- **Tipo:** **serifada** de display (Instrument Serif, Fraunces, Cormorant Garamond, Playfair Display) grande e calma + mono minúscula pros rótulos e navegação.
- **Layout:** tela cheia de imagem; **HUD** discreto (cruzes nos cantos, linha fina atravessando, numeração do capítulo); uma frase por tela; FAQ elegante no fim (é onde mora o texto).
- **Movimento:** **zoom contínuo** entre cenas da metáfora; desfoque → foco ao entrar; nada pula.
- **Técnicas:** zoom contínuo (cadeia), texto palavra a palavra, HUD.
- **A metáfora vem do nome ou do ofício** (enxerto = parceria; balança; farol; raiz; ponte). As imagens são geradas por IA no mesmo estilo (pintura renascentista, gravura, fotografia de época) e rotuladas.

## 5. Planta técnica — o projeto

- **Sensação:** prancheta, compasso, precisão. Inspiração: alche.studio.
- **Quando:** arquitetura, engenharia, construtora, serralheria, marcenaria, móveis planejados, gesso, vidraçaria, elétrica, topografia.
- **Paleta:** fundo **preto** ou **azul-planta** (`#0d2a4a`) ou **papel** (`#efece5`) + traço numa cor só (branco, ciano-planta, grafite). Destaque da marca só no botão.
- **Tipo:** mono em tudo que é rótulo (IBM Plex Mono, Space Mono) + uma grotesca técnica (Space Grotesk, Archivo) ou serifada fina pros títulos.
- **Layout:** grade visível (colunas em linha fina), cotas, numeração de prancha ("PR-03 · VISTA FRONTAL"), carimbo de projeto no rodapé com os dados da empresa (CREA, endereço) — o carimbo É o rodapé.
- **Movimento:** **linhas se construindo** na rolagem (o projeto se desenha, depois a foto real da obra aparece por cima "preenchendo").
- **Técnicas:** linhas + `construcao()`, raio-X (planta × obra pronta), HUD.

## 6. Instrumento — painel de precisão

- **Sensação:** equipamento de ponta, sinal, frequência. Inspiração: aether1.ai.
- **Quando:** segurança eletrônica, monitoramento, TI/redes, áudio, internet/provedor, telemetria, climatização inteligente.
- **Paleta:** azul-noite/grafite (`#0a1119`), traços em azul-gelo, um ponto de cor viva para "sinal ativo".
- **Tipo:** mono como voz principal (Azeret Mono, JetBrains Mono) entre colchetes (`[ SINAL ATIVO ]`) + grotesca leve (Manrope 300–500) pras frases.
- **Layout:** diagrama circular central (anéis, radar, órbitas) com rótulos em volta; contador de carregamento em porcentagem; pouquíssimas seções, cada uma um "modo" do instrumento.
- **Movimento:** anéis pulsando, radar varrendo, números que decodificam; opcional: **tela de entrada com som**.
- **Técnicas:** partículas (forma `aneis`), texto que embaralha, HUD; receita de som.

## 7. Ambiente — o elemento natural

- **Sensação:** respirar. O lugar onde o serviço acontece (mar, céu, campo, água). Inspiração: seasats.com.
- **Quando:** piscinas, náutica, energia solar, paisagismo, agro, turismo, limpeza de caixa d'água, purificação de ar.
- **Paleta:** **degradês do próprio ambiente** (verde-água → pêssego do pôr do sol; azul-céu → branco) que **mudam a cada capítulo**; cada capítulo tem sua cor e o menu mostra isso.
- **Tipo:** sans suave e larga (Manrope, Figtree, Onest) + mono pros dados.
- **Layout:** **trilho de índice** lateral com os capítulos coloridos; produto com raio-X e pontos "+"; tabela de especificações; casos reais arrastáveis ("Missões", "Obras", "Instalações").
- **Movimento:** o fundo troca de cor suavemente com a rolagem; fluxo leve (água/ar) atrás dos títulos.
- **Técnicas:** fluxo (calmo), raio-X, palco com `--p` animando o degradê.

## 8. Editorial impresso — revista

- **Sensação:** jornal de domingo, revista de arquitetura. Autoridade calma.
- **Quando:** advocacia, contabilidade, consultoria, médicos, imobiliária, escola, livraria, restaurante de autor.
- **Paleta:** papel (`#f4f1ea`) + preto + **uma** cor editorial (vermelho tijolo, verde garrafa, azul tinta).
- **Tipo:** serifada de texto e display (Newsreader, Source Serif 4, Fraunces) com itálico expressivo + grotesca pequena pros créditos.
- **Layout:** grid de revista com colunas assimétricas, números de página, capitulares, fotos P&B com legenda, citações grandes de clientes como manchetes.
- **Movimento:** mínimo — texto entra palavra a palavra; fotos revelam de cima pra baixo.
- **Técnicas:** texto; zoom contínuo com moldura para "abrir" uma foto.

## 9. Luz natural — a manhã entrando pela janela

- **Sensação:** cozinha às sete da manhã. Calor de casa, nada de vitrine.
- **Quando:** padaria, café, confeitaria, pousada pequena, decoração, móveis, cerâmica, floricultura, empório, restaurante de almoço e jantar.
- **Paleta:** creme quente, madeira e **uma** cor viva (coral, terracota). Sem branco puro nem preto puro. A noite é azul-tinta, não preta.
- **Tipo:** serifada óptica leve (Fraunces 300, Newsreader) + mono pequena só pras horas.
- **Layout:** poucas frases grandes embaixo, muito ar em cima pra sombra aparecer. Foto com luz de janela de verdade, sem flash.
- **Movimento:** a mancha de sol e a sombra de folhas andam na parede; a página clareia e depois anoitece com a rolagem.
- **Técnicas:** `luz.js`; sequência (massa crescendo, forno abrindo); texto.
- **Detalhe de marca:** a hora em cada capítulo ("5h40"), como um diário do dia.

## 10. Catálogo industrial — tudo tem número

- **Sensação:** manual de fábrica impresso. O estoque é o espetáculo. Inspiração: catálogos suíços do Refero, teenage engineering.
- **Quando:** ferragens, autopeças, distribuidora, material de construção, parafusos, ferramentas, peças de reposição, tudo que vende pelo tamanho do catálogo.
- **Paleta:** concreto (`#e2e0da`) + preto + **um** laranja ou amarelo industrial, usado só no item em destaque.
- **Tipo:** grotesca condensada enorme (Archivo Narrow 700, Barlow Condensed) + mono em tudo que é dado (IBM Plex Mono).
- **Layout:** grade de 12 colunas visível, cabeçalho de edição ("CATÁLOGO GERAL · 14.200 ITENS"), número de página, fichas com código, medida e estoque. Desenho técnico em vez de foto.
- **Movimento:** quase nenhum: a fileira de fichas arrasta com inércia; filtros trocam a grade.
- **Técnicas:** `arrastar.js` (faixa), linhas nas peças, texto (`data-contar` no estoque).
- **Detalhe de marca:** cada seção com número de página; o item em oferta ganha a ficha colorida.

## 11. Cartaz de bairro — a loja que grita na calçada

- **Sensação:** mercado de sábado, cartaz pintado à mão. Brasileiro, alegre, sem vergonha de vender.
- **Quando:** mercado, açougue, sacolão, lanchonete, pizzaria de bairro, loja de roupa popular, feira, oficina simples.
- **Paleta:** amarelo-oferta + vermelho + branco de cartolina. Cores de placa, não de marca de luxo.
- **Tipo:** letra de cartazista (Caveat Brush, Rubik Mono One bem usada) + preço em grotesca muito pesada (Bowlby One).
- **Layout:** palavra enorme atravessando a tela, cartazes tortos colados, faixa de oferta correndo no topo, preço maior que o nome do produto.
- **Movimento:** letreiro correndo; cartazes endireitam ao passar o dedo.
- **Técnicas:** `data-letreiro`; o conteúdo de verdade é a lista de ofertas da semana, fácil de trocar.
- **Detalhe de marca:** frases de balcão reais do dono ("Fiado só amanhã"). Preço fictício nunca: sem preço real, deixar a oferta sem número.

## 12. Quadrinho — a marca vira personagem

- **Sensação:** gibi aberto na mesa. Humor e história. Inspiração: Santioni Spirits (Awwwards).
- **Quando:** cervejaria, hamburgueria, sorveteria, escola, curso infantil, brinquedos, pet, qualquer marca que tenha uma história engraçada pra contar.
- **Paleta:** cores chapadas com retícula (pontinhos), contorno preto grosso, papel branco.
- **Tipo:** onomatopeia em Bangers, balões em Comic Neue Bold. Só aqui essas fontes são permitidas.
- **Layout:** uma página de HQ de verdade. A câmera guia de vinheta em vinheta e, no fim, se afasta e mostra a página inteira, que é o momento do botão.
- **Movimento:** vinhetas se abrem de lados diferentes; balões entram com salto.
- **Técnicas:** `vinhetas.js`; arte gerada por IA no mesmo traço e rotulada, ou ilustrador.
- **Detalhe de marca:** o dono ou o produto como personagem. Combinar com a pessoa antes de desenhá-la.

## 13. Álbum — quem esteve aqui sabe

- **Sensação:** fotos espalhadas numa mesa. Memória, afeto, gente de verdade. Inspiração: estilo "polaroids no caderno" do Refero.
- **Quando:** escola, creche, buffet, fotógrafo, ONG, igreja, pet shop de bairro, clube, time, qualquer lugar cuja prova é a comunidade.
- **Paleta:** papel quadriculado claro + as cores das próprias fotos; fita adesiva amarelada.
- **Tipo:** manuscrita legível (Caveat 700) pras legendas + uma serifada simples pro texto.
- **Layout:** a primeira dobra é a mesa com as fotos soltas. O visitante pega, move e joga de lado. Fotos reais são obrigatórias: esse mundo não funciona com banco de imagem.
- **Movimento:** arrastar com giro leve; a foto pega vai pra frente.
- **Técnicas:** `arrastar.js` (mesa). Pedir autorização de imagem, principalmente com criança.
- **Detalhe de marca:** legendas escritas com as palavras da própria escola ou família.

## 14. Museu de objetos — cada peça com sua ficha

- **Sensação:** sala branca de museu com três coisas no mundo. Inspiração: "museu flutuante de curiosidades" do Refero.
- **Quando:** relojoaria, joalheria, ótica, antiquário, sebo, ateliê de sapatos, marcenaria fina, instrumentos musicais.
- **Paleta:** branco e preto; a cor vem do objeto. Sombra suave embaixo de cada peça.
- **Tipo:** serifada de display fina e itálica (Cormorant Garamond 300) + mono mínima nas etiquetas (Space Mono).
- **Layout:** poucas peças por sala, muito vazio, etiqueta de museu ("Nº 03 · Anel em ouro 18k · Pedra lapidada na casa"). Foto recortada sem fundo ou 3D.
- **Movimento:** objetos flutuam devagar; ao tocar, abre a ficha ou o raio-X.
- **Técnicas:** `raiox.js`, 3D (`hero3d.js`), `arrastar.js` (faixa) pra andar entre as salas.
- **Detalhe de marca:** numeração de acervo e o ano de cada peça.

## 15. Cartografia — o site é um lugar

- **Sensação:** abrir um mapa e sair andando. Inspiração: Overworld Audio e Colonia Zacamil (Awwwards).
- **Quando:** loteamento, condomínio, imobiliária de lançamento, rede de lojas, fazenda, sítio de eventos, turismo, escola com campus, empresa com obras pela região.
- **Paleta:** papel de mapa, verdes e azuis de carta topográfica, e uma cor por estado (livre, reservado, vendido).
- **Tipo:** serifada de atlas (Fraunces) + grotesca pequena nos rótulos.
- **Layout:** o mapa ocupa quase a tela toda e **é** a navegação. Ficha discreta no canto com o que foi tocado e o botão de pedir.
- **Movimento:** voar até o ponto, arrastar, aproximar. Com palco, vira passeio guiado pela rolagem.
- **Técnicas:** `territorio.js`, com mapa desenhado em SVG a partir da planta real. Rotular "ilustração fora de escala" quando for o caso.
- **Detalhe de marca:** cada quadra, unidade ou loja com nome próprio e estado atualizado de verdade.

## 16. Cartaz tipográfico — só a palavra

- **Sensação:** cartaz suíço. Coragem. **É o mundo de quem não tem foto boa.**
- **Quando:** advocacia, consultoria, escola de idiomas, academia, psicologia, empresa nova, qualquer um com posicionamento forte e pouco material.
- **Paleta:** papel + preto + **um** vermelho. Nada mais.
- **Tipo:** uma condensada gigante (Anton, Oswald 700, Big Shoulders Display) ocupando a tela. Uma família só.
- **Layout:** frases cortadas pela borda, tela cheia de letra, nenhuma imagem.
- **Movimento:** as linhas correm em sentidos opostos com a rolagem (`--p`). Não precisa de mais nada.
- **Técnicas:** palco + `--p`, `data-letreiro`, `data-dividir`.
- **Detalhe de marca:** o texto é o design: exige uma frase que só aquela empresa diria.

## 17. Produto vivo — o sistema trabalhando na tela

- **Sensação:** o software já funcionando antes do cadastro. Inspiração: Godly (SaaS, fintech), Refero (Linear, Raycast, Ramp).
- **Quando:** software, app, fintech, sistema próprio de escola ou clínica, contabilidade digital, delivery próprio, qualquer empresa cujo produto é uma tela.
- **Paleta:** uma cor cheia e confiante (cobalto, verde-lima) no fundo + cartões brancos; ou grafite com **uma** luz.
- **Tipo:** grotesca neutra apertada (Inter Tight 600, Geist) + mono em rótulos.
- **Layout:** blocos de tamanhos diferentes (`.bento`), cada um mostrando uma tela real: número subindo, conversa acontecendo, gráfico. Prova social de clientes logo abaixo.
- **Movimento:** a interface se mexe sozinha, como se alguém a usasse.
- **Técnicas:** `.bento`, `controle.js` (simular plano ou preço), `data-contar`.
- **Detalhe de marca:** dados da demonstração rotulados como exemplo.

## 18. Luxo silencioso — quase nada acontece

- **Sensação:** recepção de hotel pequeno às quatro da tarde. Inspiração: Odyssée e Tengile MalaMala (Awwwards).
- **Quando:** pousada, clínica de estética, spa, dermatologia, imobiliária de alto padrão, arquitetura de interiores.
- **Paleta:** off-white quente (`#fbf8f3`), taupe, pedra. Nenhuma cor de destaque; o botão é um contorno.
- **Tipo:** serifada de alto contraste muito leve (Cormorant Garamond 300, Newsreader) + grotesca pequena.
- **Layout:** imagem em moldura com forma (arco, retângulo alto), listas numeradas entre parênteses "(1)", muito espaço. Vídeo lento em vez de carrossel.
- **Movimento:** abertura longa e calma; água ou pano se mexendo de leve; transições lentas.
- **Técnicas:** `superficie.js` (água), `abertura.js`, texto palavra a palavra.
- **Detalhe de marca:** o que **não** tem ("Doze quartos, nenhum televisor"). A falta é o argumento.

## 19. Vitrine viva — o produto é a interface

- **Sensação:** um estúdio branco com os objetos da loja de verdade, ao alcance da mão. Inspiração: peças de DHxWhy no 21st.dev.
- **Quando:** loja de iluminação, decoração, restaurante, moda, ótica, papelaria, adega, ferramentas, qualquer um com produto bonito e pouca variedade.
- **Paleta:** off-white (`#f7f6f3`) e preto; a cor vem dos objetos. A sala pode escurecer quando algo acende.
- **Tipo:** grotesca média bem apertada (Inter Tight 500) + mono minúscula em caixa alta pro rótulo acima do título.
- **Layout:** rótulo mínimo, uma frase no formato "uma loja de X que você Y", o objeto ocupando a tela e uma legenda embaixo que muda com o que está na mão. Sem grade de cards.
- **Movimento:** física de verdade: balança, gira, levanta, arremessa. Nada de animação decorativa.
- **Técnicas:** `varal.js`, `esteira.js`, `arrastar.js`. Fotos recortadas com fundo transparente, todas com a mesma luz.
- **Detalhe de marca:** o elogio da peça é a frase-título. Se a frase não fecha, o objeto escolhido está errado.

## 20. Painel mecânico — máquina que funciona

- **Sensação:** painel de oficina, rodoviária antiga, bomba de gasolina. Metal, número e confiança.
- **Quando:** transportadora, oficina, auto elétrica, estacionamento, posto, rodoviária, bar, barbearia clássica, gráfica antiga.
- **Paleta:** preto fosco ou verde-oficina, creme de mostrador e **um** vermelho ou âmbar de luz-piloto. Alumínio escovado nos selos.
- **Tipo:** mono pesada nos mostradores (JetBrains Mono 700, IBM Plex Mono) + grotesca condensada nos títulos.
- **Layout:** quadro de saídas com o que está acontecendo hoje, contadores em tambor, selos como placas parafusadas, botões grandes. A informação real é o enfeite.
- **Movimento:** palhetas caindo, tambores girando no vácuo, ponteiro assentando.
- **Técnicas:** `placar.js`, `.placa`, `controle.js` (dial). Dado do quadro precisa ser verdadeiro e atualizado: placar parado em dado velho é pior que nenhum.
- **Detalhe de marca:** a frota, os anos e os quilômetros reais no odômetro.

---

## Como aplicar a marca do cliente dentro do mundo

1. Cores da marca (`marca.json`) entram **no papel que o mundo dá**: no Cor cheia, a cor da marca é o fundo; no Laboratório, é o dado e o botão; no Ambiente, ela entra como um dos capítulos do degradê.
2. A fonte da marca entra se tiver licença e combinar com o papel (título ou rótulo). Senão, usar a do mundo e manter a da marca só no logo.
3. O logo é sempre o original (`/identidade-loja`). O detalhe de marca do mundo (loader, carimbo, etiqueta) usa o símbolo do logo.
