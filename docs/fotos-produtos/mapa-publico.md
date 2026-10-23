# Mapa público — associações atuais de fotos para revisão

## Produtos

| ID | Asset |
|---|---|
| `artesanais-artesanal-02` | `/img/produtos/artesanal-02.webp` |
| `artesanais-artesanal-03` | `/img/produtos/artesanal-03-1.webp` |
| `artesanais-artesanal-03` | `/img/produtos/artesanal-03-2.webp` |
| `artesanais-artesanal-04` | `/img/produtos/artesanal-04.webp` |
| `linha-cheddar-x-cheddar-03` | `/img/produtos/cheddar-03.webp` |
| `linha-cheddar-x-cheddar-05` | `/img/produtos/cheddar-05.webp` |
| `combos-combo-02` | `/img/produtos/combo-02.webp` |
| `combos-combo-03` | `/img/produtos/combo-03.webp` |
| `combos-combo-05` | `/img/produtos/combo-04.webp` |
| `combos-combo-06` | `/img/produtos/combo-06.webp` |

Os dez arquivos são WebP RGBA com fundo removido; o RGB visível vem das fontes autorizadas, com a única exceção do retoque localizado de câmera no arquivo `combo-04.webp`. Artesanal 03 tem duas fotos no mesmo ID para galeria. A associação de `combo-04.webp` ao Combo 05 segue a confirmação em áudio da Janei; a entrada antiga do manifesto de proveniência é histórica, não a associação exibida neste candidato.

## Autorização e ressalvas — revisão da Cassandra pendente

- **Artesanal 04 — `foto-003` / `artesanal-04.webp`:** há duas unidades visíveis, uma inteira à esquerda e outra cortada à direita. A fonte mostra luvas pretas em contato com os pães. No derivado, a maior parte das luvas ficou fora do recorte; permanece um pequeno resíduo escuro/cinza junto ao topo do pão da unidade cortada à direita, no ponto de contato da luva. Não se trata de uma luva inteira visível sobre o pão no recorte. A associação permanece com essa ressalva; a foto não confirma que o SKU vendido inclua duas unidades.
- **Combo 05 — `combo-04.webp`:** arquivo originalmente atribuído ao Combo 04 e retocado apenas para remover a marca de câmera “moto g31”, conforme autorização registrada. O retoque permanece restrito à borda inferior da bandeja, no retângulo `[104, 942, 238, 963)`; alpha e pixels fora da região são preservados. A confirmação posterior em áudio da Janei supersede a atribuição anterior: a imagem pertence ao Combo 05, e Combo 04 não tem foto.

Artesanal 04 permanece byte a byte inalterado, sem reconstrução do pão. Combo 04 recebe apenas o aviso genérico de foto indisponível; a foto acima aparece somente no Combo 05. O manifesto de proveniência histórica não foi reescrito. Cassandra revisará o novo SHA e a prévia; João deve aprovar explicitamente o SHA final antes de qualquer publicação. Sem push ou deploy.

## Bebidas mantidas

| ID | Asset |
|---|---|
| `bebidas-guarana-antartica-lata` | `/img/guarana-antarctica-350ml.png` |
| `bebidas-fanta-laranja-lata` | `/img/fanta-laranja-350ml.png` |
| `bebidas-fanta-uva-lata` | `/img/fanta-uva-350ml.png` |
| `bebidas-kuat-2l` | `/img/kuat-2l.png` |
| `bebidas-coca-cola-600ml` | `/img/coca-cola-600ml.png` |
| `bebidas-coca-cola-lata` | `/img/coca-cola-lata.png` |
| `bebidas-coca-cola-2l` | `/img/coca-cola-2l.png` |

As 8 fotos restantes do PDF têm `asset: null` e permanecem pendentes fora de `public/`. H2OH! 1,5 L segue sem associação ao item de 500 ml; Fanta 2 L mantém o ícone neutro. O manifesto conserva hashes das sete bebidas sem alteração.
