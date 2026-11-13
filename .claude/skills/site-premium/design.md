# Guia de design — site premium

O que faz um site parecer caro não é efeito: é **restrição** a serviço de **um conceito**. O visual de cada site
vem da direção criativa (`direcao.md`) e do mundo escolhido (`mundos.md`) — nunca deste arquivo copiado de novo.

- **§1 a §4** detalham o mundo *Noturno cinematográfico* (o `modelo/`). Nos outros mundos, valem a ideia de
  restrição (poucas cores com papel definido, duas vozes tipográficas, muito espaço, movimento com significado) e
  as regras do mundo em `mundos.md`.
- **§5 a §10** (conversão, honestidade, desempenho, ser encontrado, contrato de design, chamada final e rodapé)
  valem pra **todo** site, em qualquer mundo.

## 1. Cor: escuro + um destaque (mundo Noturno)

- Fundo quase preto, não preto puro: `#07080b` (base) e `#0d0f14` (segundo plano).
- **Uma** cor de destaque **da marca da loja** (a do `marca.json` do `/identidade-loja`, nunca escolhida por gosto), de preferência em degradê sutil (`--accent-grad`). Se a marca tem uma base escura (marinho, vinho), ela substitui o quase preto. Ela aparece no logo,
  no rótulo das seções, no preço, no botão final e numa palavra do último título. Em nenhum outro lugar.
- Uma segunda cor só como **brilho de fundo** (radial grande e desfocado), nunca em texto ou botão.
- Linhas divisórias em branco com 9% de opacidade (`rgba(255,255,255,.09)`). Nada de bordas cinza sólidas.
- Marca com identidade clara (clínica, confeitaria, salão)? Tema claro pronto: `<html data-tema="claro">` —
  fundo off-white (`#f6f4ef`), texto quase preto, um destaque. Mesma regra: base neutra + um destaque.

## 2. Tipografia: duas vozes (mundo Noturno; nos outros, o par do mundo)

| Papel | Fonte | Como |
|---|---|---|
| **Voz alta** — títulos | Display pesada (Archivo itálico 900, ou Clash Display, Satoshi Black, Inter Display 800) | MAIÚSCULAS, 9–10vw, entrelinha 0.9, espaçamento -0.035em, termina com **ponto final** |
| **Voz técnica** — rótulos, números, preço, rodapé | Monoespaçada (JetBrains Mono, IBM Plex Mono, Geist Mono) | 10–12 px, MAIÚSCULAS, espaçamento 0.14–0.3em, cor apagada |

- Corpo de texto na fonte display em peso 400, cor apagada (`--muted`), linhas curtas (máx. ~520 px).
- Título em duas linhas: a primeira sólida, a segunda em **contorno** (`-webkit-text-stroke`) ou na cor de destaque.
- Títulos curtos de 2–4 palavras, com atitude: "O que sai daqui." · "Feito com calma." · "Pode vir como está."

## 3. Layout

- Muito espaço: seções com 140–180 px de respiro em cima. Espaço vazio é o que mais passa "caro".
- Grades com **linhas finas compartilhadas** (1px entre cards), cantos de 18 px no contêiner, não em cada card.
- Cards numerados `01`, `02`... em mono na cor de destaque. Um card maior em destaque (o serviço principal),
  com brilho radial da segunda cor.
- Grade de 4 colunas: 1 destaque (2×2) + 4 cards fecha certinho. Mais serviços: de 4 em 4. Nunca sobrar card sozinho.
- Faixa de prova logo depois do hero: 4 números grandes (nota no Google, clientes, anos, diferencial).

## 4. Movimento (mundo Noturno; nos outros, a técnica-assinatura é o show e o resto é quieto)

- O hero é o show. **Todo o resto é quieto**: só elementos subindo 28 px e aparecendo ao rolar,
  em 1 s, com curva suave (`cubic-bezier(.2,.7,.1,1)`).
- Menu transparente no hero, vira vidro fosco (`backdrop-filter: blur`) depois dele.
- Hover discreto: botão sobe 2 px; foto da galeria cresce 4% em 1,2 s.
- Respeitar `prefers-reduced-motion`: sem animação, hero parado na última cena.

### O hero cinematográfico (o que a referência ensinou)

- **Uma história em 4–5 etapas**, não um loop decorativo: chega → serviço → detalhe → acabamento → entrega.
- **Cada etapa com seu título**, alternando esquerda e direita: duas frases curtas, a segunda em contorno
  ("HORA DE / LAVAR.", "SWIRLS FORA. / BRILHO SELADO.", "CHAVE NA MÃO. / QUEIXO NO CHÃO."), uma linha técnica em
  mono embaixo, e o botão de agendar **só na última** — quando o cliente já viu o resultado.
- **Transição com significado:** a linha de luz *é* a limpeza; o círculo que cresce *é* o polimento; o mergulho
  *é* o "olha de perto". Escolher a transição pelo que ela diz, não por ser bonita.
- Câmera sempre se movendo um pouco (aproximação lenta de 2–5% por cena). Nada fica parado.
- Barra embaixo com play/pause e os capítulos clicáveis, com o progresso de cada um preenchendo.
- Fotorrealismo vence 3D estilizado: cliente de loja local reconhece foto, não render.

## 5. Conversão

- **Escassez no menu:** uma pílula com o diferencial ("1 cliente por vez · só com hora marcada").
- Um só verbo de ação no site inteiro ("Agendar"), repetido no menu, no fim e no WhatsApp flutuante.
- Agenda em painel lateral (serviço → dia → período → nome) que abre o WhatsApp com a mensagem pronta.
  Sem formulário de contato genérico.
- **B2B: "Pedir orçamento" no lugar de "Agendar"** (`contato: 'orcamento'`). O mesmo painel, com as perguntas que o
  vendedor faz primeiro: o que precisa, quantidade (a pergunta do nicho), prazo, empresa, nome. Nada de
  "fale conosco" com campo "mensagem" — formulário genérico vira e-mail sem resposta. A prova muda: clientes
  atendidos (com autorização), certificações (ISO, NR, acreditação), capacidade (máquinas, frota, m²) e
  prazo de resposta cumprido, em vez de "1 cliente por vez".
- WhatsApp flutuante só aparece depois do hero (não compete com o 3D).
- **Avaliações como prova grande:** o título da seção é a nota e o número reais ("5,0 em 582 avaliações."),
  com botão pro perfil no Google e 4–6 avaliações reais (nome abreviado, estrelas, "Google · há 3 meses").
- **Cards de serviço com foto real** no fundo, escurecida embaixo pro texto ler — mostra o serviço sendo feito.
- **"Onde fica" como peça de marca, não um iframe do Google Maps:** mapa noturno com as ruas reais do bairro, o
  carro sai sujo de uma avenida conhecida, segue a rota dourada "comendo" os pontos até a loja e sai brilhando.
  Repete a história do hero. Ao lado: endereço, horário e "Como chegar" (abre o Google Maps). Leve: um JSON de
  ~30 KB e um canvas, sem chave de API e sem o peso do Maps embutido.

## 6. Honestidade (é parte do "premium")

- Animação 3D sempre rotulada como ilustrativa.
- Foto de banco marcada como ilustrativa; preferir sempre foto real do lugar.
- Faixa fixa discreta no rodapé dizendo o que é real e o que é ilustração.
- Nada de número inventado na faixa de prova.

## 7. Desempenho (o que separa site profissional de demo)

- Preloader com porcentagem real enquanto o 3D carrega.
- Resolução do 3D limitada (1.5× no celular, 2× no desktop) e antialias desligado no celular.
- 3D pausa fora da tela e com a aba escondida.
- Sem WebGL → fundo em degradê no lugar, site continua funcionando.
- Modelo .glb comprimido (Draco), idealmente < 3 MB. Fotos em WebP/AVIF com `loading="lazy"`.
- Meta tags de compartilhamento (`og:title`, `og:image` 1200×630) — o link no WhatsApp também vende.

## 8. Ser encontrado e provar resultado

- Title de cada página = **serviço + cidade + marca** ("Lentes multifocais em Campinas · <marca>"). O h1 pode ser criativo; o title não.
- Dados estruturados (JSON-LD) com o tipo mais específico do negócio, endereço, horário e coordenadas — é o que alimenta o Google e o Maps. Nunca `aggregateRating` com avaliações do Google.
- As páginas saem do plano de busca do `/seo-site` (`clientes/<Nome>/seo/plano.json`): uma por serviço que alguém procura pelo nome, cada uma com a sua palavra principal, a linha de apoio que diz o que é, onde e pra quem, e perguntas frequentes reais, visíveis na página. Elas ajudam a busca e as IAs a ler pergunta e resposta; o Google hoje quase não mostra mais o bloco de perguntas no resultado, então não prometer isso.
- Todo botão que gera contato é medido (`clique_whatsapp`, `agenda_enviada`, `orcamento_enviado`...). Site que não mede não justifica mensalidade.

## 9. Contrato de design (`DESIGN.md` do site)

Antes do CSS, escrever `clientes/<Nome>/DESIGN.md` (fica ao lado do `conceito.md`, fora da pasta publicada). É o
que mantém o site coerente da primeira seção à última, e o que deixa a manutenção de daqui a seis meses com a
mesma cara. Formato aprendido no Refero, que reduz cada site a regras que uma IA consegue seguir:

```
# DESIGN — <cliente>
Norte: <lugar + material + luz>
Resumo: <três linhas: como a página se comporta, o que domina, o que fica quieto>

## Cores (cada uma com papel)
--fundo #…… a tela        --superficie #…… faixas e cartões     --tinta #…… texto
--apagado #…… rótulos     --acao #…… só botão e link            --fio rgba(…) linhas de 1 px

## Tipografia
Título: <fonte> <peso>. Escala <razão> a partir de <base> px: 14 / 17 / 21 / 28 / 40 / 64 / 96.
Aperto por tamanho: -0,035em em 96 · -0,02em em 40 · normal em 17. Entrelinha: 0,95 no título, 1,5 no texto.
Rótulo: <fonte>, 11 px, caixa alta, 0,16em.     Texto: no máximo 62 caracteres por linha.

## Espaço e forma
Respiro entre seções: <px>. Vão entre itens: <px>. Raio: <px>, só em <onde>. Sombra: <sim/não>. Fio: 1 px.

## Movimento
Assinatura: <técnica e o que ela significa>. Resto: <a única regra>. Duração e curva: <…>.

## Fazer
- <regra com número. Ex.: a cor de ação aparece no botão e em uma palavra do último título, em mais nada>

## Não fazer
- <o erro provável. Ex.: não usar degradê; a foto do produto é a única fonte de cor>
```

- Toda regra tem **número ou lugar**. "Usar bastante espaço" não é regra; "140 px entre seções" é.
- Decisão nova que o contrato não cobre: decidir, **escrever no contrato** e só então aplicar.
- No fim, conferir o site contra o contrato, linha por linha. O que fugiu, ou volta, ou muda o contrato de propósito.

## 10. Chamada final e rodapé

Vistos nos cortes de página do Godly e nos rodapés do 21st.dev:

- **A chamada final é uma frase, um botão e a textura do mundo.** Não é formulário, não tem três botões. A frase é a promessa do site dita de novo, em outras palavras.
- **"O que acontece depois"** ao lado do botão, em três linhas com prazo de verdade: você manda a mensagem, a gente responde em até X, o serviço é marcado. Tira o medo de clicar.
- **O rodapé fecha o mundo que a abertura abriu.** A grama da primeira tela vira o chão dos links; o nome da empresa gigante em retícula (`pontilhado.js`); o carimbo da prancha; as colinas. Rodapé nunca é só uma lista de links cinza.
- **B2B:** logos ou nomes de clientes atendidos (com autorização) em faixa logo depois da abertura, antes de qualquer explicação.
