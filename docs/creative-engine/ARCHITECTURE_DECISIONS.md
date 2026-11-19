# Creative Engine do ZL_IA — Decisões de arquitetura

> **Situação:** as sete decisões marcadas com ★ foram **aprovadas pelo dono em 11/11/2026**, como
> propostas. As outras onze são detalhes técnicos que decorrem delas e foram seguidas na
> implementação, feita no mesmo dia com autorização do dono para ir até o fim. Duas saíram com
> diferença, anotada na própria decisão: a 003 e a 015.
> **Documentos irmãos:** [arquitetura](CREATIVE_ENGINE_ARCHITECTURE.md) ·
> [roadmap e testes](CREATIVE_ENGINE_ROADMAP.md) · [formato do projeto](CREATIVE_PROJECT_SCHEMA.md)

Cada decisão tem contexto, decisão, alternativas descartadas e consequência. As marcadas com
**★** mudam o rumo do trabalho ou mexem fora do motor: são as que mais precisam do olho do dono.

| # | Decisão | ★ | Situação |
|---|---|---|---|
| 001 | O motor mora em `creative-engine/`, na raiz | ★ | aprovada em 11/11/2026 |
| 002 | Pacote separado, com `package.json` próprio | ★ | aprovada em 11/11/2026 |
| 003 | JavaScript com JSDoc no motor, TSX no editor | | seguida com diferença (editor em JSX) |
| 004 | O palco é desenhado em DOM, não em `<canvas>` | ★ | aprovada em 11/11/2026 |
| 005 | Exportação quadro a quadro com o Playwright | | seguida na implementação |
| 006 | FFmpeg do sistema, atrás do Render Adapter | ★ | aprovada em 11/11/2026 |
| 007 | JSON Schema como única definição do formato | | seguida na implementação |
| 008 | Tempo em quadros inteiros; transição como sobreposição | | seguida na implementação |
| 009 | Animações prontas modificam; keyframes substituem | | seguida na implementação |
| 010 | Projetos em pastas locais; `marketing/criativos/` sai do Git | ★ | aprovada em 11/11/2026 |
| 011 | Conviver com a `/video-reels`; skill nova `/criativo` | ★ | aprovada em 11/11/2026 |
| 012 | O arquivo é a interface entre o Claude e o editor | | seguida na implementação |
| 013 | Histórico em disco: checkpoints e versões | | seguida na implementação |
| 014 | Creative Intelligence: regra em código, julgamento no Claude | | seguida na implementação |
| 015 | Testes com `node:test` e Playwright, sem framework novo | | seguida com diferença pequena |
| 016 | Do OpenMotion, conceitos e não código | | seguida na implementação |
| 017 | Primeiro o MP4 pelo Claude, depois o editor | ★ | aprovada em 11/11/2026 |
| 018 | O formato 1.0 só tem o que o MVP usa | | seguida na implementação |

---

## ADR-001 ★ — O motor mora em `creative-engine/`, na raiz

**Situação.** Aprovada em 11/11/2026.

**Contexto.** O repositório não tem aplicativo: tem skills, scripts soltos e uma prateleira de
componentes em `src/components/premium/`, que o `CLAUDE.md` descreve como peças para copiar em
projeto de cliente. O repositório original (remoto `upstream`) não é mais seguido.

**Decisão.** Uma pasta nova na raiz, `creative-engine/`, com tudo do motor dentro: Core, Renderer,
editor, CLI, inteligência e exemplos.

**Alternativas descartadas.**
- `src/creative-engine/`: mistura um aplicativo que roda com uma prateleira de peças para copiar.
- Espalhar pelo que já existe (`scripts/` para a CLI, `templates/` para os modelos): o motor
  deixaria de ser uma unidade e os testes ficariam sem casa.
- Repositório separado: quebraria o "subsistema nativo do ZL_IA" e a skill não acharia o motor.

**Consequência.** O motor pode ser lido, testado e removido como um bloco. Atualizações do
repositório original quase não conflitam, porque a pasta é nova. A raiz ganha uma pasta a mais.

---

## ADR-002 ★ — Pacote separado, com `package.json` próprio

**Situação.** Aprovada em 11/11/2026.

**Contexto.** A raiz tem uma dependência só (`playwright`) e nenhum build. O editor precisa de
React e Vite. Quem usa só as skills não deveria instalar isso.

**Decisão.** `creative-engine/package.json` próprio, com `"type": "module"` e a exigência de Node
dele (`^20.19 || >=22.12`, que é o que o Vite 8 pede). Instalação por um comando à parte
(`npm --prefix creative-engine install`). O `npm run setup` da raiz não muda. O Playwright não é
instalado de novo: o motor o encontra no `node_modules/` da raiz, um nível acima.

**Alternativas descartadas.**
- Pôr tudo no `package.json` da raiz: todo clone do ZL_IA instalaria React e Vite.
- `workspaces` do npm na raiz: muda como o `npm install` da raiz se comporta, para um ganho
  pequeno.
- Vários pacotes (core, renderer, editor): mais peças para manter sem ganho no tamanho atual. A
  separação fica nas pastas e num teste que proíbe o Core de importar o resto.

**Consequência.** Dois comandos de instalação em vez de um. As skills continuam funcionando num
clone que nunca instalou o motor.

---

## ADR-003 — JavaScript com JSDoc no motor, TSX no editor

**Contexto.** Os scripts do repositório são JavaScript ESM sem build, com comentários em português.
Os componentes de `src/` são TSX. O `engines` da raiz aceita Node 20. O Node 22.22.2 desta máquina
roda `.ts` direto (testado), mas o Node 20 não.

**Decisão.** Core, Renderer, `storage/`, inteligência e CLI em JavaScript ESM, com tipos em JSDoc
conferidos por `tsc --noEmit`. Editor em TSX, que o Vite compila. Nomes de campo, função e arquivo
em inglês (o formato já nasceu com `schemaVersion` e `clientId`); comentários, mensagens de erro e
documentação em português.

**Alternativas descartadas.**
- TypeScript em tudo, rodando pelo Node sem build: exigiria Node 22.18 ou mais novo só para o
  motor e restringe a sintaxe.
- TypeScript com etapa de build: quebra o "sem build" e cria uma pasta `dist/` para manter.
- JavaScript sem conferência de tipos: o formato tem camadas de tipos diferentes, e errar um campo
  só apareceria na tela.

**Consequência.** A CLI roda com `node arquivo.js`, como os scripts de hoje. O Core é importado
pelo editor sem conversão. `typescript` entra como dependência só de desenvolvimento.

**Como ficou na implementação.** O motor está em JavaScript com tipos em JSDoc, como decidido. Duas
diferenças: o editor está em **JSX**, não TSX, porque TSX pediria os pacotes de tipos do React, que
não estão na lista aprovada; e a conferência com `tsc` **não foi ligada** (o `typescript` não foi
instalado). Ligar a conferência é um passo futuro, com decisão sobre os pacotes de tipos.

---

## ADR-004 ★ — O palco é desenhado em DOM, não em `<canvas>`

**Situação.** Aprovada em 11/11/2026.

**Contexto.** A visão do produto lista "Canvas" no editor. Há duas leituras: a área de trabalho
onde se arrasta e redimensiona, ou a tecnologia `<canvas>` do navegador. O que mais pesa num
anúncio é texto: fonte da marca, quebra de linha, espaçamento.

**Decisão.** O palco desenha cada camada como elemento HTML posicionado (texto em HTML, imagem em
`<img>`, forma em CSS ou SVG), com `transform` e `opacity` aplicados quadro a quadro pelo Core. O
"Canvas" do editor é esse palco com uma camada de seleção e alças por cima. O mesmo palco serve o
preview e a exportação.

**Alternativas descartadas.**
- `<canvas>` 2D: obrigaria a escrever quebra de linha e ajuste de texto à mão, com tipografia pior
  que a do navegador. Vantagem (exportar sem tirar print) não compensa no MVP.
- WebGL (Pixi, Three): resolve efeito que o MVP não tem e traz dependência pesada.
- Um desenhista para o preview e outro para a exportação: o que se vê deixaria de ser o que sai.

**Consequência.** Tipografia com a qualidade do navegador e fonte da marca de graça. É o mesmo
caminho que o repositório já usa no `/carrossel` (HTML virando PNG). A exportação depende de tirar
um print por quadro, que é mais lento que codificar direto (ADR-005). Efeito que o CSS não faz bem
(desfoque de movimento, partículas) fica fora do alcance até uma decisão nova.

---

## ADR-005 — Exportação quadro a quadro com o Playwright

**Contexto.** O OpenMotion grava a tela em tempo real enquanto a animação toca: o número de quadros
depende da máquina. O HyperFrames e o `frameRenderer` do próprio OpenMotion apontam o outro
caminho: tempo calculado por quadro.

**Decisão.** A exportação abre a página do palco no Chromium do Playwright no tamanho exato da
composição e, para cada quadro, pede ao palco que vá para aquele quadro, espera a tela ficar pronta
e tira o print. Não há relógio envolvido.

**Alternativas descartadas.**
- Gravar em tempo real: quadros a mais ou a menos, e vídeo que muda de uma máquina para outra.
- Desenhar no Node com biblioteca nativa de canvas: dependência nativa e um segundo desenhista.
- Codificar no navegador (WebCodecs): o Chromium do Playwright não codifica H.264; dependeria do
  Chrome instalado.

**Consequência.** 450 quadros são 450 prints. Se ficar lento demais, a saída é mandar JPEG em vez
de PNG ou dividir em processos paralelos, sem mexer no Core.

**Medido na implementação.** Cerca de 165 ms por quadro nesta máquina: uns 75 s para o anúncio de
15 s. O mesmo quadro tirado duas vezes, na mesma execução e em execuções diferentes, saiu com os
mesmos bytes.

---

## ADR-006 ★ — FFmpeg do sistema, atrás do Render Adapter

**Situação.** Aprovada em 11/11/2026.

**Contexto.** A máquina não tem FFmpeg. O que vem com o Playwright só codifica PNG e VP9. O MVP
pede MP4. A `/video-reels` também depende do FFmpeg e hoje não consegue renderizar aqui.

**Decisão.** Usar o FFmpeg instalado no sistema (no Ubuntu desta máquina, `sudo apt install ffmpeg`,
versão 4.4.2). O motor o procura na variável `MAZY_FFMPEG` e depois no `PATH`; se não acha, para
com código 3 e a instrução de instalação. Todo o uso passa pelo Render Adapter, um contrato pequeno
(abrir, receber quadro, fechar).

**Alternativas descartadas.**
- `ffmpeg-static` (npm): põe um binário GPL-3.0 dentro do `node_modules`, pesa na instalação e não
  resolve a `/video-reels`.
- VP9 em WebM com o FFmpeg do Playwright: as redes de anúncio pedem MP4 com H.264.
- Chamar o HyperFrames para renderizar: dependeria do runtime de terceiros e do formato dele.

**Consequência.** Uma ação fora do repositório, feita uma vez, com senha de administrador. Ela
conserta de quebra a `/video-reels`. Num computador novo, o FFmpeg entra na lista do que instalar.

---

## ADR-007 — JSON Schema como única definição do formato

**Contexto.** O formato precisa ser validado por JSON Schema (pedido na visão do produto), lido
pelo Claude e conferido pelo editor. O OpenMotion define o formato em Zod, no código.

**Decisão.** Um arquivo `.schema.json` (rascunho 2020-12) é a definição. O Ajv valida no Node e no
navegador, em modo estrito. Campo desconhecido é erro em todo nível. O que o schema não expressa
(ids únicos, durações que fecham, referências que existem) fica numa segunda camada de regras no
Core, cada uma com código de erro. Datas e caminhos são conferidos por padrão de texto, para não
precisar de um segundo pacote de formatos.

**Alternativas descartadas.**
- Zod ou tipos TypeScript como fonte: duas definições para manter em dia, e o Claude teria de ler
  código para saber o formato.
- Validador escrito à mão: deixa de ser JSON Schema.
- Aceitar campos extras: erro de digitação do agente passaria em silêncio.

**Consequência.** Uma dependência nova (`ajv`, MIT). O Claude consulta um arquivo só para saber o
que pode escrever. O schema já foi validado com dois validadores e 26 casos de erro.

---

## ADR-008 — Tempo em quadros inteiros; transição como sobreposição

**Contexto.** O OpenMotion guarda tempo em milissegundos e keyframes como fração de 0 a 1. Para
vídeo com taxa fixa, isso obriga a arredondar, e o arredondamento decide em que quadro uma coisa
aparece.

**Decisão.** Todo tempo no arquivo é um número inteiro de quadros. `startFrame` da camada conta do
início da cena; o `frame` do keyframe, do início da camada (mover a camada leva os keyframes
junto). A transição pertence à cena que entra e vale como sobreposição: desconta da duração total.
`composition.durationFrames` é derivado e conferido.

**Alternativas descartadas.**
- Milissegundos: arredondamento escondido.
- Keyframe como fração da duração: mudar a duração da camada desloca todos os pontos.
- Cenas sem sobreposição, com a transição "por cima": um fundido de verdade precisa das duas cenas
  vivas ao mesmo tempo.
- Lista separada de transições: permite transição apontando para cena que não existe.

**Consequência.** "Em que quadro isso acontece" tem sempre uma resposta exata. Trocar o `fps` de um
projeto pronto não é automático: precisa de um comando de conversão, fora do MVP.

---

## ADR-009 — Animações prontas modificam; keyframes substituem

**Contexto.** O formato pede "animações" e "keyframes". No OpenMotion, aplicar um modelo grava os
keyframes calculados: o arquivo perde a informação de que aquilo era "um fade".

**Decisão.** As animações prontas ficam no arquivo como intenção (`fade`, entrada, 10 quadros) e são
resolvidas ao desenhar, como modificadores: `fade` multiplica a opacidade, `slide` soma
deslocamento, `scale` multiplica a escala. Keyframes dão o valor da propriedade e substituem o
valor base. Os dois convivem na mesma camada.

**Alternativas descartadas.**
- Converter preset em keyframes ao aplicar: o editor não consegue mais mostrar "entrada de 10
  quadros" como um bloco que se estica, e o JSON fica longo para o Claude ler.
- Só keyframes: o Claude teria de escrever quatro pontos para cada entrada.
- Só presets: sem liberdade para um movimento próprio.

**Consequência.** Arquivo curto e legível, e alças de entrada e saída no editor. Um comando
"converter em keyframes" pode vir depois, para quem quiser ajustar ponto a ponto.

---

## ADR-010 ★ — Projetos em pastas locais; `marketing/criativos/` sai do Git

**Situação.** Aprovada em 11/11/2026.

**Contexto.** A regra do `CLAUDE.md`: nenhum dado ou nome de cliente no Git. `clientes/` já está
fora. `marketing/` está **dentro**, e um criativo do próprio negócio pode mostrar trabalho de
cliente.

**Decisão.** Criativo de cliente em `clientes/<Nome>/criativos/<slug>/`. Criativo do próprio negócio
em `marketing/criativos/<slug>/`, com uma linha nova no `.gitignore` tirando essa pasta do Git. O
bloco `brand` do projeto é uma **cópia** do `marca.json`, com o caminho de origem só anotado.
`clientId` é um slug, nunca o nome de exibição.

**Alternativas descartadas.**
- Versionar os criativos do próprio negócio: risco de imagem de cliente no Git e MP4 pesando o
  repositório.
- `brand` como referência viva ao `marca.json`: o mesmo projeto renderizaria diferente depois que
  a marca mudasse, e deixaria de abrir se a pasta fosse movida.
- Uma pasta central de projetos, fora da pasta do cliente: separa o criativo do resto do material
  do cliente e do backup por cliente.

**Consequência.** Uma linha a mais no `.gitignore` (única mudança em arquivo existente antes da
etapa 5). O backup dos criativos é o `scripts/backup.js`, como o resto do trabalho local.
O backup hoje cobre `vendas`, `clientes`, `_memoria` e `.env`: para incluir `marketing/criativos`,
basta acrescentá-la na variável `BACKUP_PASTAS` do `.env`, sem mexer no script.

---

## ADR-011 ★ — Conviver com a `/video-reels`; skill nova `/criativo`

**Situação.** Aprovada em 11/11/2026.

**Contexto.** A `/video-reels` já entrega MP4 vertical com o HyperFrames, com roteiro em batidas,
legenda animada, música e lote. O Creative Engine entrega a mesma saída por um projeto que também
abre num editor. Os gatilhos das duas se encostam.

**Decisão.** Durante o MVP as duas convivem. A `/video-reels` não é tocada. A skill nova se chama
`/criativo` e entra na etapa 5, com gatilhos próprios ("criativo", "anúncio animado", "abrir no
editor") e frases novas no teste de gatilhos provando que uma não rouba pedido da outra. A
unificação é decidida depois que o motor tiver legenda, música e lote.

**Alternativas descartadas.**
- Substituir a `/video-reels` já: quebra uma skill que funciona (regra do usuário) por um motor
  que ainda não existe.
- Embutir o motor na `/video-reels`: mistura dois formatos de projeto na mesma skill.
- Usar o HyperFrames como renderizador do motor: dependência do runtime de terceiros e sem editor
  próprio.

**Consequência.** Por um tempo há dois caminhos para vídeo vertical, e a skill precisa dizer quando
usar cada um: `/video-reels` para reels com legenda e música; `/criativo` para anúncio que vai ser
ajustado à mão ou variado.

---

## ADR-012 — O arquivo é a interface entre o Claude e o editor

**Contexto.** Claude e editor precisam mexer no mesmo projeto, às vezes com o editor aberto. O
OpenMotion resolve com servidor, banco e MCP. A regra aqui é não depender de MCP.

**Decisão.** O `project.mazy.json` é a interface. O editor fala com um servidor local pequeno
(`127.0.0.1`, uma pasta de projeto por vez) que lê, grava e vigia o arquivo. O campo
`project.revision` cresce a cada gravação: quem tenta gravar em cima de uma revisão velha recebe
conflito. Quando o Claude grava, o servidor avisa a página por um fluxo de eventos e o editor
recarrega. O servidor é o próprio servidor de desenvolvimento do Vite com uma extensão; não há
etapa de build do editor no MVP.

**Alternativas descartadas.**
- MCP ou API de agente: proibido pela visão do produto e desnecessário.
- Banco de dados: tira o projeto da pasta do cliente e do backup.
- Acesso a arquivos pelo navegador, sem servidor: só funciona em alguns navegadores, pede
  permissão a cada sessão e não avisa quando o disco muda.
- Travar o arquivo enquanto o editor está aberto: impede justamente o uso híbrido.

**Consequência.** O Claude trabalha com as ferramentas de arquivo e a CLI, sem nada especial. Duas
gravações ao mesmo tempo viram um conflito visível, não uma perda silenciosa. Rodar o editor exige
o Vite instalado.

---

## ADR-013 — Histórico em disco: checkpoints e versões

**Contexto.** No OpenMotion os checkpoints ficam num anel de 8 na memória e somem quando o servidor
reinicia; as versões com nome ficam no banco. Aqui o agente e a pessoa mexem no mesmo arquivo, em
momentos diferentes.

**Decisão.** `.history/` dentro da pasta do projeto. **Checkpoint:** cópia automática antes de cada
gravação do Claude ou da CLI, e no editor ao abrir e antes de exportar; anel de 30. **Versão:**
cópia com nome, sem descarte. **Rollback:** antes de voltar, fotografa o estado atual, para dar
para desfazer. `log.jsonl` registra quem gravou, quando e o quê. O desfazer e refazer dentro do
editor usa fotografias do projeto em memória (um projeto do MVP tem dezenas de kB).

**Alternativas descartadas.**
- Git para o histórico: as pastas de projeto estão fora do Git de propósito.
- Histórico só na memória: perde tudo ao fechar.
- Desfazer por comando inverso: mais fino, mas cada comando novo traz o risco de um inverso errado.

**Consequência.** Cada projeto carrega o próprio histórico e vai junto no backup. A pasta cresce
(30 cópias de um arquivo pequeno). Projeto com imagem embutida em JSON não existe: os assets ficam
em arquivo, fora das cópias.

---

## ADR-014 — Creative Intelligence: regra em código, julgamento no Claude

**Contexto.** A visão pede Art Direction, Storytelling, Creative Critique, Variation Engine e Brand
Consistency. O OpenMotion escreve dezenas de módulos de "inteligência" em regras. A regra do
usuário é não criar funcionalidade fictícia.

**Decisão.** O motor implementa só o que é medível: área segura, tamanho de fonte, contraste sobre
cor chapada, tempo de leitura, gancho no quadro 0, chamada na última cena, cor e fonte dentro da
marca, variações por eixo com semente. O que é julgamento (conceito, composição, roteiro, "tem a
cara da marca") fica com o Claude, guiado pela skill, olhando quadros exportados pela CLI. Os
campos `project.brief` e `scene.beat` guardam a intenção para as duas partes consultarem. Nenhum
módulo do motor chama modelo de IA.

**Alternativas descartadas.**
- Módulos de "direção de arte" em regras fixas: dariam nome de inteligência a uma tabela.
- Chamar a API de um modelo de dentro do motor: custo, chave, e um motor que deixa de ser
  determinístico.
- Deixar tudo com o Claude: a mesma falha de área segura passaria ora sim, ora não.

**Consequência.** A crítica tem duas partes com nome diferente no relatório: "regras" (repetível) e
"olhar" (do Claude). Contraste de texto sobre foto não é medido por regra: fica com o olhar.

---

## ADR-015 — Testes com `node:test` e Playwright, sem framework novo

**Contexto.** O repositório não tem framework de teste; o único teste é um script próprio. O Node
traz `node:test` e `node:assert`. O Playwright já está instalado.

**Decisão.** Testes de unidade e integração com `node:test`. Testes do editor de ponta a ponta com
o Playwright dirigindo o navegador. A lógica do editor (estado, desfazer, comandos) mora em módulos
puros, testados no Node. Comparação de imagem feita dentro do navegador, sem biblioteca. Detalhes
no [plano de testes](CREATIVE_ENGINE_ROADMAP.md#plano-de-testes).

**Alternativas descartadas.**
- Vitest ou Jest com DOM simulado: dependência nova para testar componente isolado, que não é
  onde está o risco.
- `@playwright/test`: outro pacote, para um executor que o `node:test` já cobre.
- Sem teste automatizado no editor: quebra a regra do usuário.

**Consequência.** Zero dependência nova para testar. Componente React não é testado isolado; o
comportamento dele é coberto pelo teste de ponta a ponta, que é mais lento.

**Como ficou na implementação.** Como decidido, com uma diferença: a comparação de imagem não é
feita dentro do navegador. Um leitor de PNG de 40 linhas (`renderer/media/png.js`) confere a cor em
pontos conhecidos e a igualdade de bytes entre dois prints, no Node.

---

## ADR-016 — Do OpenMotion, conceitos e não código

**Contexto.** O OpenMotion é a referência indicada. A licença é MIT ("Copyright (c) 2026
Yuan-Man"), que permite copiar com o aviso junto. Ele depende de MCP, banco e servidor, que não
queremos.

**Decisão.** Estudar e levar ideias, com a origem registrada na
[arquitetura, seção 2](CREATIVE_ENGINE_ARCHITECTURE.md#2-o-que-veio-do-openmotion). Nenhum arquivo,
função ou trecho copiado. Se um dia um trecho for copiado, ele leva o aviso MIT no cabeçalho e a
mudança vira uma decisão nova. Os valores das curvas de aceleração são os da especificação de CSS e
os de uso comum na web, não cópia de tabela dele.

**Alternativas descartadas.**
- Usar o OpenMotion como dependência: runtime de terceiros, MCP e banco.
- Partir de uma cópia (fork): herdaria 606 arquivos e um formato que aceita chave solta.

**Consequência.** Nenhuma obrigação de licença além do crédito, que fica nos documentos. Tudo é
escrito do zero, o que custa mais e deixa o motor do tamanho do que o ZL_IA precisa.

---

## ADR-017 ★ — Primeiro o MP4 pelo Claude, depois o editor

**Situação.** Aprovada em 11/11/2026.

**Contexto.** O MVP pede editor com timeline e preview, e exportação em MP4. O maior risco técnico
está no caminho projeto → quadro → MP4. O editor é a parte maior e depende de tudo o que vem antes.

**Decisão.** Ordem do roadmap: formato e validação, tempo e avaliação, palco e exportação, comandos
e histórico, skill, editor, inteligência. Três marcos: **A**, um JSON vira MP4; **B**, o Claude faz
o criativo de ponta a ponta pela conversa; **C**, o editor completo.

**Alternativas descartadas.**
- Editor primeiro: semanas de tela sem saber se o MP4 sai certo.
- Tudo em paralelo: quebra a regra de etapas pequenas e verificáveis.

**Consequência.** No marco B já dá para produzir anúncio de cliente, sem editor. O editor chega por
último entre as peças do MVP. Se a prioridade for ver o editor cedo, a etapa 6.1 (abrir e tocar,
sem editar) pode ser antecipada para logo depois do marco A.

---

## ADR-018 — O formato 1.0 só tem o que o MVP usa

**Contexto.** Dá vontade de prever áudio, vídeo, grupos e efeitos no formato desde já. A regra do
usuário é não criar funcionalidade fictícia.

**Decisão.** O formato 1.0 cobre exatamente o MVP: texto, imagem, forma e logo; `fade`, `slide` e
`scale`; cinco propriedades com keyframes; três transições; MP4 com H.264. O resto entra em versão
MINOR nova, junto com a implementação e o teste.

**Alternativas descartadas.**
- Campos reservados para o futuro: o Claude escreveria neles e nada aconteceria.
- Um campo livre de extensão: derruba a regra de recusar campo desconhecido.

**Consequência.** Um projeto 1.0 não tem música. Anúncio com trilha continua na `/video-reels` até
a MINOR de áudio. A política de versões está no
[documento do formato, seção 4](CREATIVE_PROJECT_SCHEMA.md#4-versões-do-formato).
