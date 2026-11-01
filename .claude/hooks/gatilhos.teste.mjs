// Teste dos gatilhos: cada frase tem que puxar a skill certa em 1º lugar (null = nenhuma).
// Rodar depois de mexer no .claude/gatilhos.json:  node .claude/hooks/gatilhos.teste.mjs
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { sugerir } from './gatilhos.mjs';

const mapa = JSON.parse(readFileSync(path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'gatilhos.json'), 'utf8'));
const casos = [
  ['acha umas metalúrgicas em Sorocaba com site ruim pra eu abordar', 'prospectar-b2b'], ['quero clientes B2B em Campinas', 'prospectar-b2b'],
  ['quais empresas de transporte daqui tem site velho?', 'prospectar-b2b'], ['me arruma uma lista de pet shops em Valinhos pra eu oferecer o serviço', 'prospectar-lojas'],
  ['quais lojas do bairro eu posso abordar?', 'prospectar-lojas'], ['faz o diagnóstico da ótica', 'diagnostico-loja'],
  ['quero mostrar um site pronto pro dono da metalúrgica antes de vender', 'site-demo'], ['monta uma demo pra metalúrgica', 'site-demo'],
  ['quanto eu cobro desse cliente?', 'proposta-servico'], ['monta a proposta pra ótica', 'proposta-servico'],
  ['quem eu preciso chamar hoje?', 'funil'], ['a metalúrgica respondeu, disse que quer conversar semana que vem', 'funil'],
  ['fechei com a ótica!!', 'aprendizado'], ['perdi a loja da esquina, disse que tá caro', 'aprendizado'],
  ['escreve um email pro dono da transportadora', 'email-profissional'], ['cria o site da ótica', 'site-premium'],
  ['preciso de um site pra uma indústria com pedido de orçamento', 'site-premium'], ['confere se o site tá pronto pra entregar', 'checar-site'],
  ['coloca o site no ar com o domínio que ele comprou', 'publicar-site'], ['faz um carrossel sobre limpeza de sofá', 'carrossel'], ['gera os carrosséis da semana', 'carrossel-semanal'], ['automatiza os posts do instagram toda segunda', 'carrossel-semanal'],
  ['melhora essas fotos dos óculos com fundo branco', 'foto-produto'], ['anima essa foto do produto', 'video-ia'],
  ['faz um reels da promoção de black friday', 'video-reels'], ['responde essas avaliações do google', 'responder-avaliacoes'],
  ['como a ótica tá aparecendo no google? queria aparecer na primeira página', 'seo'], ['monta uma campanha de google ads pra metalúrgica', 'anuncio-google'],
  ['como foram os anúncios essa semana?', 'relatorio-ads'], ['faz o relatório do mês da ótica', 'relatorio-resultados'],
  ['analisa essa planilha de vendas', 'analisar-dados'], ['bom dia', 'abrir'], ['o que você sabe fazer?', 'menu'],
  ['esqueci o comando de fazer site', 'menu'], ['salva no github', 'salvar'], ['/prospectar-b2b metalúrgicas', null],
  ['obrigado, ficou ótimo', null], ['qual a diferença entre essas duas opções?', null], ['muda a cor do botão pra azul', null],
  ['tem alguma empresa de energia solar aqui em Jundiaí sem site?', 'prospectar-b2b'], ['quero achar contabilidades em Campinas pra vender site', 'prospectar-b2b'],
  ['mandei a proposta pra ótica ontem', 'funil'], ['o cliente não quis, achou caro', 'aprendizado'],
  ['quero vender pra uma transportadora, como eu faço o site?', 'site-premium'], ['qual skill eu uso pra fazer post?', 'menu'],
  ['esqueci de mandar a mensagem pro joão', null], ['ficou bonito o hero, mas o texto tá grande', null],
  ['pega a identidade visual da ótica', 'identidade-loja'], ['quais são as cores da loja?', 'identidade-loja'],
  ['te mandei o logo e os prints da loja', 'identidade-loja'], ['tenho medo de o site ficar muito genérico', 'identidade-loja'],
  ['vamos buscar mais lojas de diferentes ramos e mandar mensagem', 'abordagem-whatsapp'], ['monta mais um lote de abordagem', 'abordagem-whatsapp'],
  ['manda as mensagens pelo whatsapp', 'abordagem-whatsapp'], ['quem respondeu as mensagens?', 'abordagem-whatsapp'],
  ['faz o contrato da ótica', 'contrato'], ['preciso formalizar com a metalúrgica', 'contrato'],
  ['o que eu peço pro cliente novo?', 'entrada-cliente'], ['o cliente mandou as fotos', 'entrada-cliente'], ['o que falta pra entregar a ótica?', 'entrada-cliente'],
  ['quem me deve?', 'cobrancas'], ['a ótica pagou a parcela', 'cobrancas'], ['quanto entra esse mês?', 'cobrancas'], ['caiu o pix da metalúrgica', 'cobrancas'],
];
let ok = 0;
for (const [frase, esperado] of casos) {
  const r = sugerir(frase, mapa);
  if ((r[0]?.skill ?? null) === esperado) ok++;
  else console.log(`✗ ${frase} → ${r.map((s) => s.skill).join(' ') || '—'} (esperado ${esperado})`);
}
console.log(`${ok}/${casos.length}`);
process.exitCode = ok === casos.length ? 0 : 1;
