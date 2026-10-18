# Fotos autorizadas — somente bebidas

João esclareceu que **todas as 18 fotos do PDF eram testes e devem ser excluídas**. Nenhuma foto de alimento do PDF integra `public/`, `ITEM_PHOTOS` ou os novos commits desta branch. Os itens de comida usam as ilustrações herdadas da base pública. Artesanal 04 e Combo 04 também estão excluídos; não houve retoque ou reconstrução.

A branch local `review/catalogo-limpo-7336733` reúne as mudanças aprovadas em um único commit filho direto de `733673319b162ffa1142d62a1bc07d1cf2d6eb63`, sem a cadeia local que continha fontes. O commit final é identificado no pacote externo de revisão. Não houve push, deploy, force ou alteração de main/remotos.

## Sete fotos mantidas

Somente as fotos enviadas separadamente e confirmadas: Guaraná Antártica 350 ml, Fanta Laranja 350 ml, Fanta Uva 350 ml, Kuat 2 L, Coca 600 ml, Coca lata transparente e nova Coca PET 2 L transparente. Todas são byte a byte iguais ao snapshot aprovado reaplicado. Garrafa, tampa e rótulo da Coca PET 2 L foram preservados, sem retoque nesta rodada.

O [mapa público](mapa-publico.md) lista os sete assets. O [manifesto](associacoes.json) conserva hashes de proveniência externos, com todos os registros do PDF explicitamente excluídos e sem asset/ID efetivo. Nomes de fontes são metadados, não arquivos publicados.

H2OH! avulsa de 1,5 L fica fora: não representa o item 500 ml, cujo ID legado permanece `bebidas-h2o-600ml`. Fanta 2 L mantém ícone neutro; nenhum caso ambíguo ganhou foto.

## Catálogo e limites

Preços dos combos, Fanta 2 L a R$ 13 e Bimbo restrito aos cinco itens da Linha Cheddar permanecem como aprovados. IDs, volumes, ingredientes e composições foram preservados. API, administração, autenticação, configuração e demais assets herdados da base pública não foram modificados. Consulte [o resumo do catálogo](../bebidas-variantes-revisao.md).

PDF, originais extraídos e fotos avulsas continuam intactos fora do repositório. Não há fonte original ou script de preparo dependente de caminho local na árvore. A antiga branch e os objetos/reflogs locais foram preservados, mas seus commits não são ancestrais da branch limpa. Não publicar branches antigas, `--all`, `--mirror` ou bundles do repositório compartilhado.

## Verificação

Sem instalar dependências: `npm test`, `npm run test:ui -- --workers=1`, `node --check public/script.js` e `git diff --check`. Os testes verificam ausência das 18 fotos do PDF, sete associações de bebidas, hashes/alpha, preços, variantes, IDs, carrinho e fluxos existentes. O pacote externo contém logs finais, SHA, patch, prévia e auditoria de ancestralidade para Cassandra; os testes não autorizam publicação.
