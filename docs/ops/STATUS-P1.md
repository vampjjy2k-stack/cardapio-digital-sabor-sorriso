# Status da loja — aberta, fechada ou indisponível

Patch separado, aplicado **depois do P0 de login**, somente para revisão. Não foi publicado. A proteção de login não volta a depender do KV.

## Quando o status é confiável

`GET /api/status` só responde 200 com `open` ou `closed` quando o KV retorna um desses estados válidos. Aceita o formato JSON existente e os valores legados simples `open`/`closed`.

Binding `SABOR_SORRISO_KV` ausente, erro, timeout de 3 segundos, valor vazio, chave ainda não inicializada, JSON inválido ou estado desconhecido retornam **503**, `status: "unavailable"`, `updatedAt: null`, erro genérico e `Cache-Control: no-store`. Não há valor padrão aberto. Uma loja nova precisa ter seu estado inicial gravado explicitamente por operação administrativa autorizada; este patch não inicializa nem altera KV remoto. Não registre credenciais nem conteúdo de exceções de infraestrutura.

A gravação continua limitada a sessão válida, mesma origem e estados `open`/`closed`. Falhas de gravação também retornam 503 genérico, sem falso sucesso. Um timeout não consegue garantir cancelamento de uma operação KV já enviada: a gravação pode terminar depois; por isso o painel exibe estado desconhecido, não afirma que a loja permaneceu como estava.

## Recuperação de `store_status` vazio ou inválido

A recuperação é uma operação manual e deliberada: somente **operador com autorização de negócio e login administrativo válido** pode executá-la. Binding, segredos e Durable Object de proteção de login já devem ter sido provisionados por administrador fora desta tarefa. A recuperação **não requer token de API da Cloudflare** e não adiciona rota nem relaxa guards: usa a rota existente `PUT /api/status`, na mesma origem, após o login normal.

Quando o painel estiver em `unavailable`, a alternância fica desabilitada. Siga os passos exatos do [procedimento operacional](RECUPERACAO-KV.md): confirmar manutenção e autorização, escolher explicitamente um estado e executar no console do navegador do próprio painel. Recomenda-se `closed` como estado inicial seguro. **Nunca abrir automaticamente**: `open` só pode ser enviado quando o operador o escolher explicitamente e confirmar a autorização comercial. Não coloque senha, cookie, token ou segredo no snippet, em logs ou em tickets.

Depois do PUT, um 200 confirma apenas que a escrita foi aceita pela API; faça um `GET /api/status` posterior para conferir o valor observado. KV é eventualmente consistente: uma leitura pode permanecer `unavailable` ou antiga por algum tempo. Em timeout, erro ou resposta não-OK, mantenha a loja indisponível, não repita abertura automaticamente e não conclua que a gravação não ocorreu; pare, aguarde a janela de propagação e confirme por GET. Se a recuperação falhar, mantenha a manutenção até nova tentativa manual autorizada.

## Mudança mínima nos consumidores

O cardápio inicia bloqueado enquanto verifica o status. Erro de rede, timeout, resposta HTTP não-OK, JSON inválido, resposta degradada ou estado desconhecido exibem “Status indisponível” e impedem o envio, inclusive se a última leitura havia sido aberta. Abertura do carrinho reconfirma o status e bloqueia enquanto aguarda. Uma resposta antiga não pode sobrescrever o resultado de consulta mais nova. O guard de envio também exige status confirmado como aberto, não apenas um botão habilitado.

O painel não mostra “ABERTA”/“FECHADA” quando não sabe o estado e desabilita a alternância. Ao falhar uma gravação, deixa de apresentar o estado anterior como certeza. Recarregue para consultar novamente quando o serviço recuperar.

Os únicos arquivos públicos alterados são `public/script.js` e `public/admin.js`, estritamente para refletir e bloquear o estado desconhecido. Não há redesenho, alteração de HTML/CSS, produtos, preços, cálculo, mensagem de pedido, telefone ou regras comerciais. A possibilidade de envio agora depende da confirmação de status, como exige a correção P1.

## Limites que permanecem

O KV continua com consistência eventual, e o polling permanece em 60 segundos. Esta correção impede que **uma falha observada** seja interpretada como aberta; não promete confirmação em tempo real nem elimina uma leitura válida porém antiga do KV. Uma leitura confirmada aberta pode continuar válida no navegador até a próxima consulta. Para eliminar totalmente essa defasagem seria necessário mudar a fonte autoritativa e o fluxo de confirmação, fora deste patch.

Os testes de navegador interceptam `/api/status`, simulam sessão administrativa e substituem `window.open`; não enviam WhatsApp nem pedidos reais. A suíte backend testa os handlers diretamente. Não houve integração com KV de produção, teste em aparelho físico ou publicação.

## Como validar

```sh
npm ci
npm test
npm run test:ui
```

A suíte nova inclui ausência/falha/timeout do KV, dados inválidos, compatibilidade legada, falha de gravação, bloqueio público e administrativo, recuperação, consulta lenta e respostas fora de ordem. Consulte os logs de antes/depois e o resumo da entrega para os resultados exatos.
