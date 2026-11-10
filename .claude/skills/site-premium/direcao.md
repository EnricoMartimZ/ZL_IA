# Direção criativa — um conceito por empresa

O site premium não sai de um modelo com as cores trocadas. Cada empresa ganha **um conceito**: uma ideia
tirada do que ela faz (ou do nome dela) que decide o mundo visual, a técnica-assinatura, a interação e a
história. É isso que os sites de referência (`referencias.md`) têm em comum: nenhum deles poderia ser de
outra empresa.

O `modelo/` continua sendo a **infraestrutura** (agenda/orçamento no WhatsApp, SEO, JSON-LD, medição, LGPD,
página de serviço, mapa). A **cara** é feita do zero a partir do conceito, com as peças de `tecnicas/` e as
regras do mundo escolhido (`mundos.md`).

---

## Passo A — Matéria-prima (10 minutos, antes de pensar em tela)

Responder por escrito, em `clientes/<Nome>/conceito.md` (ou `vendas/demos/<slug>/conceito.md` na demo):

1. **O que a empresa transforma ou move?** Não o serviço, a *matéria*: ar, calor, metal, papel e tinta, água, luz, pedra, tempo, sinal, papelada, dor. (Ar-condicionado move *ar* e *calor*. Gráfica move *tinta* sobre *papel*. Contabilidade move *papelada* até virar *tranquilidade*.)
2. **O que o cliente sente antes e depois?** Uma palavra cada (abafado → leve; inseguro → vigiado; perdido → em ordem).
3. **O que o nome ou o logo sugere?** Às vezes o conceito está ali (um nome de árvore, de pedra, de animal, uma sigla com som).
4. **Qual é a prova física?** Números reais, certificações, máquinas, anos, obras, avaliações.
5. **Onde o cliente decide?** (celular no Instagram, comprador de empresa no desktop, síndico no WhatsApp) — decide o peso da técnica.
6. **Que material existe de verdade?** Fotos boas, vídeo, logo em vetor, planta, catálogo, histórias. Decide quais mundos são possíveis (ver "Sem foto boa", abaixo).

## Passo A2 — Ler o cliente e abrir o leque

O melhor design é o que serve **àquela** empresa. Antes dos conceitos, responder no mesmo `conceito.md`:

| Pergunta | Se a resposta for | Então |
|---|---|---|
| Quem decide, e onde? | Consumidor no celular, vindo do Instagram | Interação de dedo, uma técnica leve, botão logo na primeira tela |
| | Comprador de empresa, no computador | Número, ficha, catálogo, prova. O espetáculo é a informação |
| | Cliente de alto padrão | Silêncio, imagem grande, quase nenhum movimento |
| Quanto custa errar a compra? | Pouco, é impulso | Ousadia alta: cor cheia, humor, objeto na mão |
| | Muito, é pensado | Ousadia baixa ou média, com a prova na frente |
| Qual é a prova mais forte? | O produto é bonito | O objeto é a interface, roda, vitrine |
| | Números, certificações, capacidade | Medida, placar, Dossiê, Laboratório |
| | Gente e comunidade | Álbum, Figurinhas |
| | O lugar | Cartografia, Luz natural |
| | O processo | Do bruto ao pronto, sequência, zoom |
| Que material existe? | Foto boa | Qualquer mundo |
| | Quase nada | Mundo sem foto, ou pedido de imagens (`imagens.md`) |
| O que os concorrentes da cidade fazem? | Todos iguais (abrir três) | O conceito tem que ser o contrário visível deles |
| Como é o dono? | Brincalhão, técnico, tradicional | A voz do site é a dele. Site que o dono tem vergonha de mostrar não vende |

**Nota de ousadia**, de 1 a 5, anotada no conceito:

- **1 e 2** (advocacia, contabilidade, saúde, B2B pesado): Editorial, Dossiê, Laboratório, Luxo silencioso. O truque é tipografia e ordem.
- **3** (clínica estética, arquitetura, restaurante, indústria com produto bonito): uma assinatura forte e o resto quieto.
- **4 e 5** (hamburgueria, sorveteria, pet, academia, marca jovem): Cor cheia, Quadrinho, Cartaz de bairro, Figurinhas. Pode ter humor.

Dos três conceitos, um fica na nota do cliente, um fica um ponto acima e um é a aposta: **o seguro, o certo e o ousado**.

### Motores de ideia

Pra sair do óbvio, passar a matéria-prima do Passo A por **pelo menos quatro** destes e escrever uma linha pra cada um. Os conceitos saem daí:

1. **O objeto é a interface:** o que a empresa vende está na tela pra pegar (tabela mais abaixo).
2. **O documento do ofício:** o site toma a forma de um papel que a empresa já usa. Ordem de serviço, romaneio, etiqueta de peça, laudo, comanda, receita, prancha, bilhete de embarque.
3. **A régua do ofício:** a unidade da empresa mede a página. °C, km, mm, andares, horas, quilos (`regua()`).
4. **A ferramenta na mão:** o dedo vira o pincel, a lixa, a lanterna, a lupa, o maçarico.
5. **A escala:** do bairro ao mícron, da fazenda ao grão.
6. **O tempo:** um dia, uma safra, uma obra, quarenta anos.
7. **O avesso:** o que ninguém vê. Por dentro, o bastidor, o estoque, a cozinha.
8. **A falta:** o que não tem vira o argumento.
9. **O nome:** a metáfora que já mora no nome ou no logo.
10. **A coleção:** cada item é único e numerado.
11. **O placar de hoje:** o que está acontecendo agora (a fornada, as saídas, as vagas), com dado de verdade.
12. **O som e o gesto:** o barulho e o movimento do ofício, sempre opcional.

## Passo B — Três conceitos, o usuário escolhe um

Escrever **três conceitos bem diferentes entre si** (mundos diferentes, técnicas diferentes) e mostrar ao usuário
antes de construir. Formato de cada um:

```
CONCEITO — <nome curto>
Metáfora: <uma frase: "o site é ___">
Norte: <lugar + material + luz, ex.: "balcão de madeira às sete da manhã, farinha no ar">
Mundo: <mundos.md>          Técnica-assinatura: <tecnicas/>      Interação: <o que o visitante FAZ>
Estrutura: <ver "Estruturas de história">
História (capítulos): 1 … → 2 … → 3 … → 4 …
Tipografia: <título> + <rótulo>     Paleta: <papel de cada cor da marca>
Detalhe de marca: <loader, carimbo, etiqueta, cursor…>
Não vai ter: <o que fica de fora de propósito>
Por que vende: <ligação com o que o cliente compra>
Ousadia: <1 a 5>     Motor: <de qual motor de ideia saiu>
Imagens que faltam: <nenhuma, ou a lista que vira pedido de imagens>
```

**Interação** é o que torna o site memorável: ligar o raio-X, arrastar o termostato e ver o ar mudar, limpar
o sofá com o dedo, escolher o lote no mapa, mover as fotos da mesa, girar a peça, ouvir o produto, desenhar a
planta rolando. Todo conceito precisa de uma.

**Norte** é o teste do mundo: se a frase não dá pra imaginar com os olhos fechados, ela ainda é adjetivo
("moderno, elegante, clean") e o site vai sair genérico. Lugar, material e luz, sempre.

### Estruturas de história

O mundo diz como o site parece; a estrutura diz como ele anda. Não usar sempre "antes → depois".

| Estrutura | Como anda | Serve pra |
|---|---|---|
| **Transformação** | do problema ao alívio | climatização, limpeza, reforma, estética |
| **Um dia com** | manhã → tarde → noite, a hora muda a cena | padaria, restaurante, pousada, carro, academia |
| **Do bruto ao pronto** | a matéria passa pelas etapas | metalúrgica, marcenaria, gráfica, cervejaria, confecção |
| **Mergulho** | do bairro ao detalhe microscópico | usinagem, joalheria, dermatologia, química |
| **Lugar** | não há ordem: o visitante explora | loteamento, rede de lojas, fazenda, turismo |
| **Consulta** | catálogo pra achar e pedir | autopeças, ferragens, distribuidora, cardápio |
| **Coleção** | uma peça de cada vez | relojoaria, antiquário, portfólio de obras |
| **Personagem** | alguém vive a história em cenas | cervejaria, escola, pet, marca com humor |
| **Prova** | números, selos e casos em escalada | contabilidade, advocacia, B2B pesado, certificados |

### O objeto é a interface

O melhor padrão achado no 21st.dev: em vez de falar do produto, a página **é** o produto. Teste da frase: "uma loja de ___ que você ___, aqui na página". Luminárias que você acende. Um cardápio que dá voltas. Se a frase fecha, o site já tem conceito. Se não fecha, procurar outro objeto.

| Ramo | Objeto na tela | O visitante | Técnica |
|---|---|---|---|
| Iluminação | pendentes num trilho | passa a mão e acende, a sala escurece | `varal` com `acender` |
| Restaurante / rodízio / pizzaria | pratos numa esteira | para, gira, escolhe, pede | `esteira` |
| Moda / uniformes | cabides numa arara | empurra e vê a peça balançar | `varal` |
| Ferragens / ferramentas | painel perfurado | pega a ferramenta do gancho | `varal` + `mesa` |
| Gráfica / papelaria / catálogo | folhas impressas | vira a página com o dedo | `folha` |
| Galeria / fotógrafo / molduras | quadros na parede | rearranja, abre a ficha | `varal` |
| Equipe de qualquer empresa | crachás pendurados | vira e lê quem é | `varal` com `virar` |
| Pousada / hotel | quadro de chaves | pega a chave do quarto | `varal` com `virar` |
| Oficina / transportadora | quadro de saídas, odômetro | vê o que sai hoje | `placar` |
| Limpeza / funilaria | a peça suja | limpa com o dedo | `pincel` |
| Loteamento / rede de lojas | o mapa | anda até o lugar | `territorio` |
| Clientes e certificações | placas parafusadas | só olha: já é prova | `.placa` |
| Conservas / cervejas / cosméticos / cafés | os potes numa roda | gira e escolhe pelo rótulo | `roda` |
| Autopeças / usinagem / indústria | a peça e os números dela | rola e lê a ficha, um número por tela | `medida` |
| Time / escolinha / academia / equipe | figurinhas | inclina, vira, completa o álbum | `carta` |
| Cafeteria / bar / lista de serviços | o cardápio | aponta e vê servir | `lista` |
| Moda / carros / pratos | a passarela | rola e o próximo vem pra frente | `profundidade` |
| Joalheria / relojoaria / calçados | a peça de perto | segura e amplia | `lupa` |
| Fotógrafo / gráfica / reforma | as fotos | toca e uma vira a outra em tinta | `troca` |

### Sem foto boa

Boa parte das empresas pequenas não tem foto que aguente tela cheia. Antes de pedir ensaio ou gerar imagem,
considerar os mundos que não dependem disso: **Cartaz tipográfico**, **Cartaz de bairro**, **Quadrinho**,
**Catálogo industrial**, **Planta técnica**, **Instrumento** e **Laboratório**. **Álbum**, **Luxo silencioso**,
**Luz natural** e **Galeria pintada** dependem de imagem boa: sem ela, escolher outro.

Quando o conceito certo depende de uma imagem que não existe, não desistir dele calado nem improvisar: fazer o
**pedido de imagens** (`imagens.md`), com o prompt de cada uma pronto e o plano B, e deixar o usuário decidir.

### Banca antes de mostrar

Cada conceito passa por seis testes. Reprovou em um, refazer antes de mostrar:

1. **Troca de logo:** com o logo do concorrente, o site ainda faria sentido? Se sim, é genérico.
2. **Olhos fechados:** o norte dá pra imaginar? Lugar, material e luz, sem adjetivo.
3. **Polegar:** a interação funciona com um dedo, no celular em pé?
4. **Dono:** ele mostraria esse site com orgulho pro cliente dele?
5. **Material:** as imagens existem? Se não, o pedido de imagens (`imagens.md`) já está escrito, com o plano B?
6. **Júri:** dar nota de 0 a 10 em design (peso 4), usabilidade (3), criatividade (2) e conteúdo (1). Média abaixo de 7 não vai.

## Passo C — Não repetir

Antes de mostrar os três, ler o registro local **`clientes/_conceitos.md`** (fica só neste computador). Um conceito
novo **não pode repetir, em relação aos 3 últimos sites**:

- o mesmo **mundo**;
- a mesma **técnica-assinatura**;
- o mesmo **par tipográfico**;
- a mesma **estrutura de primeira dobra** (ex.: "título gigante à esquerda + objeto à direita");
- a mesma **estrutura de história**, entre dois sites seguidos.

Depois de aprovado, acrescentar uma linha no registro:

```
| data | ramo (genérico) | conceito | mundo | técnica | par tipográfico | primeira dobra | pasta |
```

## Passo D — Primeira dobra antes do resto

Construir só o **palco de abertura** (primeira dobra + o primeiro capítulo da técnica) e mostrar ao usuário.
Aprovado, o resto do site segue o mesmo sistema. Conceito que não convence na primeira dobra não melhora
com mais seções.

---

## Regras do conceito

- **Um truque, profundo.** Uma técnica-assinatura bem feita, ligada à história, vale mais que cinco efeitos. O resto do site é quieto e serve a ela.
- **O movimento significa algo.** O ar esfria *porque* o serviço é climatização; a planta se desenha *porque* a empresa projeta. Efeito sem significado é enfeite: cortar.
- **Pouco texto, muito específico.** Frases curtas que só aquela empresa diria. Números reais.
- **A técnica nunca esconde a conversão.** O botão de agendar/pedir orçamento aparece cedo e fica fácil no celular.
- **Celular é o palco principal** em loja local: a interação precisa funcionar com o dedo (raio-X por toque, termostato arrastável).
- **Honestidade:** imagem gerada por IA, 3D e "dentro do produto" ilustrado são rotulados.
- **Nada de nome de cliente em arquivo versionado**: o conceito e o registro ficam em `clientes/` e `vendas/` (locais).

---

## Ideias por ramo (ponto de partida, não receita)

Dois caminhos por ramo, em mundos diferentes. Inventar um terceiro a partir do Passo A é sempre melhor.
Escolher pelo que mais combina com o ramo e com a empresa, nunca pela técnica mais nova ou mais vistosa.

| Ramo | Matéria | Caminho 1 | Caminho 2 |
|---|---|---|---|
| Ar-condicionado / climatização | ar, calor | **Do abafado ao leve** — Laboratório; *fluxo* quente→frio na rolagem; termostato arrastável muda o ar; ficha técnica em mono | **Por dentro do split** — Instrumento; *raio-X* do aparelho (serpentina, filtro, dreno) com pontos "+" do que a higienização limpa; anéis = BTUs |
| Energia solar | luz, fótons | **O caminho do sol** — Ambiente; degradê do amanhecer ao meio-dia por capítulo; *partículas* (fótons) caindo e virando a conta de luz zerada | **A conta que encolhe** — Laboratório; arrastar a conta de luz e ver painéis/economia; especificações e garantia em mono |
| Segurança eletrônica | olhar, perímetro | **Vigília** — Instrumento; radar varrendo o mapa do bairro, rótulos de câmera em colchetes, *texto que decodifica* | **Planta protegida** — Planta técnica; *linhas* desenham o imóvel e os pontos de câmera/sensor; raio de cobertura |
| Gráfica / comunicação visual | tinta, papel | **CMYK** — Cor cheia; as quatro cores entram uma a uma e formam a imagem (*partículas* por cor); cursor-pincel | **Da prova à fachada** — Galeria pintada; *zoom contínuo* da fachada da cidade até a fibra do papel impresso |
| Serralheria / estruturas metálicas | metal, solda | **Faísca** — Noturno; *partículas* como fagulhas que formam a peça; luz de solda | **Projeto e aço** — Planta técnica; *linhas* desenham o portão/estrutura, depois a foto real preenche |
| Usinagem / metalúrgica | metal, precisão | **Mícron** — Laboratório; *zoom contínuo* da fábrica até a peça e até a tolerância medida; especificações | **Peça girando** — Cor cheia; peça (PNG/3D) com *raio-X* das cotas |
| Transportadora / logística | rota, tempo | **Rede** — Instrumento; mapa com *fluxo* de rotas acendendo cidades; prazos em mono | **Uma carga, uma história** — Galeria pintada; *zoom contínuo* da carga ao destino |
| Contabilidade | papelada, ordem | **Do caos à ordem** — Laboratório; *partículas* de papéis soltos que se alinham numa grade | **Livro-razão** — Editorial impresso; colunas de revista, números que contam |
| Advocacia | causa, proteção | **Pilar** — Editorial impresso; serifada, citações como manchete | **Balança** — Galeria pintada; metáfora pintada em *zoom contínuo* |
| Marmoraria | pedra, veio | **O veio** — Museu de objetos; *superfície* (relevo) sobre a foto real da pedra, a luz segue o dedo | **Bloco à bancada** — Planta técnica; *linhas* do corte + foto preenchendo |
| Vidraçaria | luz, transparência | **Refração** — Laboratório claro; *superfície* (vidro), o dedo limpa uma janela na foto | **Vão aberto** — Planta; *linhas* do caixilho, depois a vista atrás do vidro |
| Construtora / arquitetura | espaço | **Prancha** — Planta técnica; *linhas* + carimbo no rodapé | **Do terreno à chave** — Galeria; *zoom contínuo* da obra |
| Móveis planejados | madeira, medida | **Sob medida** — Planta técnica; o ambiente se desenha e ganha textura | **Gaveta aberta** — Cor cheia; *raio-X* do armário (organização interna) |
| Dedetizadora | invisível, proteção | **O que você não vê** — Instrumento; *raio-X* da casa mostrando onde ficam as pragas; varredura | **Barreira** — Laboratório; *partículas* que formam a barreira em volta da casa |
| Clínica estética / dermatologia | pele, luz | **Textura** — Galeria (serifada, fotos macro); *zoom contínuo* até a pele | **Protocolo** — Laboratório; etapas como ficha técnica |
| Odontologia | sorriso, precisão | **Escala** — Laboratório; *linhas* do alinhamento | **Raio-X** — Instrumento; raio-X dentário estilizado |
| Ótica | visão, foco | **Foco** — Ambiente; desfoque → foco na rolagem (CSS `filter` com `--p`) | **Lente** — Cor cheia; *raio-X* = olhar através da lente |
| Pet shop | cuidado, cheiro | **Banho** — Cor cheia; *partículas* de espuma que formam o pet | **Diário do pet** — Editorial; fotos reais grandes |
| Estética automotiva | brilho | **Noturno cinematográfico** (o modelo) | **Por baixo da pintura** — *raio-X* da lataria (vitrificação, camadas) |
| Barbearia / salão | lâmina, ritual | **Ritual** — Editorial em preto e um metal | **Navalha** — Noturno com *linhas* desenhando o corte |
| Restaurante / confeitaria | sabor, calor | **Mesa posta** — Galeria; *zoom contínuo* da rua ao prato | **Receita** — Editorial; ingredientes que contam |
| Academia | energia | **Pulso** — Cor cheia; *fluxo* rápido com o ritmo | **Antes do espelho** — Noturno |
| Padaria / café | massa, fogo, manhã | **Primeira fornada** — Luz natural; *luz* do amanhecer à noite, hora em cada capítulo | **A massa cresce** — Editorial; *sequência* da fermentação pela rolagem |
| Mercado / açougue / sacolão | oferta, freguês | **Hoje tem** — Cartaz de bairro; ofertas da semana em cartazes, *letreiro* | **Corredor** — Catálogo industrial; seções por número, busca por produto |
| Lanchonete / pizzaria de bairro | fome, balcão | **Balcão** — Cartaz de bairro; cardápio como cartazes, pedido no WhatsApp | **A mesa da rua** — Álbum; fotos reais de quem vai lá |
| Cervejaria / hamburgueria / bar | lúpulo, chapa | **A leva** — Quadrinho; *vinhetas* contam uma leva, onomatopeias | **Fogo** — Noturno; *superfície* (calor) sobre a chapa |
| Sorveteria / doceria | açúcar, frio | **Sabor do dia** — Cor cheia; cada sabor muda a cor da tela | **Tira diária** — Quadrinho; personagem da casa |
| Autopeças / ferragens / distribuidora | peça, medida | **Tudo tem número** — Catálogo industrial; *faixa* de fichas, estoque que conta | **A peça certa** — Laboratório; *raio-X* com cotas |
| Material de construção | saco, obra | **Lista da obra** — Catálogo industrial; *controle* da metragem calcula o pedido | **Da fundação ao telhado** — Planta técnica; *linhas* do que comprar em cada fase |
| Lavanderia / limpeza de estofados | sujeira, cheiro de limpo | **Passe o dedo** — Cor cheia clara; *pincel* limpa a peça na mão do visitante | **Antes da próxima visita** — Luz natural; a sala limpa de manhã |
| Pintura / reforma | parede, cor | **Primeira demão** — Cor cheia; *pincel* pinta a parede de vazio | **Por etapas** — Planta técnica; *linhas* + foto da obra pronta |
| Piscina / caixa d'água | água | **Transparente** — Ambiente; *superfície* (água), o toque abre anéis | **Medido** — Laboratório; pH e cloro em ficha técnica |
| Churrasqueira / forno / solda | calor | **Brasa** — Noturno; *superfície* (calor) tremendo sobre o fogo | **Projeto e tijolo** — Planta técnica |
| Loteamento / condomínio | terra, endereço | **Ande pelo bairro** — Cartografia; *território* com o estado de cada lote | **Da mata à chave** — Galeria; *zoom contínuo* |
| Rede de lojas / franquia | presença | **Perto de você** — Cartografia; *território* com cada unidade | **Número um** — Cartaz tipográfico |
| Pousada / hotel pequeno | silêncio, tempo | **Nada acontece** — Luxo silencioso; *superfície* (água), lista do que não tem | **Um dia aqui** — Luz natural; *luz* do café ao jantar |
| Escola / creche | infância, turma | **Quem esteve aqui** — Álbum; *mesa* com fotos reais autorizadas | **O ano todo** — Quadrinho; personagem da escola |
| ONG / igreja / clube | gente | **Nossa gente** — Álbum; fotos e nomes de verdade | **Um número por vez** — Cartaz tipográfico; o impacto em palavras |
| Joalheria / relojoaria | ouro, tempo | **Acervo** — Museu de objetos; ficha de cada peça, *raio-X* do mecanismo | **Mícron** — Laboratório; *zoom contínuo* até a lapidação |
| Psicologia / terapia | escuta | **Uma frase por vez** — Cartaz tipográfico suave; *texto* palavra a palavra | **Consultório** — Luz natural |
| Software / app / sistema próprio | tela, dado | **Funcionando** — Produto vivo; *bento* com a interface se mexendo, *controle* do plano | **Sem planilha** — Laboratório; *partículas* de dados se organizando |
| Mineração / terraplenagem / agrimensura | terra, volume | **Subsolo** — Noturno industrial; vídeo CGI + mono, números da operação | **Relevo** — Cartografia; *território* com as obras |
| Turismo / sítio de eventos | paisagem | **Mapa do sítio** — Cartografia; pontos com foto | **O dia passa** — Ambiente; *luz* pela rolagem |

Caminhos novos pros ramos da primeira parte: **energia solar** com *controle* da conta de luz (o número escolhido já
vai no WhatsApp), **ar-condicionado** com *controle* em forma de dial, **estética automotiva** com *pincel* tirando a
sujeira ou Noturno em serifada sobre textura do ofício, **serralheria** com *superfície* (relevo) no aço escovado,
**restaurante** com *luz* do almoço ao jantar, **pet shop** com Álbum, **academia** com Cartaz tipográfico.

Caminhos da segunda passada: **conservas, cervejas e cosméticos** no Empório com *roda*; **autopeças, usinagem e
indústria** com a ficha em tela cheia (*medida*: um número por tela e a régua em mm ou kgf) ou no Dossiê;
**escolinha, time e academia** em Figurinhas com *carta*; **cafeteria e bar** com *lista viva* (o cardápio que se
serve); **moda e concessionária** com *profundidade* (a passarela); **gráfica e tatuagem** com *troca* em tinta;
**churrascaria e pizzaria a lenha** com *troca* em queima; **transportadora** com a régua em quilômetros,
**construtora** em andares, **padaria** em horas.

---

## Exemplo completo (genérico)

```
CONCEITO — Do abafado ao leve
Metáfora: o site é o ar da sala mudando.
Mundo: Laboratório (escuro → creme)   Técnica: fluxo   Interação: arrastar o termostato de 32 °C a 22 °C
História: 1 Calor parado (fluxo laranja, caótico) → 2 A instalação (linhas do split + cotas) →
          3 A limpeza (raio-X do filtro antes/depois) → 4 Conforto (fluxo azul, laminar; botão de agendar)
Tipografia: Inter Tight 400/600 + JetBrains Mono     Paleta: fundo grafite/creme; azul da marca só no ar frio e no botão
Detalhe de marca: termômetro em mono no canto que acompanha a rolagem (32 °C → 22 °C)
Não vai ter: foto de banco de família sorrindo no sofá; título em maiúsculas gigantes
Por que vende: o cliente compra a sensação de alívio; o site faz ele sentir a temperatura caindo.
```
