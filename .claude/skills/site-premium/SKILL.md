---
name: site-premium
description: >
  Cria um site premium de uma página pra uma loja ou serviço local, com hero 3D em Three.js que conta a
  transformação que o cliente compra (antes → depois), visual escuro de alto padrão (uma cor de destaque,
  títulos enormes, rótulos monoespaçados), agenda que abre o WhatsApp com a mensagem pronta e deploy
  estático na Vercel ou Netlify. Parte de um modelo pronto e testado em modelo/. Use quando o usuário pedir
  "site", "landing page", "site premium", "site com 3D", "site profissional", "site que pareça caro",
  "site pro cliente X", ou /site-premium.
---

# /site-premium — Site de alto padrão com hero 3D

O site vende pela primeira tela: o 3D mostra o serviço acontecendo (o carro chega sujo e sai brilhando, o objeto chega fosco e sai espelhado). O resto do site é contido de propósito — é a restrição que faz parecer caro.

## Dependências

- **Modelo pronto:** `.claude/skills/site-premium/modelo/` (index.html, estilo.css, app.js, hero3d.js, img/)
- **Regras de design:** `.claude/skills/site-premium/design.md` — ler antes de mexer no visual
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

### Passo 2 — A história do 3D (o mais importante)

Definir em uma frase o **antes → depois** que o cliente compra, e de 3 a 5 capítulos:

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
| **Hero 3D** | `data-modo="3d"` no `#palco` (padrão) | Transformação clara + modelo .glb bom. Pacote mais caro |
| **Hero foto** | `data-modo="foto"` + foto real em `img/hero.*` (o Three.js nem é baixado) | Sem modelo 3D, orçamento menor, demo rápida |
| **Tema escuro** | `data-tema="escuro"` no `<html>` (padrão) | Automotivo, barbearia, bar, tecnologia, luxo |
| **Tema claro** | `data-tema="claro"` + cores no bloco `:root[data-tema="claro"]` | Clínica, ótica, confeitaria, infantil, pet, moda feminina |
| **Página de serviço** | `servico.html` copiada como `servico-<nome>.html` | Cada serviço que as pessoas buscam no Google ("lentes multifocais campinas") |
| **Loja online** | link comentado no `<nav>` do `index.html` | Loja com Nuvemshop/Shopify |

### Passo 3 — Montar o site

1. Copiar `modelo/` inteiro pra `clientes/<Nome>/site/`
2. **Variações** acima: modo do hero, tema, quais páginas de serviço
3. **`estilo.css`** → trocar só o `:root` do tema escolhido (cores da marca; fontes se a marca tiver)
4. **HTML** (`index.html`, `servico*.html`, `privacidade.html`) → trocar todo elemento com `data-editar`: textos, avaliações, endereço, meta tags **e o JSON-LD** (dados do negócio pro Google: tipo específico como `Optician`/`AutoRepair`/`BeautySalon`, endereço, horário, coordenadas, Instagram). Títulos seguindo `design.md` §2. Title de cada página = serviço + cidade + marca
5. **`DOMINIO`** → buscar e trocar em todos os arquivos (canonical, og, JSON-LD, `sitemap.xml`, `robots.txt`). Sem domínio ainda: deixar e trocar no `/publicar-site`
6. **`app.js`** → `CONFIG`: WhatsApp, serviços (os mesmos nomes dos cards), períodos, dias fechados, **medição** (Plausible sem cookies, ou GA4/Pixel do cliente — o aviso de cookies aparece sozinho)
7. **`hero3d.js`** (modo 3D) → `CONFIG`: caminho do .glb em `modelo`, `corSujeira`, `corDestaque`, e os `capitulos` do Passo 2 (rótulo, `limpo`, `brilho`, posição da câmera). Pra negócio sem "sujeira", deixar `limpo: 1` em todos e contar a história com `brilho`, câmera e `giro`. Cor do estúdio acompanha o tema sozinha
8. **`img/`** → fotos reais (WebP, ~1600 px no lado maior) no lugar dos SVGs; `og.png` 1200×630 (gerar com `og/og.html` desta skill: `node scripts/render.js .claude/skills/site-premium/og/og.html --png <pasta> --size 1200x630`); `favicon.svg` com a inicial da marca
9. **`privacidade.html`** → dados do cliente; sem GA4/Pixel, apagar a seção de cookies
10. **`sitemap.xml`** → uma `<url>` por página indexável
11. Apagar os comentários de instrução do topo dos arquivos

### Passo 4 — Ver e conferir

```bash
python3 -m http.server 4173 --directory clientes/<Nome>/site
```

Rodar o **`/checar-site`** (pega texto de exemplo esquecido, WhatsApp de exemplo, erros, 404, SEO, imagens, rolagem lateral):

```bash
node scripts/checar-site.js clientes/<Nome>/site --saida clientes/<Nome>/site/CHECAGEM.md
```

Zero ❌. Depois abrir `http://localhost:4173` e olhar, no desktop (1440 px) **e** no celular (390 px):

- [ ] Preloader some e o hero aparece; no 3D, todos os capítulos funcionam e o play/pause
- [ ] Na etapa mais próxima da câmera, o objeto não cobre o título (se cobrir, afastar `cam` daquele capítulo)
- [ ] Agenda abre, monta a mensagem e abre o WhatsApp certo (no `localhost`, o console mostra cada evento `[medir]`)
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
- **O 3D conta o serviço.** Objeto girando sem história é enfeite — perguntar qual é a transformação.
- **Licença de tudo:** modelo 3D, fotos, fontes. Na dúvida, não usar.
- **Rótulos de honestidade ficam:** "animação 3D ilustrativa" e o aviso de foto ilustrativa quando houver.
- **Nada inventado:** avaliações, números da faixa de prova e preços vêm do cliente ou do Google.
- **Celular primeiro na conferência:** a maioria dos acessos de loja local vem do Instagram, no celular.
- **Não publicar sem aprovação.**
