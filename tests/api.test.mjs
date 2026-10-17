// Testes das Functions (rodam no Node 18+):  npm test
import test from 'node:test';
import { fakeLoginNamespace } from './helpers/login-namespace.mjs';
import assert from 'node:assert/strict';

import { onRequestPost as login } from '../functions/api/login.js';
import { onRequestPost as logout } from '../functions/api/logout.js';
import { onRequestGet as session } from '../functions/api/session.js';
import { onRequestGet as getStatus, onRequestPut as putStatus } from '../functions/api/status.js';
import { createToken, verifyToken, safeEqual } from '../lib/auth.js';

const ORIGIN = 'https://loja.example';
const SECRET = 'x'.repeat(40);

function fakeKV() {
  const map = new Map();
  return {
    map,
    get: async key => (map.has(key) ? map.get(key) : null),
    put: async (key, value) => { map.set(key, value); },
    delete: async key => { map.delete(key); },
  };
}
const makeEnv = () => ({ ADMIN_PASSWORD: 'senha-certa-local-123', COOKIE_SECRET: SECRET, SABOR_SORRISO_KV: fakeKV(), ADMIN_LOGIN_LIMITER: fakeLoginNamespace() });
const req = (path, { method = 'GET', body, cookie, origin = ORIGIN, ip = '1.1.1.1' } = {}) =>
  new Request(ORIGIN + path, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(origin ? { Origin: origin } : {}),
      ...(cookie ? { Cookie: cookie } : {}),
      'CF-Connecting-IP': ip,
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
const cookieOf = res => res.headers.get('Set-Cookie').split(';')[0];

async function loggedIn(env) {
  const res = await login({ request: req('/api/login', { method: 'POST', body: { password: 'senha-certa-local-123' } }), env });
  assert.equal(res.status, 200);
  return cookieOf(res);
}

test('token: válido, adulterado, expirado e lixo', async () => {
  const token = await createToken(SECRET);
  assert.equal(await verifyToken(token, SECRET), true);
  assert.equal(await verifyToken(token, 'outro-segredo-qualquer-com-32-caracteres!!'), false);
  const [p, s] = token.split('.');
  assert.equal(await verifyToken(`${p}x.${s}`, SECRET), false);
  assert.equal(await verifyToken(token, SECRET, Date.now() + 9 * 3600 * 1000), false);
  for (const junk of ['', 'abc', 'a.b', '..', '%%%.%%%', null, undefined]) {
    assert.equal(await verifyToken(junk, SECRET), false);
  }
});

test('safeEqual compara senhas', async () => {
  assert.equal(await safeEqual('abc', 'abc'), true);
  assert.equal(await safeEqual('abc', 'abd'), false);
  assert.equal(await safeEqual('abc', 'abcd'), false);
});

test('login: senha errada = 401, certa = cookie HttpOnly', async () => {
  const env = makeEnv();
  const bad = await login({ request: req('/api/login', { method: 'POST', body: { password: 'errada' } }), env });
  assert.equal(bad.status, 401);
  assert.equal(bad.headers.get('Set-Cookie'), null);

  const ok = await login({ request: req('/api/login', { method: 'POST', body: { password: 'senha-certa-local-123' } }), env });
  assert.equal(ok.status, 200);
  const header = ok.headers.get('Set-Cookie');
  assert.match(header, /HttpOnly/);
  assert.match(header, /Secure/);
  assert.match(header, /SameSite=Strict/);
});

test('login: corpo inválido, senha vazia e origem de outro site', async () => {
  const env = makeEnv();
  const raw = new Request(ORIGIN + '/api/login', { method: 'POST', headers: { Origin: ORIGIN }, body: 'nao-e-json' });
  assert.equal((await login({ request: raw, env })).status, 400);
  assert.equal((await login({ request: req('/api/login', { method: 'POST', body: { password: '' } }), env })).status, 400);
  assert.equal((await login({ request: req('/api/login', { method: 'POST', body: { password: 'senha-certa-local-123' }, origin: 'https://malicioso.com' }), env })).status, 403);
});

test('login: bloqueia após 5 erros (por IP) e libera outro IP', async () => {
  const env = makeEnv();
  for (let i = 0; i < 5; i += 1) {
    const res = await login({ request: req('/api/login', { method: 'POST', body: { password: 'x' + i } }), env });
    assert.equal(res.status, 401);
  }
  const blocked = await login({ request: req('/api/login', { method: 'POST', body: { password: 'senha-certa-local-123' } }), env });
  assert.equal(blocked.status, 429);
  const other = await login({ request: req('/api/login', { method: 'POST', body: { password: 'senha-certa-local-123' }, ip: '2.2.2.2' }), env });
  assert.equal(other.status, 200);
});

test('sem configuração, o login nunca autentica', async () => {
  const res = await login({ request: req('/api/login', { method: 'POST', body: { password: 'qualquer' } }), env: {} });
  assert.equal(res.status, 503);
  const weak = { ADMIN_PASSWORD: 'a', COOKIE_SECRET: 'curto' };
  assert.equal((await login({ request: req('/api/login', { method: 'POST', body: { password: 'a' } }), env: weak })).status, 503);
  assert.equal(await isAuth(req('/api/session'), {}), false);
});

const isAuth = async (request, env) => (await (await session({ request, env })).json()).authenticated;

test('session: false sem cookie, true com cookie válido, false com cookie falso', async () => {
  const env = makeEnv();
  assert.equal(await isAuth(req('/api/session'), env), false);
  const cookie = await loggedIn(env);
  assert.equal(await isAuth(req('/api/session', { cookie }), env), true);
  assert.equal(await isAuth(req('/api/session', { cookie: 'session=abc.def' }), env), false);
});

test('status: GET público, PUT só logado, valor validado', async () => {
  const env = makeEnv();
  let res = await getStatus({ env });
  assert.equal(res.status, 503);
  assert.deepEqual((await res.json()).status, 'unavailable');
  assert.equal(res.headers.get('Cache-Control'), 'no-store');

  res = await putStatus({ request: req('/api/status', { method: 'PUT', body: { status: 'closed' } }), env });
  assert.equal(res.status, 401);
  assert.equal(env.SABOR_SORRISO_KV.map.size, 0);

  const cookie = await loggedIn(env);
  res = await putStatus({ request: req('/api/status', { method: 'PUT', body: { status: 'invalid' }, cookie }), env });
  assert.equal(res.status, 400);

  res = await putStatus({ request: req('/api/status', { method: 'PUT', body: { status: 'closed' }, cookie, origin: 'https://malicioso.com' }), env });
  assert.equal(res.status, 403);

  res = await putStatus({ request: req('/api/status', { method: 'PUT', body: { status: 'closed' }, cookie }), env });
  assert.equal(res.status, 200);
  assert.equal((await (await getStatus({ env })).json()).status, 'closed');

  res = await putStatus({ request: req('/api/status', { method: 'PUT', body: { status: 'open' }, cookie }), env });
  assert.equal((await (await getStatus({ env })).json()).status, 'open');
});

test('status: aceita valor simples antigo e sinaliza falha do KV', async () => {
  const env = makeEnv();
  env.SABOR_SORRISO_KV.map.set('store_status', 'closed');
  assert.equal((await (await getStatus({ env })).json()).status, 'closed');
  const broken = { SABOR_SORRISO_KV: { get: async () => { throw new Error('KV fora do ar'); } } };
  const res = await getStatus({ env: broken });
  assert.equal(res.status, 503);
  assert.equal((await res.json()).status, 'unavailable');
});

test('logout apaga o cookie', async () => {
  const res = await logout({ request: req('/api/logout', { method: 'POST' }) });
  assert.match(res.headers.get('Set-Cookie'), /Max-Age=0/);
});
