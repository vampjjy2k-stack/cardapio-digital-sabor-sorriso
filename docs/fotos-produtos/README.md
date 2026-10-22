# Fotos confirmadas — candidato local para revisão

## Estado atual: preparação local autorizada, sem publicação

A orientação posterior recebida do coordenador, com a citação literal de João abaixo, **supersede a pausa anterior** e autoriza preparar candidatos locais para exibição, sem publicar:

> “As fotos nomedas são todas as fotos que ela tem, vão ser essas mesmas. As que não tiver foto, O H2OH é sabor limão, eu tenho a imagem. As sem imagem você deixar a imagem genérica mesmo, e coloca algo indicando que o produto não tem imagem de exemplo, algo assim.”

Esta rodada restaura a exibição dos dez derivados históricos e das sete bebidas com foto própria e acrescenta somente os vínculos do [manifesto incremental](associacoes-confirmadas-20261022.json). A preparação é **LOCAL**, sem push, deploy ou publicação: `ITEM_PHOTOS` recebe as associações confirmadas, `ITEM_PHOTO_SETS` mantém as duas imagens de mesma importância do Artesanal 03, e o [manifesto histórico](associacoes.json) permanece intacto. Os originais e todos os assets históricos são preservados.

A exibição local deve manter imagem genérica nos itens sem foto e indicar algo como **“Foto de exemplo não disponível”**. Não se deve inferir proteína, ingredientes, quantidades, receita ou preço pela imagem. X Picanha 01–04 entram com preços R$19/R$23/R$36/R$21 e descrições confirmadas; apenas o 03 recebe foto pela legenda literal “Picanha 03”. O 04 começa com “pão brioche +”, conforme “siga a lógica” confirmado por João; Picanha não recebe Bimbo. Frango entra exclusivamente como Frango Fresh, R$24,00, com descrição literal confirmada e foto própria.

## Candidatos desta supersessão

- `foto-007.jpg` → `hamburgueres-x-duplo` → `public/img/produtos/x-duplo.webp`
- `foto-010.jpg` → `combos-combo-07` → `public/img/produtos/combo-07.webp`
- `foto-016.jpg` → `porcoes-batata-maluca-p` → `public/img/produtos/batata-maluca-p.webp`
- `foto-015.jpg` → `porcoes-batata-maluca-g-com-cheddar-e-bacon` → `public/img/produtos/batata-cheddar-bacon-g.webp`
- `foto-017.jpg` → `hot-dogs-dogao-quente-salsicha` **e** `hot-dogs-dogao-quente-linguica` → `public/img/produtos/dogao-quente.webp` compartilhado; não inferir proteína.
- `/home/ubuntu/upload/1000026854.jpg` → `bebidas-h2o-600ml` → `public/img/h2oh-limao-500ml.webp`; o rótulo é 500 ml/limoneto e João confirma Limão. O ID legado não deve ser renomeado.

Os oito derivados novos são **reencodificação lossless WebP integral**, sem crop, edição de pixels ou alteração de alimento. Dimensões e pixels RGB decodificados foram comparados às fontes e são idênticos. Os hashes completos estão no manifesto incremental; o manifesto histórico não foi reescrito.

Não há foto para **Batata Maluca G simples** nem para **Batata Maluca P com Cheddar e Bacon**: usar a imagem genérica com o indicador de ausência de foto, sem reutilizar a imagem de outro tamanho/receita.

## Revisão e aprovação obrigatórias

A exibição é apenas uma prévia/candidato local. Cassandra deve revisar a prévia e os derivados; depois, João deve aprovar o **SHA exato** final antes de qualquer publicação. Continua proibido fazer push ou deploy nesta rodada.

O [mapa de pendências](mapa-pendente-confirmacoes.md) detalha limites, fontes e itens fora do escopo. O manifesto histórico `associacoes.json` é somente leitura e não foi alterado.

## Confirmação posterior de João — Frango Fresh

`foto-009.jpg` (legenda “Frango” no PDF) → `hamburgueres-frango-fresh` → `public/img/produtos/frango-fresh.webp`, exclusivamente. Adicionado em Hambúrgueres, sem reclassificar os demais itens. Preço **R$24,00**.

pão Bimbo + filé de peito de frango empanado (120 g) + alface + cheddar em fatia + cebola roxa crua + molho especial

X Picanha 01–04: R$19/R$23/R$36/R$21; foto direta exclusivamente no 03, sem fotos inferidas nos demais. **X Picanha 04 com “pão brioche +” por confirmação de João (“siga a lógica”), sem Bimbo e mantendo R$21.** Candidato único filho direto de `46de50a`; `a15e8ff` e `ddabe63` permanecem locais e não são ancestrais. Sem push/deploy; aprovação explícita do SHA final ainda obrigatória.

Correção posterior de Janei, confirmada por João: retirar picles e cream cheese da receita do Frango Fresh; a descrição literal acima já reflete essa autorização. Preço permanece R$24,00.

## Correção de associação direta — Picanha 03

A legenda literal **“Picanha 03”**, na página 2, posição 3 do PDF preservado, identifica `foto-008.jpg` → `linha-picanha-x-picanha-03` → `public/img/produtos/picanha-03.webp`, exclusivamente. O derivado é integral e lossless, com dimensões e pixels RGB preservados. A associação não depende da aparência nem do preço da foto. Preço atual **R$36**, sem alteração da receita. X Picanha 01, 02 e 04 mantêm placeholders rotulados; **X Picanha 04 começa com “pão brioche +” por confirmação de João (“siga a lógica”), sem Bimbo e mantendo R$21**. PDF e originais ficam fora do Git. O novo candidato reaplica integralmente `bcab8ed` sobre `46de50a`, sem ter aquele candidato como ancestral; nova revisão Cassandra e aprovação explícita do novo SHA são obrigatórias, sem push/deploy.
