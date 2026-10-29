// Rodar de dentro da pasta do lote: node ../../../.claude/skills/abordagem-whatsapp/marcar.cjs <indice> <status> [nota]
// Atualiza o fila.json (status, horário, observação) e, quando "enviada", põe a loja no vendas/funil.md como abordada.
const fs = require('fs'); const f = JSON.parse(fs.readFileSync('fila.json', 'utf8'));
const [i, status, ...nota] = process.argv.slice(2); const it = f.itens[+i];
it.status = status; it.enviado_em = status === 'enviada' ? new Date().toISOString() : it.enviado_em; if (nota.length) it.nota_envio = nota.join(' ');
fs.writeFileSync('fila.json', JSON.stringify(f, null, 2) + '\n');
if (status === 'enviada') {
  const fp = '../../funil.md'; let t = fs.readFileSync(fp, 'utf8');
  const hoje = new Date().toISOString().slice(0, 10); const d2 = new Date(Date.now() + 2 * 864e5).toISOString().slice(0, 10);
  // cidade e data do lote: fila.json (campo "cidade") e nome da pasta (AAAA-MM-DD-lote-...); "|" quebraria a tabela
  const cidade = f.cidade || 'Campinas'; const [, mes, dia] = (process.cwd().match(/(\d{4})-(\d{2})-(\d{2})-lote/) || []).slice(1);
  const loja = it.loja.replace(/\|/g, '-');
  const linha = `| ${loja} | ${it.nicho} | ${cidade} | abordada | — | ${hoje} | ver se respondeu (WhatsApp +${it.whatsapp}) | ${d2} | lote ${dia ? dia + '/' + mes : hoje}: ${it.pontos_fracos[0]}${it.nota_envio ? '; ' + it.nota_envio : ''} |`;
  if (!t.includes(`| ${loja} |`)) fs.writeFileSync(fp, t.trimEnd() + '\n' + linha + '\n');
}
console.log(i, it.loja, '→', status);
