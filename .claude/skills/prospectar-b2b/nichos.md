# Nichos B2B — quem comprar site e presença digital

Empresas que vendem pra outras empresas. O comprador delas (compras, engenharia, gerente de loja, síndico, RH) **pesquisa o fornecedor no Google e confere o site antes de pedir orçamento**. Site velho, que não abre no celular ou que mostra "não seguro" passa a impressão de empresa parada — e o orçamento vai pro concorrente.

Por que vale mais que varejo: ticket maior, contrato mensal mais estável, decisão racional (resultado em pedido de orçamento, não em curtida) e pouca agência mirando nesse público.

| Nicho | O que o site precisa fazer | Gancho típico | Busca no Google pra achar | Sinal de que pode pagar |
|---|---|---|---|---|
| Indústria (metalúrgica, usinagem, plásticos, alimentos) | Mostrar capacidade, máquinas, certificações, catálogo técnico | Catálogo em PDF de 2015; sem página por produto; site não aparece pra "usinagem CNC em <cidade>" | "usinagem cnc <cidade>", "metalúrgica <cidade>" | Galpão próprio, ISO 9001, exporta, vagas abertas |
| Distribuidora / atacado | Linha de produtos, marcas, área atendida, pedido de cotação | Sem lista de marcas; formulário quebrado; nenhum caminho pra cotar | "distribuidora de <produto> <cidade>" | Frota própria, atende vários estados |
| Transportadora / logística | Rotas, frota, rastreio, cotação de frete | Sem cotação online; rastreio que não funciona no celular | "transportadora <cidade> para <estado>" | Frota, filiais, ANTT, seguros |
| Construtora / engenharia / arquitetura corporativa | Portfólio de obras, clientes, prazos | Portfólio com fotos pequenas e antigas; obras recentes fora do site | "construtora comercial <cidade>", "engenharia civil <cidade>" | Obras em andamento, CREA, clientes conhecidos |
| Instaladoras (elétrica industrial, ar-condicionado comercial, energia solar empresarial) | Cases com números (kWh, economia), certificações, orçamento | Sem cases; sem calculadora/orçamento; Google com poucas avaliações | "energia solar para empresas <cidade>", "instalação elétrica industrial <cidade>" | Equipe técnica, NR-10, contratos de manutenção |
| Segurança eletrônica / monitoramento | Planos, central 24h, clientes atendidos | Site genérico de template; sem planos; sem WhatsApp | "monitoramento de alarme empresa <cidade>" | Central própria, carteira recorrente |
| Facilities (limpeza, portaria, jardinagem terceirizada) | Serviços, setores atendidos, certificações, proposta | Sem lista de clientes/setores; "não seguro" no navegador | "terceirização de limpeza <cidade>", "portaria terceirizada <cidade>" | Muitos funcionários, contratos com condomínios e empresas |
| Uniformes e EPI | Catálogo, personalização, pedido mínimo | Catálogo só no Instagram parado; sem pedido de orçamento | "uniformes empresariais <cidade>", "epi <cidade>" | Confecção própria, atende indústrias |
| Gráfica / embalagens | Produtos, acabamentos, pedido online | Site sem preço nem cotação; fotos ruins | "gráfica <cidade>", "embalagens personalizadas <cidade>" | Parque de máquinas, atende marcas |
| Contabilidade | Serviços por porte, abrir empresa, captação de clientes | Site de template igual a 200 outros; sem conteúdo; sem WhatsApp | "contabilidade para <nicho> <cidade>", "abrir empresa <cidade>" | Carteira grande, nicho definido (médicos, e-commerce) |
| Advocacia empresarial | Áreas, equipe, conteúdo de autoridade | Site parado há anos; sem área de atuação clara | "advogado trabalhista empresarial <cidade>" | Sócios com OAB há anos, escritório próprio (atenção às regras de publicidade da OAB) |
| TI / suporte gerenciado / software house | Serviços, SLA, cases | Empresa de tecnologia com site velho (gancho forte) | "suporte de TI para empresas <cidade>" | Contratos mensais, equipe |
| Laboratórios / calibração / análises | Ensaios, acreditações, prazos, pedido | Lista de ensaios em PDF; sem acreditação visível | "calibração de instrumentos <cidade>", "análise de água <cidade>" | Acreditação Inmetro/RBC |
| Locação de máquinas e equipamentos | Catálogo com disponibilidade e especificações | Catálogo sem foto/specs; sem orçamento | "locação de <equipamento> <cidade>" | Frota de equipamentos |
| Medicina e segurança do trabalho | Exames, PCMSO/PGR, atendimento a empresas | Site confuso entre B2C e B2B; sem portal da empresa | "medicina do trabalho <cidade>", "pcmso <cidade>" | Contratos com empresas, unidades |

## O que vender pra B2B

Não é "um site bonito". É **um canal de pedido de orçamento**:

- Site institucional com **uma página por produto/serviço** (é o que ranqueia pra "fornecedor de X em <cidade>")
- **Pedir orçamento** em todo lugar (formulário curto + WhatsApp comercial), medido
- Portfólio/cases com números, clientes atendidos (com autorização), certificações
- Perfil no Google completo, página no LinkedIn atualizada
- Relatório mensal: pedidos de orçamento que vieram do site e do Google

Modelo: `/site-premium` com tema e tom mais sóbrios, hero em sequência mostrando o processo (a peça bruta → usinada → inspecionada → entregue) e `contato: 'orcamento'` no `app.js` (painel "Pedir orçamento").

## Pergunta do orçamento por nicho

A primeira coisa que o vendedor pergunta vira o campo `orcamento.quantidade` (e o exemplo, `exemploQuantidade`). Os serviços do painel são os produtos/serviços do site; a cidade, quando a entrega ou a obra muda o preço.

| Nicho | `quantidade` | `exemploQuantidade` | `cidade` |
|---|---|---|---|
| Indústria / usinagem | Peça, material e quantidade | ex: eixo em aço 1045, 500 un/mês | Cidade da entrega |
| Distribuidora / atacado | Produtos e volume | ex: 20 caixas de luva nitrílica por mês | Cidade da entrega |
| Transportadora | Origem, destino e carga | ex: Campinas → BH, 8 paletes, 4 t | `''` (já está na rota) |
| Construtora / engenharia | Tipo e tamanho da obra | ex: galpão de 1.200 m² | Cidade da obra |
| Energia solar empresarial | Conta de luz média | ex: R$ 6.000 por mês | Cidade da instalação |
| Elétrica / ar-condicionado comercial | O que precisa e onde | ex: 12 splits num escritório de 400 m² | Cidade |
| Segurança eletrônica | Tipo de local e tamanho | ex: galpão com 2 portarias | Cidade |
| Facilities | Área ou número de postos | ex: 3 postos de portaria 24 h | Cidade |
| Uniformes / EPI | Peças e quantidade | ex: 150 camisas polo bordadas | Cidade da entrega |
| Gráfica / embalagens | Produto, tamanho e quantidade | ex: 5.000 caixas 20×20×10 | Cidade da entrega |
| Contabilidade | Regime e tamanho da empresa | ex: Simples, 12 funcionários | `''` |
| TI / suporte gerenciado | Computadores e usuários | ex: 35 máquinas, 1 servidor | Cidade |
| Laboratório / calibração | Ensaio ou instrumento e quantidade | ex: 40 manômetros | Cidade |
| Locação de equipamentos | Equipamento e período | ex: 2 plataformas por 30 dias | Cidade da obra |
| Medicina do trabalho | Funcionários e serviço | ex: PCMSO pra 80 funcionários | Cidade |
