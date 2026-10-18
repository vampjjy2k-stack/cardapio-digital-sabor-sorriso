# Sabor & Sorriso — V4 refinada para revisão

A cópia recebeu um acabamento artesanal e acolhedor, com modernidade discreta. **É uma entrega de interface para revisão, não uma liberação de produção.** Não houve deploy, mudança de credenciais ou intervenção na loja publicada.

## Segunda rodada — nomes acessíveis dos ingredientes

Os botões mantêm os textos visíveis “Ver mais” e “Ver menos”. O nome acessível agora é “Ver mais ingredientes de [produto]” ao iniciar/recolher e “Ver menos ingredientes de [produto]” ao expandir. O estado expandido usa o próprio texto visível para compor o rótulo. A aparência e os demais fluxos da cópia refinada foram mantidos.

Foi acrescentado teste para os rótulos iniciais de todos os controles de ingredientes, os nomes acessíveis dos controles visíveis e o ciclo completo de expansão/recolhimento de X Tudo, incluindo `aria-expanded` e a associação `aria-controls`. Controles ocultos, quando a descrição não está truncada, não são tratados como expostos à árvore de acessibilidade.

O patch `sabor-e-sorriso-v4-refinamento-ui-rodada2.patch` é cumulativo: inclui a primeira entrega e esta correção e deve ser aplicado sobre uma cópia limpa da V4 original. Não reaplique esse patch inteiro sobre uma cópia que já recebeu a primeira rodada. A cópia de trabalho refinada já contém a correção; o ZIP da primeira rodada não foi reemitido nesta alteração.

## O que mudou

- Hierarquia do topo, busca, espaçamentos, superfícies quentes e cards mais consistentes, usando somente a marca, as imagens e as cores já existentes.
- Categorias, botões e controles com estados de foco e toque mais claros; status da loja mantido visível também em 320px.
- Confirmação breve ao adicionar, avisos ao alterar/remover itens e proteção contra confirmação falsa no limite de 99 unidades.
- Resumo com quantidade, entrega/retirada e pagamento; subtotal, taxa existente e total preservados. Orientação de que ainda é preciso enviar a mensagem no WhatsApp e aguardar a confirmação da loja.
- Busca com anúncio de resultados para tecnologia assistiva, ingredientes expansíveis associados ao texto, campos obrigatórios de endereço sinalizados programaticamente, foco dentro do carrinho, Escape com retorno ao controle anterior e movimento reduzido sem animações.

## O que foi preservado

Produtos, descrições, preços, categorias, destaque de combos, opções de tamanho, busca sem acentos, armazenamento do carrinho, temas, entrega/retirada, pagamento e destino do WhatsApp. Não foram adicionados rastreadores, fontes de terceiros novas nem bibliotecas de execução no site.

`functions/`, `lib/`, arquivos administrativos, cabeçalhos de segurança, imagens e configuração Cloudflare permanecem iguais à V4 recebida. As dependências adicionadas são de desenvolvimento para testes.

## Validação concluída

**10/10 testes originais de API e 13/13 testes de interface passaram**, por `npm run test:all`, na segunda rodada. O caso de KV fora do ar imprime um erro esperado no teste de API e termina aprovado; não é erro de console do frontend.

A suíte de interface verifica larguras 320, 390 e 1440px nos dois temas, sem transbordamento horizontal; busca e restauração das categorias; tamanho de vitamina e preço; adicionar, aumentar, diminuir, remover, limpar e persistir; limite de 99; entrega/endereço/retirada; taxa de cartão; resumo; texto e destino do WhatsApp; loja fechada; Tab/Shift+Tab/Escape; foco; movimento reduzido; ausência de erros de console e execução no fluxo coberto.

**Limites da evidência:** testes executados em Chromium local. O status da loja é simulado e as fontes externas são substituídas pela fonte do sistema. O teste intercepta `window.open` para conferir a URL e a mensagem, sem enviar pedido ou abrir o serviço externo. As prévias em `review/` refletem esse ambiente. Não houve integração com Cloudflare real, teste em aparelho físico, Safari/Firefox, processamento de pagamento ou auditoria completa de acessibilidade.

## Pendências que impedem chamar o projeto de pronto para produção

O bloqueio de login apontado pela Cassandra **continua pendente e não foi corrigido pelo refinamento visual**. Também não foram alterados os riscos previamente registrados da proteção de tentativas de login, revogação de sessão e comportamento de status que pode assumir loja aberta em falhas. Passar nos testes existentes não elimina essas fragilidades.

A Cassandra deve revisar esses pontos em uma etapa própria, além de aprovar o visual em aparelho real. Endereço público e metadados antigos permanecem como no original; qualquer atualização/publicação depende de decisão posterior. Preço e condições comerciais ficam com Têmis.

## Como reproduzir sem publicar

Com Node.js, npm e Python 3 instalados:

```bash
npm ci
# Se não houver Chromium no computador:
npx playwright install chromium
npm run test:all
```

O teste usa `/usr/bin/chromium` quando disponível; em outro ambiente usa o navegador instalado pelo Playwright. Também aceita `CHROMIUM_PATH`. O servidor de teste fica limitado a `127.0.0.1:4173` e é encerrado ao fim da suíte. Ele não substitui o backend.

Para executar o projeto com suas Functions locais, siga a seção local do README original, configure apenas credenciais de desenvolvimento e use `npm run dev`. Não execute o comando de deploy para revisar esta entrega.

O ZIP é a cópia completa sem dependências instaladas nem segredos. O patch complementar contém código, testes e esta documentação; aplique com `git apply --check` e depois `git apply` em uma cópia limpa da V4. As imagens de prévia e o log de validação acompanham o ZIP, não o patch.
