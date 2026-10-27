---
name: identidade-loja
description: >
  Levanta a identidade visual da loja ANTES de construir qualquer coisa pra ela (site, demo, carrossel,
  proposta): cores com o papel de cada uma (fundo, texto, destaque, base escura), logo recortado, fontes,
  frases que a própria loja usa e redes, a partir do site atual e de prints do Instagram, do logo ou da
  fachada. Gera marca.json, marca.md com o :root pronto pro modelo e um quadro visual (marca.png). Nunca
  inventa cor: sem fonte, pede os prints. Use sempre antes do /site-premium e do /site-demo, e quando o
  usuário falar em "identidade visual", "cores da loja", "logo do cliente", "manter a marca", "não ficar
  genérico", "seguir a marca da loja", ou /identidade-loja.
---

# /identidade-loja — A marca da loja antes do site

Site genérico é o que faz o dono não se reconhecer e não comprar. Antes de abrir o modelo, levantar o que a loja **já tem** — cor, logo, fonte, jeito de falar — e construir em cima disso. O modelo do `/site-premium` dá a qualidade; a identidade tem que ser **dela**.

## Dependências

- **Script:** `scripts/extrair-marca.js` (Playwright + ImageMagick — se faltar, `npm run setup` na raiz)
- **Saída:** `vendas/marcas/<slug>/` (prospect) ou `clientes/<Nome>/marca/` (cliente). Ficam só no computador (não vão pro GitHub)
- **Quem usa depois:** `/site-premium`, `/site-demo`, `/carrossel` e `/video-reels` pra cliente, e o `/checar-site --marca`

---

## Workflow

### Passo 1 — Juntar as fontes (só o que é da loja)

Por ordem de força:
1. **Logo em arquivo** que o dono mandou (melhor fonte que existe)
2. **Site atual**, se abrir (mesmo velho: cor e logo costumam estar certos)
3. **Prints que o usuário tirar** — o Instagram e o Google Maps pedem login, então quem tira é ele:
   - perfil do Instagram (foto de perfil, destaques e a grade de posts)
   - 2–3 posts com a cara da marca (arte, cardápio de serviços, promoção)
   - foto da fachada, do uniforme ou do carro/van (Google Maps → Fotos)
   Salvar em `vendas/marcas/<slug>/prints/`

**Sem nenhuma dessas fontes: parar e pedir os prints.** Não escolher cor "que combina com o nome" (azul porque o nome lembra água, verde porque lembra natureza). É exatamente assim que o site fica genérico.

### Passo 2 — Rodar o script

```bash
node scripts/extrair-marca.js --site <url> --imagem vendas/marcas/<slug>/prints/perfil.png --imagem vendas/marcas/<slug>/prints/fachada.jpg --saida vendas/marcas/<slug>
```

(Só com imagens: tirar o `--site`. Arquivo de logo: chamar de `logo.*` que ele vira o logo da marca.)

O script mede quanto cada cor aparece (área, texto, botões, logo, imagens), ignora botão de WhatsApp, chat e aviso de cookies, recorta o logo do topo do site com fundo transparente, lê as fontes e as frases. Gera `marca.json`, `marca.md` (com o `:root` sugerido e o contraste já calculado) e `marca.png`.

### Passo 3 — Conferir com o olho (obrigatório)

Abrir `marca.png` lado a lado com `assets/site-desktop.png` e os prints:
- O **destaque** é a cor da marca, e não a de um plugin, tema do WordPress ou botão de WhatsApp? Se não for, corrigir `cores.destaque` no `marca.json` e anotar o porquê em `"decisoes"`
- A **base escura** (marinho, vinho, verde-garrafa) é da marca? Ela vira o fundo do tema escuro no lugar do preto do modelo
- O **logo recortado** é o logo, inteiro e legível? Se o fundo dele é branco (`logo.fundo: "claro"`), anotar: no tema escuro vai sobre um cartão claro, ou usar o tema claro
- Cor em mais de uma fonte (site + Instagram + fachada) é certeza. Cor só em uma, desconfiar

### Passo 4 — Completar o que o script não vê

Acrescentar no fim do `marca.md`:
- **Nome como a loja se chama** (Instagram × Google × fachada podem ser diferentes)
- **Elementos de marca:** formas do logo (faixa, "S", swoosh, mascote), ícones que repetem, padrão das artes do Instagram. Viram os elementos gráficos do site (ex.: as faixas da arte do hero vêm da faixa amarela do logo)
- **Jeito de falar:** gírias, emojis, frases que repetem nos posts e nas respostas. Usar no site no lugar de frase inventada
- **Fotos reais disponíveis** (e de onde): fachada, equipe, trabalhos feitos

### Passo 5 — Levar pro site (checklist anti-genérico)

No `/site-premium` ou `/site-demo`, antes de mexer no conteúdo:
- [ ] `estilo.css` → colar o `:root` sugerido do `marca.md` (ou o bloco `:root[data-tema="claro"]`, se o tema sugerido for claro)
- [ ] Tema (claro/escuro) conforme a marca, não conforme o modelo. Base escura da marca no `--bg` do tema escuro
- [ ] **Logo real no topo** (`.logo` com `<img>`); nome em texto só se o logo não ler bem — e anotar em `decisoes`
- [ ] Fonte de título: a da marca, se for Google Font; senão a do modelo que mais se parece
- [ ] Hero e títulos com as **frases da loja** (`frases` do `marca.json` + Passo 4). Frase do modelo ("Pode vir como está") só se nada da loja servir
- [ ] Elementos gráficos derivados do logo, não formas genéricas
- [ ] Fotos reais > arte gráfica nas cores da marca > nada. Nunca foto de banco que pareça ser da loja

Conferir:
```bash
node scripts/checar-site.js <pasta-do-site> --marca vendas/marcas/<slug>/marca.json
```
❌ se o `--accent` do site não for a cor da marca (vira ⚠️ se a troca estiver em `decisoes`); ⚠️ se o logo não aparecer no topo.

### Passo 6 — Mostrar

No chat: o `marca.png`, o destaque, a base escura, o logo e as 3 frases mais fortes, e o que ficou faltando ("sem print do Instagram, a cor veio só do site de 2019 — vale confirmar com o dono").

---

## Regras

- **Nunca inventar cor, logo ou frase.** Sem fonte, pedir print. Sem print, não construir.
- **A marca é da loja.** Não "melhorar" o logo nem trocar a cor por gosto. Ajuste de contraste (um tom mais claro pra ler no fundo escuro) pode, anotado em `decisoes`.
- **Prints e logo são da loja**: usar só pra demo e pro trabalho dela; no site final, só com autorização.
- **Uma identidade por loja, reaproveitada.** O `marca.json` da prospecção vai junto pra `clientes/<Nome>/marca/` quando fechar.
