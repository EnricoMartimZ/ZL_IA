# ZL_IA

> O sistema que roda o meu negócio de marketing com IA dentro do Claude Code.
> Criado e mantido por **Enrico Martim**.

O ZL_IA junta num lugar só tudo o que eu preciso pra vender e entregar marketing
para empresas locais: achar o cliente, abordar, fechar, montar o site, cuidar do
Google, fazer o conteúdo e cobrar. São 42 skills, scripts de apoio, modelos e um
motor de anúncio animado próprio. O Claude lê a memória do negócio antes de cada
resposta e escolhe a skill certa pelo que eu escrevo, sem eu precisar lembrar de
nenhum comando.

---

## Instalar

```bash
git clone https://github.com/EnricoMartimZ/ZL_IA.git
cd ZL_IA
npm run setup
```

O `npm run setup` instala o Playwright com o Chromium (usado em carrossel, PDF e
auditoria de site) e liga a trava de sigilo nos commits. As chaves de API (kie.ai,
OpenAI, Meta) vão num `.env`, copiado do `.env.example`.

Depois é abrir o Claude Code na pasta e rodar `/instalar` uma vez: ele faz a
entrevista sobre o negócio, monta a memória e aplica o perfil certo (freelancer,
agência, empresa ou marca pessoal).

Para o motor de anúncio animado:

```bash
npm --prefix creative-engine install
```

---

## Como funciona

**Fala normal, skill certa.** Escrevo do jeito que falaria ("acha metalúrgicas com
site ruim em Sorocaba", "fechei com a ótica", "quem eu chamo hoje?") e a skill certa
entra sozinha, avisando com "⚡ /skill". Quem decide é o mapa `.claude/gatilhos.json`,
lido a cada mensagem pelo hook `.claude/hooks/gatilhos.mjs`. Para ver tudo o que
existe, basta perguntar "o que você sabe fazer?" (`/menu`).

**Memória do negócio.** `_memoria/` guarda quem eu sou, como eu falo, o que vendo e
por quanto, o foco da semana e o que aprendi com cada venda. `identidade/` guarda
cores, fontes e logo, aplicados em tudo que o sistema gera.

**Sigilo de cliente.** O GitHub guarda só o sistema. O trabalho de cada cliente
(`_memoria/`, `clientes/`, `vendas/`, `saidas/`, `dados/`, `.env`) fica só no meu
computador. Antes de cada commit, `scripts/checar-clientes.js` bloqueia arquivo
dessas pastas, nome de cliente ou prospect e CPF/CNPJ. O backup das pastas locais é
criptografado por `scripts/backup.js` e vai para o Drive.

---

## Skills

### Núcleo
- `/abrir` carrega o contexto antes de uma sessão de trabalho
- `/salvar` faz commit e push, passando pela trava de sigilo
- `/atualizar` varre o projeto e atualiza a memória
- `/novo-projeto` cria uma pasta isolada para um cliente ou iniciativa
- `/mapear-rotinas` descobre o que eu repito e transforma em skill
- `/instalar` monta o sistema numa pasta nova (o meu negócio ou o de um cliente)
- `/menu` lista tudo por objetivo e sugere o próximo passo olhando o funil

### Achar clientes
- `/abordagem-whatsapp` busca negócios de vários ramos no Google Maps, acha o ponto
  fraco que o dono confere em 10 segundos, escreve uma mensagem curta para cada um e,
  com a minha aprovação, envia pelo WhatsApp Web devagar e com limite diário
- `/prospectar-lojas` monta lista de lojas por cidade ou ramo, com nota de
  oportunidade e gancho de abordagem
- `/prospectar-b2b` mapeia indústrias, distribuidoras e outras empresas B2B com site
  fraco: audita os sites em lote com print, pesa quem pode pagar e entrega a lista
  com decisor e mensagens

### Fechar a venda
- `/diagnostico-loja` gera um diagnóstico gratuito em PDF com o que a empresa perde
  por mês
- `/proposta-servico` monta proposta com três pacotes em cima do diagnóstico
- `/negociar` conduz quem respondeu e não fechou: acha a objeção real e reduz escopo
  em vez de preço
- `/contrato` escreve o contrato só com o que foi vendido, em PDF e Word, para
  assinar pelo gov.br
- `/funil` mostra todos os contatos por etapa e quem precisa de follow-up hoje
- `/aprendizado` registra por que cada venda fechou ou foi perdida e vira regra para
  as outras skills

### Entregar e manter o cliente
- `/entrada-cliente` pede material e acessos de uma vez, conta o prazo e confere a
  entrega
- `/cobrancas` mostra quem paga, o que atrasou e quanto entra no mês, com o lembrete
  pronto
- `/relatorio-resultados` fecha o mês do cliente com antes e depois e retorno
  estimado
- `/estudo-de-caso` pede depoimento e indicação e monta o caso
- `/vigia` confere sites, domínios, demos, cobranças e backup

### Sites
- `/identidade-loja` levanta a marca do cliente antes de tudo (cores com o papel de
  cada uma, logo, fontes e frases) a partir do site, do Instagram e da fachada
- `/site-premium` cria um site com conceito próprio do ramo: escolhe um mundo visual
  e uma técnica-assinatura, conta a história pela rolagem e já sai com WhatsApp,
  página por serviço, SEO local, medição de cliques e mapa com as ruas do bairro
- `/site-demo` monta uma prévia do site antes da venda, marcada como demonstração e
  fora do Google
- `/seo-site` cuida da busca no Google e nas IAs: palavras-chave por página, títulos,
  dados estruturados, sitemap, robots e auditoria por gravidade
- `/checar-site` confere erros, texto de exemplo esquecido, cor da marca, SEO e
  celular antes de entregar
- `/publicar-site` põe no ar com domínio, Search Console e perfil do Google
- `/links-bio` faz a página de links do Instagram

### Conteúdo e Google
- `/carrossel` cria carrosséis 1080×1350 com a identidade da marca, com ou sem foto
  de IA
- `/carrossel-semanal` gera sozinho os carrosséis da semana a partir da pauta
- `/publicar-tema` transforma um tema em artigo de blog, carrossel e três legendas
- `/aprovar-post` publica blog, Instagram e Facebook num comando
- `/seo` roda o fluxo completo de SEO local: demanda, concorrência, perfil do Google,
  conteúdo, anúncios e GEO
- `/responder-avaliacoes` escreve respostas humanas para as avaliações do Google

### Foto, vídeo e anúncio
- `/foto-produto` transforma foto de celular em foto de catálogo, lifestyle ou
  sazonal, mantendo o produto idêntico
- `/video-ia` anima foto de produto (primeiro no Google Flow) e faz apresentador
  falar com lip sync
- `/video-reels` monta reels e TikToks 9:16, inclusive um vídeo por produto a partir
  de uma planilha
- `/criativo` cria anúncios animados 1080×1920 no Creative Engine, com editor web
  para ajuste à mão e exportação em MP4
- `/anuncio-google` monta a campanha inteira em CSV para o Google Ads Editor
- `/relatorio-ads` lê os exports de Google e Meta e devolve o relatório semanal

### Produção
- `/analisar-dados` lê CSV, XLSX ou PDF e devolve um resumo executivo
- `/email-profissional` rascunha e-mail a partir de contexto livre

---

## O que tem em cada pasta

| Pasta | O que guarda |
|---|---|
| `.claude/skills/` | As 42 skills |
| `.claude/hooks/` e `.claude/gatilhos.json` | O roteamento automático de skill pela mensagem |
| `scripts/` | Utilitários Node: render de HTML em PNG/PDF, imagem por IA, postagem na Meta, auditoria e SEO de site, mapa de ruas, vigia, backup e a trava de sigilo ([detalhes](scripts/README.md)) |
| `creative-engine/` | Motor de anúncio animado: core, renderer, editor web e CLI ([detalhes](creative-engine/README.md)) |
| `src/components/premium/` e `docs/archetypes/` | Componentes e arquétipos de design dos sites premium |
| `docs/creative-engine/` | Arquitetura, roadmap e formato de projeto do Creative Engine |
| `templates/` | Modelos de memória, identidade, perfis de negócio e catálogos de skills e ferramentas |
| `rotinas/` | Cópia das tarefas agendadas (lote diário, vigia semanal) para recriar em outro computador |
| `identidade/` | A minha identidade visual |
| `marketing/`, `saidas/`, `dados/` | Produção do próprio negócio (só o README vai para o GitHub) |

---

## Rotinas agendadas

As tarefas agendadas ficam no app do Claude, fora do repositório. Em `rotinas/` está
o texto de cada uma para recriar num computador novo:

- **Lote diário** (segunda a sexta): mapeia empresas da região e prepara as mensagens
  do dia para eu aprovar antes de qualquer envio
- **Vigia semanal** (segunda cedo): confere sites, domínios, demos, cobranças, backup
  e sigilo do repositório

---

## Num computador novo

1. `git clone` e `npm run setup`
2. Copiar o `.env` e restaurar o backup das pastas locais
3. Recriar as tarefas de `rotinas/`
4. Abrir o Claude Code na pasta

Para pegar as novidades: `git pull`.
