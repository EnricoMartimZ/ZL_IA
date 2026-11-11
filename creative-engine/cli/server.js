// Servidor do editor: o servidor de desenvolvimento do Vite com a API local por cima (ADR-012).
// Não há etapa de build do editor: o Vite serve o código direto.
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { createApi } from './api.js';
import { projectDir } from '../storage/index.js';

const ENGINE_DIR = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');

/**
 * @param {{ dir: string, port?: number }} opcoes
 * @returns {Promise<{ url: string, dir: string, close: () => Promise<void> }>}
 */
export async function startEditor({ dir, port = 5177 }) {
  const pasta = projectDir(dir);
  const api = createApi({ dir: pasta });
  const { createServer } = await import('vite');
  const { default: react } = await import('@vitejs/plugin-react');
  const servidor = await createServer({
    configFile: false,
    root: path.join(ENGINE_DIR, 'editor'),
    logLevel: 'warn',
    clearScreen: false,
    plugins: [
      react(),
      { name: 'mazy-api', configureServer(s) { s.middlewares.use((req, res, next) => api.handle(req, res, next)); } },
    ],
    server: { host: '127.0.0.1', port, strictPort: false, fs: { allow: [ENGINE_DIR] } },
    // o editor importa o Core e o palco de fora da pasta dele
    optimizeDeps: { include: ['react', 'react-dom', 'react-dom/client', 'ajv/dist/2020.js'] },
  });
  await servidor.listen();
  const endereco = servidor.httpServer.address();
  return {
    url: `http://127.0.0.1:${endereco.port}/`,
    dir: pasta,
    async close() { api.close(); await servidor.close(); },
  };
}
