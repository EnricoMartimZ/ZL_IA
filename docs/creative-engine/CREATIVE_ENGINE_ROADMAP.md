# MazyOS Creative Engine — Roadmap técnico e plano de testes

> **Situação:** todas as etapas, de 0.1 a 7.3, concluídas em 11/11/2026. Os quatro marcos (A, B, C
> e D) foram atingidos. Nada foi commitado ainda. O que mudou em relação ao plano está na seção
> "Como a implementação saiu", logo abaixo.
> **Documentos irmãos:** [arquitetura](CREATIVE_ENGINE_ARCHITECTURE.md) ·
> [formato do projeto](CREATIVE_PROJECT_SCHEMA.md) · [decisões](ARCHITECTURE_DECISIONS.md)

O primeiro MVP é o **Motion Ad Studio**: anúncio vertical de 1080 × 1920, 30 fps, 15 segundos, 4
cenas; textos, imagens, formas e logotipos; animações de entrada e saída; transições; timeline
visual; preview; exportação em MP4. O Claude cria e edita projetos que também abrem no editor web.

---

## Como a implementação saiu

Conferido em 11/11/2026 com `npm --prefix creative-engine test`: **213 testes, 212 passando e 1
pulado** (o render completo de 15 s). Com `MAZY_FULL_RENDER=1`, que inclui esse render, **213 de
213**.

| Etapa | Situação | Prova |
|---|---|---|
| 0.1 a 0.3 | feitas | decisões aprovadas, FFmpeg 4.4.2, `test/environment.test.js` |
| 1.1, 1.2 | feitas | `core/test/validation-schema.test.js` (28 casos), `validation-semantic.test.js` (26 casos, um por regra) |
| 1.3, 3.4, 4.3 | feitas | `cli/test/cli.test.js`: códigos de saída, `--json`, criar, aplicar, desfazer, asset, marca, Node antigo |
| 2.1 a 2.6 | feitas | `core/test/time.test.js`, `evaluate.test.js` (estados de referência em `fixtures/expected/`, fronteiras do Core) |
| 3.1 a 3.3 | feitas | `renderer/test/render.test.js`: cor em pontos conhecidos, mesmo quadro com os mesmos bytes, MP4 conferido pelo `ffprobe` |
| 4.1, 4.2 | feitas | `core/test/commands.test.js` (22 comandos), `storage/test/storage.test.js` |
| 5.1 | feita | `.claude/skills/criativo/`, teste de gatilhos 83/83; um criativo feito do zero só pela CLI |
| 6.1 a 6.8 | feitas | `editor/test/store.test.js`, `cli/test/api.test.js`, `editor/e2e/editor.test.js` (19 passos no navegador) |
| 7.1 a 7.3 | feitas | `intelligence/test/critique.test.js` (19 regras), `variations.test.js` |

**Número medido:** a exportação leva cerca de 165 ms por quadro nesta máquina, uns 75 s para o
anúncio de 15 s (450 quadros).

**O que mudou em relação ao plano:**

- **Ordem.** A crítica e as variações (fase 7) foram feitas antes do editor, porque a CLI já as
  chamava. O armazenamento (4.2) veio antes da CLI de validação (1.3), que precisava dele.
- **Casos inválidos** são alterações pequenas sobre o exemplo (`fixtures/invalid/*.cases.json`), não
  um arquivo inteiro por erro.
- **Editor em JSX, não TSX.** TSX pediria os pacotes de tipos do React, fora da lista aprovada, e a
  conferência de tipos com `tsc` não foi ligada. O `typescript` não foi instalado (ADR-003).
- **Um comando roda todos os testes.** Não há grupos `test:render` e `test:e2e` separados; o que
  precisa de navegador ou FFmpeg se pula sozinho quando falta.
- **Comandos a mais na CLI:** `catalog` (o que existe), `asset-add` (trazer um arquivo) e
  `brand-import` como comando próprio. E um `cli/demo.js`, que abre o editor numa cópia descartável
  do exemplo.
- **A crítica mede o texto no navegador.** Além das regras planejadas, ela confere se cada texto
  cabe na caixa com a fonte de verdade (`TEXT_OVERFLOW`, `TEXT_WRAPPED`). Foi isso que pegou um
  título grande demais no próprio exemplo.
- **`slide` e as transições usam o sentido do movimento:** `up` quer dizer que a coisa sobe.
- **O exemplo ganhou assets de teste de verdade** (imagens e logos desenhados para isso e recortes
  da fonte DejaVu Sans, de licença livre), para poder ser desenhado e exportado.
- **`.claude/launch.json`** entrou na 6.1 como previsto, apontando para a demonstração.
- **Mudanças fora do motor, todas declaradas:** `.gitignore` (1 regra), `scripts/checar-clientes.js`
  (barra `marketing/criativos/`, a pedido do dono), `.claude/gatilhos.json` (1 skill),
  `.claude/hooks/gatilhos.teste.mjs` (9 frases), `CLAUDE.md` (2 trechos), `scripts/README.md` (1 linha).

**O que ficou de fora ou por conferir:**

- A conferência de tipos (`tsc`) não está ligada.
- O Core foi testado no Node 22.22.2 e no Chromium (pelo Vite). Não foi testado no Node 20.19.
- As margens laterais da área segura (64 px) continuam sendo escolha de projeto: os números
  oficiais de cada rede não foram conferidos.
- O `brand-import` traz o nome das fontes, não os arquivos: ligar o arquivo da fonte ainda é um
  `brand.set` à mão.
- A `/video-reels` não foi tocada nem testada com o FFmpeg recém-instalado.
- Tudo foi conferido só nesta máquina (Linux).

---

## Como ler este roadmap

- **Cada etapa é uma alteração só**, pequena o bastante para ser revisada de uma vez, e termina com
  teste automatizado passando.
- **"Pronto quando"** é o que precisa ser verdade para a etapa fechar. **"Conferir"** é o comando
  que prova.
- **Nenhuma etapa commita sozinha.** Commit e push só a pedido, pela pasta principal, pela `/salvar`.
- **Toda etapa fecha com as três guardas** do que já existe:

```bash
node .claude/hooks/gatilhos.teste.mjs
```

```bash
node scripts/checar-clientes.js --tudo
```

```bash
git status --short
```

A terceira é para ler: fora de `creative-engine/` e `docs/creative-engine/`, só podem aparecer os
arquivos que a etapa declara em "Mexe fora do motor".

### Marcos

| Marco | O que passa a ser possível | Depois da etapa |
|---|---|---|
| **A** | Um `project.mazy.json` escrito à mão vira MP4 | 3.4 |
| **B** | O Claude faz o criativo de ponta a ponta pela conversa | 5.1 |
| **C** | O editor abre, edita e exporta o mesmo projeto: MVP completo | 6.8 |
| **D** | Crítica por regras e variações | 7.3 |

---

## Fase 0 — Preparação

### 0.1 Aprovar as decisões
- **Faz:** o dono lê as decisões marcadas com ★ em [ARCHITECTURE_DECISIONS.md](ARCHITECTURE_DECISIONS.md)
  e aprova, muda ou recusa cada uma.
- **Pronto quando:** cada ADR tem situação "aprovada" ou "alterada", com data.
- **Não inclui:** código.
- **Feito em 11/11/2026:** as sete ★ aprovadas como propostas.

### 0.2 Instalar o FFmpeg
- **Faz:** instalação do pacote do sistema, pelo dono (pede senha de administrador).
- **Pronto quando:** o FFmpeg responde e tem os codificadores `libx264` e `aac`.
- **Conferir:**

```bash
ffmpeg -hide_banner -encoders | grep -E "libx264|aac"
```

- **Efeito colateral bom:** a `/video-reels` volta a conseguir renderizar.
- **Feito em 11/11/2026:** FFmpeg 4.4.2 instalado pelo dono, com `libx264` e `aac` conferidos.

### 0.3 Esqueleto do pacote
- **Faz:** `creative-engine/package.json` (privado, `"type": "module"`, exigência de Node, script
  `test`), `creative-engine/README.md`, as pastas vazias da arquitetura e um teste que só confere a
  versão do Node.
- **Mexe fora do motor:** `.gitignore` (uma regra nova: `marketing/criativos/`).
- **Pronto quando:** `npm --prefix creative-engine test` roda e passa; `npm run setup` da raiz
  continua igual; as três guardas passam.
- **Não inclui:** dependência nenhuma ainda.
- **Feito em 11/11/2026:** 7 testes em `creative-engine/test/environment.test.js` (versão do Node,
  pacote à parte e sem build, lista de dependências aprovadas, raiz com uma dependência só, pastas
  da arquitetura, `marketing/criativos/` fora do Git).
- **Mudou em relação ao plano:** o `.claude/launch.json` foi adiado para a 6.1. Uma configuração
  que aponta para um servidor que ainda não existe seria funcionalidade fictícia.

---

## Fase 1 — Core: formato e validação

### 1.1 Schema e validação de forma
- **Faz:** move o schema do documento para `core/schema/`; instala o `ajv`; `validateProject`
  (camada do schema); exemplos em `fixtures/` (o de 4 cenas e os 26 inválidos, um arquivo por erro).
- **Pronto quando:** o exemplo passa; cada inválido falha com o caminho do erro esperado; o schema
  compila em modo estrito.
- **Conferir:** `npm --prefix creative-engine test`.
- **Também:** o [documento do formato](CREATIVE_PROJECT_SCHEMA.md) passa a apontar para o arquivo
  do schema, e um teste garante que o exemplo do documento é o mesmo de `fixtures/`.
- **Feito em 11/11/2026:** `ajv` 8.20 instalado no pacote do motor; `validateProject` devolve
  problemas com código, caminho e mensagem em português; 36 testes novos em
  `core/test/validation-schema.test.js`.
- **Mudou em relação ao plano:** os casos inválidos não são um arquivo inteiro por erro. São 28
  alterações pequenas sobre o exemplo, num arquivo só (`fixtures/invalid/schema.cases.json`),
  aplicadas por `fixtures/patch.js`. Evita 28 cópias quase iguais de um projeto de 350 linhas.
- **Fora do roadmap, a pedido do dono:** `scripts/checar-clientes.js` passou a barrar
  `marketing/criativos/` (uma regra a mais e a função `pastaLocal` exportada para teste).

### 1.2 Regras semânticas
- **Faz:** a segunda camada de `validateProject`, com os códigos da seção 3 do documento do
  formato; um exemplo inválido por código.
- **Pronto quando:** cada regra tem um caso que passa e um que falha com o código certo; erro traz
  `code`, `path`, `message` e `hint` em português.

### 1.3 CLI: `validate` e `inspect`
- **Faz:** `cli/mazy-creative.js` com os dois comandos, `--json`, códigos de saída e a conferência
  da versão do Node.
- **Pronto quando:** `validate` sai com 0 no exemplo e 1 em cada inválido; `inspect` mostra cenas,
  inícios, durações e camadas do exemplo; rodar com Node antigo dá mensagem clara e código 3.

---

## Fase 2 — Core: tempo e avaliação

### 2.1 Timeline Engine
- **Faz:** `getTimeline`: início e fim de cada cena com as sobreposições, duração total, e "quais
  cenas estão vivas no quadro N".
- **Pronto quando:** no exemplo os inícios são 0, 84, 204 e 324 e o total é 450; os quadros de
  fronteira (83, 84, 95, 96, 449) caem nas cenas certas.

### 2.2 Interpolation Engine
- **Faz:** as dez curvas com nome, Bézier cúbica própria e `hold`.
- **Pronto quando:** toda curva dá 0 em 0 e 1 em 1; `linear` é a reta; `hold` segura; a Bézier
  confere com valores calculados à parte em pontos conhecidos; entradas fora de 0 a 1 não quebram.

### 2.3 Keyframe Engine
- **Faz:** valor de uma trilha num quadro: antes do primeiro ponto, depois do último, entre dois,
  trilha de um ponto só.
- **Pronto quando:** os casos acima passam e a curva usada num trecho é a do ponto da esquerda.

### 2.4 Animation Presets
- **Faz:** `fade`, `slide` e `scale` como modificadores, nos papéis de entrada e saída, com atraso
  e parâmetros; `listPresets`.
- **Pronto quando:** cada preset tem teste no primeiro quadro, no meio, no último e depois do fim;
  duas entradas na mesma camada se combinam; preset e keyframe na mesma propriedade se combinam
  como a arquitetura define.

### 2.5 Transições
- **Faz:** `fade`, `slide` e `wipe` entre cenas, resolvidos em propriedades do contêiner da cena.
- **Pronto quando:** no meio de cada transição do exemplo as duas cenas estão vivas com os valores
  esperados; fora da transição só uma.

### 2.6 `evaluateFrame`
- **Faz:** junta tudo: projeto + quadro → estado do quadro, com cores da marca e caminhos de asset
  resolvidos.
- **Pronto quando:** os estados do exemplo em 12 quadros escolhidos (início, fronteiras, meio de
  transição, último) batem com arquivos de referência gravados; avaliar o mesmo quadro duas vezes
  dá resultado idêntico; o projeto de entrada não é alterado; um teste confere que nada em `core/`
  importa `node:*`, DOM, relógio ou sorteio.

---

## Fase 3 — Renderer

### 3.1 Palco: formas e texto
- **Faz:** `renderer/stage` desenhando estado do quadro em DOM; página do palco; `renderFrame` e o
  comando `frame` da CLI (um PNG).
- **Pronto quando:** um projeto de teste só com formas dá PNG de 1080 × 1920 com as cores certas em
  pontos conhecidos; o mesmo quadro tirado duas vezes dá imagens iguais.

### 3.2 Palco: imagens, logos e fontes
- **Faz:** carregamento de assets com espera (`ready`), `cover` e `contain` com foco, logo sem
  distorção, fonte da marca por arquivo.
- **Pronto quando:** imagens de teste neutras aparecem no lugar e no corte esperados; texto com a
  fonte de teste mede a largura esperada; asset que falta dá erro com o código certo, não tela em
  branco.

### 3.3 Exportação em MP4
- **Faz:** primeiro mede o tempo por quadro nesta máquina e registra o número. Depois:
  `renderProject`, Render Adapter e o adaptador do FFmpeg, conferência final com `ffprobe`.
- **Pronto quando:** um projeto de teste de 1 segundo vira MP4 com 1080 × 1920, 30 fps, 30 quadros,
  H.264 e `yuv420p`, conferidos pelo `ffprobe`; sem FFmpeg, sai com código 3 e a instrução.
- **Depende de:** 0.2.

### 3.4 CLI: `render` e `contact-sheet`
- **Faz:** os dois comandos, com progresso.
- **Pronto quando:** o exemplo de 4 cenas (com imagens de teste) vira MP4 de 450 quadros e 15 s; a
  folha de contato sai com os quadros principais de cada cena.
- **Marco A.**

---

## Fase 4 — Core: edição e histórico

### 4.1 Comandos
- **Faz:** o vocabulário da arquitetura, seção 6.4, e `applyCommands` atômico.
- **Pronto quando:** cada comando tem caso válido e inválido; uma lista com um comando ruim não
  muda nada; o projeto de entrada nunca é alterado; `composition.durationFrames` fica certo depois
  de mexer em cena e transição.
- **Tamanho:** se ficar grande, dividir em 4.1a (projeto, cenas, camadas) e 4.1b (assets,
  animações, keyframes).

### 4.2 Armazenamento e histórico
- **Faz:** `storage/`: abrir, gravar de forma atômica com revisão, checkpoint, versão, rollback,
  `log.jsonl`.
- **Pronto quando:** gravar com revisão velha dá conflito; o anel descarta o checkpoint mais
  antigo ao passar de 30; rollback volta ao estado certo e dá para desfazê-lo; gravação
  interrompida não deixa arquivo pela metade.

### 4.3 CLI: `new`, `apply`, histórico e `brand import`
- **Faz:** os comandos; o modelo `motion-ad-9x16`; a importação do `marca.json`.
- **Pronto quando:** `new` cria projeto válido; `apply --dry-run` não grava; `apply` cria
  checkpoint antes; `brand import` com um `marca.json` de teste preenche `brand` e copia o logo.

---

## Fase 5 — Skill

### 5.1 Skill `/criativo`
- **Faz:** `.claude/skills/criativo/SKILL.md` com referências (roteiro em batidas, área segura,
  protocolo de edição, quando usar `/video-reels`).
- **Mexe fora do motor:** `.claude/gatilhos.json` (uma entrada), `.claude/hooks/gatilhos.teste.mjs`
  (frases novas, incluindo as que provam que `/video-reels` continua ganhando os pedidos dela),
  `CLAUDE.md` (uma linha dizendo que as regras de animação de site não valem para o motor de
  vídeo), `scripts/README.md` (uma linha).
- **Pronto quando:** o teste de gatilhos passa com as frases novas e todas as antigas; um pedido de
  teste, do zero, termina num MP4 válido sem o Claude abrir o JSON à mão.
- **Marco B.**

---

## Fase 6 — Editor

### 6.1 Abrir e tocar
- **Faz:** instala React e Vite; servidor local (`GET /api/project`, assets, eventos); página do
  editor que abre um projeto e toca no palco, com tocar, pausar e arrastar o tempo.
- **Mexe fora do motor:** `.claude/launch.json` (configuração para abrir o editor pelo aplicativo).
- **Pronto quando:** teste de ponta a ponta abre o exemplo, vai ao quadro 210 e encontra o estado
  esperado; o servidor recusa caminho fora da pasta do projeto.

### 6.2 Timeline visual (só leitura)
- **Faz:** cenas, sobreposições, barras das camadas, agulha.
- **Pronto quando:** as barras do exemplo têm início e largura proporcionais aos quadros; clicar na
  timeline move a agulha e o palco.

### 6.3 Seleção, Inspector, gravação e desfazer
- **Faz:** selecionar camada; editar propriedades pelo Inspector (por comandos do Core); gravar
  (`PUT`); desfazer e refazer.
- **Pronto quando:** mudar um texto no Inspector muda o arquivo no disco e ele continua válido;
  desfazer volta; valor inválido aparece como erro no campo e não é gravado.

### 6.4 Manipulação direta no palco
- **Faz:** mover, redimensionar e girar com alças; guias da área segura.
- **Pronto quando:** arrastar uma camada no teste muda `box` no valor esperado; camada travada não
  se move.

### 6.5 Edição na timeline
- **Faz:** arrastar início e duração de camada, duração de cena e de transição; alças das
  animações de entrada e saída.
- **Pronto quando:** cada arrasto vira o comando certo; o que violaria uma regra (camada passando
  do fim da cena) é barrado na hora.

### 6.6 Asset Library
- **Faz:** lista de assets, envio de arquivo, criar camada a partir de um asset.
- **Pronto quando:** enviar uma imagem de teste a copia para `assets/`, registra o asset com
  medidas e hash, e a camada criada aparece no palco.

### 6.7 Edição simultânea
- **Faz:** recarregar quando o disco muda; aviso quando há alteração local não gravada; tela de
  conflito.
- **Pronto quando:** com o editor aberto, um `apply` pela CLI aparece na tela; com alteração
  pendente, o editor pergunta antes de recarregar; nenhuma das duas edições se perde em silêncio.

### 6.8 Exportar pelo editor
- **Faz:** botão de exportar, progresso, link para o MP4; painel de histórico (checkpoints,
  versões, voltar).
- **Pronto quando:** exportar pelo editor gera o mesmo MP4 (mesma contagem de quadros e medidas)
  que a CLI; voltar a um checkpoint pelo painel restaura o projeto.
- **Marco C: MVP completo.**

---

## Fase 7 — Creative Intelligence

### 7.1 Crítica por regras
- **Faz:** `critique`: legibilidade, marca, ritmo, mensagem e técnica, com nota e achados ligados à
  camada. Conferir aqui as áreas seguras oficiais de cada rede.
- **Pronto quando:** cada regra tem um projeto de teste que a dispara e um que não; o exemplo de 4
  cenas tem nota e achados estáveis entre execuções.

### 7.2 Crítica visual na skill
- **Faz:** a skill passa a gerar a folha de contato, aplicar um roteiro de avaliação e gravar
  `critica.md`, separando "regras" de "olhar".
- **Pronto quando:** a skill, num projeto de teste com defeito plantado (texto sobre foto clara),
  aponta o defeito e propõe o comando de correção.

### 7.3 Variation Engine
- **Faz:** `variations` com dois eixos (entrada e ritmo), semente, lista do que mudou; variantes
  como projetos irmãos válidos.
- **Pronto quando:** a mesma semente dá as mesmas variantes; toda variante é válida e mantém a
  duração total; a lista de mudanças bate com a diferença real entre os arquivos.
- **Marco D.**

---

## Depois do MVP (sem etapa detalhada ainda)

Cada item pede decisão própria e, quando muda o formato, uma versão MINOR nova.

- Áudio e música; camada de vídeo (para usar o bruto da `/video-ia`)
- Legenda animada palavra a palavra
- Lote: uma planilha vira N variantes (o que a `/video-reels` faz hoje)
- Outros formatos: 1:1, 4:5, 16:9, e imagem parada a partir do mesmo projeto
- Grupos de camadas; texto com mais de um estilo; curva de mola; ênfase em laço
- Editor de curvas de keyframe
- Decidir a unificação com a `/video-reels` (ADR-011)

---

## Dependências entre as etapas

```
0.1 ─► 0.3 ─► 1.1 ─► 1.2 ─► 1.3
                      │
                      ▼
        2.1 ─► 2.2 ─► 2.3 ─► 2.4 ─► 2.5 ─► 2.6
                                            │
                    0.2 ──────────┐         ▼
                                  │   3.1 ─► 3.2 ─► 3.3 ─► 3.4   (marco A)
                                  └──────────────────┘      │
                                                            ▼
                                             4.1 ─► 4.2 ─► 4.3 ─► 5.1   (marco B)
                                                            │
                                                            ▼
                             6.1 ─► 6.2 ─► 6.3 ─► 6.4 ─► 6.5 ─► 6.6 ─► 6.7 ─► 6.8   (marco C)
                                                                                │
                                                                                ▼
                                                                  7.1 ─► 7.2 ─► 7.3   (marco D)
```

A 6.1 (abrir e tocar) só depende do marco A: pode ser antecipada se a prioridade for ver o editor
cedo. A 7.1 só depende da 2.6 e também pode vir antes.

---

## Plano de testes

### Ferramentas

| Para | Ferramenta | Dependência nova |
|---|---|---|
| Unidade e integração | `node:test` e `node:assert` | nenhuma |
| Validação do formato | `ajv` | sim (já é do motor) |
| Desenho e ponta a ponta | Playwright, que já está instalado | nenhuma |
| Conferir vídeo | `ffprobe`, que vem com o FFmpeg | nenhuma |
| Comparar imagens | leitura de pixels dentro do navegador | nenhuma |
| Tipos | `tsc --noEmit` | `typescript`, só de desenvolvimento |

Um comando roda tudo: `npm --prefix creative-engine test`. Os testes que precisam de FFmpeg ou de
navegador ficam num grupo à parte (`test:render`, `test:e2e`) e, quando a ferramenta falta, dizem
"pulado: falta X" em vez de falhar calados ou passar sem rodar.

### O que é testado, por camada

| # | Camada | O que se prova | Como |
|---|---|---|---|
| 1 | Formato | O exemplo é válido; cada erro conhecido é recusado no lugar certo | Tabela de arquivos em `fixtures/`: válidos e inválidos |
| 2 | Regras semânticas | Cada código de erro dispara quando deve e só quando deve | Um par de arquivos por código |
| 3 | Interpolação | Extremos, monotonia das curvas sem ultrapassagem, `hold`, Bézier em pontos conhecidos | Casos fixos mais varredura com números gerados por semente |
| 4 | Timeline | Inícios, total e fronteiras com sobreposição | Casos fixos, incluindo projeto de uma cena e transição do tamanho da cena |
| 5 | Keyframes e presets | Valor em cada trecho; combinação de preset com keyframe | Casos fixos por propriedade |
| 6 | `evaluateFrame` | O estado de quadros escolhidos não muda sem querer | Arquivos de referência; atualizar referência é ato consciente, com revisão do que mudou |
| 7 | Determinismo | Mesmo projeto e quadro, mesmo resultado; entrada intacta | Avaliar duas vezes; congelar a entrada antes |
| 8 | Fronteiras do Core | O Core não importa Node, DOM, relógio nem sorteio | Teste que lê os arquivos de `core/src` |
| 9 | Comandos | Cada comando; lista atômica; duração total em dia | Casos válidos e inválidos por comando |
| 10 | Armazenamento | Conflito de revisão, anel de checkpoints, rollback reversível, gravação atômica | Pasta temporária por teste |
| 11 | CLI | Códigos de saída e formato do `--json` | Rodar o comando como processo e ler a saída |
| 12 | Palco | Formas, texto, imagem e logo no lugar; mesma imagem duas vezes | Print de um quadro; cor em pontos conhecidos; comparação com imagem de referência com tolerância |
| 13 | Exportação | MP4 com medidas, taxa, contagem de quadros e codec certos | `ffprobe` em vídeo curto de teste e no exemplo de 15 s |
| 14 | Servidor local | Só serve a pasta do projeto; conflito vira 409; inválido vira 422 | Chamadas HTTP contra o servidor num porto livre |
| 15 | Editor | Abrir, selecionar, editar, desfazer, arrastar, gravar, recarregar, exportar | Playwright dirigindo o editor sobre uma cópia do exemplo |
| 16 | Crítica | Cada regra dispara no projeto certo; nota estável | Projetos de teste com um defeito cada |
| 17 | Variações | Mesma semente, mesmas variantes; toda variante válida | Gerar, validar e comparar |

### Guardas do que já existe

Rodam ao fim de toda etapa (comandos no começo deste documento):

| Guarda | O que protege |
|---|---|
| `node .claude/hooks/gatilhos.teste.mjs` | As skills continuam sendo chamadas pelas mesmas frases |
| `node scripts/checar-clientes.js --tudo` | Nenhum nome de cliente, CPF ou CNPJ entrou em arquivo versionado |
| `git status --short` lido | Nada fora do motor mudou sem estar declarado na etapa |
| Teste do motor que lê o `package.json` da raiz | A raiz continua com uma dependência só |

### Dados de teste

- Todos os exemplos são genéricos: `clientId: "cliente-exemplo"`, textos sem nome de loja.
- As imagens de teste são geradas para o teste (blocos de cor, um logo de forma geométrica). Nada
  vem de pasta de cliente nem de banco de imagem.
- A fonte de teste é um arquivo de licença aberta, guardado em `fixtures/` com o texto da licença
  ao lado. Qual fonte usar é decidido na etapa 3.2.
- Todo teste que grava usa pasta temporária, nunca `clientes/` nem `marketing/`.

### O que os testes não cobrem

- **Gosto.** Se o anúncio é bom, quem diz é a crítica visual e o dono.
- **Componente React isolado.** O comportamento é coberto de ponta a ponta (ADR-015).
- **Outros sistemas operacionais.** Tudo é conferido nesta máquina (Linux). Fonte e suavização de
  texto mudam entre sistemas; as imagens de referência valem para o sistema em que foram gravadas.
- **Aceitação pelas redes.** O teste prova que o MP4 tem o formato pedido, não que a plataforma de
  anúncio aprova a peça.
