# MazyOS

> O sistema operacional do seu negócio dentro do Claude Code.

Você acaba de instalar o MazyOS. Em alguns minutos, sua empresa vai
ter uma memória própria, uma identidade visual aplicada em tudo que
o sistema gerar, e 30 skills prontas pra fazer marketing, SEO, ads
e operação rodarem com você dirigindo.

Bora voar.

---

## Ligando o sistema

Dois caminhos. Escolhe o que combina contigo.

### Pelo Claude (mais rápido)

Abre o Claude Code em qualquer pasta e cola:

```
Clona o https://github.com/mazzeoia/MazyOS.git na pasta atual,
entra nela e roda o /instalar.
```

Ele clona, entra na pasta nova e dispara a entrevista de setup. Você
só responde.

### Pelo terminal (mais previsível)

```
git clone https://github.com/mazzeoia/MazyOS.git
cd MazyOS
code .
```

Na janela do VS Code que abrir: terminal integrado → `claude` → `/instalar`.

**Para carrossel e PDFs** (diagnóstico, proposta, relatório), instale uma vez
o Playwright: `npm run setup` na raiz. Chaves de API (OpenAI, Meta) vão num
`.env` — copie o `.env.example`. O `.env` nunca vai pro GitHub.

---

Quando o `/instalar` terminar, renomeia a pasta `MazyOS/` pro nome do teu
negócio (fecha o VS Code, renomeia no Explorer/Finder, abre de novo). A
pasta não fica como "MazyOS" — ela é o teu negócio agora.

O `/instalar` roda uma vez só. Te entrevista sobre o negócio, monta a
memória e configura o sistema. Depois disso, é só usar.

---

## O sistema

**Não precisa decorar comando.** Fala do jeito normal — "acha metalúrgicas
com site ruim em Sorocaba", "fechei com a ótica", "quem eu chamo hoje?" — e a
skill certa entra sozinha (aparece "⚡ /skill"). Quem decide é o mapa
`.claude/gatilhos.json`, lido a cada mensagem pelo hook
`.claude/hooks/gatilhos.mjs`. Esqueceu o que existe? Pergunta "o que você sabe
fazer?" (`/menu`): ele lista tudo por objetivo, com frase de exemplo, e diz o
que fazer hoje olhando o funil.

**Núcleo** — o jeito de operar o dia a dia
`/abrir` carrega o contexto antes de cada sessão de trabalho · `/salvar`
faz commit + push no GitHub · `/atualizar` varre o projeto e atualiza
a memória · `/novo-projeto` cria pasta isolada pra cada cliente ou
iniciativa · `/mapear-rotinas` descobre o que você repete e transforma
em skill personalizada.

**Conteúdo e SEO** — vitrine pública da empresa
`/carrossel` cria carrosséis 1080×1350 com identidade da marca (com ou
sem foto IA) · `/publicar-tema` pega um tema e entrega artigo de blog +
carrossel + 3 legendas amarradas · `/seo` roda fluxo completo de 8 passos
(demanda, concorrência, GMB, on-page, conteúdo, ads, monitoramento, GEO)
· `/responder-avaliacoes` escreve respostas humanas pras reviews do
Google · `/aprovar-post` publica blog + Instagram + Facebook num comando.

**Anúncios pagos** — onde o dinheiro entra
`/anuncio-google` monta a campanha inteira em CSV pronto pra importar
no Google Ads Editor · `/relatorio-ads` lê os exports de Google + Meta
e devolve relatório semanal com alertas e recomendações.

**Vender serviço de IA pra lojas** — do lead ao cliente que renova
`/prospectar-lojas` monta lista de lojas por nicho e região com nota de
oportunidade e gancho de abordagem · `/diagnostico-loja` gera diagnóstico
gratuito em PDF com os pontos de perda e quanto custam por mês ·
`/proposta-servico` monta proposta com três pacotes em cima do diagnóstico
(e cria `_memoria/servicos.md` na primeira vez) · `/relatorio-resultados`
fecha o mês do cliente com antes/depois e retorno estimado · `/funil` mostra
todas as lojas por etapa e quem precisa de follow-up hoje, com mensagem
pronta · `/aprendizado` registra por que cada venda fechou ou foi perdida e
vira regra pras outras skills.

**Foto e vídeo com IA** — entregas que a loja vê na hora
`/foto-produto` transforma foto de celular em foto de catálogo, lifestyle ou
sazonal mantendo o produto idêntico (kie.ai ou Higgsfield) · `/video-ia`
anima foto de produto e faz apresentador falar com lip sync · `/video-reels`
monta reels e TikToks 9:16 com o HyperFrames, inclusive um vídeo por produto
a partir de uma planilha.

**Sites** — a vitrine que vale dinheiro
`/site-premium` cria site com hero cinematográfico que conta o antes → depois do
serviço — cenas geradas por IA costuradas com transições (padrão), 3D ou foto —, visual escuro de alto padrão e agenda pelo
WhatsApp (ou "Pedir orçamento" pra empresa B2B) — com tema claro ou escuro, hero 3D ou foto, página por serviço, SEO local
e medição de cliques, e mapa animado com as ruas reais do bairro · `/site-demo` monta uma prévia do site da loja antes de vender
(marcada como demonstração, fora do Google) · `/checar-site` confere erros, texto de
exemplo esquecido, SEO e celular antes de entregar · `/publicar-site` põe no ar com
domínio, Search Console e Google Meu Negócio, e organiza a manutenção mensal.

**Prospecção B2B** — onde o ticket é maior
`/prospectar-b2b` mapeia indústrias, distribuidoras, transportadoras e outras
empresas B2B da região com site ruim e presença fraca: audita os sites em lote
(sem HTTPS, quebrado no celular, © antigo, sem caminho pra orçamento) com print,
confere Google, Instagram e LinkedIn, pesa quem pode pagar e entrega a lista
priorizada com gancho, decisor e mensagens.

**Produção** — ferramentas do dia a dia
`/analisar-dados` lê CSV/XLSX/PDF e gera resumo executivo ·
`/email-profissional` rascunha email a partir de contexto livre.

---

## A tese

IA não é uma ferramenta que sua empresa usa. É o sistema operacional em
que ela roda.

A diferença não é velocidade. É capacidade nova — uma pessoa com IA
constrói o que antes exigia time inteiro. Cada processo crítico que hoje
roda em open loop (decide → executa → não mede → repete cego) vira
closed loop dentro do MazyOS (decide → executa → captura → realimenta →
ajusta sozinho).

O sistema não substitui você. Vira parte da sua empresa.

---

## Como o MazyOS pensa

`_memoria/` é o cérebro. Tudo que importa do seu negócio mora aqui —
quem é a empresa, como ela fala, o que tá em foco essa semana. O Claude
lê isso antes de cada resposta. Quanto melhor a memória, melhor o sistema.

`identidade/` é o rosto. Cores, fontes, logo, padrão visual. Todo
carrossel, slide, peça que o sistema gera respeita isso.

`marketing/`, `saidas/` e `scripts/` são o resultado. O sistema produz,
versiona no GitHub, fica tudo seu.

---

## Quando precisar

[mazzeoia.com.br](https://mazzeoia.com.br)
