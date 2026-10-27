# Guia de design — site premium

O que faz um site parecer caro não é efeito: é **restrição**. Cada regra abaixo tira alguma coisa.
Referência estudada: um site premium de estética automotiva.

## 1. Cor: escuro + um destaque

- Fundo quase preto, não preto puro: `#07080b` (base) e `#0d0f14` (segundo plano).
- **Uma** cor de destaque da marca, de preferência em degradê sutil (`--accent-grad`). Ela aparece no logo,
  no rótulo das seções, no preço, no botão final e numa palavra do último título. Em nenhum outro lugar.
- Uma segunda cor só como **brilho de fundo** (radial grande e desfocado), nunca em texto ou botão.
- Linhas divisórias em branco com 9% de opacidade (`rgba(255,255,255,.09)`). Nada de bordas cinza sólidas.
- Marca com identidade clara (clínica, confeitaria, salão)? Tema claro pronto: `<html data-tema="claro">` —
  fundo off-white (`#f6f4ef`), texto quase preto, um destaque. Mesma regra: base neutra + um destaque.

## 2. Tipografia: duas vozes

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

## 4. Movimento

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
- Uma página por serviço importante, com perguntas frequentes reais (viram resultado no Google).
- Todo botão que gera contato é medido (`clique_whatsapp`, `agenda_enviada`, `orcamento_enviado`...). Site que não mede não justifica mensalidade.
