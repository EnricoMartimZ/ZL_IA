---
name: site-premium
description: >
  Cria um site premium pra uma loja ou serviço local, com um hero cinematográfico que conta a transformação
  que o cliente compra (antes → depois) — cenas geradas por IA costuradas com transições em WebGL (padrão),
  modelo 3D em Three.js, ou foto — visual de alto padrão (uma cor de destaque,
  títulos enormes, rótulos monoespaçados), agenda que abre o WhatsApp com a mensagem pronta — ou, pra
  empresa B2B, um painel "Pedir orçamento" (WhatsApp ou formulário que chega no e-mail) — e deploy
  estático na Vercel ou Netlify. Parte de um modelo pronto e testado em modelo/. Use quando o usuário pedir
  "site", "landing page", "site premium", "site com 3D", "site profissional", "site que pareça caro",
  "site pro cliente X", "site pra empresa", "site com pedido de orçamento", "site pra indústria", ou /site-premium.
---

# /site-premium — Site de alto padrão com hero cinematográfico

O site vende pela primeira tela: o hero mostra o serviço acontecendo, em etapas (o carro chega sujo, uma linha de luz lava, a câmera mergulha no capô, o polimento tira os riscos, o carro sai brilhando no pôr do sol). Cada etapa tem seu próprio título. O resto do site é contido de propósito — é a restrição que faz parecer caro.

Referência: um site premium de estética automotiva — primeira versão com 3D, segunda com cenas de IA. A segunda ficou melhor: parece foto, pesa menos e não depende de modelo 3D.

## Dependências

- **Modelo pronto:** `.claude/skills/site-premium/modelo/` (index.html, estilo.css, app.js, hero-seq.js, hero3d.js, img/)
- **Regras de design:** `.claude/skills/site-premium/design.md` — ler antes de mexer no visual
- **Cenas de IA do hero:** `.claude/skills/site-premium/cenas.md` — roteiro, prompts e geração consistente (com `scripts/kie.js` ou Higgsfield)
- **Mapa da seção "Onde fica":** `scripts/mapa-ruas.js` (ruas reais do OpenStreetMap + rota até a loja) e `modelo/mapa.js` (a animação)
- **Cliente:** `clientes/<Nome>/` — `CLAUDE.md`, briefing, fotos (`fotos/` do `/foto-produto` se houver)
- **Diagnóstico:** `vendas/diagnosticos/<slug>/dados.md` (avaliações reais, nota, diferenciais)
- **Tom de voz:** `_memoria/preferencias.md` e o do cliente
- Sem build, sem npm: HTML + CSS + JS + Three.js por CDN. Abre em qualquer hospedagem estática

---

## Workflow

### Passo 1 — Briefing (uma mensagem só)

Puxar o que já existe (pasta do cliente, diagnóstico) e perguntar só o que faltar:

1. Nome, cidade, WhatsApp, endereço e horário
2. Serviços (o principal + 4) e preço "a partir de" do principal
3. O diferencial que vira a pílula de escassez ("1 por vez", "só com hora marcada", "atendimento em casa")
4. Cores e logo (ou `identidade/design-guide.md` da loja)
5. 4+ fotos reais do lugar/trabalho e 3 avaliações reais do Google
6. **A transformação** — ver Passo 2

### Passo 2 — A história do hero (o mais importante)

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
3. **`estilo.css`** → trocar só o `:root` do tema escolhido (cores da marca; fontes se a marca tiver)
4. **HTML** (`index.html`, `servico*.html`, `privacidade.html`) → trocar todo elemento com `data-editar`: textos, avaliações, endereço, meta tags **e o JSON-LD** (dados do negócio pro Google: tipo específico como `Optician`/`AutoRepair`/`BeautySalon`, endereço, horário, coordenadas, Instagram). Títulos seguindo `design.md` §2. Title de cada página = serviço + cidade + marca
5. **`DOMINIO`** → buscar e trocar em todos os arquivos (canonical, og, JSON-LD, `sitemap.xml`, `robots.txt`). Sem domínio ainda: deixar e trocar no `/publicar-site`
6. **`app.js`** → `CONFIG`: WhatsApp, `contato` (`'agenda'` ou `'orcamento'`), serviços (os mesmos nomes dos cards), `agenda` (períodos, dias fechados) **ou** `orcamento` (pergunta do nicho, prazos, resposta, formulário), **medição** (Plausible sem cookies, ou GA4/Pixel do cliente — o aviso de cookies aparece sozinho)
7. **Hero** → no `index.html`, os blocos `.beat` (um por capítulo: título em duas frases curtas, linha técnica, o último com o botão) e o rótulo `.tag-ia`. Modo sequência: `hero-seq.js` → `CONFIG.cenas` e `CONFIG.passos` (ver `cenas.md` §4). Modo 3D: `hero3d.js` → `CONFIG`: caminho do .glb em `modelo`, `corSujeira`, `corDestaque`, e os `capitulos` do Passo 2 (rótulo, `limpo`, `brilho`, posição da câmera). Pra negócio sem "sujeira", deixar `limpo: 1` em todos e contar a história com `brilho`, câmera e `giro`. Cor do estúdio acompanha o tema sozinha
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
node scripts/checar-site.js clientes/<Nome>/site --saida clientes/<Nome>/site/CHECAGEM.md
```

Zero ❌. Depois abrir `http://localhost:4173` e olhar, no desktop (1440 px) **e** no celular (390 px):

- [ ] Preloader some e o hero aparece; todos os capítulos funcionam (clicar em cada um) e o play/pause
- [ ] Em cada etapa o título lê bem e não cobre o assunto da cena (sequência: ajustar `foco`/`zoom` do passo; 3D: afastar `cam`). Pra parar numa etapa: no console, `__hero.pausar(); __hero.ir(<segundos>)`
- [ ] No celular, o assunto de cada cena aparece (a tela corta as laterais — ajustar `foco`)
- [ ] Mapa: a loja está no lugar certo, a rota faz sentido (não atravessa quarteirão, começa numa rua conhecida) e o "Como chegar" abre a loja no Google Maps. Pra parar numa fase: `__mapa.pausar(); __mapa.ir(<segundos>)`
- [ ] Agenda (ou pedido de orçamento) abre, monta a mensagem e abre o WhatsApp certo (no `localhost`, o console mostra cada evento `[medir]`). Orçamento por formulário: o envio de teste fica pro site publicado
- [ ] Grade de serviços sem card sobrando sozinho
- [ ] Desligar o WebGL mostra o fundo alternativo e o site continua usável

### Passo 5 — Publicar

Com o cliente aprovando a versão: **`/publicar-site`** — deploy, domínio, Search Console, Google Meu Negócio, documento de entrega e oferta de manutenção mensal. **Publicar só com o "ok" do usuário** — o site vai pro ar com o nome do cliente.

Ainda não é cliente? A versão de venda é o **`/site-demo`**.

### Passo 6 — Entrega

Mostrar no chat: link do preview/publicado, a frase da transformação, e o que ainda depende do cliente (fotos reais, modelo 3D definitivo, domínio). Registrar a entrega na pasta do cliente pro `/relatorio-resultados`.

---

## Regras

- **Ler `design.md` antes de mexer no visual.** Não adicionar cor, fonte ou animação fora do sistema.
- **O hero conta o serviço.** Cena bonita sem história é enfeite — perguntar qual é a transformação.
- **Consistência nas cenas de IA:** mesma câmera, mesmo objeto, mesma luz. Cena que não bate, regerar.
- **Licença de tudo:** modelo 3D, fotos, fontes. Na dúvida, não usar. Nada de marca/modelo reconhecível gerado por IA.
- **Rótulos de honestidade ficam:** "imagens geradas por IA · ilustrativas" (ou "animação 3D ilustrativa") no hero, e fotos reais no resto do site.
- **Nada inventado:** avaliações, números da faixa de prova e preços vêm do cliente ou do Google.
- **Celular primeiro na conferência:** a maioria dos acessos de loja local vem do Instagram, no celular.
- **Não publicar sem aprovação.**
