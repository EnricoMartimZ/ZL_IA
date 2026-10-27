// Gera uma foto via OpenAI Images API e salva em PNG.
//
// Uso:
//   node --env-file=.env scripts/gerar-imagem.js "PROMPT EM INGLÊS" <saida.png> [--size 1024x1536]
//
// Tamanhos: 1024x1536 (retrato, padrão — bom pro 4:5), 1024x1024, 1536x1024
// Modelo: OPENAI_IMAGE_MODEL no .env (padrão gpt-image-1)

import { writeFile, mkdir } from 'node:fs/promises';
import path from 'node:path';

const argv = process.argv.slice(2);
let size = '1024x1536';
const resto = [];
for (let i = 0; i < argv.length; i++) {
  if (argv[i] === '--size') size = argv[++i];
  else resto.push(argv[i]);
}
const [prompt, saida] = resto;

if (!prompt || !saida) {
  console.error('uso: node --env-file=.env scripts/gerar-imagem.js "PROMPT" <saida.png> [--size 1024x1536]');
  process.exit(1);
}
if (!process.env.OPENAI_API_KEY) {
  console.error('erro: OPENAI_API_KEY não está no .env (copie o .env.example e preencha)');
  process.exit(1);
}

const resp = await fetch('https://api.openai.com/v1/images/generations', {
  method: 'POST',
  headers: {
    Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    model: process.env.OPENAI_IMAGE_MODEL || 'gpt-image-1',
    prompt,
    size,
    n: 1,
  }),
});

const corpo = await resp.json();
if (!resp.ok) {
  console.error(`erro da OpenAI (${resp.status}): ${corpo.error?.message || JSON.stringify(corpo)}`);
  process.exit(1);
}

const imagem = corpo.data?.[0];
let bytes;
if (imagem?.b64_json) {
  bytes = Buffer.from(imagem.b64_json, 'base64');
} else if (imagem?.url) {
  bytes = Buffer.from(await (await fetch(imagem.url)).arrayBuffer());
} else {
  console.error('erro: resposta da OpenAI sem imagem');
  process.exit(1);
}

await mkdir(path.dirname(path.resolve(saida)), { recursive: true });
await writeFile(saida, bytes);
console.log(`imagem: ${saida}`);
