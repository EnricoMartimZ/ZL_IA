// Aplica alterações pequenas num projeto de exemplo, pra gerar casos de teste sem copiar o arquivo inteiro.
// Cada alteração é { op: 'set' | 'remove', path: '/scenes/0/layers/2/text', value }.
// O caminho é um JSON Pointer simples (sem ~0 e ~1). Devolve uma cópia: o original não muda.

const partes = (caminho) => {
  if (!caminho.startsWith('/')) throw new Error(`caminho tem que começar com "/": ${caminho}`);
  return caminho.slice(1).split('/').map((p) => (/^\d+$/.test(p) ? Number(p) : p));
};

export function applyPatch(doc, ops) {
  const copia = structuredClone(doc);
  for (const { op, path, value } of ops) {
    const chaves = partes(path);
    const ultima = chaves.pop();
    let alvo = copia;
    for (const chave of chaves) {
      if (alvo === null || typeof alvo !== 'object' || !(chave in alvo)) throw new Error(`caminho não existe: ${path}`);
      alvo = alvo[chave];
    }
    if (op === 'set') alvo[ultima] = structuredClone(value);
    else if (op === 'remove') {
      if (!(ultima in alvo)) throw new Error(`nada pra remover em: ${path}`);
      if (Array.isArray(alvo)) alvo.splice(ultima, 1); else delete alvo[ultima];
    } else throw new Error(`operação desconhecida: ${op}`);
  }
  return copia;
}
