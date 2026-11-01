---
name: contrato
description: >
  Monta o contrato de prestação de serviços do que foi vendido a um cliente, só com as cláusulas do que
  ele comprou, em PDF e Word, com a mensagem de envio e o passo a passo de assinatura grátis pelo gov.br.
  Já lança as parcelas e o mensal em /cobrancas. Use sempre que uma venda fechar ou o usuário pedir
  "contrato", "fechou, manda o contrato", "preciso formalizar", "assinar com o cliente", "acordo por
  escrito", ou /contrato, mesmo que ele só diga que o cliente aceitou a proposta.
---

# /contrato — Do "sim" ao papel assinado

Depois do sim, o que protege as duas partes é ter por escrito o que entra, o que não entra, quanto e quando. O contrato sai do que foi combinado de verdade e fica curto o bastante pra um dono de loja ler: nada de juridiquês que ele não entenderia.

## Dependências

- **Modelo:** `.claude/skills/contrato/modelo.html`
- **Dados do contratado:** seção "Dados do contratado" de `_memoria/empresa.md`. Se estiver vazia, pedir ao usuário e salvar lá. **Nunca escrever CPF ou endereço em arquivo versionado:** é por isso que o modelo só tem campos
- **O que foi vendido:** `vendas/propostas/<loja>/`, `vendas/funil.md`, a conversa, `_memoria/servicos.md` (itens e condições padrão)
- **Render:** `scripts/render.js` (HTML → PDF) e `pandoc` ou `soffice` (Word)
- **Saída:** `clientes/<Nome>/contrato/` (local, não vai pro GitHub)

---

## Workflow

### Passo 1 — Levantar o combinado

Puxar da proposta, do funil e da conversa, e mostrar num resumo curto pro usuário confirmar **antes** de escrever:

```
Cliente: <nome> · Vendido: <itens>
Implantação: R$ X em N parcelas (<valor e data de cada uma>) · Mensal: R$ Y, dia Z, desde <quando>
Prazo: N dias depois do material · Domínio: <quem paga> · Foro: <comarca>
Falta saber: <lista>
```

Preço, parcelas e prazo saem do que foi combinado com o cliente, nunca da tabela. A tabela só preenche o que não foi falado (condições padrão). Se o combinado ficou só em áudio, pedir o valor ao usuário: contrato com valor deduzido é o pior erro possível aqui.

### Passo 2 — Preencher

Copiar o `modelo.html` pra `clientes/<Nome>/contrato/contrato.html` e:

1. **Apagar os blocos do que não foi vendido** (`<!-- site -->…<!-- /site -->`, `links`, `google`, `mensal`, `carrosseis`, `avaliacoes`) e os comentários dos que ficam. Sem mensal, sai tudo que depende dele, inclusive a fidelidade e a pausa por atraso.
2. **Trocar cada `{{CAMPO}}`.** O que o cliente vai preencher vira linha em branco (`________________`): razão social, CNPJ, representante e CPF costumam ficar assim. Endereço e WhatsApp vêm do Google ou da conversa, se conferidos.
3. **Descrever a entrega com a mão do projeto:** `{{DESCRICAO_SITE}}` diz o que o site tem de específico (o conceito aprovado), porque é isso que evita discussão depois.
4. **Numeração:** a lista do mensal continua a da implantação (`{{PRIMEIRO_ITEM_MENSAL}}` = quantidade de itens da implantação + 1).
5. **Valores por extenso** em todo lugar que pedir. Pix numa parcela só: tirar a lista e escrever a frase direta.
6. `{{NAO_INCLUSO}}` lista o que costuma gerar discussão: anúncios e o valor investido neles, vídeos, páginas novas, taxa do domínio depois do primeiro ano.
7. `{{DADOS_SITE}}`: confirmar como o site trata dados. Se os pedidos vão direto pro WhatsApp: "O site não guarda dados de quem o visita: os pedidos vão direto para o WhatsApp do Contratante." Se usar formulário ou medição, dizer isso.
8. Foro: a comarca do cliente, a menos que o usuário peça outra.

### Passo 3 — Gerar e conferir

```bash
node scripts/render.js clientes/<Nome>/contrato/contrato.html --pdf clientes/<Nome>/contrato/contrato-<slug>.pdf
pandoc clientes/<Nome>/contrato/contrato.html -f html -t docx -o clientes/<Nome>/contrato/contrato-<slug>.docx
```

Sem `pandoc`: `soffice --headless --infilter="HTML (StarWriter)" --convert-to docx:"MS Word 2007 XML" --outdir clientes/<Nome>/contrato clientes/<Nome>/contrato/contrato.html`. O Word sai simples, sem o visual do PDF: serve pro cliente preencher os dados.

Conferir antes de mostrar:

- [ ] Nenhum `{{` sobrando: `grep -c '{{' clientes/<Nome>/contrato/contrato.html` dá 0
- [ ] A soma das parcelas é igual ao valor da implantação, e cada extenso bate com o número
- [ ] O resumo da cláusula 2 diz o mesmo que as cláusulas 3 e 4
- [ ] As referências entre cláusulas ainda apontam pro lugar certo depois de apagar blocos
- [ ] Abrir o PDF e olhar: 2 a 3 páginas, assinaturas juntas na mesma página

### Passo 4 — Mensagem e assinatura

Escrever `clientes/<Nome>/contrato/mensagem.md` no tom do usuário: o que foi combinado em 2 linhas, o que falta o cliente preencher e o pedido do material (puxar da `/entrada-cliente`). O envio é do usuário, ou aprovado por ele no chat.

Assinatura grátis pelo gov.br:

1. Preencher os dados no Word e salvar como PDF
2. Cada um entra em assinador.iti.br com a conta gov.br (nível prata ou ouro), envia o PDF, assina e baixa
3. Um manda o PDF assinado pro outro, que assina em cima do mesmo arquivo

Se preferir, papel também vale. Dá pra mencionar que a assinatura eletrônica pelo gov.br dispensa testemunhas.

### Passo 5 — Amarrar o resto

- Lançar parcelas e mensal em `vendas/cobrancas.md` (`/cobrancas`)
- Atualizar `vendas/funil.md` e `vendas/ESTADO.md`
- Sugerir `/entrada-cliente`

## Regras

- **Modelo, não parecer jurídico.** Serve pro dia a dia de serviço pequeno. Em valor alto, exclusividade, dado sensível (saúde) ou cliente que peça mudança de cláusula, dizer ao usuário pra passar por um advogado.
- **Nunca prometer resultado.** A cláusula 7 fica em todo contrato.
- **Mudou o combinado depois de assinado?** Não editar o assinado: fazer um aditivo curto ou um contrato novo, com data.
- **Os dados pessoais ficam locais.** Nada de CPF, endereço ou nome de cliente no `modelo.html` nem neste arquivo.
