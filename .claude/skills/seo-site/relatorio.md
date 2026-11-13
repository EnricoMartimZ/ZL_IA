# Modelo do relatório de SEO

Vai em `clientes/<Nome>/seo/RELATORIO-SEO.md`. Quem lê é o dono do negócio: frase curta, sem sigla solta (na primeira vez, explicar entre parênteses), sem promessa. Os números saem do `plano.json` e da auditoria (`seo-site.js --json`); o que não foi medido fica escrito como "não medido".

```markdown
# Relatório de SEO — <cliente> — <data>

## Em uma frase
<O que o site está pronto pra fazer e o que falta. Ex.: "O site está pronto pra ser lido pelo Google e pelas IAs em 5 buscas de <cidade>; falta o domínio e três fotos reais.">

## 1. Estratégia: como o cliente de vocês procura
- Quem procura e o que quer resolver
- As <n> buscas escolhidas e por quê (intenção de compra, cidade, concorrência que dá pra enfrentar)
- O que ficou de fora e por quê
- De onde vieram os dados (busca real em <data>, Search Console, Planejador). Volume é estimativa, salvo quando dito o contrário

## 2. Uma página pra cada busca
| Página | Busca principal | Buscas de apoio | O que a pessoa quer |
|---|---|---|---|

## 3. Como cada página aparece no Google
| Página | Título (title) | Descrição (description) |
|---|---|---|
Explicar em uma linha: é o texto azul e o texto cinza do resultado.

## 4. Estrutura de cada página
Por página: o título principal (h1), a frase de apoio e os subtítulos, na ordem.

## 5. O que foi implementado
- [x] Endereço próprio e definitivo de cada página (canonical)
- [x] Mapa do site (sitemap) e instruções pros robôs (robots.txt)
- [x] Prévia do link no WhatsApp e nas redes (Open Graph)
- [x] Imagens com nome, descrição e peso certos
- [x] Links entre as páginas
- [x] Versão de celular
- [ ] <o que não foi feito, com o motivo>

## 6. Dados que o Google e as IAs leem direto (dados estruturados)
| Página | O que informa | Tipo |
|---|---|---|
Tudo o que está aqui também está escrito na página.

## 7. Buscadores de IA (ChatGPT, Perplexity, Gemini)
- O que foi feito: definição da empresa no topo, perguntas respondidas, fatos conferíveis, texto legível sem JavaScript
- Robôs de IA: <liberados / só busca / bloqueados>, por decisão de <quem>, em <data>
- llms.txt: <não feito / feito como teste>. Recurso experimental
- **Certeza de cada coisa:** prática comprovada / hipótese / experimental (copiar as etiquetas do `geo.md`)
- Ninguém garante que uma IA cite uma empresa. Teste feito em <data>: <resultado, ou "ainda não testado: o site não está no ar">

## 8. O que a auditoria achou
| Gravidade | Achado | Situação |
|---|---|---|
| Crítico | | corrigido / pendente |
Resumo: <n> achados, <n> corrigidos, <n> pendentes.
Medição de velocidade: <local, neste computador / PageSpeed Insights em <data>: nota <n>>. Dizer qual das duas.

## 9. O que depende de vocês
- <fotos reais, confirmar horário, pedir avaliações, acesso ao Search Console, registrar o domínio...>

## 10. Próximos passos
- Nos primeiros 30 dias: <enviar o sitemap no Search Console e no Bing, conferir a indexação, testar as perguntas nas IAs>
- Depois: <página nova pro serviço X se a busca aparecer no Search Console, artigo sobre Y, mais avaliações>

## O que este relatório não diz
O site ainda não tem posição nem visitas medidas. Posição e indexação só aparecem no Search Console, algumas semanas depois de publicar. Não há garantia de primeira página nem de citação por IA.
```

Regras do relatório:

- Achado corrigido aparece como corrigido, com o que mudou. Pendente aparece com o dono (você ou o cliente)
- Site já no ar com Search Console: trocar o último bloco pelos números reais, com o período
- Auditoria de site de prospect (pra vender): só as seções 8, 7 e 10, no tom do `/diagnostico-loja`. Sem assustar com o que não é grave
