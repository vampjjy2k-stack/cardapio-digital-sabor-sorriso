# Login administrativo — bloqueio P0

Esta alteração é para revisão na cópia de trabalho. Não foi publicada. O patch P0 não altera arquivos públicos, pedidos nem o status da loja; o P1 será um patch separado.

## O que passa a ser obrigatório

- `ADMIN_PASSWORD`: segredo somente no servidor, pelo menos 12 caracteres úteis e no máximo 200 unidades UTF-16 (`String.length`, incluindo espaços), não vazio/branco nem placeholder conhecido. Configuração e rota usam a mesma constante `MAX_PASSWORD_LENGTH`; não há truncamento nem normalização da senha. Acima de 200 a configuração é inválida e o login retorna 503 sem cookie. Os valores de `.dev.vars.example` são deliberadamente rejeitados; substitua-os por valores exclusivos de desenvolvimento, nunca commite `.dev.vars`.
- `COOKIE_SECRET`: segredo somente no servidor, pelo menos 32 caracteres úteis, também não placeholder. A sessão assinada continua válida por 8 horas.
- `ADMIN_LOGIN_LIMITER`: binding Durable Object de classe `AdminLoginLimiter`, exportada pelo Worker separado `sabor-sorriso-admin-login-limiter`. O namespace usa armazenamento SQLite e a migração `v1` de `wrangler.login-limiter.toml`.
- O KV `SABOR_SORRISO_KV` permanece somente para status. Sua presença, ausência ou consistência não libera nem controla o login.

Pages não hospeda classes Durable Object diretamente: o Worker separado e o binding externo são necessários. O arquivo `wrangler.toml` já declara a ligação pelo `script_name`. Em uma implantação futura aprovada, será necessário criar o Worker com a migração, vincular o namespace ao Pages de cada ambiente e configurar os segredos do Pages antes de liberar o painel. **Nenhuma dessas ações remotas foi executada nesta tarefa.** Não reutilize namespace de testes/preview com produção, nem crie namespaces diferentes para réplicas do mesmo ambiente.

Fontes oficiais: [bindings Pages/DO e desenvolvimento local](https://developers.cloudflare.com/pages/functions/bindings/#durable-objects) e [transações persistentes](https://developers.cloudflare.com/durable-objects/api/sqlite-storage-api/).

## Política preservada

A V4 já define `MAX_FAILED_LOGINS = 5` e `LOGIN_WINDOW_SECONDS = 15 * 60` em `lib/auth.js`; o período não está ausente. São 5 falhas por IP, com expiração de 900 segundos **desde a última falha aceita**, como o TTL renovado pelo código anterior. A quinta falha recebe 401; da sexta tentativa em diante retorna 429, inclusive com senha correta. Tentativas bloqueadas não renovam o período; `Retry-After` informa o tempo restante. Sucesso antes do bloqueio limpa as falhas. Corpo inválido continua 400 e não conta como senha incorreta.

Cada IP chega sempre ao mesmo objeto por uma chave SHA-256. Sem `CF-Connecting-IP`, usa-se um bucket comum conservador, não uma isenção. Em produção esse cabeçalho deve vir da infraestrutura Cloudflare, não de um proxy que preserve um valor arbitrário do cliente.

A comparação da senha permanece em tempo constante no Pages. O objeto recebe somente `{authenticated: boolean}`, nunca a senha, o segredo de sessão ou o IP bruto. Uma única transação decide bloqueio, incremento ou reset; não existe a antiga sequência separada verificar/ler/escrever. O Worker não expõe rota pública (`workers_dev = false`, sem rotas; handler público devolve 404).

## Falhas e sessão

Configuração inválida, binding ausente, exceção, timeout de 3s, resposta inválida ou falha de storage retornam 503 genérico e **nenhum cookie**. Não há fallback KV/memória nem logs de credenciais ou exceções no caminho de login. O worker pode terminar uma transação após um timeout do chamador; isso pode consumir uma tentativa, mas jamais autoriza uma sessão no chamador que falhou.

Cookies continuam `HttpOnly`, `Secure` em HTTPS, `SameSite=Strict`, `Path=/`, `Max-Age=28800`; HMAC, expiração e rejeição de token adulterado foram preservados. O logout apaga o cookie do navegador; **não revoga uma cópia já capturada do token**. Introduzir revogação server-side não faz parte deste P0. Sessões existentes não passam a depender da disponibilidade do limitador; o bloqueio fail-closed vale para a emissão de novos logins. Configuração de segredo inválida impede também a autenticação de sessão.

A base examinada já recusava segredo ausente/vazio, mas aceitava senha curta/branca e os placeholders de exemplo. Os testes de configuração reforçam esses casos; não se afirma que a aceitação de senha literalmente vazia foi reproduzida nesta cópia. Os defeitos de ausência de proteção e perda de contagem concorrente são reproduzidos na base anterior.

## Reproduzir sem publicar

Node.js 22+ (validação executada em Node 24), npm e dependências do lockfile:

```sh
npm ci
npm test
# Somente runtime local workerd + Durable Objects SQLite:
npm run test:runtime
```

Os testes unitários usam adaptadores de storage explicitamente simulados. `tests/login-runtime.test.mjs` executa o código real em Miniflare/workerd, com dois Workers e namespace SQLite persistente local: 40 falhas concorrentes devem produzir exatamente 5 respostas 401 e 35 respostas 429, persistindo o bloqueio após reiniciar o runtime. Não acessam conta, KV ou credenciais de produção.

Para exercitar manualmente Functions + binding local, substitua os placeholders de `.dev.vars` por valores locais não versionados e use dois terminais:

```sh
npm run dev:limiter
# Em outro terminal, na mesma cópia:
npm run dev
```

Não execute scripts de publicação para revisar. A configuração existente do KV ainda contém um ID placeholder e só serve como modelo; não foi alterada para um recurso real. A suíte de build/teste local e os logs de antes/depois acompanham a entrega para Cassandra.

## Checklist para uma implantação futura aprovada (não executada)

1. Escolher recursos/namespace separados para staging e produção; configurar nomes correspondentes no `script_name` do Pages e `name` do Worker.
2. Somente após revisão e autorização de publicação, provisionar o Worker e sua migração: `npx wrangler deploy --config wrangler.login-limiter.toml`. Não adicionar rotas públicas.
3. Configurar `ADMIN_PASSWORD` e `COOKIE_SECRET` como segredos do Pages e `ADMIN_LOGIN_LIMITER` como binding do namespace `AdminLoginLimiter` do Worker correto, em cada ambiente.
4. Publicar o Pages somente depois do Worker; validar em staging login correto, cinco falhas, sessão e indisponibilidade. Os comandos históricos do README não substituem esta ordem.
5. Não migrar contadores de KV como se fossem exatos; na troca de mecanismo, planejar a janela de manutenção para não transformar o rollout em bypass de bloqueios ativos. O patch não efetua rollout nem zera contadores remotos.

O script local `dev` explicita `--do ADMIN_LOGIN_LIMITER=AdminLoginLimiter@sabor-sorriso-admin-login-limiter` para conectar o Pages ao Worker iniciado por `dev:limiter`.

## Segunda revisão — fronteiras de configuração e entrada

`tests/login-boundaries.test.mjs` comprova configuração com 200 aceita e login correto 200 com cookie; com 201, vazia ou ausente, `isConfigured` recusa e o login retorna 503 genérico, sem cookie nem acesso ao limitador. Inclui 201 unidades com espaços finais para impedir divergência por `trim()` no máximo. Com configuração válida, payload de 200 chega à comparação (401 se incorreto), enquanto 201, vazio e ausente recebem 400, sem cookie e sem consumir tentativa. O mínimo útil de 12 e a política do segredo de cookie são preservados. As fixtures são exclusivamente locais.
