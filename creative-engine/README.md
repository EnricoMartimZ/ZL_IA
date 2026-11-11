# MazyOS Creative Engine

Motor de conteúdo visual animado do MazyOS. O Claude Code cria e edita o projeto por comandos; um
editor web abre o mesmo projeto para ajuste à mão; os dois usam o mesmo Core. A skill que dirige
tudo é a `/criativo`.

**Situação:** MVP do Motion Ad Studio completo (roadmap até a etapa 7.3): anúncio vertical de
1080×1920, 30 fps, 15 s, 4 cenas, com texto, imagem, forma e logo, entradas, saídas, transições,
timeline, preview e MP4.

## Documentos

- [Arquitetura](../docs/creative-engine/CREATIVE_ENGINE_ARCHITECTURE.md)
- [Roadmap e plano de testes](../docs/creative-engine/CREATIVE_ENGINE_ROADMAP.md)
- [Formato do projeto](../docs/creative-engine/CREATIVE_PROJECT_SCHEMA.md)
- [Decisões](../docs/creative-engine/ARCHITECTURE_DECISIONS.md)

## Instalar e testar

Pede Node `^20.19.0` ou `>=22.12.0`, o Chromium do Playwright (o `npm run setup` da raiz instala) e,
para exportar MP4, o FFmpeg do sistema. Na raiz do MazyOS:

```bash
npm --prefix creative-engine install
```

```bash
npm --prefix creative-engine test
```

A suíte leva cerca de um minuto. O render do anúncio inteiro de 15 s fica fora dela por demorar mais
um minuto; para incluí-lo:

```bash
MAZY_FULL_RENDER=1 npm --prefix creative-engine test
```

Teste que precisa de navegador ou de FFmpeg e não os encontra é pulado dizendo o que falta. O
`npm run setup` da raiz não instala nem mexe em nada daqui.

## Usar

```bash
node creative-engine/cli/mazy-creative.js --help
```

Ver o editor numa cópia descartável do projeto de exemplo:

```bash
npm --prefix creative-engine run demo
```

## Pastas

| Pasta | O que mora aqui |
|---|---|
| `core/` | Formato (`schema/`), validação, timeline, curvas, keyframes, animações prontas, transições, `evaluateFrame`, comandos de edição e modelos de projeto. Roda no Node e no navegador |
| `renderer/` | `stage/` desenha um quadro em DOM (preview e exportação); `export/` tira quadro, folha de contato e MP4 com o Playwright; `adapters/` fala com o FFmpeg; `media/` mede imagem e confere vídeo |
| `storage/` | A pasta do projeto no disco: gravação atômica, revisão, checkpoints, versões e rollback |
| `intelligence/` | `critique/` (crítica por regras), `variations/` (variações com semente), `brand/` (importar o `marca.json`) |
| `cli/` | `mazy-creative.js` (a CLI), `api.js` e `server.js` (servidor local do editor), `demo.js` |
| `editor/` | Editor web em React, servido pelo Vite sem etapa de build. `e2e/` tem os testes de ponta a ponta |
| `fixtures/` | Projeto de exemplo com assets de teste, casos inválidos e estados de referência |
| `test/` | Guardas do pacote: ambiente, dependências aprovadas, estrutura, trava de sigilo |

## Regras que valem para todo código daqui

1. **Nada de cliente.** Projeto, asset e render moram em `clientes/<Nome>/criativos/` ou em
   `marketing/criativos/`, fora do Git. Aqui só entra código e exemplo genérico
   (`clientId: "cliente-exemplo"`, texto sem nome de loja, imagem feita para o teste).
2. **O Core não sabe onde roda.** `core/` não importa `node:*`, não usa DOM, não lê relógio e não
   sorteia. Um teste confere.
3. **Toda alteração de projeto passa pelos comandos do Core** (`applyCommands`), no editor e na CLI.
4. **O palco não anima sozinho.** Sem transição de CSS, sem relógio: cada quadro é calculado.
5. **Dependência nova só com decisão.** A lista aprovada está em `test/environment.test.js` e na
   arquitetura, seção 9. Acrescentar um pacote sem atualizar as duas quebra o teste.
6. **Sem build.** O que roda no Node roda direto do arquivo `.js`; o editor é servido pelo Vite.
7. **Nomes em inglês, texto em português.** Campo, função e arquivo em inglês; comentário,
   mensagem de erro e documentação em português.
8. **Teste que grava usa pasta temporária**, nunca `clientes/` nem `marketing/`.

## Créditos e licenças

- Conceitos estudados no OpenMotion (MIT, Copyright (c) 2026 Yuan-Man). Nenhum código copiado.
- Fontes de teste em `fixtures/`: recortes da DejaVu Sans, com a licença ao lado dos arquivos.
