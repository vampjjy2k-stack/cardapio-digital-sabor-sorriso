import test from 'node:test';
import assert from 'node:assert/strict';
import { onRequestPost as login } from '../functions/api/login.js';
import { AdminLoginLimiter } from '../workers/admin-login-limiter.js';
import { fakeLoginNamespace } from './helpers/login-namespace.mjs';
import { isConfigured, LOGIN_WINDOW_SECONDS } from '../lib/auth.js';

const password = 'senha-teste-local-123';
const secret = 'test-only-cookie-signing-value-1234567890';
const request = value => new Request('https://loja.example/api/login', {
  method: 'POST', headers: { Origin: 'https://loja.example', 'CF-Connecting-IP': '192.0.2.4' }, body: JSON.stringify({ password: value }),
});
const env = () => ({ ADMIN_PASSWORD: password, COOKIE_SECRET: secret, ADMIN_LOGIN_LIMITER: fakeLoginNamespace() });

test('configuração exige 12 caracteres úteis e nunca aceita exemplos/placeholders', () => {
  for (const value of [undefined, '', ' '.repeat(30), 'x'.repeat(11), 'troque-por-uma-senha-forte', 'change-me-password', 'your_password_here']) {
    assert.equal(isConfigured({ ADMIN_PASSWORD: value, COOKIE_SECRET: secret }), false);
  }
  assert.equal(isConfigured({ ADMIN_PASSWORD: 'x'.repeat(12), COOKIE_SECRET: secret }), true);
});

test('configuração e login alinham máximo de 200; 201, vazio e ausência falham fechados', async t => {
  for (const [label, value, configured] of [
    ['200 caracteres', 'x'.repeat(200), true],
    ['201 caracteres', 'x'.repeat(201), false],
    ['vazia', '', false],
    ['ausente', undefined, false],
    ['201 incluindo espaços', `${'x'.repeat(199)}  `, false],
  ]) {
    await t.test(label, async () => {
      let decisions = 0;
      const bindings = { ...env(), ADMIN_PASSWORD: value };
      const namespace = bindings.ADMIN_LOGIN_LIMITER;
      bindings.ADMIN_LOGIN_LIMITER = {
        idFromName: name => { decisions++; return namespace.idFromName(name); },
        get: id => namespace.get(id),
      };
      if (value === undefined) delete bindings.ADMIN_PASSWORD;
      assert.equal(isConfigured(bindings), configured);
      const response = await login({ request: request(value), env: bindings });
      assert.equal(response.status, configured ? 200 : 503);
      assert.equal(decisions, configured ? 1 : 0);
      if (configured) assert.ok(response.headers.get('Set-Cookie'));
      else {
        assert.equal(response.headers.get('Set-Cookie'), null);
        assert.deepEqual(await response.json(), { error: 'Serviço temporariamente indisponível.' });
      }
    });
  }
});

test('payload 200 chega à comparação; 201, vazio e ausência são 400 sem consumir tentativa', async () => {
  let decisions = 0;
  const bindings = env();
  const namespace = bindings.ADMIN_LOGIN_LIMITER;
  bindings.ADMIN_LOGIN_LIMITER = {
    idFromName: name => { decisions++; return namespace.idFromName(name); },
    get: id => namespace.get(id),
  };
  for (const value of ['x'.repeat(201), '', undefined]) {
    const response = await login({ request: request(value), env: bindings });
    assert.equal(response.status, 400);
    assert.equal(response.headers.get('Set-Cookie'), null);
    assert.deepEqual(await response.json(), { error: 'Requisição inválida.' });
  }
  assert.equal(decisions, 0);
  const response = await login({ request: request('x'.repeat(200)), env: bindings });
  assert.equal(response.status, 401);
  assert.equal(response.headers.get('Set-Cookie'), null);
  assert.equal(decisions, 1);
});

test('regressão KV: cinco falhas concorrentes não perdem contagem mesmo se KV só devolver zero', async () => {
  const bindings = env();
  // Simula leituras concorrentes/stale do KV antigo: todas veem o mesmo valor.
  bindings.SABOR_SORRISO_KV = { get: async () => '0', put: async () => {}, delete: async () => {} };
  const responses = await Promise.all(Array.from({ length: 5 }, () => login({ request: request('incorreta'), env: bindings })));
  assert.ok(responses.every(r => r.status === 401));
  const blocked = await login({ request: request(password), env: bindings });
  assert.equal(blocked.status, 429);
  assert.equal(blocked.headers.get('Set-Cookie'), null);
});

test('janela original é 900s desde última falha; bloqueios não renovam e expiração libera', async () => {
  assert.equal(LOGIN_WINDOW_SECONDS, 900);
  const originalNow = Date.now;
  let now = 1_000_000;
  const values = new Map();
  const txn = { get: async key => values.get(key), put: async (key, value) => values.set(key, value), delete: async key => values.delete(key) };
  const object = new AdminLoginLimiter({ storage: { transaction: callback => callback(txn) } });
  const decide = valid => object.fetch(new Request('https://internal/decide', { method: 'POST', body: JSON.stringify({ authenticated: valid }) }));
  try {
    Date.now = () => now;
    await decide(false);
    now += 100_000;
    for (let i = 0; i < 4; i++) await decide(false);
    const expiration = values.get('attempts').expiresAt;
    assert.equal(expiration, now + 900_000);
    now += 50_000;
    assert.deepEqual(await (await decide(true)).json(), { allowed: false, retryAfter: 850 });
    assert.equal(values.get('attempts').expiresAt, expiration);
    now = expiration;
    assert.deepEqual(await (await decide(true)).json(), { allowed: true, authenticated: true });
    assert.equal(values.has('attempts'), false);
  } finally { Date.now = originalNow; }
});

test('storage indisponível ou corrompido falha fechado sem vazar exceção', async () => {
  for (const storage of [
    { transaction: async () => { throw new Error('sensitive provider detail'); } },
    { transaction: callback => callback({ get: async () => ({ count: 'bad', expiresAt: 1 }) }) },
  ]) {
    const object = new AdminLoginLimiter({ storage });
    const response = await object.fetch(new Request('https://internal/', { method: 'POST', body: JSON.stringify({ authenticated: true }) }));
    assert.equal(response.status, 503);
    assert.deepEqual(await response.json(), { error: 'Serviço temporariamente indisponível.' });
  }
});

test('timeout do binding retorna 503, nunca autentica e não registra segredos', async () => {
  const bindings = env();
  bindings.ADMIN_LOGIN_LIMITER = { idFromName: name => name, get: () => ({ fetch: () => new Promise(() => {}) }) };
  const original = console.error;
  const logs = [];
  console.error = (...args) => logs.push(args);
  try {
    const result = await login({ request: request(password), env: bindings });
    assert.equal(result.status, 503);
    assert.equal(result.headers.get('Set-Cookie'), null);
    assert.deepEqual(logs, []);
  } finally { console.error = original; }
});
