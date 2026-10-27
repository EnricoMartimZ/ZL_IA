---
name: prospectar-b2b
description: >
  Mapeia empresas B2B da região (indústrias, distribuidoras, transportadoras, construtoras, instaladoras,
  contabilidades, facilities...) com presença digital fraca: audita o site de cada uma em lote (sem HTTPS,
  quebrado no celular, © antigo no rodapé, sem caminho pra orçamento) com print de desktop e celular,
  confere Google, Instagram e LinkedIn, pesa o potencial de pagar e entrega uma lista priorizada com o
  gancho de cada uma, o decisor e as mensagens de abordagem. Use quando o usuário pedir "prospectar
  empresas", "achar clientes b2b", "empresas com site ruim", "lista de indústrias", "quem abordar pra
  vender site", "empresas sem presença digital", "leads b2b em <cidade>", ou /prospectar-b2b.
---

# /prospectar-b2b — Empresas B2B com presença digital fraca

O varejo (`/prospectar-lojas`) compra conteúdo e Instagram. A empresa B2B compra **pedido de orçamento**: o comprador dela pesquisa o fornecedor no Google e abre o site antes de cotar. Site velho custa contrato — e isso dá pra provar com um print. Ticket maior, contrato mais longo.

## Dependências

- **Nichos e o que vender:** `nichos.md` nesta pasta
- **Auditoria dos sites:** `scripts/auditar-site.js` (Playwright — se faltar, `npm run setup` na raiz)
- **Contexto:** `_memoria/empresa.md`, `_memoria/servicos.md`, `_memoria/vendas-aprendizados.md` (nichos que já converteram)
- **Funil:** `vendas/funil.md` (formato no `/funil`)
- **Saída:** `vendas/prospeccao/b2b/<YYYY-MM-DD>-<nicho>-<regiao>/`

---

## Como rodar

```
/prospectar-b2b metalúrgicas em Sorocaba
/prospectar-b2b transportadoras e distribuidoras na região de Campinas, 30 empresas
/prospectar-b2b
```

Sem argumento: perguntar a região e sugerir 3 nichos de `nichos.md` (os que já converteram em `vendas-aprendizados.md` primeiro).

## Workflow

### Passo 1 — Levantar as empresas (o dobro do pedido)

Fontes públicas, nesta ordem:
1. **Google Maps / busca** com os termos de `nichos.md` ("usinagem cnc sorocaba", "transportadora campinas para minas"). Páginas 1 a 3 — quem está na página 3 é justamente quem precisa
2. **Listas setoriais:** associação comercial/industrial da cidade, sindicato patronal do setor, distrito industrial, feiras do setor (lista de expositores)
3. **Base pública de CNPJ** (dados abertos da Receita Federal, ou um serviço que consulte ela) filtrando por CNAE e município — dá tempo de mercado e porte. Usar só dados **da empresa**

Pra cada uma: empresa, site, cidade, telefone comercial, e-mail comercial, links do Google, Instagram e LinkedIn (quando achar). Salvar em `lista.csv` (separador `;`, com coluna `site`).

Descartar: multinacionais e grupos grandes (decisão fora da cidade), franquias, quem já está no funil nos últimos 60 dias.

### Passo 2 — Auditar os sites em lote

```bash
node scripts/auditar-site.js vendas/prospeccao/b2b/<pasta>/lista.csv --saida vendas/prospeccao/b2b/<pasta>
```

Gera `auditoria.csv` (nota de 0 a 100, maior = site pior = mais oportunidade, com os motivos) e `prints/` de desktop e celular. O script só abre a página inicial, como um visitante. O que ele pontua:

| Sinal | Pontos |
|---|---|
| Sem site / domínio que não existe / fora do ar | 60 / 55 / 55 |
| Sem HTTPS ou certificado com erro ("não seguro") | 20 |
| Não feito pra celular / rola pro lado no celular / letra minúscula | 18 / 14 / 8 |
| © antigo no rodapé (2 pontos por ano, até 15) | até 15 |
| Flash; código dos anos 2000; jQuery/WordPress velhos | 15 / 8 / 5–6 |
| Lento (> 6 s) ou pesado | até 12 |
| Sem WhatsApp **nem** formulário (sem caminho pra orçamento) | 12 |
| Sem descrição pro Google, título genérico, sem imagem de compartilhamento, quase sem texto | 3–5 cada |
| Imagem quebrada | 6 |

Abrir os prints dos 10 primeiros e confirmar com o olho — o print do celular é o gancho mais forte que existe.

### Passo 3 — Presença (público, sem login)

Pra cada empresa com nota de site ≥ 30 (ou sem site), conferir:

| Ponto | Pontos de presença (máx. 40) |
|---|---|
| Sem perfil no Google / perfil sem fotos ou sem horário | +15 / +5 |
| Menos de 15 avaliações no Google | +8 |
| Não aparece na 1ª página do Google pra "<serviço> <cidade>" (e quem aparece no lugar) | +10 |
| Instagram inexistente ou sem post há mais de 90 dias | +7 |
| Sem página no LinkedIn | +5 |

Anotar o concorrente que aparece na frente — vira argumento.

### Passo 4 — Potencial de pagar (A / B / C)

Sinais públicos de porte e de momento:
- **Tempo de mercado** (abertura do CNPJ) e **porte** (funcionários no LinkedIn, galpão/sede própria, frota)
- **Está crescendo:** vagas abertas, unidade nova, notícia local, obra em andamento
- **Já investe em venda:** anúncios ativos (Biblioteca de Anúncios da Meta, Central de Transparência do Google Ads), presença em feiras
- **Atende fora da cidade** (outros estados = depende mais do Google)

**A** = 3+ sinais · **B** = 1–2 · **C** = nenhum (empresa muito pequena — só se o nicho for prioridade).

### Passo 5 — Prioridade e gancho

`oportunidade = 0,6 × nota do site + pontos de presença` (0 a 100). Ordenar por **potencial (A antes de B) e depois oportunidade**.

Pra cada uma das 15 primeiras, **um gancho verificável** tirado da auditoria — específico, com o que o comprador dela sente:
- Bom: "Abri o site de vocês no celular: a página rola pro lado e o botão de orçamento some. Quem pesquisa fornecedor pelo celular desiste ali."
- Bom: "O site de vocês aparece com 'não seguro' no Chrome — pra comprador de indústria, isso pesa na hora de cadastrar fornecedor."
- Ruim: "Vi que vocês poderiam melhorar a presença digital."

### Passo 6 — Decisor e canal

- **Quem decide:** em PME, o sócio-diretor; em empresa média, gerente comercial ou de marketing. Nome e cargo pela página "quem somos", pelo LinkedIn da empresa ou perguntando na ligação
- **LinkedIn:** deixar o link de busca pro usuário abrir (`https://www.linkedin.com/search/results/people/?keywords=<empresa>`) — não raspar perfis
- **Canal por ordem de resposta em B2B:** ligação pro comercial (pedir o responsável) → e-mail comercial personalizado → convite no LinkedIn com nota → WhatsApp comercial só 1 a 1

### Passo 7 — Planilha, funil e mensagens

Na pasta da prospecção:
- `prospects.xlsx` (skill de XLSX): `Prioridade | Empresa | Nicho | Potencial | Oportunidade | Nota site | Gancho | Decisor | Telefone | E-mail | Site | Google | Instagram | LinkedIn | Print celular | Status`
- `mensagens.md` com, pra cada um dos 5 primeiros: e-mail (assunto + 5 linhas, com o print anexado), nota de convite do LinkedIn (até 300 caracteres), roteiro de ligação (30 segundos) e os follow-ups dos dias 3, 7 e 14 — cada follow-up trazendo algo novo (outro print, o concorrente que aparece na frente, uma ideia)
- Todo e-mail termina com uma linha de saída: "Se não fizer sentido, me avisa que não mando mais."

Adicionar cada empresa em `vendas/funil.md`, nicho com prefixo **B2B ·**, etapa **a abordar**.

Fechar no chat com o top 5 (empresa, potencial, oportunidade, gancho) e:

> "Pros 3 primeiros vale mandar a abordagem já com uma prévia: `/site-demo` (com 'Pedir orçamento' no lugar de agendar). Quer que eu monte?"

---

## Regras

- **Só dado de empresa.** Nome, CNPJ, endereço, telefone e e-mail comerciais, perfis da empresa. Do decisor, só nome e cargo públicos. Nada de CPF, telefone pessoal ou endereço residencial (LGPD).
- **Abordagem B2B dentro da LGPD:** contato comercial, personalizado, com motivo concreto e opção de sair. Nada de comprar lista nem de disparo em massa — no WhatsApp isso ainda bane o número.
- **A auditoria é de visitante:** só a página inicial, uma empresa por vez. Nada de formulário, login ou varredura agressiva.
- **Os prints são do site público do prospect** e servem pra abordagem dele. Não publicar nem usar em portfólio.
- **Nada inventado.** Sem dado, a coluna fica "não encontrado".
- **Não abordar ninguém.** A skill monta a lista e as mensagens; quem manda é o usuário.
