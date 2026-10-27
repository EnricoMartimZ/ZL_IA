---
name: diagnostico-loja
description: >
  Gera um diagnóstico gratuito de 1–2 páginas pra uma loja específica: onde ela está perdendo
  venda (Google Meu Negócio, avaliações, Instagram, site, catálogo, atendimento, concorrência),
  quanto isso custa por mês em estimativa transparente, e o que IA resolve em cada ponto. Sai
  em HTML + PDF com a sua identidade visual, pronto pra mandar pro dono da loja como isca de venda.
  Use quando o usuário pedir "diagnóstico da loja X", "analisa essa loja", "raio-x da loja",
  "auditoria", "o que essa loja tá perdendo", ou /diagnostico-loja.
---

# /diagnostico-loja — Diagnóstico gratuito que abre a venda

Peça central do funil. O lojista não compra "IA" — compra o fim de um problema que ele reconhece. O diagnóstico mostra o problema dele, com os dados dele, e coloca um número em reais na frente. A proposta vem depois, apoiada nele.

## Dependências

- **Contexto:** `_memoria/empresa.md`, `_memoria/preferencias.md` (tom de voz)
- **Aprendizados:** `_memoria/vendas-aprendizados.md` se existir — usar os pontos de perda que mais pesaram em vendas fechadas
- **Serviços:** `_memoria/servicos.md` se existir (cada problema apontado deve ter um serviço seu que resolve)
- **Visual:** `identidade/design-guide.md` (o PDF sai com a sua marca, não a da loja)
- **Entrada opcional:** linha da planilha de `/prospectar-lojas` em `vendas/prospeccao/`
- **Modelo:** `.claude/skills/diagnostico-loja/modelo.html` (layout pronto, só trocar os `{{CAMPOS}}`)
- **Render:** `scripts/render.js` (Playwright — se faltar, rodar `npm run setup` na raiz)

---

## Como rodar

```
/diagnostico-loja <nome da loja>, <cidade>
/diagnostico-loja @<instagram da loja>
/diagnostico-loja top 3 da última prospecção
```

Se a loja já está numa planilha de `vendas/prospeccao/`, reaproveitar o raio-x e só aprofundar.

## Workflow

### Passo 1 — Coleta (pública e verificável)

Aprofundar além do raio-x da prospecção:

- **Google Meu Negócio:** nota, nº de avaliações, % respondidas, tempo médio sem resposta, fotos (quantidade e data), horário, categorias, perguntas e respostas
- **Avaliações:** ler as últimas 20. Agrupar reclamações e elogios recorrentes (3 temas de cada)
- **Instagram:** últimos 12 posts — frequência, formato, engajamento médio (curtidas+comentários / seguidores), bio, link, destaques
- **Site/loja online:** existe, velocidade no celular, títulos e descrições de produto, se aparece no Google pro próprio nicho
- **Atendimento:** WhatsApp visível, catálogo, mensagem de ausência. Se o usuário topar, ele mesmo manda uma mensagem de cliente oculto e informa o tempo de resposta
- **Concorrência:** 2–3 concorrentes que aparecem na frente em "nicho + bairro/cidade" — comparar nota, nº de avaliações, frequência no Instagram

Anotar a fonte e a data de cada dado. Prints importantes: pedir pro usuário salvar em `vendas/diagnosticos/<loja>/prints/`.

### Passo 2 — Pontos de perda

Transformar a coleta em **3 a 5 pontos de perda**, do maior pro menor. Cada ponto tem:

1. **O que acontece** — fato com número ("31 de 47 avaliações sem resposta")
2. **Por que custa venda** — uma frase, sem jargão ("quem pesquisa no Google lê as respostas antes de ir à loja")
3. **Comparação** — com o concorrente ou com o padrão do nicho
4. **O que a IA resolve** — concreto e ligado a um serviço seu ("respostas personalizadas em até 24h, todas")

Não listar 12 problemas. O dono precisa sair lembrando de 3.

### Passo 3 — Estimativa de perda em R$

Usar conta simples, **com as premissas visíveis** no documento. Exemplo:

```
Buscas mensais estimadas por "pet shop + bairro": ~600 (fonte/premissa)
Cliques que ficam com concorrentes por nota/avaliações piores: ~15%  → 90 pessoas
Conversão de visita em compra no nicho: ~20%                         → 18 vendas
Ticket médio do nicho (ou informado pelo dono): R$ 120
Perda estimada: ~R$ 2.160/mês
```

Regras da estimativa:
- Sempre um **intervalo conservador** ("entre R$ 1.500 e R$ 2.500/mês"), nunca um número exato
- Toda premissa escrita e marcada como estimativa
- Se faltar base pra estimar um ponto, não estimar — dizer "impacto não estimado"
- Preferir subestimar. Número exagerado faz o dono desconfiar de tudo

### Passo 4 — Montar o documento

Copiar `modelo.html` dessa skill pra `vendas/diagnosticos/<slug-loja>/diagnostico.html`, trocar as cores do `:root` pelas de `identidade/design-guide.md` (se estiver em branco, manter as do modelo) e preencher os `{{CAMPOS}}`. Não deixar nenhum `{{...}}` no arquivo final. Estrutura do modelo:

```
[Logo do usuário]                                   Diagnóstico gratuito · <data>

<Nome da loja>
Uma frase: o resumo do que encontrei.

Quanto isso pode estar custando: R$ X – R$ Y por mês (estimativa, premissas no fim)

1. <Ponto de perda>       fato · por que importa · comparação · o que resolve
2. ...
3. ...

O que eu faria nos primeiros 30 dias
- 3 ações, em ordem

Premissas e fontes (letra menor)

[Nome, contato, CTA: "Quer conversar 15 minutos sobre isso?"]
```

Limite: **2 páginas A4**. Se passar, cortar pontos, não diminuir fonte.

### Passo 5 — Render em PDF

```bash
node scripts/render.js vendas/diagnosticos/<slug-loja>/diagnostico.html --pdf vendas/diagnosticos/<slug-loja>/diagnostico-<slug-loja>.pdf
```

Abrir o PDF e conferir: no máximo 2 páginas, nada cortado, nenhum `{{` sobrando.

Salvar também `dados.md` com toda a coleta bruta e as premissas (o `/proposta-servico` lê daqui).

### Passo 6 — Mensagem de envio

Escrever a mensagem curta pra mandar o PDF (WhatsApp ou DM), no tom de `_memoria/preferencias.md`:

> "Oi, [nome]. Fiz um diagnóstico rápido da presença online da [loja] — achei 3 pontos que provavelmente estão levando cliente pro concorrente. Te mando o PDF? É gratuito, sem compromisso."

Duas versões: uma pra pedir permissão antes de mandar, outra pra mandar direto com o PDF.

### Passo 7 — Entrega

Mostrar no chat: resumo de 3 linhas, faixa de perda estimada, caminho do PDF e as mensagens. Atualizar a loja em `vendas/funil.md` pra etapa **diagnóstico pronto** (criar a linha se não existir).

> "Se ele responder, roda `/proposta-servico <loja>` que eu monto a proposta em cima desse diagnóstico."

---

## Regras

- **Nada inventado.** Todo número tem fonte ou está marcado como estimativa com premissa.
- **Respeitoso com a loja.** Diagnóstico aponta oportunidade, não humilha. "Está deixando dinheiro na mesa", não "o Instagram de vocês é horrível".
- **Cada problema tem solução sua.** Não apontar problema que você não resolve — vira consultoria grátis pro concorrente.
- **Curto.** 2 páginas no máximo. Dono de loja não lê relatório de 15 páginas.
- **Não enviar nada.** A skill gera o PDF e a mensagem; quem manda é o usuário.
