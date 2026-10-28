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

---

## Como aplicar a marca do cliente dentro do mundo

1. Cores da marca (`marca.json`) entram **no papel que o mundo dá**: no Cor cheia, a cor da marca é o fundo; no Laboratório, é o dado e o botão; no Ambiente, ela entra como um dos capítulos do degradê.
2. A fonte da marca entra se tiver licença e combinar com o papel (título ou rótulo). Senão, usar a do mundo e manter a da marca só no logo.
3. O logo é sempre o original (`/identidade-loja`). O detalhe de marca do mundo (loader, carimbo, etiqueta) usa o símbolo do logo.
