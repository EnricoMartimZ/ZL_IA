# Guia de design — site premium

O que faz um site parecer caro não é efeito: é **restrição**. Cada regra abaixo tira alguma coisa.
Referência estudada: um site premium de estética automotiva.

## 1. Cor: escuro + um destaque

- Fundo quase preto, não preto puro: `#07080b` (base) e `#0d0f14` (segundo plano).
- **Uma** cor de destaque da marca, de preferência em degradê sutil (`--accent-grad`). Ela aparece no logo,
  no rótulo das seções, no preço, no botão final e numa palavra do último título. Em nenhum outro lugar.
- Uma segunda cor só como **brilho de fundo** (radial grande e desfocado), nunca em texto ou botão.
- Linhas divisórias em branco com 9% de opacidade (`rgba(255,255,255,.09)`). Nada de bordas cinza sólidas.
- Marca com identidade clara (salão rosa, por exemplo)? Pode inverter pra fundo claro, mas a regra é a mesma:
  base neutra + um destaque.

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

- O 3D do hero é o show. **Todo o resto é quieto**: só elementos subindo 28 px e aparecendo ao rolar,
  em 1 s, com curva suave (`cubic-bezier(.2,.7,.1,1)`).
- Menu transparente no hero, vira vidro fosco (`backdrop-filter: blur`) depois dele.
- Hover discreto: botão sobe 2 px; foto da galeria cresce 4% em 1,2 s.
- Respeitar `prefers-reduced-motion`: sem animação, 3D parado no último capítulo.

## 5. Conversão

- **Escassez no menu:** uma pílula com o diferencial ("1 cliente por vez · só com hora marcada").
- Um só verbo de ação no site inteiro ("Agendar"), repetido no menu, no fim e no WhatsApp flutuante.
- Agenda em painel lateral (serviço → dia → período → nome) que abre o WhatsApp com a mensagem pronta.
  Sem formulário de contato genérico.
- WhatsApp flutuante só aparece depois do hero (não compete com o 3D).
- Depoimentos **reais** do Google, com nome abreviado e estrelas.

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
