import test from 'node:test';
import assert from 'node:assert/strict';
import { onRequestGet as getStatus, onRequestPut as putStatus } from '../functions/api/status.js';
import { createToken } from '../lib/auth.js';

const ORIGIN = 'https://loja.example';
const SECRET = 'x'.repeat(40);
const BASE = { ADMIN_PASSWORD: 'senha-certa-local-123', COOKIE_SECRET: SECRET };

const request = ({ method = 'GET', body, cookie, origin = ORIGIN } = {}) => new Request(`${ORIGIN}/api/status`, {
  method,
  headers: {
    'Content-Type': 'application/json',
    ...(origin ? { Origin: origin } : {}),
    ...(cookie ? { Cookie: `session=${cookie}` } : {}),
  },
  body: body === undefined ? undefined : JSON.stringify(body),
});

const loggedCookie = () => createToken(SECRET);
const unavailable = async response => {
  assert.equal(response.status, 503);
  assert.deepEqual(await response.json(), {
    status: 'unavailable', updatedAt: null,
    error: 'Serviço temporariamente indisponível.',
  });
  assert.equal(response.headers.get('Cache-Control'), 'no-store');
};

const envWithGet = get => ({ ...BASE, SABOR_SORRISO_KV: { get } });

test('GET sem binding retorna indisponível sem assumir aberto', async () => {
  await unavailable(await getStatus({ env: BASE }));
});

test('GET falha, trava e valores inválidos retornam indisponível', async t => {
  await t.test('get lança erro', async () => unavailable(await getStatus({ env: envWithGet(async () => { throw new Error('provider'); }) })));
  await t.test('get trava e respeita timeout', async () => {
    const started = Date.now();
    const response = await getStatus({ env: envWithGet(() => new Promise(() => {})) });
    assert.ok(Date.now() - started >= 2900);
    await unavailable(response);
  });
  for (const value of [null, '', 'garbage', '{}', '{"status":"busy"}', '{"status":null}']) {
    await t.test(`valor inválido ${String(value)}`, async () => unavailable(await getStatus({ env: envWithGet(async () => value) })));
  }
});

test('GET aceita legado simples e JSON open/closed', async () => {
  for (const [raw, expected] of [['open', 'open'], ['closed', 'closed'], ['{"status":"open","updatedAt":"2026-01-01T00:00:00.000Z"}', 'open'], ['{"status":"closed","updatedAt":123}', 'closed']]) {
    const response = await getStatus({ env: envWithGet(async () => raw) });
    assert.equal(response.status, 200);
    const data = await response.json();
    assert.equal(data.status, expected);
    assert.equal(data.updatedAt, raw.startsWith('{') ? JSON.parse(raw).updatedAt : null);
    assert.equal(response.headers.get('Cache-Control'), 'no-store');
  }
});

test('PUT sem binding/falha/trava retorna 503 genérico', async t => {
  const cookie = await loggedCookie();
  const baseRequest = () => request({ method: 'PUT', body: { status: 'closed' }, cookie });
  await t.test('binding ausente', async () => {
    const response = await putStatus({ request: baseRequest(), env: BASE });
    assert.equal(response.status, 503);
    assert.deepEqual(await response.json(), { error: 'Serviço temporariamente indisponível.' });
  });
  await t.test('put lança erro sem expor provider', async () => {
    const env = { ...BASE, SABOR_SORRISO_KV: { put: async () => { throw new Error('provider secret'); } } };
    const response = await putStatus({ request: baseRequest(), env });
    assert.equal(response.status, 503);
    assert.deepEqual(await response.json(), { error: 'Serviço temporariamente indisponível.' });
  });
  await t.test('put trava e respeita timeout', async () => {
    const env = { ...BASE, SABOR_SORRISO_KV: { put: () => new Promise(() => {}) } };
    const response = await putStatus({ request: baseRequest(), env });
    assert.equal(response.status, 503);
    assert.deepEqual(await response.json(), { error: 'Serviço temporariamente indisponível.' });
  });
});

test('PUT mantém autenticação, origem, validação e contrato de sucesso', async () => {
  const calls = [];
  const env = { ...BASE, SABOR_SORRISO_KV: { put: async (...args) => calls.push(args) } };
  assert.equal((await putStatus({ request: request({ method: 'PUT', body: { status: 'closed' } }), env })).status, 401);
  const cookie = await loggedCookie();
  assert.equal((await putStatus({ request: request({ method: 'PUT', body: { status: 'closed' }, cookie, origin: 'https://malicioso.example' }), env })).status, 403);
  assert.equal((await putStatus({ request: request({ method: 'PUT', body: { status: 'invalid' }, cookie }), env })).status, 400);
  const response = await putStatus({ request: request({ method: 'PUT', body: { status: 'closed' }, cookie }), env });
  assert.equal(response.status, 200);
  const data = await response.json();
  assert.equal(data.success, true);
  assert.equal(data.status, 'closed');
  assert.match(data.updatedAt, /^\d{4}-\d{2}-\d{2}T/);
  assert.equal(calls.length, 1);
});
