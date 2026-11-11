#!/usr/bin/env node
// Abre o editor numa cópia descartável do projeto de exemplo, para ver e testar sem mexer em nada.
// node creative-engine/cli/demo.js [--port 5177]
import { cpSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { startEditor } from './server.js';

const motor = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const destino = path.join(tmpdir(), 'mazy-editor-demo');
rmSync(destino, { recursive: true, force: true });
cpSync(path.join(motor, 'fixtures', 'projects', 'motion-ad-4-scenes'), destino, { recursive: true });
const i = process.argv.indexOf('--port');
const editor = await startEditor({ dir: destino, port: i > 0 ? Number(process.argv[i + 1]) : 5177 });
console.log(`Editor de demonstração em ${editor.url}\nCópia do exemplo em ${destino} (apagada e refeita a cada vez).`);
