# scripts/ — utilitários do MazyOS

Scripts Node.js e Python que as skills chamam quando precisam fazer coisas fora do alcance da IA pura (gerar imagem, postar em rede social, renderizar HTML em PNG).

Instalação (uma vez): `npm run setup` na raiz — instala o Playwright e o Chromium.

## Scripts

| Script | Usado por | O que faz |
|---|---|---|
| `render.js` | `/carrossel`, `/diagnostico-loja`, `/proposta-servico`, `/relatorio-resultados` | HTML → PNG (um por `.slide`) ou PDF A4 |
| `gerar-imagem.js` | `/carrossel` (foto IA) | Gera foto via OpenAI Images API (`gpt-image-1`) |
| `postar-instagram.js` | `/aprovar-post` | Publica carrossel ou post único no Instagram |
| `postar-facebook.js` | `/aprovar-post` | Publica as fotos num post da Página do Facebook |
| `lib/meta.js` | scripts de postagem | Funções comuns da Meta Graph API |
| `checar-site.js` | `/checar-site`, `/site-demo`, `/publicar-site` | Confere um site (pasta ou URL): erros, 404, texto de exemplo, SEO, imagens, celular. Sai com código 1 se houver erro que bloqueia |
| `auditar-site.js` | `/prospectar-b2b` (e qualquer prospecção) | Audita o site de prospects em lote: nota de 0 a 100 com os motivos (sem HTTPS, quebrado no celular, © antigo, sem orçamento...) e prints de desktop e celular |
| `extrair-marca.js` | `/identidade-loja` (antes de `/site-premium` e `/site-demo`) | Tira a identidade da loja do site atual e de prints/logo: cores com papel (fundo, texto, destaque, base escura), logo recortado, fontes, frases e redes. Gera `marca.json`, `marca.md` com o `:root` pronto e o quadro `marca.png` |
| `montar-lote.js` | `/abordagem-whatsapp` | Lê as buscas do Google Maps, escolhe quem tem celular e ponto fraco verificável, compara com o líder local do nicho, audita os sites e escreve uma mensagem curta e diferente pra cada loja (`lote.md`, `fila.json`, `lote.csv`) |
| `mapa-ruas.js` | `/site-premium` (seção "Onde fica") | Baixa as ruas reais em volta da loja (OpenStreetMap), calcula a rota de carro até ela e salva o `mapa.json` da animação |
| `kie.js` | `/foto-produto`, `/video-ia` | Gera imagem, vídeo e lip sync pelo kie.ai (motor do Open Higgsfield AI); sobe arquivos locais marcados com `@` |
| `checar-clientes.js` | todo commit (`.githooks/pre-commit`) | Trava o commit se entrar arquivo local, nome de cliente, CPF ou CNPJ. Com `--tudo`, revisa o repositório inteiro |
| `backup.js` | `/salvar`, rotina semanal | Guarda `vendas/`, `clientes/`, `_memoria/` e `.env` num arquivo criptografado, confere se abre e restaura com `--restaurar` |
| `vigia.js` | `/vigia`, rotina semanal | Confere sites no ar, certificado, vencimento de domínio e demos na data de sair |

```bash
node scripts/render.js marketing/conteudo/<pasta>/carrossel.html --png marketing/conteudo/<pasta>/instagram
node scripts/render.js vendas/propostas/<loja>/proposta.html --pdf vendas/propostas/<loja>/proposta-<loja>.pdf
node --env-file=.env scripts/gerar-imagem.js "PROMPT" marketing/conteudo/<pasta>/foto.png
node --env-file=.env scripts/postar-instagram.js marketing/conteudo/<slug>-<data> --dry-run
```

`/video-reels` não usa script daqui: roda o CLI do HyperFrames (`npx hyperframes`, precisa de Node 22+ e FFmpeg).

`/criativo` também não: usa o Creative Engine, que tem pacote próprio em `creative-engine/` (instalar com `npm --prefix creative-engine install`; comandos em `node creative-engine/cli/mazy-creative.js --help`).

`--dry-run` nos scripts de postagem e no `kie.js` mostra as chamadas à API sem publicar nada — use pra conferir antes da primeira vez.

## Pré-requisitos comuns

A maioria dos scripts depende de:

**Node.js 20+** instalado na máquina

**.env** na raiz do projeto (copie o `.env.example`; o `.env` está no `.gitignore`):
```bash
OPENAI_API_KEY=sk-...               # pra gerar-imagem.js
KIE_API_KEY=...                     # pra kie.js (/foto-produto, /video-ia)
META_PAGE_ACCESS_TOKEN=...          # pra postar-instagram.js + postar-facebook.js
META_PAGE_ID=...
META_IG_USER_ID=...
SITE_URL=https://seudominio.com.br
```

**Playwright** (pra renderizar HTML em PNG):
```bash
npm install playwright
npx playwright install chromium
```

## Como o MazyOS lida com isso

Quando você roda uma skill que precisa de script ausente, o Claude vai:

1. Detectar que falta o script
2. Te perguntar se quer configurar agora
3. Te guiar no setup das chaves de API (Meta, OpenAI, etc.)
4. Criar o script já configurado
5. Rodar a skill

Você não precisa decorar nada. Roda a skill, segue o fluxo.
