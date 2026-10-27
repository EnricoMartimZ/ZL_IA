// Hook UserPromptSubmit: compara a mensagem do usuário com .claude/gatilhos.json e sugere ao Claude
// as skills que bateram. O usuário não precisa lembrar o nome de nenhuma skill.
//
// Teste: echo '{"prompt":"acha metalúrgicas com site ruim"}' | node .claude/hooks/gatilhos.mjs
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const MAX_SUGESTOES = 3;
const MAX_TEXTO = 2000; // texto colado longo: só o começo decide

const normalizar = (t) => t.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/\s+/g, ' ').trim();

export function sugerir(prompt, mapa) {
  const texto = normalizar(prompt).slice(0, MAX_TEXTO);
  if (!texto || texto.startsWith('/')) return []; // já chamou a skill pelo nome
  return mapa.skills
    .map((s) => {
      const pontos = s.gatilhos.filter((g) =>
        (Array.isArray(g) ? g : [g]).every((parte) => new RegExp(parte).test(texto))).length;
      return { ...s, pontos };
    })
    .filter((s) => s.pontos > 0)
    .sort((a, b) => b.pontos - a.pontos)
    .slice(0, MAX_SUGESTOES);
}

function principal() {
  let entrada = '';
  try { entrada = readFileSync(0, 'utf8'); } catch { return; }
  let prompt = '';
  try { prompt = JSON.parse(entrada).prompt || ''; } catch { return; }

  const raiz = path.dirname(path.dirname(fileURLToPath(import.meta.url))); // .claude/
  const mapa = JSON.parse(readFileSync(path.join(raiz, 'gatilhos.json'), 'utf8'));
  const achadas = sugerir(prompt, mapa);
  if (!achadas.length) return;

  const lista = achadas.map((s) => `/${s.skill} (${s.quando})`).join('; ');
  console.log(JSON.stringify({
    systemMessage: `⚡ ${achadas.map((s) => '/' + s.skill).join(' · ')}`,
    hookSpecificOutput: {
      hookEventName: 'UserPromptSubmit',
      additionalContext: `Gatilho de skill do MazyOS: este pedido parece com ${lista}. `
        + 'Se for mesmo isso, invoque a skill mais adequada com a ferramenta Skill antes de responder e siga as instruções dela, '
        + 'sem pedir pro usuário digitar o comando. Se o pedido não for isso, ignore este aviso.',
    },
  }));
}

if (process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1])) principal();
