# Plano de busca — da pesquisa ao texto

O plano é feito **antes do site**. Ele responde: que buscas esse negócio pode ganhar, qual página responde cada uma e o que ela precisa dizer.

## 1. Como o cliente procura

Listar de 20 a 40 buscas, na língua de quem compra. Fontes, sem ferramenta paga:

- O que o dono ouve no balcão e no WhatsApp ("vocês fazem…?", "quanto custa…?")
- As avaliações do Google do negócio e dos concorrentes: as palavras que o cliente usa
- A própria busca: digitar o serviço e ler o autocompletar, "As pessoas também perguntam" e "Pesquisas relacionadas" (WebSearch, ou o navegador)
- O `marketing/seo/01-pesquisa-demanda.md`, se o `/seo` rodou
- Com acesso do cliente: Search Console (consultas reais) e Planejador de palavras-chave do Google Ads (faixa de volume)

Classificar cada busca:

| Intenção | Como reconhecer | Que página responde |
|---|---|---|
| **Comprar ou contratar** (transacional) | "orçamento", "preço", "agendar", serviço + cidade, "perto de mim" | Página do serviço, página inicial |
| **Escolher** (comercial) | "melhor", "qual", "vale a pena", "x ou y", "avaliações" | Página do serviço com comparação e prova; página "por que nós" |
| **Entender** (informacional) | "como", "o que é", "por que", "quanto tempo dura" | Pergunta respondida dentro da página do serviço; artigo, se o assunto for grande |
| **Achar a empresa** (navegacional) | o nome do negócio, "telefone", "endereço", "horário" | Página inicial, com dados do negócio |

Negócio local: quase toda busca que paga é **serviço + cidade** ou **serviço + bairro**. B2B: **produto + aplicação**, **produto + norma ou medida**, "fornecedor de", "fabricante de".

Conferir cada candidata com uma busca real e anotar o que aparece: mapa, anúncio, diretório, concorrente direto. Busca dominada por portal nacional não é pra página de loja de bairro: escolher a variação com cidade ou a pergunta específica.

Volume: escrever **alto, médio ou baixo, estimativa**, e a base ("aparece no autocompletar e tem anúncio" / "número do Planejador, tirado em tal data"). Nunca um número inventado.

## 2. Escolher

Pra cada página:

- **1 principal** — a busca que a página existe pra responder. Intenção de compra, com cidade quando o negócio é local. Nenhuma outra página do site pode ter a mesma
- **2 a 4 secundárias** — variações e termos vizinhos que cabem no mesmo texto sem forçar
- **Cauda longa** — as perguntas inteiras ("quanto tempo demora pra fazer lente multifocal"). Viram os h2 em forma de pergunta e o bloco de perguntas frequentes

Descartar e anotar o motivo: busca que o negócio não atende, termo de marca alheia, termo genérico sem cidade que só portal ganha.

## 3. Arquitetura

Regra: **uma página por intenção, não por palavra**. "Lente multifocal" e "óculos multifocal" são a mesma página. "Lente multifocal" e "conserto de armação" são duas.

| Página | Quando existe | Principal típica |
|---|---|---|
| Inicial (`/`) | Sempre | o que o negócio é + cidade ("ótica em <cidade>") |
| Serviço ou produto (`/servico-<nome>.html`, `/<nome>`) | Cada serviço que alguém procura pelo nome e que o negócio quer vender | serviço + cidade |
| Região (`/<servico>-<bairro-ou-cidade>`) | Só se o negócio **atende mesmo** ali e tem o que dizer de diferente (prazo, equipe, obra feita, cliente atendido). Senão, uma seção "Onde atendemos" basta | serviço + região |
| Sobre | Quando quem compra precisa confiar em quem faz (saúde, obra, B2B) | nome + "quem somos"; serve mais à IA e ao navegacional |
| Perguntas | Só se as perguntas não couberem nas páginas de serviço | — |
| Artigo | Assunto que pede mais de 600 palavras e traz gente que ainda vai comprar | pergunta informacional |
| Privacidade | Sempre que há medição ou formulário | fica com `noindex` |

Site pequeno é normal: negócio local sai bem com a inicial e de 2 a 5 páginas de serviço. Página sem o que dizer é pior que página nenhuma.

Endereços: curtos, minúsculos, com hífen, sem acento, com a palavra do serviço (`/lentes-multifocais`). Definidos uma vez; trocar depois exige redirecionamento.

Links internos: a inicial linka cada serviço pelo nome; cada serviço volta pra inicial, aponta um serviço vizinho e a chamada de contato. Nenhuma página fica sem link chegando. Texto do link = o nome do destino, nunca "clique aqui".

Registrar no `plano.json` (ver `plano-exemplo.json`): `negocio`, `paginas[]` com `pagina`, `principal`, `secundarias`, `intencao`, `title`, `description`, `h1`, `apoio`, `perguntas`, e `decisoes` (páginas que ficaram de fora, política pra IA).

## 4. Escrever a página

O mesmo texto serve ao Google, à IA e ao cliente quando é específico. Ordem de cada página:

1. **Title** — principal + marca, de 30 a 60 caracteres: `Lentes multifocais em <cidade> · <marca>`. Um por página, nenhum repetido
2. **Description** — 70 a 160 caracteres: o que é, pra quem, um fato (prazo, preço a partir de, garantia) e o que fazer. É o anúncio grátis no resultado
3. **h1** — um só. Diz o serviço **ou** é a frase do conceito
4. **Linha de apoio** — logo abaixo do h1, a definição em uma frase, com o que é, onde e pra quem: "A <marca> é uma ótica no centro de <cidade> que faz lentes multifocais em laboratório próprio, com entrega em 3 dias." É a frase que a busca e a IA copiam. Obrigatória quando o h1 é criativo
5. **Corpo em blocos, cada um com um h2** que nomeia o assunto ou faz a pergunta: o que inclui, como funciona, quanto custa, quanto tempo leva, pra quem serve, onde atende. Primeira frase de cada bloco responde; o resto detalha
6. **Fatos no lugar de adjetivos.** "Entrega em 3 dias úteis", "desde 2009", "laboratório próprio", "garantia de 1 ano", "atende <bairros>". Tudo conferível e confirmado com o cliente
7. **Perguntas frequentes** quando há perguntas de verdade: 3 a 6, resposta de 2 a 3 frases com número. Visíveis na página (não escondidas em aba que não existe no HTML)
8. **Prova** — avaliações reais copiadas, com nome abreviado; clientes atendidos e certificações no B2B
9. **Contato igual em todo lugar** — nome, endereço e telefone escritos do mesmo jeito no site, no JSON-LD, no Google e no Instagram

Quanto texto: o que a busca pede. Página de serviço local resolve com 250 a 500 palavras boas. Abaixo de 200 a auditoria avisa.

Palavra principal: no title, na description, no h1 ou na linha de apoio, e naturalmente no texto. Se você reparou que ela está repetida, tem demais.

### O que não escrever

- "Qualidade e excelência", "soluções completas", "referência no mercado": frases que qualquer concorrente assina. Trocar por fato
- Lista de cidades ou de sinônimos no rodapé
- A mesma página copiada trocando o nome da cidade
- Número, prêmio, certificação ou depoimento que o cliente não confirmou
- Texto pra máquina que o visitante não vê
