# Imagens — quando pedir ao usuário e como pedir

Site premium vive de imagem. Quando o conceito precisa de uma que não existe, a regra é **parar e pedir ao
usuário**, com o prompt pronto. Nunca: pegar banco de imagem genérico, deixar um `exemplo-*` do modelo, trocar a
foto por um desenho fraco, ou mudar de conceito calado pra fugir da imagem.

Quem gera é o usuário, na ferramenta dele (Higgsfield, Flow, Midjourney, o que ele usar). Se ele responder
"gera você", usar `scripts/kie.js` ou o MCP do Higgsfield (`cenas.md` §2), avisando antes quantas imagens são,
porque custa crédito.

## 1. Antes de pedir

1. Olhar o que já existe: `clientes/<Nome>/fotos/`, o que o `/foto-produto` gerou, o logo em vetor, o Instagram da loja.
2. Ver se um mundo sem foto resolve melhor (`direcao.md`, "Sem foto boa"). Pedir imagem é pra servir ao conceito, não pra salvar um conceito errado.
3. Listar o que a técnica escolhida exige (`tecnicas/README.md`, "Material que cada uma precisa") e marcar o que falta.

## 2. Quando pedir

| Situação | O que pedir |
|---|---|
| O conceito é feito de cena que não existe: hero em sequência, zoom contínuo, Galeria pintada, Quadrinho | Cenas de IA, todas com a mesma câmera e o mesmo estilo |
| Produto sem foto recortada, e a técnica precisa dele solto: roda, esteira, varal, sanduíche, prateleira, fila | Recorte da foto real, ou o produto regerado a partir dela, em fundo liso |
| Raio-X e pincel sem o par (por dentro/por fora, antes/depois) | A foto real editada, sem mexer na câmera |
| A foto do cliente existe mas é escura, torta, com reflexo | A mesma foto melhorada (`/foto-produto`), com o produto idêntico |
| Falta a textura do ofício pro fundo: aço escovado, farinha, couro, concreto | Textura de perto, sem objeto nenhum |
| Carta ou figurinha de item sem foto em pé | Retrato do item em 5:7, a mesma luz em todas |
| Cena da lista viva ou abertura em vídeo | Vídeo curto em laço (`/video-ia`) |
| Mascote ou personagem (Quadrinho, Figurinhas) | Folha de personagem, com o "ok" de quem for retratado |
| Capa de compartilhamento | Arte 1200 × 630 (ou gerar com `og/og.html`) |

**O que não se gera, se pede ao cliente:** tudo que entra no site como prova. Fachada, equipe, a obra entregue,
o serviço sendo feito, o antes e depois de um caso real. Aí o pedido é um **roteiro de fotos** pro dono tirar com
o celular (§6).

## 3. O formato do pedido

Mostrar no chat, nesta forma, e parar até o usuário responder:

```
PEDIDO DE IMAGENS — <cliente> · conceito "<nome>"
Preciso de <N> imagens pra seguir. Sem elas fica parado: <a parte do site que depende delas>.
Se não der pra gerar: <o plano B: outro mundo ou outra técnica, e o que se perde>.

Estilo comum (colar no começo de todos os prompts):
<uma frase: lente, luz, paleta, material> — no text, no logos, no watermark, no people's faces

1) <nome-do-arquivo>.jpg — <onde entra no site>
   Formato: <proporção> · <tamanho mínimo> · <onde fica o assunto no quadro>
   Anexar como referência: <a foto real do cliente / a imagem 1 depois de aprovada / nada>
   Prompt:
   <em inglês, pronto pra colar>
   Tem que ter: <…>      Não pode ter: <…>

2) …

Ordem: gerar a 1 primeiro e me mostrar. As outras saem dela, com a mesma câmera.
Onde salvar: clientes/<Nome>/site/img/bruto/, com esses nomes. Também pode colar aqui no chat.
```

O pedido sempre traz o **plano B**: o usuário decide se vale gerar ou se troca de caminho.

## 4. Como escrever o prompt

- Em inglês, nesta ordem: assunto, lugar, luz, câmera e lente, material, clima. No fim, o que não pode ter.
- **Consistência vem de editar, não de descrever.** Uma imagem-base aprovada primeiro; as outras pedem "Same exact photo, same camera angle, same framing, same lighting. Only change: …" com a base anexada.
- Foto real de produto: "keep the product exactly identical, same label, same proportions" e conferir o rótulo letra por letra.
- Nada de rosto reconhecível como "cliente", nada de marca ou modelo de terceiros, nada que prometa resultado que a empresa não entrega.

| Uso | Proporção | Tamanho | Cuidado |
|---|---|---|---|
| Hero em sequência | 16:9 | 2K | 5 a 7 cenas, a do "depois" primeiro (`cenas.md`) |
| Zoom contínuo | 16:10 | 2K | De dentro pra fora, completando em volta (`tecnicas/README.md`) |
| Produto solto (roda, esteira, varal, sanduíche, fila) | 1:1 ou 4:5 | 1.500 px | Fundo liso de uma cor só, de frente, a mesma luz e o mesmo ângulo em todos |
| Par do raio-X ou do pincel | A da foto-base | A mesma | Só muda o que está dentro ou sujo; contorno e câmera iguais |
| Carta | 5:7 | 1.000 × 1.400 | Assunto no terço de cima; o nome entra embaixo |
| Textura | 16:9 | 2K | De perto, luz rasante, nenhum objeto |
| Vinheta de HQ | A do quadro | 1.200 px | A folha de personagem anexada em todas |
| Versão de celular | 9:16 | 1.080 × 1.920 | Só quando o corte do 16:9 perde o assunto |

## 5. Quando as imagens chegarem

1. Conferir lado a lado: mesmo objeto, horizonte na mesma altura, luz no mesmo lugar, sem texto torto nem mão estranha.
2. Reprovou? Pedir de novo **só** a que falhou, dizendo o que corrigir e mandando o prompt ajustado.
3. Converter pra WebP (~1.600 a 1.920 px) e apagar a pasta `bruto/` antes de publicar.
4. Rotular no site: "Imagens geradas por IA · ilustrativas". Foto real fica sem rótulo.

Enquanto espera, adiantar o que não depende delas (estrutura, textos, SEO, agenda, mapa), deixando no lugar de
cada imagem um bloco de cor com o nome do arquivo esperado. Nunca publicar assim: o `/checar-site` precisa passar.

## 6. Roteiro de fotos pro dono da empresa

Quando a falta é de foto real, entregar ao usuário uma mensagem pronta pra ele mandar ao cliente:

```
Pra o site ficar com a cara da <empresa>, preciso de umas fotos tiradas aí, com o celular mesmo:
1. A fachada de dia, de frente, sem carro na frente
2. O lugar por dentro, arrumado, com a luz acesa
3. Alguém da equipe trabalhando (de lado ou de costas, se preferir)
4. O <produto ou serviço principal> de perto
5. Um detalhe que só vocês têm (a máquina, o forno, a bancada, o estoque)
6. Um antes e um depois do mesmo serviço, do mesmo lugar
Dicas: limpar a lente, celular deitado, perto da janela ou de dia, sem flash e sem filtro.
```

Trocar os itens pelo que o conceito pede. Foto com gente só com autorização, e de criança só com a dos pais.
