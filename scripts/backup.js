// Backup do que NÃO vai pro GitHub: vendas/, clientes/, _memoria/ e o .env. Junta tudo num arquivo só,
// criptografado com senha (AES-256 pelo gpg), pra guardar num HD externo ou numa nuvem sem expor cliente.
//
// node --env-file=.env scripts/backup.js                         cria o backup e confere se abre
// node --env-file=.env scripts/backup.js --restaurar <arquivo> <pasta vazia>
//
// No .env: BACKUP_SENHA (obrigatória) e BACKUP_DESTINO (pasta; padrão ~/backups/mazyos).
// A senha precisa estar guardada FORA deste computador: sem ela, o backup não abre nunca mais.
// Mantém os últimos BACKUP_MANTER (padrão 8) e apaga os mais antigos.

import { spawn, spawnSync } from 'node:child_process';
import { existsSync, mkdirSync, readdirSync, statSync, unlinkSync, createWriteStream, createReadStream } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { homedir } from 'node:os';
import path from 'node:path';

const raiz = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const PASTAS = (process.env.BACKUP_PASTAS || 'vendas,clientes,_memoria,.env').split(',');
const FORA = ['node_modules', '.vercel', '.wrangler', '.next', 'dist'];

function morrer(msg) { console.error(`✗ ${msg}`); process.exit(1); }

const senha = process.env.BACKUP_SENHA;
if (!senha) morrer('Falta BACKUP_SENHA no .env.');
for (const prog of ['gpg', 'tar']) if (spawnSync(prog, ['--version']).status !== 0) morrer(`Falta o programa ${prog}.`);

// a senha entra pelo descritor 3, nunca pela linha de comando (ela apareceria na lista de processos)
const GPG = ['--batch', '--yes', '--quiet', '--pinentry-mode', 'loopback', '--passphrase-fd', '3'];

function comSenha(args, stdio) {
  const p = spawn('gpg', [...GPG, ...args], { stdio: [...stdio, 'pipe'] });
  p.stdio[3].end(`${senha}\n`);
  return p;
}
const terminou = (p, nome) => new Promise((ok, erro) => p.on('close', (c) => (c === 0 ? ok() : erro(new Error(`${nome} falhou (código ${c})`)))));

async function criar() {
  const destino = process.env.BACKUP_DESTINO || path.join(homedir(), 'backups', 'mazyos');
  mkdirSync(destino, { recursive: true });
  const existem = PASTAS.filter((p) => existsSync(path.join(raiz, p)));
  if (!existem.length) morrer('Nenhuma pasta pra guardar.');
  const carimbo = new Date().toISOString().slice(0, 16).replace('T', '-').replace(':', '');
  const arquivo = path.join(destino, `mazyos-${carimbo}.tar.gz.gpg`);

  const tar = spawn('tar', ['-czf', '-', ...FORA.map((f) => `--exclude=${f}`), '-C', raiz, ...existem], { stdio: ['ignore', 'pipe', 'inherit'] });
  const gpg = comSenha(['--symmetric', '--cipher-algo', 'AES256', '--compress-algo', 'none'], ['pipe', 'pipe', 'inherit']);
  tar.stdout.pipe(gpg.stdin);
  gpg.stdout.pipe(createWriteStream(arquivo));
  await Promise.all([terminou(tar, 'tar'), terminou(gpg, 'gpg')]);

  // backup que nunca foi aberto não é backup: abre agora e conta os arquivos
  const abre = comSenha(['--decrypt'], ['pipe', 'pipe', 'inherit']);
  createReadStream(arquivo).pipe(abre.stdin);
  const lista = spawn('tar', ['-tzf', '-'], { stdio: ['pipe', 'pipe', 'inherit'] });
  abre.stdout.pipe(lista.stdin);
  let qtd = 0;
  lista.stdout.on('data', (d) => { qtd += d.toString().split('\n').length - 1; });
  await Promise.all([terminou(abre, 'conferência'), terminou(lista, 'conferência')]);

  const manter = Number(process.env.BACKUP_MANTER) || 8;
  const antigos = readdirSync(destino).filter((f) => /^mazyos-.*\.gpg$/.test(f)).sort().reverse().slice(manter);
  antigos.forEach((f) => unlinkSync(path.join(destino, f)));

  const mb = (statSync(arquivo).size / 1048576).toFixed(1);
  console.log(`✓ Backup: ${arquivo} (${mb} MB, ${qtd} itens, conferido)`);
  if (destino.startsWith(homedir())) console.log('! Está no mesmo disco deste computador: copie pro HD externo ou pra nuvem, ou aponte BACKUP_DESTINO pra lá.');
}

async function restaurar(arquivo, pasta) {
  if (!arquivo || !pasta) morrer('Uso: --restaurar <arquivo.gpg> <pasta vazia>');
  mkdirSync(pasta, { recursive: true });
  if (readdirSync(pasta).length) morrer(`A pasta ${pasta} não está vazia: nada foi alterado.`);
  const abre = comSenha(['--decrypt'], ['pipe', 'pipe', 'inherit']);
  createReadStream(arquivo).pipe(abre.stdin);
  const tar = spawn('tar', ['-xzf', '-', '-C', pasta], { stdio: ['pipe', 'inherit', 'inherit'] });
  abre.stdout.pipe(tar.stdin);
  await Promise.all([terminou(abre, 'gpg'), terminou(tar, 'tar')]);
  console.log(`✓ Restaurado em ${pasta}`);
}

const i = process.argv.indexOf('--restaurar');
(i > 0 ? restaurar(process.argv[i + 1], process.argv[i + 2]) : criar())
  .catch((e) => morrer(i > 0 ? 'Não abriu: senha errada ou arquivo corrompido.' : e.message));
