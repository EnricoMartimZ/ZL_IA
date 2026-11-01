# Vigia semanal

Segunda, 8h30. Nome no app: `vigia-semanal`. Prompt:

Pasta de trabalho: a raiz do MazyOS. Fale em português, direto e curto. Esta rotina só lê e avisa: não mande mensagem, não remova nada e não mude arquivo de cliente sem o Enrico aprovar no chat.

1. Rode `node scripts/vigia.js` e siga a skill `.claude/skills/vigia/SKILL.md`.
2. Leia `vendas/cobrancas.md` e siga o painel da skill `.claude/skills/cobrancas/SKILL.md`: o que atrasou e o que vence nesta semana, com o lembrete pronto pra aprovar.
3. Se `BACKUP_SENHA` estiver no `.env`, rode `node --env-file=.env scripts/backup.js` e diga onde o arquivo ficou. Se não estiver, avise em uma linha que o backup segue sem configurar.
4. Rode `node scripts/checar-clientes.js --tudo` e avise se achar algo.

Termine com um resumo de até 5 linhas: só o que precisa de ação, ou "tudo certo".
