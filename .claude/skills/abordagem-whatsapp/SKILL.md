---
name: abordagem-whatsapp
description: >
  Prospecção em lote com abordagem curta por WhatsApp: busca negócios de vários nichos no Google Maps,
  acha os pontos fracos que dá pra provar (sem site, só Instagram, poucas avaliações perto do líder do
  nicho, nota menor, site quebrado), compara com o concorrente que aparece na frente e escreve uma
  mensagem curta e diferente pra cada um. O usuário aprova o lote no chat e o envio sai pelo WhatsApp Web
  do Chrome dele, devagar e com limite diário. Diagnóstico em PDF só pra quem responder. Também confere
  quem respondeu. Use quando o usuário pedir "prospectar várias lojas", "mandar pra várias lojas",
  "abordagem em massa", "disparar mensagem", "achar lojas de vários nichos", "mandar no WhatsApp",
  "quem respondeu", ou /abordagem-whatsapp.
---

# /abordagem-whatsapp — Muitas lojas, mensagem curta, PDF só pra quem responder

Em vez de um diagnóstico caprichado pra cada loja (que demora e quase ninguém lê), uma mensagem de 4 linhas com **um fato que o dono confere em 10 segundos** e a comparação com o concorrente que aparece na frente dele. Quem responde ganha o resto: diagnóstico, demo, proposta.

## Dependências

- **Navegador do app** (busca no Google Maps) + `ler-maps.js` desta pasta
- **`scripts/montar-lote.js`** (pontos fracos, líder do nicho, mensagens) — usa o `scripts/auditar-site.js`
- **Claude in Chrome** (o Chrome do usuário, com o WhatsApp Web logado) pro envio
- **Funil:** `vendas/funil.md` · **Saída:** `vendas/prospeccao/<YYYY-MM-DD>-lote-<cidade>/`

---

## Workflow

### Passo 1 — Buscar (navegador do app)

Para cada nicho: abrir `https://www.google.com/maps/search/<nicho>+<cidade>?hl=pt-BR`, janela 1280×1400 (`resize_window`), rodar o conteúdo de `ler-maps.js` no `javascript_tool` e salvar o JSON em `<pasta>/buscas/<nicho>.json` (formato `{"busca":"...","L":[[posição, nome, nota, avaliações, categoria, endereço, telefone, site, lat, lon], ...]}`).

- Sem login, o Maps mostra ~8–10 negócios por busca: fazer **8+ nichos** por lote
- Em alguns nichos a lista não mostra o site (layout com fotos: ótica, pet shop, móveis). Marcar `"site_na_lista": false` no JSON: aí o script **não afirma** "não tem site"
- **Nichos que rendem** (muito celular no perfil, presença fraca, ticket bom): marmoraria, vidraçaria, dedetizadora, móveis planejados, serralheria, gesso/drywall, energia solar, climatização, piscinas, pet shop de bairro, clínica de estética, autoescola. **Rendem pouco:** barbearia (top da busca já forte e sem telefone), oficina (quase só fixo)
- Nunca disfarçar o navegador nem usar outro jeito de fugir da proteção do Google. Ritmo de pessoa: uma busca por vez

### Passo 2 — Montar o lote

```bash
node scripts/montar-lote.js vendas/prospeccao/<pasta> --max 20
```

O script:
- só aceita **celular** (DDD + 9 + 8 dígitos — fixo não recebe WhatsApp), ativo (10+ avaliações), não é rede/franquia, a menos de 40 km da busca
- usa como **líder** o maior negócio *local* da busca (rede gigante não entra como comparação: não convence)
- pontos fracos verificáveis: sem site / só Instagram, Facebook ou Linktree no perfil · avaliações < 20% do líder · nota ≤ 4,5 com líder ≥ 4,8 · site próprio quebrado (auditado)
- escreve a mensagem com abertura e fecho variados (texto igual em massa é o que faz o WhatsApp banir) e mistura os nichos
- gera `lote.md` (pra aprovar), `fila.json` (pro envio) e `lote.csv`

### Passo 3 — Aprovação (obrigatória)

Mostrar no chat a tabela do `lote.md` e 3 mensagens de exemplo. **Só enviar depois de o usuário aprovar o lote**, e só os itens aprovados (ele pode tirar ou editar qualquer um). Ler cada mensagem antes: fato errado mata a abordagem — se algo parecer estranho (nome cortado, comparação injusta), corrigir no `fila.json` antes.

### Passo 4 — Enviar (Claude in Chrome)

1. Abrir `https://web.whatsapp.com` no Chrome do usuário. Se pedir o QR code, **o usuário escaneia** — nunca tentar logar por ele
2. Pra cada item aprovado, em ordem:
   - `navigate` pra `https://web.whatsapp.com/send?phone=<whatsapp>&text=<mensagem codificada com encodeURIComponent>`
   - esperar a conversa carregar; se aparecer "número de telefone compartilhado via url é inválido", marcar `status: "sem whatsapp"` e seguir
   - conferir que o texto na caixa é o aprovado, enviar (Enter) e conferir que a mensagem apareceu na conversa com o relógio/visto
   - registrar com `node ../../../.claude/skills/abordagem-whatsapp/marcar.cjs <índice> enviada "<observação>"` (rodando da pasta do lote): atualiza o `fila.json` e põe a loja no `vendas/funil.md` como **abordada** (próximo passo: ver resposta em 2 dias). Resposta automática ("agradece seu contato") não conta como resposta: anotar na observação
   - **reler a mensagem antes de clicar em enviar**: se algo estiver errado (elogio a nota baixa, nome cortado), não enviar — marcar `segurada` e corrigir pro próximo lote
   - **esperar 2 a 5 minutos** (aleatório) antes da próxima
3. **Limites:** no máximo **20 por dia** (começar com 10 nos primeiros dias de um número novo). Parar na hora se o WhatsApp mostrar aviso, pedir verificação ou começar a falhar
4. Ao terminar, resumo no chat: quantas foram, quais falharam e por quê

### Passo 5 — Quem respondeu (quando o usuário pedir, ou 2 dias depois)

No WhatsApp Web, abrir cada conversa enviada (busca pelo número) e **só ler**:
- Respondeu → resumir o que disse, mover no funil pra **respondeu** e sugerir o próximo passo: interessado → `/diagnostico-loja` ou `/site-demo` (agora sim, o material completo); dúvida → resposta curta; "não quero" → **não mandar mais nada** e marcar `status: "pediu pra parar"`
- Não respondeu em 3 dias → **um** follow-up só, com algo novo (outro fato, o print do site, uma ideia), aprovado pelo usuário. Sem resposta depois disso: arquivar
- As respostas e a conversa com a loja são do usuário: sugerir o texto, ele aprova antes de enviar

---

## Regras

- **Tudo verdade e conferível.** Número de avaliação, nota, "não tem site": o dono vai olhar. Gatilho forte, sim; exagero ou ameaça ("vai falir"), não
- **Sempre se identificar** (quem é, o que faz) e **sempre a linha de saída** ("se não fizer sentido, é só falar que não mando mais"). Quem pede pra parar nunca mais recebe nada
- **Só número comercial** que a própria loja publicou no Google. Nada de lista comprada
- **Nada sai sem aprovação** do lote. Envio um por um, devagar, com limite diário — é o que protege o número do usuário de ser banido (o WhatsApp proíbe disparo automático em massa; ideal: um número de WhatsApp Business só pra prospecção)
- **Diagnóstico em PDF e demo só depois de resposta**
