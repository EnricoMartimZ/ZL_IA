#!/usr/bin/env node
// Porta de entrada da CLI. Este arquivo usa só sintaxe antiga de propósito: assim ele consegue
// rodar num Node velho o bastante para dar a mensagem certa em vez de um erro de sintaxe.
var partes = process.versions.node.split('.').map(Number);
var serve = (partes[0] === 20 && partes[1] >= 19) || (partes[0] === 22 && partes[1] >= 12) || partes[0] > 22;
if (!serve) {
  console.error('erro: o Creative Engine pede Node ^20.19 ou >=22.12, e este é o ' + process.versions.node + '.');
  console.error('Use o Node 22 do nvm (nvm use 22) e rode de novo.');
  process.exit(3);
} else {
  import('./main.js').then(function (m) { return m.main(process.argv.slice(2)); }).then(function (codigo) { process.exitCode = codigo; });
}
