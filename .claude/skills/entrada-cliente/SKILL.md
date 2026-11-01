---
name: entrada-cliente
description: >
  Organiza o começo do trabalho com um cliente que fechou: lista exatamente o que pedir conforme o que ele
  comprou (fotos, logo, textos, acessos do Google e do Instagram, domínio), escreve a mensagem pronta, acompanha
  o que chegou e o que falta, conta o prazo combinado e confere a entrega que libera a última parcela. Use
  sempre que o usuário disser "onboarding", "o que eu peço pro cliente", "o cliente assinou", "o cliente
  mandou as fotos", "o que falta pra entregar", "começar o trabalho com", ou /entrada-cliente, mesmo sem
  usar essas palavras, quando o assunto for o andamento de um cliente já fechado.
---

# /entrada-cliente — Do contrato assinado à entrega

Projeto de serviço trava no começo: o cliente demora a mandar material, ninguém lembra o que faltou e o prazo fica em discussão. Aqui tudo vira uma lista só, por cliente, e um pedido único em vez de dez mensagens soltas.

## Dependências

- **Cliente:** `clientes/<Nome>/` (se não existir, `/novo-projeto`)
- **O que foi vendido:** `clientes/<Nome>/contrato/` ou a proposta em `vendas/propostas/<loja>/`
- **Saída:** `clientes/<Nome>/entrada.md` (local)
- **Depois:** `/identidade-loja`, `/site-premium`, `/checar-site`, `/publicar-site`, `/cobrancas`

---

## Workflow

### Passo 1 — Montar `clientes/<Nome>/entrada.md`

Só com o que foi vendido, e já marcando o que chegou (conferir a pasta do cliente e a conversa antes de pedir de novo):

```markdown
# Entrada: <cliente>

Prazo combinado: N dias depois do material e dos acessos
Material completo em: — · Entrega até: —

## Falta receber
- [ ] <item> (responsável: cliente) · pedido em <data>

## Recebido
- [x] <item> em <data>

## Entrega
- [ ] <item do contrato>
```

| Vendeu | Pedir |
|---|---|
| **Site** | Logo no melhor arquivo que tiver · 6 a 15 fotos reais de trabalhos, da equipe e do lugar · lista de serviços e o principal · diferenciais · cidades e bairros atendidos · horário · WhatsApp que recebe os pedidos · autorização de quem aparece nas fotos |
| **Domínio** | Nome desejado, conferido no Registro.br · CNPJ ou CPF do titular. O domínio fica no nome do cliente; quem registra e aponta para o site é combinado |
| **Página de links** | Os links que entram e o @ do Instagram |
| **Perfil no Google** | Convite de gerente no Perfil da Empresa |
| **Carrosséis e redes** | Acesso de parceiro ou colaborador na conta, ou combinar que ele publica · temas e ofertas do mês · quem aprova |
| **Avaliações** | Convite de gerente no Perfil da Empresa |
| **Anúncios** | Acesso de anunciante, verba e quem paga a plataforma |

### Passo 2 — Pedir tudo de uma vez

Escrever uma mensagem só, no tom do usuário, curta e em lista, dizendo por que precisa e em que ordem. Se o cliente tiver pouca foto, ensinar: celular na horizontal, de dia, com o serviço pronto ou antes e depois. O envio é aprovado pelo usuário.

**Acesso nunca é senha por WhatsApp.** O cliente convida pelo próprio painel (gerente no Google, parceiro na Meta). Isso protege os dois lados e cumpre o contrato, que proíbe trocar senhas. Se ele insistir em mandar senha, orientar a fazer o convite e, se for mesmo o único jeito, a trocar a senha depois.

### Passo 3 — Acompanhar

A cada novidade ("mandou as fotos", "deu o acesso"), mover o item, conferir se a foto presta (tamanho, foco, direito de uso) e dizer o que ainda falta.

- **Fechou a lista:** anotar a data em "Material completo em", calcular "Entrega até" e registrar. **O prazo do contrato conta a partir daqui**, e por isso a data precisa ficar escrita.
- **Parado há mais de 3 dias úteis:** propor um lembrete curto, com aprovação do usuário. Se o bloqueio for foto ruim, oferecer alternativa em vez de esperar (`/foto-produto`, ou seguir com o que tem, rotulando o que for ilustrativo).

### Passo 4 — Entregar

Quando tudo estiver pronto:

1. `/checar-site` e aprovação do cliente por escrito (cada entrega tem até 2 rodadas de ajustes)
2. `/publicar-site`: sem faixa de demonstração e indexável
3. Trocar o link do Google e a bio
4. Marcar os itens de "Entrega". **Completou? A parcela "na entrega" vence:** avisar `/cobrancas`, e o mensal passa a contar pelo contrato
5. Atualizar funil e ESTADO, e sugerir pedir um depoimento agora, que é quando o cliente está mais contente

## Regras

- **Um pedido só.** Reunir o que falta em vez de mandar uma mensagem por item.
- **Não inventar material.** Foto gerada por IA nunca passa por foto do cliente, e texto com dado que ele não confirmou fica de fora.
- **Direito de imagem:** foto com cliente ou funcionário aparecendo só com autorização, registrada aqui.
- **Sem cobrança dura.** O atraso do material é só uma data que muda; lembrar a regra do prazo com leveza.
