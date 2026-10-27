// Rodar de dentro da pasta do lote: node ../../../.claude/skills/abordagem-whatsapp/marcar.cjs <indice> <status> [nota]
// Atualiza o fila.json (status, horário, observação) e, quando "enviada", põe a loja no vendas/funil.md como abordada.
const fs = require('fs'); const f = JSON.parse(fs.readFileSync('fila.json', 'utf8'));
const [i, status, ...nota] = process.argv.slice(2); const it = f.itens[+i];
it.status = status; it.enviado_em = status === 'enviada' ? new Date().toISOString() : it.enviado_em; if (nota.length) it.nota_envio = nota.join(' ');
fs.writeFileSync('fila.json', JSON.stringify(f, null, 2) + '\n');
if (status === 'enviada') {
  const fp = '../../funil.md'; let t = fs.readFileSync(fp, 'utf8');
  const hoje = new Date().toISOString().slice(0, 10); const d2 = new Date(Date.now() + 2 * 864e5).toISOString().slice(0, 10);
  const linha = `| ${it.loja} | ${it.nicho} | Campinas | abordada | — | ${hoje} | ver se respondeu (WhatsApp +${it.whatsapp}) | ${d2} | lote 27/10: ${it.pontos_fracos[0]}${it.nota_envio ? '; ' + it.nota_envio : ''} |`;
  if (!t.includes(`| ${it.loja} |`)) fs.writeFileSync(fp, t.trimEnd() + '\n' + linha + '\n');
}
console.log(i, it.loja, '→', status);
