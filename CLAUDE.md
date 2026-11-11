# MazyOS — Sistema operacional do negócio

Sua empresa roda em cima desse arquivo. Aqui ficam as regras de operação
do MazyOS — como o Claude lê o contexto, aprende com correções, mantém
tudo atualizado e cria skills novas conforme a operação evolui.

Esse arquivo é editável. Quando o `/instalar` rodar, ele complementa o
final dessa página com as regras específicas do seu negócio.

---

## Contexto do negócio

No início de toda conversa, ler os seguintes arquivos (quando existirem
e estiverem preenchidos):

1. `_memoria/empresa.md` — quem é o usuário, o que faz, como funciona o negócio
2. `_memoria/preferencias.md` — tom de voz, estilo de escrita, o que evitar
3. `_memoria/estrategia.md` — foco atual, prioridades, prazos
4. `_memoria/servicos.md` — o que você vende pras lojas e por quanto
5. `_memoria/vendas-aprendizados.md` — o que já funcionou e o que não funcionou nas vendas

A pasta `_memoria/` é só deste computador (não vai pro GitHub). Se um
arquivo dela não existir (clone novo), criar copiando o modelo de
`templates/memoria/` antes de usar.

Usar essas informações como base pra qualquer resposta ou decisão. Ao
sugerir prioridades, formatos ou abordagens, considerar o foco atual
descrito em `estrategia.md`.

Pra qualquer tarefa visual (carrossel, post, landing page), consultar
`identidade/design-guide.md` como referência de estilo.

Não é necessário listar o que foi lido nem confirmar a leitura. Apenas
usar o contexto naturalmente.

---

## Fluxo de trabalho

Antes de executar qualquer tarefa, verificar se existe skill relevante
em `.claude/skills/`. Se encontrar, seguir as instruções da skill. Se
não encontrar, executar a tarefa normalmente.

**O usuário não decora comando.** Ele fala do jeito normal ("acha
metalúrgicas com site ruim", "fechei com a ótica", "quem eu chamo hoje?")
e a skill certa entra sozinha, sem pedir pra ele digitar `/nome`. A cada
mensagem, o hook `.claude/hooks/gatilhos.mjs` compara o texto com o mapa
`.claude/gatilhos.json` e avisa quais skills bateram (aparece como
"⚡ /skill"). O aviso é uma pista: usar a skill quando o pedido for
mesmo aquilo, e também quando o contexto pedir sem palavra-chave (um
print de avaliação colado → `/responder-avaliacoes`; uma planilha →
`/analisar-dados`). Na dúvida sobre o que existe: `/menu`.

Ao concluir uma tarefa que não tinha skill mas parece repetível (o
usuário provavelmente vai pedir de novo no futuro), perguntar:

> "Isso pode virar uma skill pra próxima vez. Quer que eu crie?"

Não perguntar pra tarefas pontuais ou perguntas simples. Só quando o
padrão de repetição for claro.

---

## Aprender com correções

Quando o usuário corrigir algo, melhorar uma resposta ou dar uma
instrução que parece permanente (frases como "na verdade é assim", "não
faça mais isso", "prefiro assim", "sempre que...", "evita...", "da
próxima vez..."), perguntar:

> "Quer que eu salve isso pra não precisar repetir?"

Se sim, identificar onde faz mais sentido salvar:

- **Sobre o negócio** (clientes, serviços, mercado) → `_memoria/empresa.md`
- **Sobre preferências e estilo** (tom de voz, formato, o que evitar) → `_memoria/preferencias.md`
- **Sobre prioridades e foco** (projetos, metas, prazos) → `_memoria/estrategia.md`
- **Regra de comportamento nessa pasta** → próprio `CLAUDE.md`

Salvar com uma linha nova clara, sem reformatar o arquivo inteiro.
Confirmar mostrando a linha adicionada.

Não perguntar se a correção for óbvia de contexto imediato (ex: "na
verdade o arquivo se chama X"). Só perguntar quando a informação tiver
valor duradouro.

---

## Manter contexto atualizado

Ao terminar uma tarefa que mudou algo relevante (cliente novo, skill
nova, mudança de foco, processo novo, ferramenta instalada, estrutura
alterada), perguntar:

> "Isso mudou algo no teu contexto. Quer que eu atualize a memória?"

Se sim, identificar o que atualizar:

- **Cliente, serviço, ferramenta, equipe** → `_memoria/empresa.md`
- **Mudança de prioridade ou foco** → `_memoria/estrategia.md`
- **Tom ou estilo** → `_memoria/preferencias.md`
- **Pasta, regra de organização, skill criada** → `CLAUDE.md`
- **Visual (cores, fontes, logo)** → `identidade/design-guide.md`

Mostrar o que vai mudar antes de salvar. Não reformatar o arquivo
inteiro, só adicionar ou editar a linha relevante.

**Quando NÃO perguntar:**
- Tarefas pontuais sem impacto no contexto (escrever um email avulso, criar um post)
- Perguntas simples ou conversas sem ação
- Mudanças já salvas pelo bloco "Aprender com correções"

**Dica:** rode `/atualizar` pra uma varredura completa quando houver dúvida.

---

## Criação de skills

Quando o usuário pedir skill nova:

1. Verificar se existe template relevante em `templates/skills/`. Se
   existir, usar como base e adaptar pro contexto
2. Perguntar se é específica desse projeto ou útil em qualquer:
   - Específica → `.claude/skills/nome-da-skill/SKILL.md` (local)
   - Universal → `~/.claude/skills/nome-da-skill/SKILL.md` (global)
3. Ler `_memoria/empresa.md` e `_memoria/preferencias.md` pra calibrar
   o conteúdo da skill ao contexto do negócio
4. Se a skill precisar de arquivos de apoio (templates, exemplos),
   criar dentro da pasta da skill
5. Seguir o fluxo da skill-creator nativa do Claude Code
6. Adicionar a skill em `.claude/gatilhos.json` (grupo, quando, 2–3
   frases de exemplo e os gatilhos) e testar com
   `echo '{"prompt":"<frase>"}' | node .claude/hooks/gatilhos.mjs`, e pôr 1–2 frases
   em `.claude/hooks/gatilhos.teste.mjs` (rodar: `node .claude/hooks/gatilhos.teste.mjs`).
   Sem isso ela não dispara sozinha nem aparece no `/menu`

---

## Sites premium — regras globais de design

Valem pra todo site, landing page e componente gerado neste repositório.
São ordens: quebrar uma delas só com o motivo escrito no `DESIGN.md` do
cliente.

Não valem pro Creative Engine (`creative-engine/`, anúncio em vídeo, skill
`/criativo`): lá a animação é calculada quadro a quadro pelo próprio motor,
sem mola, GSAP nem Lenis. As regras dele estão em `docs/creative-engine/`.

**Dois trilhos, a mesma régua:**

- **Site estático** (padrão pra negócio local, sem build): skill
  `/site-premium`, com os mundos visuais e as peças de
  `.claude/skills/site-premium/tecnicas/`
- **Projeto Next.js (App Router):** arquétipo do nicho em
  `docs/archetypes/` e componentes prontos em `src/components/premium/`
  (arquivos soltos: copiar a pasta pro projeto do cliente)

**Escolher o arquétipo pelo cliente, antes de escrever CSS:**

| Cliente | Ler |
|---|---|
| Software, API, IA, fintech, ferramenta B2B | `docs/archetypes/saas-tech.md` |
| Joia, moda, arquitetura, hotel, gastronomia autoral, alto padrão | `docs/archetypes/luxury.md` |
| Marca que vende produto direto ao consumidor | `docs/archetypes/dtc-ecommerce.md` |
| Estúdio, agência, portfólio, produtora, evento | `docs/archetypes/creative-agency.md` |

Nenhum serve: usar o `/site-premium` (leitura do cliente em `direcao.md`).
O arquétipo é ponto de partida: a marca do cliente troca cor, fonte e
assinatura. Dois sites do mesmo arquétipo nunca saem iguais.

### UI/UX, hierarquia e contraste

- Uma ideia por dobra e uma ação principal por tela. A primeira dobra
  responde o que é, pra quem é e o que fazer agora
- Três níveis de texto: título, apoio e detalhe. A diferença vem de
  tamanho e peso juntos: salto mínimo de 1,25× entre níveis, título da
  primeira dobra com pelo menos 3× o corpo
- Título em `clamp()`, entrelinha de 0,9 a 1,1 e espaçamento de −0,02 a
  −0,04em. Corpo de 16 a 18 px, entrelinha de 1,5 a 1,7, linha de 45 a
  75 caracteres
- No máximo 2 famílias e 1 mono. Fonte é escolha de marca, nunca a que
  veio no projeto
- Contraste medido: corpo ≥ 4,5:1; texto grande (≥ 24 px, ou 19 px em
  negrito), ícone e borda de controle ≥ 3:1. Texto sobre foto ou vídeo
  só com véu que garanta o número
- Cor: um fundo, uma tinta, um destaque (até 10% da tela, reservado pra
  ação e estado) e neutros derivados da tinta
- Espaço em escala de 4 px, grade de 12 colunas (4 no celular), respiro
  entre seções ≥ 96 px no computador e ≥ 64 px no celular
- Desenhar primeiro em 375 px, sem rolagem lateral. Alvo de toque ≥
  44 px, foco visível, tudo operável por teclado
- Todo controle tem os estados: repouso, hover, foco, pressionado,
  desabilitado, carregando e erro
- Proibido o genérico: degradê roxo de enfeite, três cards iguais com
  ícone, emoji como ícone, a mesma sombra em tudo, texto de exemplo e
  foto de banco de imagem

### Animação

- **Mola é obrigatória** em tudo que responde a ponteiro, toque ou
  arrasto: rigidez e amortecimento, nunca duração fixa. No Next, Motion
  (`useSpring`, `type: 'spring'`); no estático, `fisica.js`. Partida:
  170/26 (assentada), 260/20 (viva), 120/14 (elástica, só em peça de
  brincar)
- **GSAP ScrollTrigger sobre Lenis é obrigatório** em tudo que é ligado
  à rolagem: seção fixada, scrub e revelação. Proibido listener de
  `scroll` solto dirigindo animação. No estático, o `palco()` faz esse
  papel
- Texto revelado com SplitText (caractere, palavra ou linha) e máscara,
  mantendo o texto original pro leitor de tela
- Animar só `transform`, `opacity` e uniform de shader. Nunca largura,
  altura, posição, sombra ou filtro em laço
- Uma animação-assinatura por página, o resto discreto. Micro de 150 a
  250 ms, entrada de 500 a 900 ms, intervalo entre itens de 20 a 60 ms,
  saída em `cubic-bezier(0.16, 1, 0.3, 1)`
- `prefers-reduced-motion` troca o comportamento (sem seção fixada, sem
  parallax, sem mola de enfeite), não só encurta o tempo
- Cada biblioteca tem um dono: Motion cuida de estado e gesto de
  componente; GSAP, de rolagem e texto; Lenis, da rolagem suave; R3F, do
  3D. Duas nunca animam a mesma propriedade do mesmo elemento
- Limpar ao desmontar: `useGSAP`, `lenis.destroy()`, listeners e
  geometrias

### Performance e fallback de GPU

- Orçamento em celular médio no 4G: LCP ≤ 2,5 s, CLS ≤ 0,05, INP ≤
  200 ms, JavaScript da primeira carga ≤ 200 kB (gzip) sem contar o 3D
- WebGL nunca é o LCP: primeiro o pôster estático (HTML, CSS ou imagem),
  depois o canvas, montado só no cliente
- Todo canvas mede o próprio FPS. Abaixo de 30: reduz DPR e amostras do
  shader; se não recuperar, troca pelo pôster. Sem WebGL, contexto
  perdido, economia de dados ou movimento reduzido: pôster direto
- DPR ≤ 2 no computador e ≤ 1,5 no celular. Um canvas por página,
  pausado fora da tela e com a aba oculta
- No celular (ponteiro grosso): sem cursor customizado, sem ímã, sem
  pós-processamento, metade das amostras do shader e rolagem nativa
- Imagem em AVIF ou WebP com `next/image` e `sizes`; a do LCP com
  `priority`. Fonte por `next/font`, `display: swap`
- `will-change` só durante a animação. Sem `backdrop-filter` em área
  grande que rola no celular
- Antes de entregar: Lighthouse no celular ≥ 90 em desempenho e em
  acessibilidade (`/checar-site` no estático)

### Dependências (projeto Next.js)

| Papel | Pacote | Regra |
|---|---|---|
| Base | `next` (App Router), `react` 19, TypeScript estrito | Server Component por padrão; `'use client'` só na folha que anima |
| Estilo | `tailwindcss` 4 | Tokens no `@theme`; valor solto fora do token é exceção |
| Estado, gesto e mola | `motion` (o Framer Motion; importar de `motion/react`) | Nada de CSS transition em quem a mola já move |
| Rolagem e texto | `gsap` ≥ 3.13 e `@gsap/react` (ScrollTrigger, SplitText) | Sempre dentro de `useGSAP` |
| Rolagem suave | `lenis` | Uma instância, a do `SmoothScrollContainer` |
| 3D | `three` e `@react-three/fiber` (`@react-three/drei` só se precisar) | Shader próprio em GLSL; modelo em `.glb` com Draco |

```bash
npm i motion gsap @gsap/react lenis three @react-three/fiber && npm i -D @types/three
```

Biblioteca fora dessa lista entra só com motivo. Os componentes de
`src/components/premium/` já seguem tudo acima:

| Componente | Serve pra |
|---|---|
| `Hero3DCanvas` | Primeira dobra com objeto 3D de vidro que refrata a luz, segue o ponteiro e cai pro pôster se o FPS ficar abaixo de 30 |
| `SmoothScrollContainer` | Lenis + ScrollTrigger na página toda, com `PinnedSection` (seção fixada) e `SplitReveal` (texto letra a letra) |
| `MagneticButton` | Chamada principal que o ponteiro atrai, com mola |
| `CustomCursor` | Cursor fluido que vira rótulo ("View", "Drag") e cresce sobre mídia |

---

## Clientes ficam só neste computador

Nenhum dado de cliente ou prospect vai pro GitHub: nem funil, lotes,
prints e telefones (já estão no `.gitignore`: `vendas/`, `clientes/`,
`_memoria/`, `projetos/`, `saidas/`, `marketing/criativos/`), nem **nome de loja ou empresa,
real ou fictício**, em arquivo versionado — skills, exemplos, frases de
gatilho, testes e mensagens de commit.

- Em exemplo, usar termo genérico: `<loja>`, `<cliente>`, "a ótica",
  "a metalúrgica". Nunca tirar exemplo do funil real
- Nunca `git add -f` em arquivo das pastas locais
- Antes de commit, olhar o `git diff --cached` procurando nome de empresa
  ou pessoa. A trava `scripts/checar-clientes.js` roda sozinha em cada commit
  (`.githooks/pre-commit`, ativada pelo `npm run setup`): nunca pular com
  `--no-verify`. Nome curto que ela não conhece entra em
  `_memoria/nomes-proibidos.txt`
- Backup das pastas locais: `node --env-file=.env scripts/backup.js`,
  criptografado, fora do GitHub
