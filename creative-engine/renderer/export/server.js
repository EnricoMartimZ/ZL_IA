// Servidor local da exportação: entrega a página do palco, o código do motor que ela importa e
// os arquivos de UMA pasta de projeto. Só escuta em 127.0.0.1 e recusa caminho fora das pastas.
import { createServer } from 'node:http';
import { createReadStream, existsSync, statSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

export const ENGINE_DIR = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', '..');

const TIPOS = {
  '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.json': 'application/json; charset=utf-8',
  '.css': 'text/css; charset=utf-8', '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg',
  '.webp': 'image/webp', '.gif': 'image/gif', '.avif': 'image/avif', '.woff': 'font/woff', '.woff2': 'font/woff2', '.ttf': 'font/ttf', '.otf': 'font/otf',
};

/** Resolve um caminho pedido dentro de uma pasta base. Devolve null se ele tentar sair dela. */
export function dentroDe(base, pedido) {
  let relativo;
  try { relativo = decodeURIComponent(pedido); } catch { return null; }
  if (relativo.includes('\0')) return null;
  const alvo = path.resolve(base, `.${path.sep}${relativo}`);
  return alvo === base || alvo.startsWith(base + path.sep) ? alvo : null;
}

export function enviarArquivo(res, arquivo) {
  if (!arquivo || !existsSync(arquivo) || !statSync(arquivo).isFile()) {
    res.writeHead(404, { 'content-type': 'text/plain; charset=utf-8' }).end('não encontrado');
    return;
  }
  res.writeHead(200, { 'content-type': TIPOS[path.extname(arquivo).toLowerCase()] ?? 'application/octet-stream', 'cache-control': 'no-store' });
  createReadStream(arquivo).pipe(res);
}

// Do motor, o navegador só precisa do palco e do Core.
const PASTAS_DO_MOTOR = ['core/src/', 'renderer/stage/'];

/**
 * @param {{ projectDir: string, project: any }} opcoes
 * @returns {Promise<{ url: string, close: () => Promise<void> }>}
 */
export function startStageServer({ projectDir, project }) {
  const base = path.resolve(projectDir);
  const servidor = createServer((req, res) => {
    const { pathname } = new URL(req.url, 'http://127.0.0.1');
    if (req.method !== 'GET') { res.writeHead(405).end(); return; }
    if (pathname === '/' || pathname === '/stage.html') return enviarArquivo(res, path.join(ENGINE_DIR, 'renderer', 'stage', 'stage.html'));
    if (pathname === '/project.json') {
      res.writeHead(200, { 'content-type': TIPOS['.json'], 'cache-control': 'no-store' }).end(JSON.stringify(project));
      return undefined;
    }
    if (pathname.startsWith('/engine/')) {
      const resto = pathname.slice('/engine/'.length);
      return enviarArquivo(res, PASTAS_DO_MOTOR.some((p) => resto.startsWith(p)) ? dentroDe(ENGINE_DIR, resto) : null);
    }
    if (pathname.startsWith('/project/')) return enviarArquivo(res, dentroDe(base, pathname.slice('/project/'.length)));
    return enviarArquivo(res, null);
  });
  return new Promise((resolve, reject) => {
    servidor.once('error', reject);
    servidor.listen(0, '127.0.0.1', () => {
      const { port } = servidor.address();
      resolve({ url: `http://127.0.0.1:${port}`, close: () => new Promise((ok) => { servidor.closeAllConnections?.(); servidor.close(() => ok()); }) });
    });
  });
}
