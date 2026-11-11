// Project Validation: forma (JSON Schema) e, se a forma estiver certa, as regras que cruzam campos.
import { validateSchema } from './schema.js';
import { validateSemantics } from './semantic.js';

/** @typedef {import('../types.js').ValidationResult} ValidationResult */

/**
 * Valida um projeto. Erro impede gravar e renderizar; aviso não.
 * @param {unknown} project
 * @returns {ValidationResult}
 */
export function validateProject(project) {
  const forma = validateSchema(project);
  if (forma.length) return { valid: false, errors: forma, warnings: [] };
  const { errors, warnings } = validateSemantics(project);
  return { valid: errors.length === 0, errors, warnings };
}
