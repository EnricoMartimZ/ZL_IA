// Tipos do Core, em JSDoc. Este arquivo não tem código: só documenta formas de dado.

/**
 * Um problema encontrado na validação de um projeto.
 * @typedef {object} Problem
 * @property {string} code     Código estável, em maiúsculas (ex.: SCHEMA_UNKNOWN_FIELD).
 * @property {string} path     Onde está, em JSON Pointer (ex.: /scenes/0/layers/2/text). '' é a raiz.
 * @property {string} message  O que está errado, em português.
 * @property {string} [hint]   O que é aceito ali, ou como corrigir.
 */

/**
 * Resultado de validateProject. Erro impede gravar e renderizar; aviso não.
 * @typedef {object} ValidationResult
 * @property {boolean} valid
 * @property {Problem[]} errors
 * @property {Problem[]} warnings
 */

export {};
