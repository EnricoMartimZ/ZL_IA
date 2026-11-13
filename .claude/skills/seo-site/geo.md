# GEO — aparecer nas respostas das IAs, sem vender o que ninguém sabe

Buscadores de IA (ChatGPT com busca, Perplexity, Gemini, Copilot, Claude) respondem juntando trechos de páginas que conseguem ler. Não existe documentação oficial de "como ser citado" e ninguém garante citação. O que dá pra fazer é deixar o site **fácil de ler, de entender e de conferir**.

No relatório, cada item leva a etiqueta da coluna "Base".

## O que fazer, e com que certeza

| O quê | Base | Por quê |
|---|---|---|
| Texto presente no HTML que o servidor entrega (sem depender de JavaScript) | **Prática** | O Google renderiza JavaScript com atraso; os robôs de IA em geral não renderizam. Site estático e Next.js com Server Components já entregam assim |
| Não bloquear no `robots.txt` os robôs de busca e de leitura das IAs | **Prática** | Documentado por OpenAI, Anthropic e Perplexity: robô bloqueado não lê a página |
| Estar bem no Bing e no Google | **Prática** | O Copilot usa o índice do Bing e o Gemini o do Google; SEO bem feito é a base do GEO |
| Dados estruturados corretos (negócio, serviço, produto, perguntas, artigo) | **Prática** pro Google e Bing · **hipótese** pras IAs | Buscadores documentam o uso. Nas IAs ajuda a identificar a entidade, sem comprovação de que mude a citação |
| Definição clara no topo: quem é, o que faz, onde, pra quem | **Hipótese** | É o trecho que uma resposta copia. Coerente com o que se observa, sem prova pública |
| Resposta direta na primeira frase de cada bloco; perguntas como título | **Hipótese** | Idem |
| Fatos específicos e conferíveis (número, data, endereço, norma) no lugar de adjetivo | **Hipótese** | Estudos acadêmicos apontam ganho com dado e citação de fonte; não é regra de nenhum buscador |
| Mesmo nome, endereço e telefone no site, no Google, nas redes e em diretórios; `sameAs` no JSON-LD | **Hipótese** | Ajuda a máquina a tratar tudo como uma empresa só |
| Autoria, data e fonte em artigo | **Prática** pro Google (conteúdo confiável) · **hipótese** pras IAs | |
| Menções fora do site (perfil do Google, imprensa local, associação do setor) | **Hipótese** | As respostas costumam citar terceiros. Só menção verdadeira: nunca comprar |
| `llms.txt` | **Experimental** | Proposta de um arquivo-resumo em Markdown. Até onde se sabe, nenhum grande buscador confirmou que usa, e não é fator de posição. Fazer só se custar pouco; nunca cobrar como entrega |

Quando a informação mudar (um buscador passar a documentar algo), atualizar esta tabela com a fonte e a data.

## Política pra robôs de IA (decisão do cliente, registrada no plano)

Cada empresa de IA usa robôs diferentes pra **buscar** (levar o site pra uma resposta), pra **ler a pedido do usuário** e pra **treinar** modelo. A lista que a auditoria confere está em `scripts/lib/seo.js`.

| Opção | `seo-arquivos.js --ia` | Efeito | Pra quem |
|---|---|---|---|
| Liberar tudo | `permitir` (padrão) | Pode ser citado e o texto pode entrar em treino | Negócio local e B2B que quer ser achado: quase todos |
| Só busca | `sem-treino` | Pode ser citado; fica fora do treino dos que respeitam o `robots.txt` | Quem tem conteúdo autoral (artigos, cursos, catálogo técnico próprio) |
| Bloquear | `bloquear` | Some das respostas das IAs que respeitam o arquivo | Só a pedido explícito do cliente |

Explicar ao cliente em uma frase e anotar a escolha em `plano.json` → `decisoes.robos_ia`. O `robots.txt` é um pedido: robô mal-comportado ignora.

## Conferir (depois de publicado)

Não há painel oficial. O teste é manual e vai datado pro `plano.md`:

1. Pegar 5 perguntas do plano, do jeito que o cliente perguntaria ("qual ótica em <cidade> faz multifocal no mesmo dia?")
2. Fazer cada uma no ChatGPT (com busca), no Perplexity e no Gemini
3. Anotar: a empresa apareceu? Quem apareceu? Que páginas foram citadas como fonte?
4. Repetir a cada 30 dias. Resposta de IA varia de um dia pro outro: uma aparição não é posição, uma ausência não é punição

No relatório, escrever o que foi visto e quando. Nunca "a IA recomenda a empresa".
