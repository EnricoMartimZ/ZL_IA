# Lote diário de prospecção

Segunda a sexta, 9h. Nome no app: `lote-b2b-sbo`. Prompt:

Pasta de trabalho: a raiz do ZL_IA. Fale em português, direto e curto.

Objetivo: prospecção diária de 7 lojas (comércio e serviço pro consumidor) e 7 empresas B2B de Santa Bárbara d'Oeste e região (Americana, Nova Odessa, Sumaré) que NÃO têm site ou têm site ruim, com abordagem curta pelo WhatsApp. São 14 por dia, no lugar dos 10 de antes (decisão do Enrico em 31/10/2026).

Antes de tudo, leia: CLAUDE.md, vendas/ESTADO.md, vendas/funil.md, .claude/skills/abordagem-whatsapp/SKILL.md (é o passo a passo que você segue) e .claude/skills/prospectar-b2b/nichos.md (nichos B2B).

1) QUEM RESPONDEU (só ler, nada de responder sozinho)
- Pegue os itens com status "enviada" nos vendas/prospeccao/*/fila.json enviados há 2 dias ou mais.
- No Claude in Chrome (o Chrome do Enrico, WhatsApp Web já logado; se pedir QR code, pare e avise), abra cada conversa e leia. Resposta automática não conta como resposta: anote que foi robô.
- Respondeu: resuma, mova no vendas/funil.md pra "respondeu" e sugira o próximo passo (diagnóstico/demo só pra quem respondeu). "Não quero": marque "pediu pra parar" e nunca mais mande nada.
- 7+ dias sem resposta (o Enrico definiu 1 semana em 30/10): escreva UM follow-up com um fato novo, mas não envie sem aprovação. Quem só teve robô recebe o recado pro responsável da regra da skill abordagem-whatsapp. Quem já está em vendas/prospeccao/followups-<AAAA-MM>/fila.json não ganha outro.

2) MAPEAR O LOTE NOVO
- Crie vendas/prospeccao/<AAAA-MM-DD>-lote-sbo/buscas/.
- No navegador do app, faça de 8 a 10 buscas no Google Maps (https://www.google.com/maps/search/<nicho>+<cidade>?hl=pt-BR, janela 1280x1400), uma por vez, em ritmo de pessoa, metade de lojas e metade de B2B. Rode o conteúdo de .claude/skills/abordagem-whatsapp/ler-maps.js no javascript_tool e salve o JSON em buscas/<nicho>-<cidade>.json.
- Gire nichos e cidades: veja os buscas/ dos lotes *-lote-sbo anteriores e não repita a mesma combinação de nicho e cidade. B2B que já renderam: segurança eletrônica, ar-condicionado/climatização, gráfica, energia solar, serralheria. Também valem: uniformes/EPI, dedetizadora, gesso/drywall, vidraçaria, marmoraria, locação de equipamentos, caçambas, terceirização de limpeza, medicina do trabalho, transportadora, usinagem, caldeiraria, tornearia, comunicação visual, automação industrial, manutenção industrial e elétrica industrial. Indústria grande quase só tem telefone fixo e não entra; prefira prestador de serviço pra empresa.
- Lojas: clínica de estética, odontologia, fisioterapia, pet shop, autoescola, academia, ótica, salão, restaurante, padaria, floricultura, loja de roupa, móveis, material de construção. Lojas que dependem de rede ou franquia não entram.
- Rode: node scripts/montar-lote.js vendas/prospeccao/<pasta> --max 28 --so-site --cidade "Santa Bárbara e região"
- Tire do lote quem já está no vendas/funil.md ou em fila.json de lotes anteriores (mesmo número de WhatsApp) e concorrente direto de cliente fechado ou em negociação (veja ESTADO). Máximo de 2 do mesmo ramo por lote.
- Leia mensagem por mensagem e corrija no fila.json e no lote.md: nome comprido ou cortado (use o nome que o cliente reconhece), fato que não dá pra provar, link encurtado que na verdade leva pro WhatsApp. Pra site ruim, abra o print do celular em prints/ e confirme com o olho.

3) APROVAÇÃO E ENVIO
- Mostre no chat a tabela do lote (loja, loja ou B2B, nicho, Google, ponto fraco) e as mensagens. NÃO ENVIE NADA antes de o Enrico aprovar no chat. Ele pode tirar ou editar qualquer item.
- Depois de aprovado: envie só os aprovados pelo Claude in Chrome, conforme o Passo 4 da skill abordagem-whatsapp (web.whatsapp.com/send?phone=...&text=..., conferir o texto, Enter, conferir que saiu). Espere de 2 a 5 minutos entre cada envio e registre cada um com marcar.cjs.
- Limites: 14 novos por dia (7 lojas e 7 B2B) e no máximo 20 envios por dia somando lote novo, follow-ups e os follow-ups já agendados pra hoje em vendas/prospeccao/followups-<AAAA-MM>/fila.json. Conte os enviados hoje em todos os fila.json. O que passar do limite fica "aguardando aprovação" pro dia seguinte. Pare na hora se o WhatsApp mostrar aviso ou bloqueio.

4) FECHAR
- Atualize vendas/ESTADO.md (seção "Em andamento") com o lote do dia, quantas foram, quem respondeu e o que está pendente.
- Termine com um resumo curto: respostas do dia, follow-ups sugeridos, lote enviado e o que ficou pra amanhã.
