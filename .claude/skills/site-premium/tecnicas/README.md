# Técnicas — o "truque" de cada site

Peças de movimento prontas e testadas pra montar a experiência que o **conceito** pede (`../direcao.md`).
Cada site usa **uma técnica-assinatura**, no máximo duas. Elas não têm cor nem fonte: isso vem do
mundo escolhido (`../mundos.md`).

Bancada de teste com todas funcionando: `demo.html`.

```bash
python3 -m http.server 4174 --directory .claude/skills/site-premium/tecnicas   # → http://localhost:4174/demo.html
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

## Receitas que ainda não estão prontas (montar quando o conceito pedir)

Escrever como módulo novo aqui, com `progresso(p)`, e pôr na bancada `demo.html`:

- **Distorção WebGL** (água, vidro, calor tremendo): textura da foto num plano, deslocamento por ruído/mapa normal, intensidade pela rolagem ou pelo mouse. Vidraçaria, piscina, estética, bebidas, calor.
- **Vídeo pela rolagem**: vídeo curto com quadro-chave em todo quadro (`ffmpeg -g 1`), `video.currentTime = p * duração`. Processo filmado de verdade (solda, corte, montagem).
- **Trilho de índice**: menu lateral com os capítulos empilhados, cada um com a cor do seu trecho, o atual aberto. Sites longos de produto/serviço.
- **Galeria arrastável** (missões, obras, cases): faixa horizontal com inércia, arrastar com mouse/dedo.
- **Som**: tela de entrada "com som / sem som"; ambiente sutil + clique. Só quando o produto *é* som/sensação (áudio, spa, música). Nunca tocar sem o clique.
- **Cursor de marca**: cursor próprio que muda sobre elementos (lupa no raio-X, pincel na gráfica). Só desktop.
- **Termostato/arrastar valor**: o visitante arrasta um controle (temperatura, conta de luz, metragem) e a cena responde. Vira a calculadora do orçamento.

## Regras

- **Uma assinatura.** Duas técnicas de impacto brigam pela atenção. O resto do site é quieto.
- **Celular primeiro:** testar 390 px em pé. Partículas e fluxo já reduzem a quantidade; conferir se o assunto aparece.
- **`prefers-reduced-motion`:** as técnicas param de animar sozinhas; o conteúdo tem que continuar legível.
- **Sem WebGL** (raro): partículas não aparecem. O palco e o texto continuam: o capítulo precisa se sustentar só com texto/foto.
- Pausam fora da tela e com a aba escondida (bateria).
- CDN com versão fixa (three 0.160.0, lenis 1.1.13). Não trocar sem testar a bancada.
