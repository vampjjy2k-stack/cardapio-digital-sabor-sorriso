import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

import { onRequestPost as login } from '../functions/api/login.js';
import { onRequestPost as logout } from '../functions/api/logout.js';
import { onRequestGet as session } from '../functions/api/session.js';
import { verifyToken } from '../lib/auth.js';
import { AdminLoginLimiter } from '../workers/admin-login-limiter.js';

const ORIGIN = 'https://loja.example';
const PASSWORD = 'senha-teste-local-123';
const SECRET = 's'.repeat(48);
const OTHER_SECRET = 'o'.repeat(48);
const SESSION = 'session';

function responseJson(response) {
  return response.json();
}

function request(path = '/api/login', {
  body = { password: PASSWORD },
  ip = '1.1.1.1',
  cookie,
  origin = ORIGIN,
  method = 'POST',
  contentType = 'application/json',
} = {}) {
  const headers = {
    ...(contentType ? { 'Content-Type': contentType } : {}),
    ...(origin ? { Origin: origin } : {}),
    'CF-Connecting-IP': ip,
    ...(cookie ? { Cookie: cookie } : {}),
  };
  const init = { method, headers };
  if (body !== undefined && method !== 'GET' && method !== 'HEAD') {
    init.body = typeof body === 'string' ? body : JSON.stringify(body);
  }
  return new Request(`${ORIGIN}${path}`, {
    ...init,
  });
}

class SerializedStorage {
  constructor() {
    this.values = new Map();
    this.tail = Promise.resolve();
  }

  async transaction(callback) {
    const run = this.tail.then(async () => {
      const transaction = {
        get: async key => this.values.get(key),
        put: async (key, value) => { this.values.set(key, value); },
        delete: async key => { this.values.delete(key); },
      };
      return callback(transaction);
    });
    this.tail = run.catch(() => {});
    return run;
  }
}

function makeLimiterNamespace({ mode = 'real', response = null } = {}) {
  const objects = new Map();
  const storages = new Map();
  const namespace = {
    objects,
    storages,
    idFromName(name) {
      return { name };
    },
    get(id) {
      if (mode === 'throw-get') throw new Error('limiter indisponível');
      return {
        async fetch(input, init) {
          if (mode === 'throw-fetch') throw new Error('stub indisponível');
          if (mode === 'invalid-response') return new Response('{"allowed":"yes"}', { status: 200 });
          if (mode === 'custom-response') return response;
          let storage = storages.get(id.name);
          if (!storage) {
            storage = new SerializedStorage();
            storages.set(id.name, storage);
          }
          let object = objects.get(id.name);
          if (!object) {
            object = new AdminLoginLimiter({ storage }, {});
            objects.set(id.name, object);
          }
          return object.fetch(typeof input === 'string' ? new Request(input, init) : input);
        },
      };
    },
  };
  return namespace;
}

function makeEnv(overrides = {}) {
  return {
    ADMIN_PASSWORD: PASSWORD,
    COOKIE_SECRET: SECRET,
    ADMIN_LOGIN_LIMITER: makeLimiterNamespace(),
    ...overrides,
  };
}

function cookiePair(response) {
  const header = response.headers.get('Set-Cookie');
  assert.ok(header, 'login bem-sucedido deve emitir Set-Cookie');
  return header.split(';', 1)[0];
}

function tokenFromCookie(cookie) {
  assert.match(cookie, /^session=.+$/);
  return cookie.slice(`${SESSION}=`.length);
}

async function loginWith(env, options = {}) {
  return login({ request: request('/api/login', options), env });
}

function assertNoCookie(response) {
  assert.equal(response.headers.get('Set-Cookie'), null);
}

const exampleVars = readFileSync(new URL('../.dev.vars.example', import.meta.url), 'utf8');
const examplePassword = exampleVars.match(/^ADMIN_PASSWORD=(.*)$/m)?.[1] ?? '';
const exampleSecret = exampleVars.match(/^COOKIE_SECRET=(.*)$/m)?.[1] ?? '';

test('configuração ausente, vazia, branca, curta ou placeholder responde 503 genérico e sem cookie', async () => {
  const cases = [
    null,
    { ADMIN_PASSWORD: '', COOKIE_SECRET: SECRET },
    { ADMIN_PASSWORD: '   ', COOKIE_SECRET: SECRET },
    { ADMIN_PASSWORD: PASSWORD, COOKIE_SECRET: '' },
    { ADMIN_PASSWORD: PASSWORD, COOKIE_SECRET: ' '.repeat(32) },
    { ADMIN_PASSWORD: PASSWORD, COOKIE_SECRET: 'x'.repeat(31) },
    { ADMIN_PASSWORD: examplePassword, COOKIE_SECRET: SECRET },
    { ADMIN_PASSWORD: PASSWORD, COOKIE_SECRET: exampleSecret },
    { ADMIN_PASSWORD: 'troque-por-uma-senha-forte', COOKIE_SECRET: 'troque-por-um-texto-aleatorio-com-mais-de-32-caracteres' },
  ];
  for (const invalid of cases) {
    const response = await loginWith(invalid === null ? {} : { ...makeEnv(), ...invalid });
    assert.equal(response.status, 503, JSON.stringify(invalid));
    assertNoCookie(response);
    const body = await responseJson(response);
    assert.equal(typeof body.error, 'string');
    assert.doesNotMatch(body.error, /ADMIN_PASSWORD|COOKIE_SECRET|troque|senha incorreta/i);
  }
});

test('senha fixture válida autentica, cria cookie de sessão seguro e sessão aceita o token', async () => {
  const env = makeEnv();
  const response = await loginWith(env);
  assert.equal(response.status, 200);
  const cookie = cookiePair(response);
  assert.match(response.headers.get('Set-Cookie'), /HttpOnly/);
  assert.match(response.headers.get('Set-Cookie'), /SameSite=Strict/);
  assert.match(response.headers.get('Set-Cookie'), /Max-Age=28800/);
  assert.match(response.headers.get('Set-Cookie'), /Secure/);
  assert.equal((await responseJson(response)).success, true);
  assert.equal((await responseJson(await session({ request: request('/api/session', { method: 'GET', cookie }), env }))).authenticated, true);
  assert.equal(await verifyToken(tokenFromCookie(cookie), SECRET), true);
});

test('senha errada retorna 401 sem cookie; entrada inválida não conta como falha de senha', async () => {
  const env = makeEnv();
  const wrong = await loginWith(env, { body: { password: 'senha-incorreta-123' } });
  assert.equal(wrong.status, 401);
  assertNoCookie(wrong);
  for (const body of [{}, { password: '' }, { password: 123 }, { password: 'x'.repeat(201) }]) {
    const invalid = await loginWith(env, { body });
    assert.equal(invalid.status, 400);
    assertNoCookie(invalid);
  }
});

test('cinco falhas por IP dão 401, sexta é bloqueada inclusive com senha certa, e retry-after é inteiro', async () => {
  const env = makeEnv();
  for (let i = 0; i < 5; i += 1) assert.equal((await loginWith(env, { body: { password: `errada-${i}` } })).status, 401);
  const blocked = await loginWith(env);
  assert.equal(blocked.status, 429);
  assert.match(blocked.headers.get('Retry-After') ?? '', /^\d+$/);
  assertNoCookie(blocked);
});

test('concorrência de 30 falhas no mesmo IP é serializada pelo DO: exatamente 5x401 e 25x429', async () => {
  const env = makeEnv();
  const responses = await Promise.all(Array.from({ length: 30 }, (_, i) => loginWith(env, { body: { password: `paralela-${i}` } })));
  assert.equal(responses.filter(r => r.status === 401).length, 5);
  assert.equal(responses.filter(r => r.status === 429).length, 25);
  responses.filter(r => r.status === 429).forEach(assertNoCookie);
});

test('IPs independentes e sucesso limpa falhas antes do limite', async () => {
  const env = makeEnv();
  for (let i = 0; i < 4; i += 1) assert.equal((await loginWith(env, { ip: '10.0.0.1', body: { password: `x-${i}` } })).status, 401);
  assert.equal((await loginWith(env, { ip: '10.0.0.2', body: { password: PASSWORD } })).status, 200);
  assert.equal((await loginWith(env, { ip: '10.0.0.1', body: { password: PASSWORD } })).status, 200);
  for (let i = 0; i < 5; i += 1) assert.equal((await loginWith(env, { ip: '10.0.0.1', body: { password: `again-${i}` } })).status, 401);
  assert.equal((await loginWith(env, { ip: '10.0.0.1', body: { password: PASSWORD } })).status, 429);
});

test('binding ausente, falha de namespace, resposta inválida e erro do stub são 503 sem cookie', async () => {
  const cases = [
    null,
    { ADMIN_LOGIN_LIMITER: makeLimiterNamespace({ mode: 'throw-get' }) },
    { ADMIN_LOGIN_LIMITER: makeLimiterNamespace({ mode: 'throw-fetch' }) },
    { ADMIN_LOGIN_LIMITER: makeLimiterNamespace({ mode: 'invalid-response' }) },
    { ADMIN_LOGIN_LIMITER: { idFromName: () => ({ name: 'x' }), get: () => ({ fetch: async () => new Response(JSON.stringify({ allowed: true, authenticated: 'yes' })) }) } },
  ];
  for (const overrides of cases) {
    const env = overrides === null ? { ADMIN_PASSWORD: PASSWORD, COOKIE_SECRET: SECRET } : { ...makeEnv(), ...overrides };
    const response = await loginWith(env);
    assert.equal(response.status, 503);
    assertNoCookie(response);
  }
});

test('duas instâncias do handler compartilham namespace e reinicialização do DO preserva storage', async () => {
  const namespace = makeLimiterNamespace();
  const env = makeEnv({ ADMIN_LOGIN_LIMITER: namespace });
  for (let i = 0; i < 4; i += 1) assert.equal((await loginWith(env, { body: { password: `persist-${i}` } })).status, 401);
  const objectKey = [...namespace.objects.keys()][0];
  const firstObject = namespace.objects.get(objectKey);
  namespace.objects.delete(objectKey);
  assert.notEqual(namespace.objects.get(objectKey), firstObject);
  assert.equal((await loginWith(env, { body: { password: 'persist-final' } })).status, 401);
  assert.equal((await loginWith(env, { body: { password: PASSWORD } })).status, 429);
});

test('cookie adulterado ou expirado não autentica; logout apaga o cookie sem revogação server-side', async () => {
  const env = makeEnv();
  const cookie = cookiePair(await loginWith(env));
  const [payload, signature] = tokenFromCookie(cookie).split('.');
  const tampered = `${SESSION}=${payload}x.${signature}`;
  assert.equal((await responseJson(await session({ request: request('/api/session', { method: 'GET', cookie: tampered }), env }))).authenticated, false);
  assert.equal(await verifyToken(tokenFromCookie(cookie), SECRET, Date.now() + 8 * 60 * 60 * 1000 + 1), false);
  const loggedOut = await logout({ request: request('/api/logout', { cookie }) });
  assert.equal(loggedOut.status, 200);
  assert.match(loggedOut.headers.get('Set-Cookie') ?? '', /Max-Age=0/);
  assert.equal((await responseJson(await session({ request: request('/api/session', { method: 'GET', cookie }), env }))).authenticated, true);
});

test('segredo diferente não valida cookie emitido pelo segredo original', async () => {
  const env = makeEnv();
  const cookie = cookiePair(await loginWith(env));
  const other = makeEnv({ COOKIE_SECRET: OTHER_SECRET });
  assert.equal((await responseJson(await session({ request: request('/api/session', { method: 'GET', cookie }), env: other }))).authenticated, false);
});
