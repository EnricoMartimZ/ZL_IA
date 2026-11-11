// Conversa do editor com o servidor local.
async function pedir(metodo, caminho, corpo, cabecalhos) {
  const r = await fetch(caminho, { method: metodo, body: corpo, headers: cabecalhos });
  const dados = await r.json().catch(() => ({}));
  if (!r.ok) throw Object.assign(new Error(dados.message ?? `erro ${r.status}`), { status: r.status, ...dados });
  return dados;
}
const comJson = (metodo, caminho, corpo) => pedir(metodo, caminho, JSON.stringify(corpo ?? {}), { 'content-type': 'application/json' });

export const api = {
  open: () => pedir('GET', '/api/project'),
  save: (project, baseRevision) => comJson('PUT', '/api/project', { project, baseRevision }),
  upload: (arquivo, type) => pedir('POST', `/api/assets?name=${encodeURIComponent(arquivo.name)}${type ? `&type=${type}` : ''}`, arquivo, { 'content-type': 'application/octet-stream' }),
  history: () => pedir('GET', '/api/history'),
  checkpoint: (label) => comJson('POST', '/api/history/checkpoint', { label }),
  version: (label) => comJson('POST', '/api/history/version', { label }),
  rollback: (id) => comJson('POST', '/api/history/rollback', { id }),
  critique: () => pedir('GET', '/api/critique'),
  render: (range) => comJson('POST', '/api/render', range ? { range } : {}),
  /** Avisos do servidor: o disco mudou, a exportação andou. Devolve a função que desliga. */
  events(ouvintes) {
    const fonte = new EventSource('/api/events');
    for (const [evento, f] of Object.entries(ouvintes)) fonte.addEventListener(evento, (e) => f(JSON.parse(e.data)));
    return () => fonte.close();
  },
};

export const ASSET_BASE = '/project-files/';
