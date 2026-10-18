# Fotos autorizadas — mapa Athena FINAL

O mapa Athena FINAL autoriza **10 fotos reais do PDF**, correspondentes a **9 IDs** (Artesanal 03 possui duas fotos para o mesmo ID). Os dez derivados estão em `public/img/produtos/` como WebP lossless RGBA, com fundo removido por máscaras determinísticas conservadoras. O RGB visível é preservado da fonte; não houve IA nem pixels inventados.

## Fotos autorizadas

- Artesanal 02 → `artesanais-artesanal-02` (`artesanal-02.webp`)
- Artesanal 03 foto 1 e foto 2 → `artesanais-artesanal-03` (`artesanal-03-1.webp`, `artesanal-03-2.webp`)
- Artesanal 04 → `artesanais-artesanal-04` (`artesanal-04.webp`)
- Cheddar 03 → `linha-cheddar-x-cheddar-03` (`cheddar-03.webp`)
- Cheddar 05 → `linha-cheddar-x-cheddar-05` (`cheddar-05.webp`)
- Combo 02, 03, 04 e 06 → `combos-combo-02`, `combos-combo-03`, `combos-combo-04`, `combos-combo-06`.

As máscaras preservam lanche, embalagem e conjuntos quando presentes e removem mesa, chão, cena externa e mão somente onde a separação era segura. Os cortes são conservadores; bordas com transparência parcial são antialias da máscara, não conteúdo criado.

## Pendências e bebidas

As outras 8 fotos do PDF ficam com `item_id` e `asset` nulos, `pending` explícito e **fora de `public/`**. H2OH! avulsa de 1,5 L também fica fora: não representa o item legado de 500 ml. As sete bebidas existentes permanecem intactas, com seus hashes de proveniência preservados no manifesto. Fanta 2 L continua sem foto própria.

O [mapa público](mapa-publico.md) lista os dez derivados e as sete bebidas. O [manifesto](associacoes.json) registra dimensões, modo, hashes e status de cada fonte/asset. PDF, originais, máscaras e scripts continuam fora do repositório.
