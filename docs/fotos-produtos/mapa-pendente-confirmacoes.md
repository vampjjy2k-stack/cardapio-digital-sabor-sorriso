# Mapa de fotos — supersessão para candidato local

**Escopo supersedido:** a orientação posterior do coordenador, com confirmação literal de João, substitui a pausa anterior para fins de preparação local:

> “As fotos nomedas são todas as fotos que ela tem, vão ser essas mesmas. As que não tiver foto, O H2OH é sabor limão, eu tenho a imagem. As sem imagem você deixar a imagem genérica mesmo, e coloca algo indicando que o produto não tem imagem de exemplo, algo assim.”

Isto autoriza preparar a exibição **LOCAL** dos candidatos abaixo, mas não publicar. Ainda são obrigatórias a revisão de Cassandra e a aprovação de João para o **SHA exato** final; não há push nem deploy. `ITEM_PHOTOS` recebe somente as novas correspondências confirmadas; `ITEM_PHOTO_SETS` e `associacoes.json` permanecem intactos.

## Correspondências para candidato local

As fontes estão em `/workspace/sabor-fotos-revisao/originais/`, salvo a foto H2OH indicada. Os hashes completos, dimensões e o estado dos derivados estão no [manifesto incremental](associacoes-confirmadas-20261022.json).

| Fonte | ID existente | Derivado candidato | Limite confirmado |
|---|---|---|---|
| `foto-007.jpg` | `hamburgueres-x-duplo` | `public/img/produtos/x-duplo.webp` | X Duplo; não deduzir ingredientes pela foto. |
| `foto-010.jpg` | `combos-combo-07` | `public/img/produtos/combo-07.webp` | Combo 07; não deduzir quantidade de itens pela foto. |
| `foto-016.jpg` | `porcoes-batata-maluca-p` | `public/img/produtos/batata-maluca-p.webp` | Batata Maluca P; não extrapolar para outro tamanho/receita. |
| `foto-015.jpg` | `porcoes-batata-maluca-g-com-cheddar-e-bacon` | `public/img/produtos/batata-cheddar-bacon-g.webp` | Batata Maluca G com cheddar e bacon; não extrapolar para outro tamanho/receita. |
| `foto-017.jpg` | `hot-dogs-dogao-quente-salsicha` e `hot-dogs-dogao-quente-linguica` | `public/img/produtos/dogao-quente.webp` compartilhado | Foto genérica compartilhada; não inferir proteína. |
| `/home/ubuntu/upload/1000026854.jpg` | `bebidas-h2o-600ml` | `public/img/h2oh-limao-500ml.webp` | Rótulo mostra 500 ml/limoneto; João confirma sabor Limão. Preservar ID legado. |

Os oito derivados são reencodificação **lossless WebP integral**, sem crop, edição de pixels ou alteração de alimento. Dimensões e pixels RGB foram comparados às fontes e preservados; os hashes completos estão no manifesto incremental. Na inspeção visual, `foto-016.jpg` mostra a porção menor no pote de quentinha (**P**); `foto-015.jpg` mostra a porção maior na tábua (**G**), conforme a orientação de João. A primeira contém alimento real em primeiro plano com um cardápio no fundo; não é uma fotografia isolada de menu usada como substituto de comida.

## Ausência de foto e indicação genérica

Não há foto para **Batata Maluca G simples** nem **Batata Maluca P com Cheddar e Bacon**. Para esses produtos, manter a imagem genérica e inserir indicação de ausência, por exemplo **“Foto de exemplo não disponível”**. Não reutilizar foto de outro tamanho ou receita.

## Itens fora do escopo

- **X Picanha 01–04:** itens confirmados em R$19/R$23/R$36/R$21; somente o 03 tem foto, pela legenda literal “Picanha 03”, sem inferência por aparência ou preço. Os **R$ 35 impressos estão desatualizados** e não alteram o preço confirmado de R$36. X Picanha 04 começa com “pão brioche +”, conforme “siga a lógica” de João, sem Bimbo e mantendo R$21.
- **Frango:** correspondência confirmada por João exclusivamente com **Frango Fresh**, R$24,00. A receita vem da descrição textual confirmada, não da imagem.
- Não inferir ingredientes, proteínas, quantidades, receitas ou preços a partir das imagens.

## Revisão, SHA e publicação

1. Preparar a prévia e os derivados somente localmente.
2. Cassandra revisa a prévia, a integralidade lossless e os vínculos documentais.
3. A aprovação deve referir-se ao SHA exato dos derivados finais e do conjunto candidato.
4. Até essa revisão e aprovação, manter o candidato sem publicação; **não fazer push nem deploy**.

As 10 fotos antigas e 7 bebidas históricas continuam preservadas. O manifesto histórico `associacoes.json` não deve ser alterado.

## Confirmação posterior de João — Frango Fresh

`foto-009.jpg` (legenda “Frango” no PDF) → `hamburgueres-frango-fresh` → `public/img/produtos/frango-fresh.webp`, exclusivamente. Adicionado em Hambúrgueres, sem reclassificar os demais itens. Preço **R$24,00**.

pão Bimbo + filé de peito de frango empanado (120 g) + alface + cheddar em fatia + cebola roxa crua + molho especial

X Picanha 01–04: R$19/R$23/R$36/R$21; foto direta exclusivamente no 03, sem fotos inferidas nos demais. **X Picanha 04 com “pão brioche +” por confirmação de João (“siga a lógica”), sem Bimbo e mantendo R$21.** Candidato único filho direto de `46de50a`; `a15e8ff` e `ddabe63` permanecem locais e não são ancestrais. Sem push/deploy; aprovação explícita do SHA final ainda obrigatória.

Correção posterior de Janei, confirmada por João: retirar picles e cream cheese da receita do Frango Fresh; a descrição literal acima já reflete essa autorização. Preço permanece R$24,00.

## Correção de associação direta — Picanha 03

A legenda literal **“Picanha 03”**, na página 2, posição 3 do PDF preservado, identifica `foto-008.jpg` → `linha-picanha-x-picanha-03` → `public/img/produtos/picanha-03.webp`, exclusivamente. O derivado é integral e lossless, com dimensões e pixels RGB preservados. A associação não depende da aparência nem do preço da foto. Preço atual **R$36**, sem alteração da receita. X Picanha 01, 02 e 04 mantêm placeholders rotulados; **X Picanha 04 começa com “pão brioche +” por confirmação de João (“siga a lógica”), sem Bimbo e mantendo R$21**. PDF e originais ficam fora do Git. O novo candidato reaplica integralmente `bcab8ed` sobre `46de50a`, sem ter aquele candidato como ancestral; nova revisão Cassandra e aprovação explícita do novo SHA são obrigatórias, sem push/deploy.
