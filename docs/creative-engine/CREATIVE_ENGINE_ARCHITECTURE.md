# MazyOS Creative Engine — Arquitetura

> **Situação:** implementada em 11/11/2026 (MVP completo, etapas 0.1 a 7.3). A seção 12 lista o que
> a implementação fez diferente deste desenho. As seções 1 e 11 são o retrato do dia da auditoria.
> **Data da auditoria:** 11/11/2026, no commit `0f63d70` do repositório principal.
> **Documentos irmãos:** [roadmap e plano de testes](CREATIVE_ENGINE_ROADMAP.md) ·
> [formato do projeto](CREATIVE_PROJECT_SCHEMA.md) · [decisões](ARCHITECTURE_DECISIONS.md)

O Creative Engine é a parte do MazyOS que produz conteúdo visual animado de marketing. Tem duas
portas de entrada para o mesmo projeto: o Claude Code, que dirige a criação e opera por comandos, e
um editor web, onde se ajusta à mão. As duas portas usam o mesmo núcleo (o Core) e o mesmo arquivo
de projeto. Não há MCP em lugar nenhum: a interface entre o Claude e o editor é o arquivo no disco.

---

## 1. O que a auditoria encontrou

Tudo abaixo foi lido ou executado nesta máquina. O que não deu para verificar está na seção 11.

### O repositório hoje

| Item | Estado |
|---|---|
| Natureza | Sistema de skills do Claude Code, não um aplicativo. 40 skills em `.claude/skills/`, 13 scripts Node em `scripts/` |
| `package.json` da raiz | `"type": "module"`, uma dependência (`playwright`, instalado na versão 1.64.1), `engines.node >= 20`, sem build e sem framework de teste |
| Testes existentes | Um só: `node .claude/hooks/gatilhos.teste.mjs` (script próprio, sem biblioteca) |
| Hook | `.claude/hooks/gatilhos.mjs` lê `.claude/gatilhos.json` a cada mensagem e sugere a skill |
| Trava de sigilo | `scripts/checar-clientes.js`, chamada por `.githooks/pre-commit`. Barra arquivo das pastas locais, nome de cliente e CPF/CNPJ |
| Pastas fora do Git | `_memoria/`, `clientes/`, `vendas/`, `projetos/`, `saidas/*`, `dados/*`, `.env` |
| `marketing/` | **Versionada** (hoje só tem o `README.md`). A `/video-reels` grava vídeo do próprio negócio em `marketing/videos/` |
| `src/` | Só `src/components/premium/`: 4 componentes React soltos para copiar em projeto Next de cliente. Não é um aplicativo que roda |
| `docs/` | Só `docs/archetypes/` (4 arquétipos de design de site) |
| Remotos | `origin` (o repositório do usuário) e `mazyos` (o MazyOS original, de onde vêm atualizações) |
| Licença do repositório | Não há arquivo `LICENSE` na raiz |

### O que já gera imagem e vídeo

| Skill ou script | O que faz | Como |
|---|---|---|
| `/carrossel`, `scripts/render.js` | PNG 1080×1350 e PDF | HTML aberto no Chromium do Playwright, um print por `.slide` |
| `/foto-produto`, `/video-ia`, `scripts/kie.js` | Foto e vídeo bruto gerados por IA | API do kie.ai |
| `scripts/gerar-imagem.js` | Foto por IA | API de imagens da OpenAI |
| `/video-reels` | Reels vertical 1080×1920 em MP4 | **HyperFrames** (HTML renderizado em MP4), chamado por `npx hyperframes`. Pede Node 22+ e FFmpeg |
| `/identidade-loja`, `scripts/extrair-marca.js` | `marca.json` da loja (cores com papel, fontes, logo, frases) | Playwright + ImageMagick |

A `/video-reels` é a vizinha mais próxima do Creative Engine: mesma saída (MP4 vertical), outro
caminho. O conflito está tratado na seção 10.

### A máquina

| Item | Estado |
|---|---|
| Node | `node` do terminal com nvm: v22.22.2. `/usr/bin/node`: v12.22.9 (não serve para nada do repositório) |
| FFmpeg | **Não está instalado** (`ffmpeg: command not found`). O pacote do sistema disponível é o 4.4.2 |
| FFmpeg do Playwright | Existe em `~/.cache/ms-playwright/ffmpeg-1013`, mas só codifica PNG e VP9. Não gera H.264 nem AAC, então não serve para MP4 |
| Chromium do Playwright | Instalado (`chromium-1248`) |
| Google Chrome e ImageMagick | Instalados |
| HyperFrames | Não está em `node_modules`; a skill baixa pelo `npx` quando roda |

Consequência direta: **hoje a máquina não exporta MP4 por nenhum caminho**, nem pelo Creative
Engine, nem pela `/video-reels`, que também declara depender do FFmpeg.

---

## 2. O que veio do OpenMotion

Repositório: `github.com/Yuan-ManX/open-motion`, lido em 11/11/2026 pela API do GitHub (último
commit de 17/08/2026). **Licença: MIT, "Copyright (c) 2026 Yuan-Man".**

A licença MIT permite usar, copiar e modificar, desde que o aviso de copyright e o texto da licença
acompanhem qualquer cópia ou parte substancial do código. A regra deste projeto é mais estreita:
**extraímos ideias, não código.** Nenhum arquivo, função ou trecho do OpenMotion entra no MazyOS. Se
um dia isso mudar, o trecho copiado leva o aviso MIT no cabeçalho e a mudança vira uma decisão
registrada.

### Como ele é por dentro

Dois pacotes num monorepo: `open-motion/` (servidor Express, banco SQLite pelo `node:sqlite`,
servidor MCP, agente com chamadas a modelos de IA) e `web/` (React 18, Vite 5, Zustand, Tailwind).
Os dois importam um pacote comum, `open-motion/src/shared`, onde o formato do projeto é definido
com Zod. Exportação de vídeo com `puppeteer-core` e `ffmpeg-static`, ambos opcionais.

### Conceito a conceito

| Conceito | Como o OpenMotion faz | O que o Creative Engine leva | O que muda |
|---|---|---|---|
| **Scene Graph** | Lista plana de componentes com `sceneId`, `parentId` e `orderIndex`; a cena é só nome e duração. Uma árvore de composição (sequência, paralelo, escalonado) é calculada depois | A ideia de um formato único, lido pelo agente e pelo editor | Árvore explícita no arquivo: projeto → cenas → camadas. A ordem da lista é a ordem de empilhamento |
| **Timeline** | Tempo em milissegundos; cada componente tem `durationMs` e `delayMs` | Relógio único e determinístico (`t = quadro / fps`), do `frameRenderer` dele | Tempo em **quadros inteiros** no arquivo, não em milissegundos |
| **Keyframes** | `offset` de 0 a 1 dentro da duração do componente, no estilo de animação CSS | Curva de aceleração por trecho; propriedades animáveis numa lista fechada | Quadro absoluto dentro da camada. Só 5 propriedades animáveis no começo |
| **Templates** | Cerca de 140 modelos com `id`, categoria (entrada, saída, ênfase, transição) e uma função que devolve componentes com keyframes já calculados | Catálogo com categoria e descrição que o agente consulta | Presets **não destrutivos**: ficam no arquivo como "fade de 10 quadros" e são resolvidos na hora de desenhar |
| **Transições de cena** | Par saída + entrada com sobreposição | A transição como sobreposição entre duas cenas | Declarada na cena que entra (`transitionIn`) |
| **Variation Engine** | Gera N variantes por eixos independentes (curva, tempo, intensidade, direção, paleta), com semente, lista do que mudou e nota de divergência | O desenho inteiro: eixos, semente, lista de mudanças | Eixos de anúncio (ritmo, entrada, paleta dentro da marca, texto) |
| **Motion Critique** | Nota de 0 a 100 em 4 dimensões com peso, achados com severidade e recomendações | Dimensões, severidade, nota ponderada, achado ligado à camada | Dimensões de anúncio: legibilidade, marca, ritmo, mensagem e técnica. A crítica visual é do Claude olhando quadros |
| **Checkpoints** | Fotografia do projeto antes de cada alteração do agente, num anel de 8, **só na memória** (some ao reiniciar) | Fotografia automática antes de cada alteração do agente; anel de tamanho fixo | Gravada em disco, na pasta do projeto |
| **Rollback** | Volta ao checkpoint e antes fotografa o estado atual, para dar para desfazer o desfazer | Igual | Igual |
| **Versões** | Fotografias com nome numa tabela do banco, com limite e descarte das mais antigas | Versão com nome ("aprovada pelo cliente") | Arquivo em disco, sem descarte automático |
| **Plan-then-execute** | Um compositor por regras transforma o pedido em ações tipadas; o plano aparece para revisão e pode ser cancelado | Plano revisável antes de executar; execução atômica | Quem planeja é o Claude Code. O plano é um arquivo de comandos, com `--dry-run` |
| **Brand Pack** | Identidade de movimento (durações, curvas, "personalidade") guardada como texto dentro de `tokens` | A marca como parte do projeto | Bloco `brand` tipado, importado do `marca.json` que o MazyOS já gera |

### O que não adotamos, e por quê

- **MCP, servidor REST e banco SQLite.** O arquivo JSON na pasta do cliente já é a interface, e o
  Claude Code já é o agente.
- **Chamadas a modelos de IA dentro do motor.** O motor é determinístico. Quem pensa é o Claude,
  pelas skills.
- **Chaves soltas com `_` dentro de `style`** (`_content`, `_tag`, `_trimPath` e dezenas de outras).
  O formato dele deixa passar qualquer chave; o nosso recusa campo desconhecido.
- **Gravação em tempo real.** O `recorder.ts` dele grava a tela enquanto a animação toca, então o
  número de quadros depende da velocidade da máquina. O nosso exportador avança quadro a quadro.
- **As 340 ferramentas e os 23 sistemas** (3D, partículas, rotoscopia). Fora do escopo.

---

## 3. Princípios

1. **Um formato, duas portas.** O `project.mazy.json` é a única fonte da verdade. Claude e editor
   leem e gravam o mesmo arquivo.
2. **O Core não sabe onde roda.** Não usa DOM, não usa `node:*`, não lê relógio nem sorteia. Roda
   igual no Node e no navegador.
3. **Uma porta de alteração.** Toda mudança de projeto passa por comandos do Core, que validam o
   resultado antes de aceitar.
4. **Determinismo.** O mesmo projeto e o mesmo quadro dão sempre a mesma imagem.
5. **Um desenhista só.** O preview do editor e a exportação usam o mesmo compositor. O que se vê é
   o que sai.
6. **Código de um lado, cliente do outro.** O motor mora em pasta versionada. Projetos, assets e
   renders moram em pasta local. O motor recebe o caminho do projeto; nunca o adivinha.
7. **Recusar é melhor que adivinhar.** Campo desconhecido, cor fora do padrão ou asset fora da
   pasta do projeto é erro com código e caminho, não aviso.
8. **Nada fictício.** O formato 1.0 só tem o que o MVP implementa. O que vem depois entra com
   versão nova do formato.

---

## 4. Estrutura de diretórios

### O motor (versionado)

```
creative-engine/                    pacote próprio, com package.json separado do da raiz
├── package.json
├── README.md
├── core/                           roda no Node e no navegador
│   ├── schema/
│   │   └── mazy-creative-project.schema.json
│   ├── src/
│   │   ├── index.js                API pública do Core (única entrada)
│   │   ├── types.js                tipos em JSDoc
│   │   ├── project/                Project Manager: criar, normalizar, migrar versão
│   │   ├── scene/                  Scene Manager
│   │   ├── layer/                  Layer Manager
│   │   ├── timeline/               Timeline Engine: início de cada cena, duração total
│   │   ├── keyframes/              Keyframe Engine: valor de uma trilha num quadro
│   │   ├── interpolation/          Interpolation Engine: curvas e Bézier
│   │   ├── presets/                Animation Presets, transições e modelos de projeto
│   │   ├── validation/             Project Validation: schema + regras semânticas
│   │   ├── commands/               comandos de edição
│   │   └── evaluate/               projeto + quadro → estado do quadro
│   └── test/
├── renderer/
│   ├── stage/                      compositor (navegador): estado do quadro → tela
│   ├── export/                     Export Renderer (Node + Playwright)
│   ├── adapters/                   Render Adapter: contrato e adaptador do FFmpeg
│   ├── media/                      Media Processing: medidas, hash, ffprobe
│   └── test/
├── storage/                        (Node) pasta do projeto: gravação atômica, revisão, histórico
├── intelligence/
│   ├── critique/                   crítica por regras
│   ├── variations/                 Variation Engine
│   └── brand/                      importar marca.json; conferir consistência
├── cli/
│   ├── mazy-creative.js            um comando, vários subcomandos
│   └── server.js                   servidor local do editor
├── editor/                         React + Vite
│   ├── index.html
│   ├── vite.config.js
│   ├── src/
│   │   ├── canvas/                 palco com seleção e alças
│   │   ├── timeline/
│   │   ├── inspector/
│   │   ├── assets/                 Asset Library
│   │   ├── preview/                tocar, pausar, arrastar o tempo
│   │   ├── state/                  projeto em memória, undo/redo
│   │   └── api/                    conversa com o servidor local
│   └── e2e/                        testes de ponta a ponta
├── fixtures/                       projetos de exemplo genéricos, válidos e inválidos
└── test/                           guardas do pacote: ambiente, dependências aprovadas, estrutura

docs/creative-engine/               estes quatro documentos
.claude/skills/criativo/            skill nova (etapa 5 do roadmap)
```

**Por que `docs/creative-engine/`:** a pasta `docs/` já existe e já guarda documentação de
referência (`docs/archetypes/`). Uma subpasta por assunto mantém o padrão.

**Por que não em `src/`:** `src/components/premium/` é uma prateleira de peças para copiar em
projeto de cliente, descrita assim no `CLAUDE.md`. Um aplicativo ali dentro confundiria as duas
coisas.

### Os projetos (locais, fora do Git)

```
clientes/<Nome>/criativos/<slug>/       criativo de cliente
marketing/criativos/<slug>/             criativo do próprio negócio (pasta a tirar do Git, ADR-010)
├── project.mazy.json                   o projeto (fonte da verdade)
├── assets/                             imagens, logos e fontes copiados para o projeto
├── .history/
│   ├── checkpoints/                    automáticos, anel de 30
│   ├── versions/                       com nome, sem descarte
│   └── log.jsonl                       uma linha por gravação: quem, quando, o quê
├── renders/                            MP4 e quadros de conferência
├── roteiro.md                          o roteiro aprovado
├── legenda.md                          a legenda do post
└── critica.md                          a última crítica
```

O `clientId` do projeto é um slug. O nome de exibição do cliente não entra no formato.

---

## 5. Os cinco blocos e onde cada um mora

| Bloco pedido | Onde | Observação |
|---|---|---|
| **Core** | `creative-engine/core/` | O Project Manager do Core só mexe no documento. Ler e gravar disco é do `storage/` |
| **Visual Editor** | `creative-engine/editor/` | O "Canvas" é o palco com alças, desenhado em DOM (ADR-004) |
| **Rendering** | `creative-engine/renderer/` | Preview e exportação usam o mesmo `stage/` |
| **Creative Intelligence** | `creative-engine/intelligence/` + skill | Metade é código, metade é o Claude (tabela abaixo) |
| **Claude Code Integration** | `creative-engine/cli/`, `storage/`, `.claude/skills/criativo/` | O histórico de versões mora na pasta do projeto |

### Creative Intelligence: o que é código e o que é o Claude

| Capacidade | Código (determinístico) | Claude (pela skill) |
|---|---|---|
| **Art Direction** | Modelos de projeto e presets | Escolhe conceito, composição e hierarquia a partir do `marca.json`, do `identidade/design-guide.md` e do briefing |
| **Storytelling** | Campo `beat` em cada cena (gancho, produto, oferta, prova, prazo, chamada) | Escreve o roteiro em batidas, como a `/video-reels` já ensina |
| **Creative Critique** | Regras medíveis: área segura, tamanho mínimo de fonte, contraste sobre cor chapada, tempo de leitura, gancho no quadro 0, chamada na última cena, piscar acima de 3 vezes por segundo | Olha os quadros exportados (`frame`, `contact-sheet`) e julga o que regra não mede: composição, foto, clareza da mensagem |
| **Variation Engine** | Gera variantes por eixo, com semente e lista do que mudou | Propõe os textos alternativos e escolhe quais variantes valem render |
| **Brand Consistency** | Confere cor e fonte contra o bloco `brand`; logo sempre inteiro e sem distorção | Julga se a peça "tem a cara" da marca |

Nenhuma linha da coluna do meio chama modelo de IA.

---

## 6. Contratos

### 6.1 Core

O Core trabalha sobre o documento do projeto (um objeto JavaScript simples) e nunca o altera no
lugar: toda função devolve um documento novo.

```js
// creative-engine/core/src/index.js
createProject({ template, id, name, clientId, brand })  → project
validateProject(project)   → { valid, errors: [Problema], warnings: [Problema] }
migrateProject(project)    → project                     // sobe schemaVersion antiga
getTimeline(project)       → { totalFrames, scenes: [{ sceneId, startFrame, endFrame, overlapIn }] }
evaluateFrame(project, f)  → FrameState                  // 0 ≤ f < totalFrames
applyCommands(project, [Comando]) → { project, changes } // tudo ou nada
listPresets()              → [{ id, role, description, params }]
listTemplates()            → [{ id, description, composition }]

// Problema: { code: 'LAYER_OUT_OF_SCENE', path: '/scenes/1/layers/0', message: '…', hint: '…' }
```

`validateProject` roda duas camadas. A primeira é o JSON Schema (com Ajv). A segunda são as regras
que o JSON Schema não expressa, listadas no [documento do formato](CREATIVE_PROJECT_SCHEMA.md).
Erro impede gravar e renderizar; aviso não.

### 6.2 Estado do quadro (Core → Renderer)

É o contrato central. O Core resolve tudo: tempo, curvas, presets, transições, cores da marca e
caminhos de asset. O Renderer só desenha o que recebe. (Os números abaixo são ilustrativos.)

```js
{
  frame: 210, timeSeconds: 7.0, width: 1080, height: 1920,
  background: '#14181F',                        // cor já resolvida
  scenes: [                                     // 1 cena; 2 durante uma transição (a de baixo primeiro)
    {
      sceneId: 'cena-produto', localFrame: 126, background: '#F6F4EF',
      container: { x: -540, y: 0, opacity: 1, clip: null },   // efeito da transição, já calculado
      layers: [                                 // só as visíveis neste quadro, de baixo para cima
        {
          layerId: 'produto-titulo', type: 'text',
          x: 64, y: 1070, width: 952, height: 200,
          scale: 1, rotation: 0, anchorX: 0.5, anchorY: 0.5, opacity: 1,
          content: { /* bloco text, image, shape ou logo, com cor, fonte e src resolvidos */ }
        }
      ]
    }
  ]
}
```

### 6.3 Regras de avaliação

**Timeline.** A primeira cena começa no quadro 0. Cada cena seguinte começa em
`início da anterior + duração da anterior − duração da transição de entrada`. A duração total é o
fim da última cena. Durante a sobreposição, as duas cenas existem ao mesmo tempo, cada uma no
próprio tempo local.

**Valor de uma propriedade** (`x`, `y`, `scale`, `rotation`, `opacity`) no quadro local da camada:

1. Parte do valor base da camada (`box.x`, `box.y`, `transform.scale`, `transform.rotation`,
   `opacity`).
2. Se existe trilha de keyframes da propriedade, o valor da trilha **substitui** o base. Antes do
   primeiro keyframe vale o primeiro valor; depois do último, o último. Entre dois, interpola com a
   curva do keyframe da esquerda (`linear` se não houver; `hold` segura o valor até o próximo).
3. Cada animação pronta ativa **modifica** o resultado: `fade` multiplica a opacidade, `slide` soma
   um deslocamento a `x` ou `y`, `scale` multiplica a escala. Uma entrada, enquanto espera o
   `delayFrames`, mantém o estado inicial (a camada ainda não apareceu).
4. Opacidade limitada entre 0 e 1.

Como presets modificam e keyframes substituem, os dois convivem: dá para ter uma entrada pronta e,
depois, um pulso feito com keyframes na mesma camada.

**Curvas com nome** (valores de Bézier cúbica; as cinco primeiras são as da especificação de CSS):

| Nome | Bézier |
|---|---|
| `linear` | reta |
| `hold` | degrau: mantém o valor |
| `ease-in` | 0.42, 0, 1, 1 |
| `ease-out` | 0, 0, 0.58, 1 |
| `ease-in-out` | 0.42, 0, 0.58, 1 |
| `ease-in-cubic` | 0.32, 0, 0.67, 0 |
| `ease-out-cubic` | 0.33, 1, 0.68, 1 |
| `ease-in-out-cubic` | 0.65, 0, 0.35, 1 |
| `ease-out-expo` | 0.16, 1, 0.3, 1 (a curva de saída do `CLAUDE.md`) |
| `ease-out-back` | 0.34, 1.56, 0.64, 1 (passa do alvo e volta) |

Padrão quando o campo falta: entrada `ease-out-cubic`, saída `ease-in-cubic`, transição
`ease-in-out`, keyframe `linear`.

### 6.4 Comandos (a única porta de alteração)

Um comando é um objeto JSON. O editor e o Claude usam o mesmo vocabulário.

| Família | Comandos |
|---|---|
| Projeto | `project.update`, `brand.set`, `composition.update`, `export.update` |
| Assets | `asset.add`, `asset.update`, `asset.remove` |
| Cenas | `scene.add`, `scene.update`, `scene.remove`, `scene.reorder`, `scene.setTransition` |
| Camadas | `layer.add`, `layer.update`, `layer.remove`, `layer.reorder`, `layer.move` (para outra cena) |
| Animação | `animation.add`, `animation.update`, `animation.remove`, `keyframe.set`, `keyframe.remove` |

```json
[
  { "type": "layer.update", "layerId": "oferta-numero", "patch": { "text": { "content": "30% OFF" } } },
  { "type": "scene.update", "sceneId": "cena-oferta", "patch": { "durationFrames": 144 } }
]
```

`applyCommands` aplica a lista inteira e valida o resultado. Se um comando falha ou o resultado é
inválido, nada muda e a resposta diz qual comando e por quê. Os comandos mantêm
`composition.durationFrames` em dia sozinhos.

### 6.5 Armazenamento e histórico (`storage/`)

```js
openProject(dir)                       → { project, revision }
saveProject(dir, project, { baseRevision, source, label }) → { revision }
                                       // falha com CONFLICT se o disco já passou de baseRevision
checkpoint(dir, { label, source })     → { id }
listHistory(dir)                       → [{ id, kind: 'checkpoint'|'version', label, source, at, revision }]
rollback(dir, id)                      → { revision }   // antes, fotografa o estado atual
saveVersion(dir, label)                → { id }
```

- Gravação atômica: escreve arquivo temporário e renomeia.
- `project.revision` cresce 1 a cada gravação. É o que detecta o Claude e o editor gravando ao
  mesmo tempo.
- `source` é `claude`, `editor` ou `cli`, e vai para o `log.jsonl`.
- Toda gravação vinda do Claude ou da CLI cria um checkpoint antes. O editor cria um ao abrir o
  projeto e antes de cada exportação.

### 6.6 Renderer

```js
// renderer/stage (navegador) — usado pelo preview do editor e pela página de exportação
mountStage(elemento, { project, assetBaseUrl }) → {
  ready,                 // Promise: fontes e imagens carregadas
  seek(frame),           // Promise: tela pronta para aquele quadro
  setProject(project),
  destroy()
}
```

O palco não usa transição nem animação de CSS, nem relógio, nem sorteio. Só aplica o estado do
quadro.

```js
// renderer/export (Node)
renderProject({ dir, output, range, adapter, onProgress }) → { output, frames, seconds, checks }
renderFrame({ dir, frame, output })                        → { output }       // um PNG
```

A exportação valida o projeto, abre a página do palco no Chromium do Playwright no tamanho da
composição, e para cada quadro chama `seek(quadro)`, tira o print e entrega ao adaptador. No fim,
confere o arquivo com `ffprobe`: largura, altura, taxa de quadros, número de quadros e codec.

```js
// renderer/adapters — Render Adapter
{
  id: 'ffmpeg',
  available() → { ok, version, reason },     // reason explica como instalar
  open({ width, height, fps, output, crf }) → { write(bufferPng), close() → { output } }
}
```

O MVP tem um adaptador, o do FFmpeg do sistema. O contrato existe para que trocar o codificador não
toque no Core nem no palco.

### 6.7 Servidor local do editor

`mazy-creative edit <pasta>` sobe um servidor em `127.0.0.1` que atende **uma** pasta de projeto e
recusa qualquer caminho fora dela.

| Rota | O que faz |
|---|---|
| `GET /api/project` | Projeto, revisão e resultado da validação |
| `PUT /api/project` | Grava. Corpo com `baseRevision`. `409` se o disco mudou; `422` se inválido |
| `GET /api/events` | Fluxo de eventos: `project-changed` (alguém gravou no disco), `render-progress` |
| `GET /assets/…` | Arquivos de `assets/` do projeto |
| `POST /api/assets` | Recebe um arquivo, copia para `assets/` e devolve a entrada de asset |
| `GET /api/history` · `POST /api/history/checkpoint` · `POST /api/history/rollback` | Histórico |
| `POST /api/render` | Dispara a exportação; o progresso sai em `/api/events` |

É assim que a edição do Claude aparece no editor aberto: o servidor vigia o arquivo e avisa a
página, que recarrega. Se o editor tem alteração não gravada e o disco mudou, ele pergunta antes de
recarregar.

### 6.8 Claude Code (CLI)

```bash
node creative-engine/cli/mazy-creative.js <comando> <pasta-do-projeto> [opções]
```

| Comando | O que faz |
|---|---|
| `new` | Cria a pasta a partir de um modelo (`--template motion-ad-9x16`), com `--client` e `--brand <marca.json>` |
| `validate` | Schema + regras. Sai com 1 se houver erro |
| `inspect` | Resumo legível: cenas, tempos, camadas. É como o Claude "vê" o projeto sem ler o JSON inteiro |
| `apply --ops <arquivo>` | Aplica comandos de forma atômica, com checkpoint antes. `--dry-run` mostra o que mudaria |
| `checkpoint` · `history` · `rollback` · `version` | Histórico |
| `brand import <marca.json>` | Copia a identidade para o bloco `brand` e os logos para `assets/` |
| `frame --at <quadro>` | Um PNG daquele quadro, para o Claude olhar |
| `contact-sheet` | Uma folha com os quadros principais de cada cena |
| `critique` | Crítica por regras, com nota e achados |
| `variations` | Gera projetos-variante numa subpasta |
| `render` | Exporta o MP4 |
| `edit` | Abre o editor |

Todo comando aceita `--json` e responde `{ "ok", "data", "errors": [{ "code", "path", "message" }] }`.
Códigos de saída: 0 certo, 1 projeto inválido, 2 uso errado, 3 falta algo na máquina (FFmpeg,
Chromium, versão do Node).

**O Claude pode editar o JSON direto?** Pode, com um protocolo que a skill impõe: `checkpoint`,
editar, `validate`; se a validação falhar e não der para corrigir, `rollback`. O caminho preferido
continua sendo `apply`, que faz as três coisas sozinho.

**Plano antes de executar.** Para um pedido grande, o Claude escreve o roteiro e o arquivo de
comandos, roda `apply --dry-run`, mostra o resumo e espera o "pode". As skills do MazyOS já
trabalham assim (a `/video-reels` para no roteiro e espera aprovação).

**Memória do cliente.** A skill lê `_memoria/preferencias.md` (tom de voz), o `marca.json` do
`/identidade-loja` e o briefing da pasta do cliente, e preenche `brand` e `project.brief`. O motor
nunca lê `_memoria/` nem `clientes/` por conta própria.

---

## 7. Fluxo de ponta a ponta

```
Pedido ("faz um criativo da oferta da ótica")
   │
   ▼
Skill /criativo ── lê marca.json, tom de voz, briefing
   │  roteiro em batidas → aprovação
   ▼
CLI new + apply ──► project.mazy.json ◄── editor (PUT /api/project)
   │                      │  ▲
   │                      │  └── avisa o editor quando o disco muda
   ▼                      ▼
critique + contact-sheet   Core.evaluateFrame(quadro)
   │                      │
   ▼                      ▼
Claude olha os quadros     stage (DOM) ──► preview no editor
e ajusta                   │
                           ▼
                    export (Playwright, quadro a quadro) ──► Render Adapter (FFmpeg) ──► MP4
```

---

## 8. Onde o sigilo entra no desenho

A regra do `CLAUDE.md` é que nenhum dado ou nome de cliente vai para o Git. O desenho segue isso
por construção:

- O motor é código e exemplos genéricos. Os exemplos em `fixtures/` usam `clientId:
  "cliente-exemplo"`, textos sem nome de loja e imagens neutras feitas para o teste.
- Projeto de cliente só existe em `clientes/<Nome>/criativos/`, que o `.gitignore` já cobre e a
  trava `scripts/checar-clientes.js` já barra.
- O motor recebe a pasta do projeto por argumento. Não há caminho de cliente escrito no código.
- Os caminhos de asset são relativos à pasta do projeto, e o formato recusa caminho absoluto, `..`
  e endereço da internet. Um projeto não consegue apontar para a pasta de outro cliente.
- O servidor do editor só escuta em `127.0.0.1` e só serve a pasta que recebeu.
- O plano de testes inclui rodar a trava (`--tudo`) depois de cada etapa.

Ponto de atenção: `marketing/` é versionada. Um criativo do próprio negócio que mostre trabalho de
cliente levaria imagem de cliente para o Git. Por isso a ADR-010 propõe tirar `marketing/criativos/`
do Git.

---

## 9. Dependências

Versões consultadas no npm em 11/11/2026.

| Pacote | Versão | Licença | Onde entra | Por que precisa |
|---|---|---|---|---|
| `ajv` | 8.20.0 | MIT | Core (Node e navegador) | Validar JSON Schema 2020-12. Sem ele, ou se escreve um validador à mão, ou o schema vira enfeite |
| `react`, `react-dom` | 19.3.1 | MIT | Editor | Pedido na visão do produto. Mesma versão principal que o `CLAUDE.md` já fixa para sites |
| `vite` | 8.3.8 | MIT | Editor e servidor local | Pedido na visão do produto. Exige Node `^20.19` ou `>=22.12` |
| `@vitejs/plugin-react` | 6.3.0 | MIT | Editor | JSX e atualização ao vivo |
| `typescript` | 7.0.2 | Apache-2.0 | Só desenvolvimento | Conferir tipos (`tsc --noEmit`). Não gera arquivo |
| `playwright` | 1.64.1 (já instalado) | Apache-2.0 | Exportação e testes de ponta a ponta | Já é a única dependência da raiz. O motor a encontra em `node_modules/` da raiz |
| FFmpeg | do sistema | LGPL/GPL (programa à parte) | Exportação | Codificar H.264 em MP4 |

O que **não** entra, e o que cobre a falta:

| Não entra | No lugar |
|---|---|
| Framework de teste (Vitest, Jest) | `node:test` e `node:assert`, que já vêm no Node |
| Gerenciador de estado (Zustand, Redux) | Uma store pequena com `useSyncExternalStore` do React |
| Tailwind no editor | CSS simples. O Tailwind do `CLAUDE.md` é para sites de cliente |
| GSAP, Motion, Lenis | O motor tem a própria interpolação. Essas bibliotecas são das regras de site |
| Express | `node:http` e o servidor de desenvolvimento do Vite |
| Zod | O JSON Schema é a única definição do formato |
| `ffmpeg-static`, `puppeteer` | FFmpeg do sistema e o Playwright que já existe |
| `@modelcontextprotocol/sdk` | Sem MCP |

---

## 10. Conflitos identificados

| # | Conflito | Gravidade | Como resolver |
|---|---|---|---|
| 1 | **FFmpeg não estava instalado** na data da auditoria. Sem ele não sai MP4 | Resolvido em 11/11/2026 | O dono instalou o pacote do sistema, versão 4.4.2 (ADR-006) |
| 2 | **`/video-reels` faz a mesma saída** por outro caminho (HyperFrames) | Média | Conviver durante o MVP: a `/video-reels` continua como está; a skill nova cuida do criativo editável. Decidir a unificação quando o motor tiver legenda, música e lote (ADR-011) |
| 3 | **Gatilhos sobrepostos.** "vídeo de oferta" e "vídeo pro instagram" hoje chamam `/video-reels` | Média | A skill nova entra com gatilhos próprios ("criativo", "anúncio animado", "abrir no editor"), e o teste de gatilhos ganha frases das duas para provar que não se roubam |
| 4 | **Vite 8 pede Node `^20.19` ou `>=22.12`**, e a raiz declara `>=20` | Baixa | O `package.json` do motor declara a própria exigência. A CLI confere a versão e explica o que fazer. A máquina tem 22.22.2 |
| 5 | **`/usr/bin/node` é o v12.** Um terminal sem nvm quebra tudo (isso já vale para os scripts atuais) | Baixa | A CLI falha cedo com mensagem clara. O `.claude/launch.json` do editor aponta para o Node certo |
| 6 | **`src/` tem outro papel** | Baixa | O motor fica em `creative-engine/` (ADR-001) |
| 7 | **Dependências novas na raiz** fariam todo mundo que usa só as skills instalar React e Vite | Média | `package.json` separado dentro de `creative-engine/` (ADR-002). `npm run setup` não muda |
| 8 | **As regras de animação do `CLAUDE.md`** (mola obrigatória, GSAP sobre Lenis) parecem valer para tudo | Baixa | Elas são da seção "Sites premium". Quando a etapa 5 entrar, uma linha no `CLAUDE.md` diz que não se aplicam ao motor de vídeo |
| 9 | **`marketing/` é versionada** | Média | Tirar `marketing/criativos/` do Git (ADR-010) |
| 10 | **O repositório original (`mazyos`) pode mudar arquivos da raiz** | Baixa | O motor numa pasta nova e isolada quase não gera conflito de merge. As únicas edições em arquivo existente são linhas novas no `.gitignore`, no `gatilhos.json`, no teste de gatilhos e no `CLAUDE.md` |
| 11 | **Fontes.** O `marca.json` guarda o nome da fonte, não o arquivo | Média | O projeto pede o arquivo da fonte como asset. Sem ele, a validação avisa que o render depende da fonte instalada |
| 12 | **O clone de trabalho de um cliente** (dentro de `clientes/`) tem o push desligado de propósito | Baixa | O motor é desenvolvido e commitado só no repositório principal. O clone recebe por `git pull` |

Nenhuma skill, script ou hook existente precisa ser alterado para o MVP funcionar.

---

## 11. O que não foi possível ler ou verificar

- **OpenMotion.** Li o README, a licença, os três `package.json`, o formato (`shared/motion/spec.ts`,
  `easing.ts`, `transform.ts`), `checkpointManager.ts`, `db/repositories/versions.ts`,
  `export/video.ts`, `export/recorder.ts` e o `templates/helper.ts` com um modelo. Dos arquivos
  grandes li só o começo: `frameRenderer.ts`, `compositionEngine.ts`, `motionCritique.ts`,
  `motionVariantGenerator.ts`, `planExecutor.ts`, `planStore.ts`, `sceneTransitions.ts`,
  `storyboard.ts`, `brandPack.ts`, e do editor `projectStore.ts` e `cssRenderer.ts`. **Não li** o
  `orchestrator.ts`, o `shared/tools.ts`, o `MotionCanvas.tsx`, o `TimelineBar.tsx` nem o
  `README_CN.md`. **Não instalei nem rodei** o OpenMotion.
- **HyperFrames.** Não instalei nem rodei. O que sei dele vem do texto da `/video-reels`.
- **Velocidade da exportação.** Não medi quanto o Playwright leva por quadro em 1080×1920 nesta
  máquina. A etapa 3.3 do roadmap começa medindo isso.
- **Igualdade de pixels entre execuções.** O desenho pede que o mesmo quadro saia idêntico duas
  vezes. É o esperado com fontes locais e sem animação de CSS, mas só o teste confirma.
- **Área segura das plataformas.** Os números de cima e de baixo (168 e 590 px) vêm da
  `/video-reels`. As margens laterais do exemplo (64 px) são escolha de projeto, não número oficial
  de plataforma. Conferir com a documentação de cada rede na etapa 7.1.
- **Conteúdo das pastas locais.** Olhei só a estrutura de `clientes/` (nomes de subpasta), sem abrir
  arquivo de cliente.

---

## 12. O que a implementação fez diferente

O desenho acima foi seguido. As diferenças, todas pequenas:

| Assunto | No desenho | Como ficou |
|---|---|---|
| Sentido de `slide` e das transições | Não estava definido | `direction` é o sentido do movimento: `up` quer dizer que a coisa sobe. Na entrada, a camada vem do lado oposto |
| Progresso de uma animação pronta | Não estava definido | Entrada começa em 0 no primeiro quadro; saída chega a 1 no último quadro da camada |
| Progresso de uma transição | Não estava definido | `(quadro local + 1) / (duração + 1)`: nunca 0 nem 1 dentro da sobreposição, para nenhum quadro ser gasto com a cena nova invisível |
| Duas transições na mesma cena | Não estava definido | Não podem se encontrar: a transição de entrada mais a de saída têm que caber na cena (`TRANSITION_TOO_LONG`) |
| Retorno de `applyCommands` | `{ project, changes }` | `{ ok: true, project, changes }` ou `{ ok: false, error }`, com o índice do comando recusado. Também tira sozinho a transição da cena que virou a primeira |
| Fontes no palco | Família da marca | Cada arquivo de fonte entra com um nome interno por asset. O projeto não depende de fonte instalada nem de nome igual |
| Histórico | Um arquivo por ponto | Igual, e cada arquivo guarda junto quem gravou, quando, o rótulo e a revisão |
| Checkpoint do editor | Ao abrir e antes de exportar | Antes de exportar e a pedido (botão no painel de histórico). Ao abrir, não |
| Servidor do editor | Rotas da seção 6.7 | As mesmas, mais `/api/critique` e `/api/history/version`. Os arquivos saem em `/project-files/` e só de `assets/` e `renders/` |
| CLI | Comandos da seção 6.8 | Os mesmos, mais `catalog` e `asset-add`. `brand import` virou `brand-import` |
| Editor | TSX | JSX, sem conferência de tipos (ADR-003) |
| Pastas | Seção 4 | Mais `storage/test/`, `intelligence/test/`, `cli/test/`, `editor/test/`, `editor/e2e/`, `fixtures/expected/` e `cli/demo.js` |
| Crítica | Regras da seção 5 | As mesmas, mais a medição do texto no navegador (cabe na caixa? quebrou linha?) |

