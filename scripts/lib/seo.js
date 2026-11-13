// Peças comuns da /seo-site: texto normalizado, robots.txt e a lista de robôs de IA.

export const normalizar = (t) => String(t || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')
  .replace(/[^a-z0-9]+/g, ' ').trim();
export const palavras = (t) => normalizar(t).split(' ').filter(Boolean);

const VAZIAS = new Set(['a', 'o', 'as', 'os', 'e', 'de', 'do', 'da', 'dos', 'das', 'em', 'no', 'na', 'nos', 'nas',
  'para', 'pra', 'pro', 'por', 'com', 'um', 'uma', 'que']);
// palavras que carregam o sentido de uma busca ("ótica em campinas" → otica, campinas)
export const termos = (frase) => palavras(frase).filter((p) => !VAZIAS.has(p));
// todas as palavras da busca aparecem no texto, em qualquer ordem (variação natural conta, repetição exata não é exigida)
export const contemBusca = (texto, frase) => {
  const t = ` ${normalizar(texto)} `;
  return termos(frase).every((p) => t.includes(` ${p}`));
};

// Robôs de IA que se identificam no robots.txt. "busca" e "usuario" são os que levam o site
// pra dentro de uma resposta; "treino" só coleta texto pra treinar modelo.
export const ROBOS_IA = [
  { nome: 'OAI-SearchBot', de: 'ChatGPT (busca)', papel: 'busca' },
  { nome: 'ChatGPT-User', de: 'ChatGPT (abre a página a pedido do usuário)', papel: 'usuario' },
  { nome: 'GPTBot', de: 'OpenAI (treino)', papel: 'treino' },
  { nome: 'Claude-SearchBot', de: 'Claude (busca)', papel: 'busca' },
  { nome: 'Claude-User', de: 'Claude (abre a página a pedido do usuário)', papel: 'usuario' },
  { nome: 'ClaudeBot', de: 'Anthropic (treino)', papel: 'treino' },
  { nome: 'PerplexityBot', de: 'Perplexity (busca)', papel: 'busca' },
  { nome: 'Perplexity-User', de: 'Perplexity (abre a página a pedido do usuário)', papel: 'usuario' },
  { nome: 'Bingbot', de: 'Bing, que também alimenta o Copilot', papel: 'busca' },
  { nome: 'Google-Extended', de: 'Gemini (treino e uso fora da busca; não muda o Google)', papel: 'treino' },
  { nome: 'Applebot-Extended', de: 'Apple (treino)', papel: 'treino' },
  { nome: 'meta-externalagent', de: 'Meta (treino)', papel: 'treino' },
  { nome: 'CCBot', de: 'Common Crawl (base usada em treino)', papel: 'treino' },
  { nome: 'Bytespider', de: 'ByteDance (treino)', papel: 'treino' },
];

// robots.txt → grupos [{ agentes: [...], regras: [{ permite, caminho }] }] e as linhas Sitemap
export function lerRobots(texto) {
  const grupos = [];
  const sitemaps = [];
  let atual = null;
  let ultimaFoiAgente = false;
  for (const bruta of String(texto || '').split(/\r?\n/)) {
    const linha = bruta.replace(/#.*/, '').trim();
    const m = linha.match(/^([A-Za-z-]+)\s*:\s*(.*)$/);
    if (!m) continue;
    const campo = m[1].toLowerCase();
    const valor = m[2].trim();
    if (campo === 'user-agent') {
      if (!ultimaFoiAgente) { atual = { agentes: [], regras: [] }; grupos.push(atual); }
      atual.agentes.push(valor.toLowerCase());
      ultimaFoiAgente = true;
      continue;
    }
    ultimaFoiAgente = false;
    if (campo === 'sitemap') sitemaps.push(valor);
    else if ((campo === 'allow' || campo === 'disallow') && atual) atual.regras.push({ permite: campo === 'allow', caminho: valor });
  }
  return { grupos, sitemaps };
}

// O robô pode ler o caminho? Devolve { permitido, grupo: 'próprio' | '*' | 'nenhum' }
export function roboPode(robots, agente, caminho = '/') {
  const a = agente.toLowerCase();
  let grupo = robots.grupos.filter((g) => g.agentes.includes(a));
  let qual = 'próprio';
  if (!grupo.length) { grupo = robots.grupos.filter((g) => g.agentes.includes('*')); qual = '*'; }
  if (!grupo.length) return { permitido: true, grupo: 'nenhum' };
  let melhor = null;
  for (const r of grupo.flatMap((g) => g.regras)) {
    if (!r.caminho) continue; // "Disallow:" vazio libera tudo
    const padrao = new RegExp('^' + r.caminho.replace(/[.+?^${}()|[\]\\]/g, '\\$&').replace(/\*/g, '.*').replace(/\\\$$/, '$'));
    if (!padrao.test(caminho)) continue;
    if (!melhor || r.caminho.length > melhor.caminho.length || (r.caminho.length === melhor.caminho.length && r.permite)) melhor = r;
  }
  return { permitido: melhor ? melhor.permite : true, grupo: qual };
}
