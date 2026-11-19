---
name: carrossel-semanal
description: "Gera sozinho, sem pausas pra aprovação, os carrosséis da semana (padrão: 2) pro Instagram de um negócio no ZL_IA: escolhe ideias da pauta, escreve o texto, monta o HTML com a identidade da marca, renderiza os PNGs 1080x1350, confere o visual, escreve a legenda, atualiza a pauta e faz commit. Feita pra rodar em rotina agendada; entrega rascunhos prontos pra revisão e nunca publica. Use quando o usuário (ou uma rotina) pedir \"carrossel semanal\", \"carrosséis da semana\", \"gera os posts da semana\" ou /carrossel-semanal [quantidade].\n"
---

# /carrossel-semanal — Carrosséis da semana no automático

Versão sem checkpoints da skill `/carrossel`. Roda do começo ao fim sem perguntar nada: quem revisa é
a pessoa, depois, antes de postar. Se faltar alguma coisa, decide pelo caminho mais seguro e anota no
relatório final.

**Argumento opcional:** quantidade de carrosséis (padrão 2).

---

## Fontes de verdade (ler tudo antes de começar)

| Arquivo | Pra quê |
|---|---|
| `CLAUDE.md` | Regras do workspace |
| `_memoria/empresa.md` | Quem é o negócio, endereço, WhatsApp, @, como atende |
| `_memoria/preferencias.md` | Tom de voz e o que evitar |
| `_memoria/estrategia.md` | Foco do momento |
| `identidade/design-guide.md` | Cores, fontes, logo, o que nunca fazer |
| `marketing/conteudo/ideias-carrosseis.md` | Pauta: ideias com status e lista de "Já feitos" |
| Carrossel mais recente em `marketing/conteudo/carrossel-*/` | Base visual (CSS, estrutura, assets) e cor da última capa |
| Catálogo de produtos | O primeiro que existir: `site/produtos.csv`, `dados/produtos*.csv`, `_memoria/produtos.md`. Se nenhum existir, só vale produto que já apareceu num carrossel anterior |

---

## Regras que não mudam

- **Sem preço.** No máximo o peso (ex.: "50 g", "1 kg").
- **Só produto que existe** no catálogo ou em carrossel anterior. Na dúvida, deixa o produto de fora.
- **Sem promessa de efeito no corpo** (cura, emagrecer, imunidade, "detox", "mais saudável que").
- **Sem frase de efeito artificial** (ex.: "sem promessa milagrosa"). Falar como o negócio fala na bio.
- **Não concorrer com produto da casa.** Se a memória diz que a loja vende algo pronto (ex.: temperos misturados por eles), não ensinar a fazer em casa.
- **Nunca publicar** em rede social. A entrega é a pasta com PNGs e legenda.
- **Nunca usar** foto em que apareça informação desatualizada (ex.: telefone antigo) nem rosto de pessoa sem autorização registrada na memória.

---

## Passo 1 — Preparar

1. `git pull` na branch atual pra pegar o que mudou desde a última rodada.
2. Ler todas as fontes de verdade.
3. Descobrir a **cor da última capa**: abrir o `texto.md` do carrossel mais recente da lista "Já feitos" (linha "Capa no feed").

## Passo 2 — Escolher as ideias

1. Pegar da pauta as ideias marcadas com **✅** que ainda não estão em "Já feitos".
2. Preferir ideias com data (ex.: "postar na 2ª quinzena de novembro") quando a data chegou.
3. Não repetir o mesmo produto principal nos carrosséis da mesma rodada.
4. **Se faltar ideia ✅:** criar ideias novas seguindo as regras, usando só produtos do catálogo. Antes de produzir, adicionar cada ideia nova na pauta com ✅.
5. Ideias 🟡 (confirmar) e 📷 (precisa de foto) **não entram**.

## Passo 3 — Escrever o texto

Pra cada carrossel, 7 ou 8 slides:

1. **Capa:** eyebrow curto + título de até 8 palavras + subtítulo de uma linha.
2. **Miolo (5 ou 6 slides):** uma ideia por slide, frase curta e concreta. Incluir um slide **"Pra salvar"** com resumo em lista quando o tema permitir.
3. **Chamada final:** frase de convite + endereço + WhatsApp + @ (da memória).

Tom: o de `_memoria/preferencias.md`. Português do dia a dia, sem jargão.

## Passo 4 — Montar o visual

1. Criar `marketing/conteudo/carrossel-<tema-em-slug>-<AAAA-MM-DD>/` com `assets/` e `instagram/`.
2. Copiar pra `assets/` os arquivos de logo citados no design-guide (versão pra fundo escuro, versão pra fundo claro, logo completo, ornamento).
3. Criar **um único `carrossel.html`** com todos os slides (`<div class="slide">`, 1080×1350). Partir do CSS do carrossel mais recente pra manter a identidade: mesmas fontes, cores, cabeçalho (logo à esquerda, contador à direita), rodapé (@ à esquerda, seta à direita) e chamada final.
4. **Capa:** alternar com a última publicada, na ordem **foto ou escuro → cor da marca → claro → foto ou escuro**. Nunca duas capas iguais seguidas.
5. **Fundos:** nunca dois slides seguidos com o mesmo fundo. Texto branco só em fundo escuro ou na cor forte da marca.
6. **Ilustrações** feitas só com CSS, no estilo das peças anteriores. Reaproveitar quando fizer sentido:
   - tigela de madeira vista de cima com o produto dentro, na cor e textura certas;
   - etiqueta de balança em fonte mono, com nome do produto, **peso** e código de barras (sem preço);
   - pote de vidro em camadas que enche a cada slide;
   - saquinho transparente com etiqueta.
7. **Não fazer:** número gigante solto no slide, ícone em caixinha, degradê aleatório, emoji decorativo, textura em grade que pareça tecido.

## Passo 5 — Renderizar e conferir

1. Na raiz do projeto, rodar `node scripts/render.js marketing/conteudo/<pasta>/carrossel.html --png marketing/conteudo/<pasta>/instagram` (gera um PNG 1080×1350 por `.slide`). Se o Playwright não estiver instalado, rodar `npm run setup` antes.
2. Montar uma folha de contato com todos os slides e **olhar a imagem**. Conferir:
   - texto cortado, sobreposto à ilustração ou fora do slide;
   - área vazia grande demais ou conteúdo espremido;
   - contraste ruim;
   - textura que não parece o produto;
   - cabeçalho, contador e rodapé em todos os slides.
3. Corrigir no HTML e renderizar de novo. Até 3 rodadas por carrossel.

## Passo 6 — Legenda e registro

Na pasta do carrossel:

- **`legenda.md`:** gancho (pergunta ou afirmação) → 1 ou 2 frases de contexto → "Arrasta pro lado…" → endereço e WhatsApp (no máximo 3 emojis no post) → 10 a 15 hashtags (tema + nicho + cidade e região).
- **`texto.md`:** tipo, objetivo, regra de preço, cor da capa ("Capa no feed: …"), texto slide a slide e a seção **"Antes de postar"** listando os produtos que a loja precisa confirmar.

## Passo 7 — Atualizar a pauta

1. Tirar as ideias produzidas da lista de ideias.
2. Adicionar uma linha em "Já feitos" pra cada uma (data, título, pasta).
3. Se sobrarem menos de 4 ideias ✅, criar ideias novas até ter 4, seguindo as regras.

## Passo 8 — Salvar

1. `git add` só das pastas novas e da pauta.
2. Commit com mensagem clara (ex.: "Carrosséis da semana: <título 1> e <título 2>").
3. `git push` na branch atual (ou na que a rotina indicar). Nunca `--force`. Se o push falhar por rede, tentar de novo até 4 vezes, esperando 2, 4, 8 e 16 segundos.

## Passo 9 — Relatório final

Responder com:

- título e pasta de cada carrossel;
- a legenda de cada um, pronta pra copiar;
- o que precisa ser confirmado com a loja antes de postar;
- ideias novas que entraram na pauta;
- qualquer decisão tomada no lugar da pessoa (ex.: "não havia ideia ✅, criei duas novas").

---

## Uso em rotina agendada

Prompt sugerido pra tarefa agendada (ex.: segunda e quinta de manhã):

> Rode a skill /carrossel-semanal com 2 carrosséis. Ao terminar, faça commit e push na branch
> `<branch>` e me mande o resumo com as legendas.

A cada rodada a rotina começa do zero; tudo o que ela precisa saber tem que estar nos arquivos acima.
Quando a pessoa corrigir algo num carrossel, registrar a correção em `_memoria/preferencias.md` pra
próxima rodada já sair certa.
