---
name: vigia
description: >
  Confere de uma vez se os sites dos clientes estão no ar, quando o certificado e o domínio vencem e quais demos
  passaram da data de sair do ar, e diz o que fazer. Use sempre que o usuário perguntar "os sites estão no
  ar?", "o site do cliente caiu", "algum domínio vencendo?", "quais demos eu tiro do ar?", ou /vigia, e na
  rotina semanal.
---

# /vigia — Nada cai sem ninguém ver

O pior jeito de descobrir que o site do cliente caiu é pelo cliente. Essa conferência leva segundos e só lê: não muda nada.

## Dependências

- **Lista:** `clientes/_sites.json` (local; formato no topo de `scripts/vigia.js`)
- **Script:** `scripts/vigia.js`

## Workflow

1. Rodar `node scripts/vigia.js`
2. Responder só com o que precisa de ação, nesta ordem:
   - **Cliente fora do ar:** abrir o site, ver se é o site ou a hospedagem, e corrigir hoje
   - **Domínio vencendo em até 30 dias:** ver no contrato quem paga e avisar o responsável. Domínio vencido derruba o site e o e-mail
   - **Certificado vencendo em até 14 dias:** normalmente renova sozinho; se não renovar, é problema na hospedagem
   - **Demo na data de sair:** se a loja não fechou, propor a remoção. Demo de quem fechou sai quando o site final estiver no ar
3. Se estiver tudo certo, responder em uma linha

Remover demo ou mudar hospedagem é ação fora daqui: mostrar o comando e só rodar com o ok do usuário. Avisar cliente sobre problema também passa pelo usuário.

## Manter a lista em dia

Toda publicação entra na lista (`/publicar-site`, `/site-demo`), com `dominio` quando houver e `remover_ate` nas demos. Lojas que saíram ficam de fora: o vigia só cobre o que ainda é responsabilidade do usuário.
