---
name: site-premium
description: >
  Cria um site premium com um conceito próprio pra cada empresa: tira do ramo (ou do nome) uma metáfora,
  escolhe um entre 23 mundos visuais (de cartaz de mercado a luxo silencioso, de quadrinho a catálogo
  industrial) e uma técnica-assinatura (fluxo de ar, partículas, planta que se desenha, zoom contínuo, raio-X,
  luz do dia, mapa pra explorar, limpar com o dedo, foto que vira pedra ou água, esteira de pratos, objetos
  pendurados, página que vira, placar mecânico, roda de produtos, um número por tela, figurinhas que viram,
  cardápio que se serve, fila em profundidade, cenas de IA, 3D) e monta a
  história pela rolagem — nunca o mesmo visual de um site pro outro. Escolhe pelo cliente (quem decide, a
  prova mais forte, o material que existe) e, quando falta imagem, pede ao usuário com o prompt pronto.
  Serve de padaria a mineradora, de
  loteamento a software. Por baixo, a infraestrutura testada do modelo/: agenda que abre
  o WhatsApp com a mensagem pronta ou, pra B2B, "Pedir orçamento" (WhatsApp ou e-mail), SEO, medição, LGPD
  e deploy estático na Vercel ou Netlify. Use quando o usuário pedir
  "site", "landing page", "site premium", "site com 3D", "site profissional", "site que pareça caro",
  "site pro cliente X", "site pra empresa", "site com pedido de orçamento", "site pra indústria", ou /site-premium.
---

# /site-premium — Um site com cara própria pra cada empresa

Premium não é um visual: é **um conceito levado até o fim**. Os sites de referência (`referencias.md`) não poderiam trocar de logo entre si — a forma nasce do que a empresa faz. Então cada site começa por uma **direção criativa** (`direcao.md`): a matéria que a empresa move (ar, metal, tinta, luz, papelada), uma metáfora, um **mundo** visual (`mundos.md`) e **uma técnica-assinatura** (`tecnicas/`) com uma interação que o visitante lembra. Nunca o mesmo mundo e a mesma técnica em dois sites seguidos.

O `modelo/` é a **infraestrutura** (agenda/orçamento, SEO, JSON-LD, medição, LGPD, mapa, páginas de serviço) e um dos mundos possíveis (o *Noturno cinematográfico*: hero em capítulos com cenas de IA). Não é o ponto de partida visual de todo site.

## Dependências

- **Direção criativa (antes de tudo, depois da identidade):** `direcao.md` (3 conceitos → o usuário escolhe), `mundos.md` (23 sistemas visuais), `referencias.md` (o nível a atingir e as galerias onde garimpar) e o registro local `clientes/_conceitos.md` (o que já foi usado)
- **Técnicas:** `.claude/skills/site-premium/tecnicas/` — palco (rolagem como linha do tempo), fluxo, partículas, linhas, zoom contínuo, raio-X, superfície, pincel, controle, território, arrastar, vinhetas, luz, sequência, abertura, trilho, esteira, varal, folha, pontilhado, placar, física, roda, medida (número por tela e régua do ofício), carta, troca, lista viva, profundidade, cursor (rótulo, ímã, rastro, lupa), menu cheio, texto, HUD. Catálogo e o "Padrão de peça premiada" em `tecnicas/README.md`; bancadas em `tecnicas/demo.html`, `tecnicas/mostruario.html`, `tecnicas/objetos.html` e `tecnicas/arsenal.html`
- **Infraestrutura pronta:** `.claude/skills/site-premium/modelo/` (index.html, estilo.css, app.js, hero-seq.js, hero3d.js, img/)
- **Identidade da loja (antes de tudo):** `/identidade-loja` → `clientes/<Nome>/marca/marca.json` e `marca.md` (cores com papel, logo, fontes, frases da loja, `:root` pronto). Sem ela, não começar
- **Regras de design:** `.claude/skills/site-premium/design.md` — o que vale pra todo mundo (conversão, desempenho, SEO, honestidade) e o detalhe do mundo Noturno
- **Cenas de IA do hero:** `.claude/skills/site-premium/cenas.md` — roteiro, prompts e geração consistente (com `scripts/kie.js` ou Higgsfield)
- **Imagens que faltam:** `.claude/skills/site-premium/imagens.md` — quando parar e pedir ao usuário, o formato do pedido com o prompt de cada imagem, e o roteiro de fotos pro dono da empresa
- **Contrato de design:** `design.md` §9 → `clientes/<Nome>/DESIGN.md`, escrito antes do CSS
- **Mapa da seção "Onde fica":** `scripts/mapa-ruas.js` (ruas reais do OpenStreetMap + rota até a loja) e `modelo/mapa.js` (a animação)
- **Cliente:** `clientes/<Nome>/` — `CLAUDE.md`, briefing, fotos (`fotos/` do `/foto-produto` se houver)
- **Diagnóstico:** `vendas/diagnosticos/<slug>/dados.md` (avaliações reais, nota, diferenciais)
- **Tom de voz:** `_memoria/preferencias.md` e o do cliente
- Sem build, sem npm: HTML + CSS + JS + Three.js por CDN. Abre em qualquer hospedagem estática
- **Se o projeto for Next.js (App Router):** esta skill dá o conceito e a direção; o código segue o `CLAUDE.md` ("Sites premium"), com o arquétipo do nicho em `docs/archetypes/` e os componentes de `src/components/premium/` (hero 3D de vidro, rolagem suave com seção fixada e texto revelado, botão magnético, cursor com rótulo)

---

## Workflow

### Passo 1 — Briefing (uma mensagem só)

Puxar o que já existe (pasta do cliente, diagnóstico) e perguntar só o que faltar:

1. Nome, cidade, WhatsApp, endereço e horário
2. Serviços (o principal + 4) e preço "a partir de" do principal
3. O diferencial que vira a pílula de escassez ("1 por vez", "só com hora marcada", "atendimento em casa")
4. Cores e logo: **rodar o `/identidade-loja`** (site atual + logo + prints do Instagram/fachada). Nunca escolher cor por conta própria
5. 4+ fotos reais do lugar/trabalho e 3 avaliações reais do Google
6. **A transformação** — ver Passo 2

### Passo 2 — Direção criativa (o mais importante)

Seguir o `direcao.md`:

1. **Matéria-prima** (o que a empresa move, antes → depois, o que o nome sugere, a prova física) em `clientes/<Nome>/conceito.md`
2. **Ler o cliente e abrir o leque** (Passo A2): quem decide e onde, quanto custa errar a compra, a prova mais forte, o material que existe, o que os concorrentes fazem; nota de ousadia de 1 a 5; e a matéria-prima passada por pelo menos quatro motores de ideia
3. **Três conceitos** bem diferentes, o seguro, o certo e o ousado (norte + mundo + técnica-assinatura + interação + estrutura de história + tipografia + paleta + detalhe de marca + imagens que faltam), aprovados na banca do `direcao.md` e checados contra os 3 últimos do `clientes/_conceitos.md` — mostrar ao usuário e **ele escolhe um**
4. **Pedido de imagens** (`imagens.md`): se o conceito escolhido precisa de imagem que não existe, mandar o pedido com o prompt de cada uma e o plano B, e esperar a resposta. Enquanto isso, adiantar o que não depende delas
5. **Contrato de design** (`design.md` §9): escrever `clientes/<Nome>/DESIGN.md` antes do CSS
6. **Primeira dobra primeiro:** montar só o palco de abertura com a técnica escolhida e mostrar. Aprovado, segue o resto

A técnica sai de `tecnicas/` (testar a peça na bancada antes, se for mexer nela). Técnica nova que o conceito pedir (som, nuvem de pontos, galeria em disco…): escrever como módulo em `tecnicas/`, com `progresso(p)`, seguindo o "Padrão de peça premiada" do `tecnicas/README.md`, e pôr numa bancada. Antes de inventar, testar o "O objeto é a interface" do `direcao.md`. Ramo sem referência: garimpar nas galerias de `referencias.md` antes de propor.

#### Quando o conceito for o mundo Noturno cinematográfico (hero em capítulos)

Definir em uma frase o **antes → depois** que o cliente compra, e de 4 a 5 capítulos. Cada capítulo vira uma etapa do hero com título próprio.

**Hero em sequência (padrão):** seguir o `cenas.md` — roteiro de 6 cenas, geração com a mesma câmera (a cena do "depois" primeiro, as outras editando ela), WebP, `CONFIG.passos` no `hero-seq.js` e um bloco `.beat` por capítulo no `index.html`. Mostrar as cenas geradas pro usuário **antes** de montar.

**Hero 3D** (alternativa, quando há modelo .glb bom):

| Negócio | Objeto 3D | Antes | Capítulos |
|---|---|---|---|
| Estética automotiva | carro | sujo, fosco | chega · lavagem · polimento · vitrificação · entrega |
| Joalheria / relojoaria | anel, relógio | oxidado, riscado | chega · limpeza · polimento · entrega |
| Sapataria / limpeza de tênis | tênis | encardido | chega · limpeza · hidratação · pronto |
| Ótica | óculos | lente embaçada | chega · ajuste · lente nova · entrega |
| Pet shop | escova/frasco, osso estilizado | — (usar só "brilho") | chega · banho · secagem · cheiroso |
| Loja de produto | o produto-herói | — (sem sujeira) | apresentação · detalhe · uso · oferta |

Mostrar a frase e os capítulos pro usuário antes de construir.

**Modelo 3D (.glb):**
- Fontes com licença comercial: Sketchfab (filtro "Downloadable" + licença CC-BY ou CC0, creditar no rodapé quando CC-BY), Poly Haven (CC0), Fab.com, ou modelo comprado
- **Nunca** produto de marca reconhecível sem autorização (carro de fábrica famosa, tênis de marca) — usar modelo genérico e rotular "modelo genérico"
- Comprimir: `npx @gltf-transform/cli optimize entrada.glb saida.glb --compress draco --texture-compress webp` (alvo < 3 MB)
- Sem modelo ainda: o modelo pronto tem um objeto de demonstração; serve pra aprovar o visual

### Variações do modelo

| Escolha | Como | Quando |
|---|---|---|
| **Hero em sequência** | `data-modo="sequencia"` no `#palco` (padrão) + cenas em `img/seq/` | Quase sempre: parece foto, leve, sem modelo 3D. Pacote principal |
| **Hero 3D** | `data-modo="3d"` + .glb em `hero3d.js` | Produto que gira bem em 3D e modelo .glb com licença |
| **Hero foto** | `data-modo="foto"` + foto real em `img/hero.*` (sem WebGL) | Orçamento menor, demo rápida |
| **Tema escuro** | `data-tema="escuro"` no `<html>` (padrão) | Automotivo, barbearia, bar, tecnologia, luxo |
| **Tema claro** | `data-tema="claro"` + cores no bloco `:root[data-tema="claro"]` | Clínica, ótica, confeitaria, infantil, pet, moda feminina |
| **Página de serviço** | `servico.html` copiada como `servico-<nome>.html` | Cada serviço que as pessoas buscam no Google ("lentes multifocais campinas") |
| **Loja online** | link comentado no `<nav>` do `index.html` | Loja com Nuvemshop/Shopify |
| **Mapa animado** | seção `#onde` + `mapa.json` (padrão) | Todo negócio com endereço físico. Só online: apagar a seção, o link "Onde fica" e o `mapa.js` |
| **Agenda** | `contato: 'agenda'` no `app.js` (padrão): serviço → dia → período → nome → WhatsApp | Loja, estética, oficina, clínica: quem vende horário |
| **Pedir orçamento** | `contato: 'orcamento'`: o que precisa → quantidade → prazo → empresa → nome → WhatsApp. Troca sozinho os textos com `data-orcamento` | **B2B** (indústria, distribuidora, transportadora, construtora, instaladora) e serviço sob medida. Ver o bloco abaixo |
| **Orçamento por e-mail** | `contato: 'orcamento'` + `orcamento.formulario` com a URL do Formspree ou Web3Forms | Empresa que tem comercial no e-mail ou quer o pedido registrado. Nunca em demo |

### Modo "Pedir orçamento" (B2B)

O comprador de empresa não marca horário: ele cota. O painel pergunta o que o vendedor pergunta primeiro e manda o pedido pronto.

- **`contato: 'orcamento'`** troca o painel e todo texto marcado com `data-orcamento="..."` (menu, botões, pílula, fim da página, FAQ, privacidade). Texto novo que fale de agenda: marcar com `data-orcamento` ou reescrever. O `/checar-site` avisa se sobrar "agendar" ou "hora marcada"
- **`orcamento.quantidade`** = a pergunta do nicho, com o exemplo em `exemploQuantidade` (tabela "Pergunta do orçamento" em `.claude/skills/prospectar-b2b/nichos.md`): "Origem, destino e peso" na transportadora, "Conta de luz média" na energia solar, "Área da obra" na construtora. `''` tira o campo; o mesmo vale pra `cidade`
- **`orcamento.prazos`** sem nenhum marcado de saída (o vendedor quer a resposta real) e **`resposta`** com o prazo que a empresa cumpre de verdade
- **Envio:** com `formulario` vazio o pedido abre no WhatsApp comercial, formatado. Com formulário:
  1. Criar o formulário **na conta da empresa** (Formspree: formspree.io → New form → copiar a URL `https://formspree.io/f/...`; Web3Forms: web3forms.com → e-mail comercial → chave em `camposFixos: { access_key: '...' }` com `formulario: 'https://api.web3forms.com/submit'`)
  2. O painel passa a pedir e-mail e telefone, mostra a linha da LGPD e uma tela de "pedido recebido"; se o envio falhar, oferece o WhatsApp com o pedido inteiro
  3. Em `privacidade.html`, trocar o item "Pedido de orçamento" pelo que está comentado logo abaixo dele, com o nome do serviço
  4. Depois de publicar, mandar **um pedido de teste real** e confirmar que chegou no e-mail da empresa (o Formspree pede pra confirmar o e-mail no primeiro envio)
- **Medição:** `orcamento_aberto` e `orcamento_enviado` (com `servico`, `prazo` e `canal`); no Pixel da Meta vira `Lead`
- **Resto do site pra B2B** (`design.md` §5): tema sóbrio, prova com clientes atendidos, certificações e capacidade, uma página por produto/serviço

### Passo 3 — Montar o site

1. Copiar `modelo/` inteiro pra `clientes/<Nome>/site/`
2. **Variações** acima: modo do hero, tema, quais páginas de serviço
3. **Visual do mundo escolhido** (`mundos.md`): reescrever o `estilo.css` com a paleta, as fontes e o layout do mundo — o `estilo.css` do modelo só serve como está no mundo Noturno. Copiar `tecnicas/` pra pasta do site e montar a história em palcos (`tecnicas/README.md`). Seções do modelo (prova, serviços, galeria, avaliações, mapa, final) podem mudar de forma, de ordem ou sair: o que fica obrigatório é o que converte e o que o Google lê (botão de agenda/orçamento, avaliações reais, endereço, JSON-LD). No mundo Noturno: colar o `:root` sugerido no `marca.md` da loja (tema claro ou escuro conforme a marca, base escura da marca no `--bg`; fonte de título da marca se for Google Font). Logo real no `.logo` do topo e do rodapé; frases da loja (`frases` do `marca.json`) no hero e nos títulos. Checklist completo no Passo 5 do `/identidade-loja`
4. **HTML** (`index.html`, `servico*.html`, `privacidade.html`) → trocar todo elemento com `data-editar`: textos, avaliações, endereço, meta tags **e o JSON-LD** (dados do negócio pro Google: tipo específico como `Optician`/`AutoRepair`/`BeautySalon`, endereço, horário, coordenadas, Instagram). Títulos seguindo `design.md` §2. Title de cada página = serviço + cidade + marca
5. **`DOMINIO`** → buscar e trocar em todos os arquivos (canonical, og, JSON-LD, `sitemap.xml`, `robots.txt`). Sem domínio ainda: deixar e trocar no `/publicar-site`
6. **`app.js`** → `CONFIG`: WhatsApp, `contato` (`'agenda'` ou `'orcamento'`), serviços (os mesmos nomes dos cards), `agenda` (períodos, dias fechados) **ou** `orcamento` (pergunta do nicho, prazos, resposta, formulário), **medição** (Plausible sem cookies, ou GA4/Pixel do cliente — o aviso de cookies aparece sozinho)
7. **Abertura** → nos outros mundos, é o palco da técnica-assinatura aprovado no Passo 2 (apagar `#palco`, `hero-seq.js` e `hero3d.js` se não forem usados). **Mundo Noturno:** no `index.html`, os blocos `.beat` (um por capítulo: título em duas frases curtas, linha técnica, o último com o botão) e o rótulo `.tag-ia`. Modo sequência: `hero-seq.js` → `CONFIG.cenas` e `CONFIG.passos` (ver `cenas.md` §4). Modo 3D: `hero3d.js` → `CONFIG`: caminho do .glb em `modelo`, `corSujeira`, `corDestaque`, e os `capitulos` do Passo 2 (rótulo, `limpo`, `brilho`, posição da câmera). Pra negócio sem "sujeira", deixar `limpo: 1` em todos e contar a história com `brilho`, câmera e `giro`. Cor do estúdio acompanha o tema sozinha
8. **`img/`** → fotos reais (WebP, ~1600 px no lado maior) no lugar de **todo arquivo `exemplo-*`** (galeria, fundo dos cards de serviço em `style="--foto: url(...)"`, hero foto, cenas); `og.png` 1200×630 no lugar do `og-exemplo.png` (gerar com `og/og.html` desta skill: `node scripts/render.js .claude/skills/site-premium/og/og.html --png <pasta> --size 1200x630`); `favicon.svg` com a inicial da marca. O `/checar-site` acusa qualquer `exemplo-*` que sobrar
9. **Onde fica (mapa)** → pegar a coordenada da porta da loja no Google Maps (botão direito → copiar coordenadas) e gerar as ruas e a rota:
   ```bash
   node scripts/mapa-ruas.js --loja <lat,lon> --saida clientes/<Nome>/site/mapa.json
   ```
   O carro sai sozinho de uma avenida a uns 400–550 m; pra escolher de onde (a avenida que todo mundo conhece, a saída do shopping): `--de <lat,lon>`. Depois, no `index.html`: `data-mapa="mapa.json"` e `data-loja="<nome curto da loja>"` no `.mapa-caixa`, endereço, horário e o link "Como chegar" com `destination=<lat,lon>`. Apagar o `mapa-exemplo.json`. O crédito "© OpenStreetMap contributors" fica (é exigência da licença dos dados)
10. **Avaliações** → nota e número **reais** do perfil no Google (no dia), 4 a 6 avaliações reais copiadas com nome abreviado e data, e o link do perfil no botão "Ver todas no Google"
11. **`privacidade.html`** → dados do cliente; sem GA4/Pixel, apagar a seção de cookies
12. **`sitemap.xml`** → uma `<url>` por página indexável
13. Apagar os comentários de instrução do topo dos arquivos

### Passo 4 — Ver e conferir

```bash
python3 -m http.server 4173 --directory clientes/<Nome>/site
```

Rodar o **`/checar-site`** (pega texto de exemplo esquecido, WhatsApp de exemplo, erros, 404, SEO, imagens, rolagem lateral):

```bash
node scripts/checar-site.js clientes/<Nome>/site --marca clientes/<Nome>/marca/marca.json --saida clientes/<Nome>/site/CHECAGEM.md
```

Zero ❌. Depois abrir `http://localhost:4173` e olhar, no desktop (1440 px) **e** no celular (390 px):

- [ ] Preloader some e o hero aparece; todos os capítulos funcionam (clicar em cada um) e o play/pause
- [ ] Em cada etapa o título lê bem e não cobre o assunto da cena (sequência: ajustar `foco`/`zoom` do passo; 3D: afastar `cam`). Pra parar numa etapa: no console, `__hero.pausar(); __hero.ir(<segundos>)`
- [ ] No celular, o assunto de cada cena aparece (a tela corta as laterais — ajustar `foco`)
- [ ] Mapa: a loja está no lugar certo, a rota faz sentido (não atravessa quarteirão, começa numa rua conhecida) e o "Como chegar" abre a loja no Google Maps. Pra parar numa fase: `__mapa.pausar(); __mapa.ir(<segundos>)`
- [ ] Agenda (ou pedido de orçamento) abre, monta a mensagem e abre o WhatsApp certo (no `localhost`, o console mostra cada evento `[medir]`). Orçamento por formulário: o envio de teste fica pro site publicado
- [ ] Grade de serviços sem card sobrando sozinho
- [ ] Desligar o WebGL mostra o fundo alternativo e o site continua usável
- [ ] A técnica-assinatura funciona com o dedo no celular (raio-X por toque, palcos rolando sem travar) e respeita "reduzir movimento"
- [ ] O site bate com o `DESIGN.md`, linha por linha (cores no papel certo, escala de tipo, respiro, o que não fazer)
- [ ] Chamada final com uma frase, um botão e "o que acontece depois"; o rodapé fecha o mundo da abertura (`design.md` §10)
- [ ] **Não parece o site anterior:** abrir lado a lado com o último do `clientes/_conceitos.md` — mundo, primeira dobra, tipografia e técnica diferentes

### Passo 5 — Publicar

Com o cliente aprovando a versão: **`/publicar-site`** — deploy, domínio, Search Console, Google Meu Negócio, documento de entrega e oferta de manutenção mensal. **Publicar só com o "ok" do usuário** — o site vai pro ar com o nome do cliente.

Ainda não é cliente? A versão de venda é o **`/site-demo`**.

### Passo 6 — Entrega

Mostrar no chat: link do preview/publicado, o conceito em uma frase, e o que ainda depende do cliente (fotos reais, modelo 3D definitivo, domínio). Registrar a entrega na pasta do cliente pro `/relatorio-resultados` e o conceito no `clientes/_conceitos.md` (uma linha, ramo genérico).

---

## Regras

- **Conceito antes de tela.** Sem `conceito.md` aprovado, não começar o visual. Cada site com mundo e técnica-assinatura próprios; nunca dois seguidos iguais.
- **Escolher pelo cliente, não pela novidade.** A técnica mais nova só entra se for a que mais combina com aquela empresa e com quem compra dela.
- **Faltou imagem, pede.** Pedido de imagens com prompt pronto e plano B (`imagens.md`). Nunca banco de imagem genérico, `exemplo-*` esquecido ou conceito trocado em silêncio.
- **Uma técnica-assinatura, profunda.** O movimento significa algo do negócio; efeito sem significado sai. Dentro do mundo escolhido, não adicionar cor, fonte ou animação fora do sistema.
- **A história conta o serviço.** Cena bonita sem história é enfeite — perguntar qual é a transformação.
- **Consistência nas cenas de IA:** mesma câmera, mesmo objeto, mesma luz. Cena que não bate, regerar.
- **Licença de tudo:** modelo 3D, fotos, fontes. Na dúvida, não usar. Nada de marca/modelo reconhecível gerado por IA.
- **Rótulos de honestidade ficam:** "imagens geradas por IA · ilustrativas" (ou "animação 3D ilustrativa") no hero, e fotos reais no resto do site.
- **Nada inventado:** avaliações, números da faixa de prova e preços vêm do cliente ou do Google.
- **Celular primeiro na conferência:** a maioria dos acessos de loja local vem do Instagram, no celular.
- **Não publicar sem aprovação.**
