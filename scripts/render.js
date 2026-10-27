// Renderiza um HTML do MazyOS em PNG (um arquivo por .slide) ou em PDF A4.
//
// Uso:
//   node scripts/render.js <arquivo.html> --png <pasta-saida> [--size 1080x1350]
//   node scripts/render.js <arquivo.html> --pdf <arquivo-saida.pdf>
//
// Precisa do Playwright instalado na raiz do projeto: npm run setup

import { chromium } from 'playwright';
import { mkdir } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

function lerArgs(argv) {
  const args = { size: '1080x1350' };
  const resto = [];
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--png') args.png = argv[++i];
    else if (a === '--pdf') args.pdf = argv[++i];
    else if (a === '--size') args.size = argv[++i];
    else resto.push(a);
  }
  args.html = resto[0];
  return args;
}

function sair(msg) {
  console.error(`erro: ${msg}`);
  console.error('uso: node scripts/render.js <arquivo.html> (--png <pasta> [--size LxA] | --pdf <saida.pdf>)');
  process.exit(1);
}

const args = lerArgs(process.argv.slice(2));
if (!args.html) sair('faltou o arquivo HTML');
if (!existsSync(args.html)) sair(`arquivo não encontrado: ${args.html}`);
if (!args.png === !args.pdf) sair('escolha --png ou --pdf (um dos dois)');

const [largura, altura] = args.size.split('x').map(Number);
if (!largura || !altura) sair(`--size inválido: ${args.size} (ex: 1080x1350)`);

const browser = await chromium.launch();
try {
  const page = await browser.newPage({ viewport: { width: largura, height: altura } });
  await page.goto(pathToFileURL(path.resolve(args.html)).href, { waitUntil: 'networkidle' });
  await page.evaluate(() => document.fonts.ready);

  if (args.pdf) {
    await mkdir(path.dirname(path.resolve(args.pdf)), { recursive: true });
    await page.pdf({ path: args.pdf, format: 'A4', printBackground: true, preferCSSPageSize: true });
    console.log(`PDF: ${args.pdf}`);
  } else {
    const slides = await page.$$('.slide');
    if (slides.length === 0) sair('nenhum elemento .slide no HTML');
    await mkdir(args.png, { recursive: true });
    for (let i = 0; i < slides.length; i++) {
      const saida = path.join(args.png, `slide-${String(i + 1).padStart(2, '0')}.png`);
      await slides[i].screenshot({ path: saida });
      console.log(`PNG: ${saida}`);
    }
  }
} finally {
  await browser.close();
}
