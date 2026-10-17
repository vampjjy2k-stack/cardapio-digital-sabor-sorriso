# Recuperação manual de `store_status`

Procedimento para a chave vazia, ausente ou inválida. **Não é bootstrap automático.** Só execute com autorização de negócio registrada e estando autenticado no painel como operador autorizado.

## Pré-condições e segurança

- O binding `SABOR_SORRISO_KV`, os segredos de sessão e o Durable Object de proteção de login já foram provisionados por administrador fora deste procedimento.
- Não é necessário token de API da Cloudflare, acesso ao dashboard da Cloudflare ou CLI.
- Faça o login normal no painel, pela mesma origem da loja. Não cole senha, cookie, token ou segredo no console.
- Coordene com o responsável a suspensão comercial de pedidos durante a intervenção e registre quem a autorizou. Este patch não implementa um interruptor global de manutenção: `unavailable` bloqueia quem observa a falha, mas clientes podem ter uma leitura antiga `open`. Não confie apenas na tela para garantir suspensão universal. Enquanto o painel exibir `unavailable`, o controle deve permanecer desabilitado.
- Escolha o estado **antes** do PUT. Recomenda-se `closed` para bootstrap/recuperação; `open` é permitido somente por escolha explícita e autorização comercial explícita. Nunca derive `open` de erro, vazio, timeout, ausência de binding ou falha de leitura.

O aplicativo atual não tem papéis distintos nem MFA: a permissão técnica é uma sessão administrativa HMAC válida, emitida pelo login normal com proteção DO disponível e configuração válida. A autorização comercial do operador é controlada pelo responsável fora do aplicativo. Não há grant separado de bootstrap. Se faltar binding/segredo, o login falhar ou o KV estiver indisponível, interrompa e escale ao administrador de infraestrutura; este procedimento não contorna essas restrições nem cria recursos.

## Passos exatos no console do navegador

1. Abra o painel administrativo da própria loja e conclua o login normal.
2. Confirme visualmente que a origem na barra de endereço é a origem oficial do painel e que a loja está em manutenção.
3. Abra DevTools → **Console**. Não habilite colagem de credenciais e não cole qualquer valor secreto.
4. Execute **somente** este comando para recuperar de forma conservadora como fechada:

```js
fetch('/api/status', {
  method: 'PUT',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ status: 'closed' })
}).then(async response => ({ httpStatus: response.status, body: await response.json() }))
```

5. Interprete o resultado sem imprimir cabeçalhos de requisição, cookies ou exceções. O esperado é `httpStatus: 200` e `body.status: "closed"`. Qualquer 401/403/400/503, erro de rede ou corpo inesperado é falha: pare e mantenha a manutenção.
6. Se houver autorização comercial para abrir, não reutilize nem edite automaticamente o comando anterior. Confirme manualmente a decisão e execute, como uma operação separada e deliberada, o mesmo comando trocando **apenas** o corpo para:

```js
body: JSON.stringify({ status: 'open' })
```

O valor `open` nunca deve ser enviado por retry automático, por fallback ou como consequência de uma resposta indisponível.
7. Após a escrita, confirme por uma leitura posterior, sem alterar nada:

```js
fetch('/api/status', { cache: 'no-store' })
  .then(async response => ({ httpStatus: response.status, body: await response.json() }))
```

Espere `httpStatus: 200` com o estado escolhido. Não grave o resultado bruto em ticket/log se ele contiver contexto sensível; registre apenas horário, operador autorizado, estado deliberadamente escolhido e códigos HTTP.
8. Se o GET continuar 503/`unavailable`, retornar estado diferente ou falhar, pare. Não repita a abertura e não trate um timeout como prova de que a escrita não ocorreu. Aguarde a janela de consistência eventual do KV e faça uma nova confirmação manual; em caso de dúvida, deixe `closed`/manutenção.
9. Só retire a manutenção depois de uma confirmação posterior coerente e de uma verificação funcional autorizada. Recarregue o painel para atualizar sua leitura; o polling não é confirmação instantânea.

## Operação após timeout ou falha

KV tem consistência eventual. O timeout de três segundos limita a resposta, mas não cancela uma operação KV já enviada; ela pode concluir depois. Portanto, após timeout, erro ou resposta não-OK:

- não assuma sucesso nem falso sucesso;
- não faça retry automático;
- não envie `open` como recuperação;
- pare, mantenha a loja indisponível/manutenção e confirme depois por `GET /api/status`;
- se uma nova escrita for realmente necessária, faça-a somente como ação manual autorizada, com estado escolhido explicitamente.

Este documento descreve o uso da rota existente e não cria rota, não relaxa autenticação/origem e não fornece acesso a produção.
