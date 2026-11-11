// Primeira camada da validação: a forma do projeto, conferida pelo JSON Schema com o Ajv.
// Traduz os erros do Ajv em problemas com código, caminho e mensagem em português.
import Ajv2020 from 'ajv/dist/2020.js';
import schema from '../../schema/mazy-creative-project.schema.json' with { type: 'json' };

/** @typedef {import('../types.js').Problem} Problem */

// strict: o schema não pode ter palavra-chave desconhecida nem obrigatório sem definição.
// verbose: cada erro traz o trecho do schema que falhou, de onde sai a dica.
const ajv = new Ajv2020({ strict: true, allErrors: true, verbose: true });
const conferir = ajv.compile(schema);

const TIPOS = {
  object: 'objeto', array: 'lista', string: 'texto', number: 'número',
  integer: 'número inteiro', boolean: 'verdadeiro ou falso', null: 'nulo',
};
const LIMITES = {
  minimum: (p) => `Tem que ser no mínimo ${p.limit}.`,
  maximum: (p) => `Tem que ser no máximo ${p.limit}.`,
  exclusiveMinimum: (p) => `Tem que ser maior que ${p.limit}.`,
  exclusiveMaximum: (p) => `Tem que ser menor que ${p.limit}.`,
  multipleOf: (p) => `Tem que ser múltiplo de ${p.multipleOf}.`,
  minItems: (p) => `A lista precisa de pelo menos ${p.limit} item(ns).`,
  maxItems: (p) => `A lista aceita no máximo ${p.limit} item(ns).`,
  minLength: (p) => `O texto precisa de pelo menos ${p.limit} caractere(s).`,
  maxLength: (p) => `O texto aceita no máximo ${p.limit} caractere(s).`,
  uniqueItems: () => 'A lista tem item repetido.',
};
const UNIAO = new Set(['anyOf', 'oneOf']);

const mostrar = (valor) => {
  if (valor !== null && typeof valor === 'object') return Array.isArray(valor) ? 'uma lista' : 'um objeto';
  return JSON.stringify(valor) ?? 'nada';
};

// O Ajv devolve vários erros para uma falha só quando o schema tem alternativas (anyOf, oneOf) ou
// condição (if/then). Aqui sobra um problema por falha.
function enxugar(erros) {
  let lista = erros.filter((e) => e.keyword !== 'if'); // "não bateu com o then": o erro de dentro já diz qual
  for (const uniao of lista.filter((e) => UNIAO.has(e.keyword))) {
    const onde = uniao.instancePath;
    // Erro mais fundo quer dizer que o valor tentou ser uma das alternativas e errou num campo:
    // esse erro explica melhor que "nenhuma alternativa serviu".
    const maisFundo = lista.some((e) => e.instancePath.startsWith(`${onde}/`));
    lista = lista.filter((e) => e.instancePath !== onde || (!maisFundo && e === uniao));
  }
  const temErroEm = (caminho, menos) => lista.some((e) => e !== menos
    && (e.instancePath === caminho || e.instancePath.startsWith(`${caminho}/`)));
  return lista.filter((e) => {
    // Valor de tipo errado também está "fora da lista": o erro de tipo basta.
    if (e.keyword === 'enum' || e.keyword === 'const') {
      return !lista.some((o) => o.keyword === 'type' && o.instancePath === e.instancePath);
    }
    // Bloco com erro dentro (ex.: shape sem fill) deixa de contar como reconhecido e apareceria
    // também como "campo desconhecido". Ele é conhecido; o problema é o de dentro.
    if (e.keyword === 'unevaluatedProperties') {
      return !temErroEm(`${e.instancePath}/${e.params.unevaluatedProperty}`, e);
    }
    return true;
  });
}

/** @returns {Problem} */
function traduzir(e) {
  const dica = e.parentSchema?.description;
  const problema = (code, path, message, hint = dica) => (hint ? { code, path, message, hint } : { code, path, message });

  if (e.keyword === 'additionalProperties' || e.keyword === 'unevaluatedProperties') {
    const campo = e.params.additionalProperty ?? e.params.unevaluatedProperty;
    return problema('SCHEMA_UNKNOWN_FIELD', `${e.instancePath}/${campo}`, `Campo desconhecido: "${campo}".`,
      'O formato não aceita campo fora do schema: confira o nome ou remova.');
  }
  if (e.keyword === 'required') {
    return problema('SCHEMA_REQUIRED', `${e.instancePath}/${e.params.missingProperty}`,
      `Falta o campo obrigatório "${e.params.missingProperty}".`);
  }
  if (e.keyword === 'type') {
    const esperados = [e.params.type].flat().map((t) => TIPOS[t] ?? t).join(' ou ');
    return problema('SCHEMA_TYPE', e.instancePath, `Tipo errado: esperado ${esperados}, veio ${mostrar(e.data)}.`);
  }
  if (e.keyword === 'enum') {
    return problema('SCHEMA_ENUM', e.instancePath,
      `Valor ${mostrar(e.data)} fora da lista. Aceitos: ${e.params.allowedValues.join(', ')}.`);
  }
  if (e.keyword === 'const') {
    return problema('SCHEMA_ENUM', e.instancePath, `Valor ${mostrar(e.data)} não aceito: tem que ser ${mostrar(e.params.allowedValue)}.`);
  }
  if (e.keyword === 'pattern') {
    return problema('SCHEMA_PATTERN', e.instancePath, `Valor ${mostrar(e.data)} fora do padrão aceito.`,
      dica ?? `Padrão: ${e.params.pattern}`);
  }
  if (e.keyword in LIMITES) {
    return problema('SCHEMA_RANGE', e.instancePath, `${LIMITES[e.keyword](e.params)} Veio ${mostrar(e.data)}.`);
  }
  if (UNIAO.has(e.keyword)) {
    const composto = e.data !== null && typeof e.data === 'object';
    return problema('SCHEMA_NO_MATCH', e.instancePath,
      composto ? 'Nenhuma das formas aceitas aqui foi atendida.' : `Valor ${mostrar(e.data)} não aceito aqui.`);
  }
  return problema('SCHEMA_INVALID', e.instancePath, `Valor recusado pela regra "${e.keyword}" do schema.`);
}

/**
 * Confere a forma do projeto contra o JSON Schema. Não altera a entrada.
 * @param {unknown} project
 * @returns {Problem[]} lista vazia quando a forma está certa
 */
export function validateSchema(project) {
  if (conferir(project)) return [];
  const vistos = new Set();
  return enxugar(conferir.errors ?? [])
    .map(traduzir)
    .filter((p) => {
      const chave = `${p.code}|${p.path}|${p.message}`;
      return vistos.has(chave) ? false : (vistos.add(chave), true);
    })
    .sort((a, b) => a.path.localeCompare(b.path) || a.code.localeCompare(b.code));
}

export { schema };
