// Trava de sigilo: impede que dado de cliente entre no GitHub. Roda sozinha antes de cada commit
// (.githooks/pre-commit) e olha só o que está entrando no commit.
//
// Bloqueia:
//   - arquivo das pastas locais (vendas/, clientes/, _memoria/, projetos/, .env...)
//   - nome de cliente ou prospect: vem de vendas/funil.md, das pastas de clientes/ e, pros nomes curtos
//     que a tabela não traz, de _memoria/nomes-proibidos.txt (um por linha)
//   - CPF ou CNPJ escritos, além dos dados de _memoria/empresa.md ("Dados do contratado")
//
// node scripts/checar-clientes.js            confere o que está preparado pro commit
// node scripts/checar-clientes.js --tudo     confere o repositório inteiro (pra revisar de vez em quando)
//
// Nome genérico demais que dê falso alarme vai em _memoria/nomes-liberados.txt.
// Sai com código 1 quando acha algo. Essas listas são locais: num clone novo a trava só olha pastas e CPF/CNPJ.

import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const raiz = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const git = (...a) => execFileSync('git', a, { cwd: raiz, encoding: 'utf8', maxBuffer: 1 << 27 });
const normalizar = (t) => t.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[-_]+/g, ' ');
const ler = (f) => (existsSync(path.join(raiz, f)) ? readFileSync(path.join(raiz, f), 'utf8') : '');
const linhas = (f) => ler(f).split('\n').map((l) => l.trim()).filter((l) => l && !l.startsWith('#'));

const PASTAS = /^(vendas|clientes|_memoria|projetos|\.env(\.|$))/;
const PERMITIDOS = /(^|\/)(\.gitkeep|\.env\.example)$/;
const DOCUMENTO = /\b\d{3}\.\d{3}\.\d{3}-\d{2}\b|\b\d{2}\.\d{3}\.\d{3}\/\d{4}-\d{2}\b/g;
const CABECALHO = /^(loja|nome|empresa|cliente)$/;

export function nomesProibidos() {
  const nomes = new Set(linhas('_memoria/nomes-proibidos.txt').map(normalizar));
  for (const l of ler('vendas/funil.md').split('\n')) {
    if (!l.startsWith('|')) continue;
    const nome = normalizar(l.split('|')[1] || '').trim();
    if (nome.length > 3 && !/^[-: ]+$/.test(nome) && !CABECALHO.test(nome)) nomes.add(nome);
  }
  if (existsSync(path.join(raiz, 'clientes'))) {
    for (const d of readdirSync(path.join(raiz, 'clientes'), { withFileTypes: true })) {
      if (d.isDirectory() && !d.name.startsWith('_')) nomes.add(normalizar(d.name));
    }
  }
  const dados = ler('_memoria/empresa.md').split('## Dados do contratado')[1] || '';
  for (const m of dados.matchAll(/\*\*(?:CPF ou CNPJ|Endereço):\*\* *(.+)/g)) {
    nomes.add(normalizar(m[1].split(',')[0].trim()));
  }
  for (const liberado of linhas('_memoria/nomes-liberados.txt')) nomes.delete(normalizar(liberado));
  nomes.delete('');
  return [...nomes];
}

const achaNome = (texto, nome) => {
  const seguro = nome.replace(/[.*+?^${}()|[\]\\]/g, '\\$&').replace(/ +/g, ' +');
  return new RegExp(`(^|[^a-z0-9])${seguro}($|[^a-z0-9])`).test(texto);
};

// devolve [{ arquivo, texto }] só com o que está entrando no commit
function preparado() {
  const saida = git('diff', '--cached', '-U0', '--no-color');
  const partes = [];
  let arquivo = null;
  for (const l of saida.split('\n')) {
    if (l.startsWith('+++ ')) { arquivo = l.slice(4).replace(/^b\//, ''); continue; }
    if (arquivo && l.startsWith('+') && !l.startsWith('+++')) partes.push({ arquivo, texto: l.slice(1) });
  }
  return partes;
}

function tudo() {
  const partes = [];
  for (const arquivo of git('ls-files').split('\n').filter(Boolean)) {
    if (/\.(png|jpe?g|webp|gif|ico|pdf|woff2?|glb|mp4|bundle)$|package-lock\.json$/.test(arquivo)) continue;
    ler(arquivo).split('\n').forEach((texto) => partes.push({ arquivo, texto }));
  }
  return partes;
}

function principal() {
  const inteiro = process.argv.includes('--tudo');
  const problemas = [];
  const arquivos = inteiro
    ? git('ls-files').split('\n').filter(Boolean)
    : git('diff', '--cached', '--name-only', '--diff-filter=ACMR').split('\n').filter(Boolean);
  for (const f of arquivos) if (PASTAS.test(f) && !PERMITIDOS.test(f)) problemas.push(`${f}: pasta local, não pode ir pro GitHub`);

  const nomes = nomesProibidos();
  const vistos = new Set();
  for (const { arquivo, texto } of inteiro ? tudo() : preparado()) {
    if (arquivo === 'scripts/checar-clientes.js') continue;
    const t = normalizar(texto);
    for (const nome of nomes) {
      if (achaNome(t, nome) && !vistos.has(`${arquivo}|${nome}`)) {
        vistos.add(`${arquivo}|${nome}`);
        problemas.push(`${arquivo}: "${nome}"`);
      }
    }
    for (const doc of texto.match(DOCUMENTO) || []) {
      if (!/^(000\.000\.000|00\.000\.000)/.test(doc)) problemas.push(`${arquivo}: CPF ou CNPJ escrito (${doc.slice(0, 6)}...)`);
    }
  }

  if (problemas.length) {
    console.error('✗ Dado de cliente no que vai pro GitHub (regra do CLAUDE.md):');
    problemas.forEach((p) => console.error(`  - ${p}`));
    console.error('Troque por termo genérico (<loja>, "a ótica") ou tire do commit. Falso alarme: _memoria/nomes-liberados.txt.');
    process.exitCode = 1;
    return;
  }
  console.log(`✓ Sem dado de cliente (${nomes.length} nomes conferidos${inteiro ? ', repositório inteiro' : ''}).`);
}

if (process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1])) principal();
