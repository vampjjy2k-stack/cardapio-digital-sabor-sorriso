# Cardápio Digital — Sabor & Sorriso (v4)

> **Revisão P0 de login, sem publicação:** leia [LOGIN-P0.md](LOGIN-P0.md). O login agora exige senha de 12+ caracteres e o binding `ADMIN_LOGIN_LIMITER` de um Worker Durable Object separado. A receita histórica de publicação abaixo não basta sem esse serviço; placeholders são rejeitados.

Cardápio estático + **status Aberto/Fechado centralizado** (Cloudflare Pages + Functions + KV).
A dona da loja abre/fecha em `/admin` com senha; o status vale para todos os clientes ao mesmo tempo.

## Estrutura

```
public/            site publicado (index, style, script, admin.html/css/js, img, _headers, _routes.json)
functions/api/     login.js · logout.js · session.js · status.js   (Cloudflare Functions)
lib/auth.js        sessão assinada (HMAC), senha em tempo constante, limite de tentativas
tests/             testes automáticos das Functions  →  npm test
wrangler.toml      configuração do Pages (KV)
```

> **Importante:** arrastar a pasta no painel da Cloudflare (Direct Upload) **não publica a pasta `functions`**.
> Use **Git** (recomendado) ou o **Wrangler**, como abaixo.

## Publicar (uma vez)

Requer Node 18+ e conta Cloudflare.

```bash
npm install
npx wrangler login

# 1) Crie o KV e cole o "id" mostrado em wrangler.toml (campo id)
npx wrangler kv namespace create SABOR_SORRISO_KV

# 2) Crie o projeto
npx wrangler pages project create sabor-sorriso --production-branch main

# 3) Cadastre os segredos (digite quando pedir)
#    ADMIN_PASSWORD = senha exclusiva da dona da loja (12+ caracteres, não placeholder)
#    COOKIE_SECRET  = texto aleatório com 32+ caracteres (ex.: openssl rand -base64 48)
npx wrangler pages secret put ADMIN_PASSWORD --project-name sabor-sorriso
npx wrangler pages secret put COOKIE_SECRET  --project-name sabor-sorriso

# 4) Publique
npm run deploy
```

Para publicar por Git: conecte o repositório em Workers & Pages → Pages, com
*Build command* vazio e *Build output directory* = `public`. Faça os passos 1 e 3 igual.

Depois de publicado: abra `https://SEU-SITE.pages.dev/admin`.

## Uso diário

Abra `/admin` no celular → entre com a senha → **Fechar a loja** / **Abrir a loja**.
Os clientes veem a mudança em até ~1 minuto (ou ao reabrir/voltar à aba). Fechada, o cardápio
continua visível, mas o envio do pedido fica bloqueado e aparece um aviso.
(O KV da Cloudflare pode levar até ~60 s para propagar entre regiões.)

## Testar no computador

```bash
cp .dev.vars.example .dev.vars   # edite a senha e o segredo
npm run dev                      # http://localhost:8788  e  /admin
npm test                         # testes automáticos das Functions
```

## Segurança (resumo)

- Senha só no servidor (segredo da Cloudflare); o navegador recebe um cookie `HttpOnly`, `Secure`, `SameSite=Strict`, válido por 8 h.
- Comparação de senha em tempo constante; **5 erros por IP → bloqueio de 15 min**.
- Alterar o status exige login **e** pedido vindo do próprio site (proteção extra contra CSRF).
- Sem `ADMIN_PASSWORD` (12+), `COOKIE_SECRET` (32+) e `ADMIN_LOGIN_LIMITER` válidos, o login não cria sessão (503 genérico).
- `_routes.json` limita as Functions a `/api/*`: imagens, CSS e JS continuam estáticos (não gastam a cota de Functions).

## Antes de publicar: ajustes de endereço

`index.html` ainda tem o endereço antigo (`cardapiosaboresorriso.netlify.app`) em `canonical`, `og:url`,
`og:image` e `twitter:image`. Troque pelo endereço novo (`*.pages.dev` ou domínio próprio).

## WhatsApp

Pedidos vão para **+55 (21) 99579-2519** (`WHATSAPP_NUMBER` em `public/script.js`, só dígitos com DDD).
