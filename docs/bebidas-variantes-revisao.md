# Catálogo revisado para Cassandra

Branch local limpa baseada em `733673319b162ffa1142d62a1bc07d1cf2d6eb63`, sem incorporar commits intermediários locais. Sem push ou deploy. Todas as fotos antigas do PDF foram excluídas conforme esclarecimento de João; permanecem somente as sete fotos próprias de bebidas confirmadas no [mapa atual](fotos-produtos/mapa-publico.md).

## Preços aprovados dos combos

| Item | Preço final (R$) |
|---|---:|
| Combo 01 | 25 |
| Combo 02 | 48 |
| Combo 03 | 65 |
| Combo 04 | 73 |
| Combo 05 | 78 |
| Combo 06 | 113 |
| Combo 07 | 128 |
| Combo 08 | 98 |
| Mini 01 | 32 |
| Dupla Perfeita 02 | 60 |
| Bomba de Sabor 03 | 103 |
| Explosão de Sabor 04 | 138 |
| Brutal 05 | 152 |

Composições e IDs permanecem intactos. A categoria artesanais não recebeu aumento por generalização.

## Bimbo, variantes e compatibilidade

“Pão Bimbo” corrige somente as cinco descrições X Cheddar 01–05 da Linha Cheddar. Não se alteram outros ingredientes ou a grafia dos hambúrgueres comuns por generalização.

Fanta 2 L Uva/Laranja compartilha o ID original `bebidas-fanta-2l`, com sabor distinguindo as variantes, a R$ 13 cada e sem ressalva de preço. Carrinhos legados sem sabor continuam “sabor a confirmar”. Os 66 registros e IDs originais permanecem, com 70 combinações no catálogo e 71 na apresentação das duas Fantas 2 L.

H2OH! mantém nome revisado, volume 500 ml e ID legado `bebidas-h2o-600ml`; a foto avulsa de 1,5 L não é usada. Coca lata continua sem inventar volume. A nova Coca PET 2 L e a antiga Coca 600 ml usam somente suas fotos confirmadas, sem troca entre volumes.

## Testes e revisão

A fixture `tests/fixtures/menu-base-7336733.json` preserva os dados históricos. Testes cobrem preços, composições, Bimbo, variantes, migração de carrinho, fotos/alpha, ausência das fotos de teste, API e fluxos de administração existentes. Dependências preexistentes são reutilizadas, sem instalação ou alteração de lockfile. Os logs finais, diff, SHA e prévia acompanham a entrega externa à Cassandra. Nenhum pedido real é enviado pelos testes.
