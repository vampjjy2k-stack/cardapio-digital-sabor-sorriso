import test from 'node:test';
import assert from 'node:assert/strict';
import { onRequestGet, onRequestPut } from '../functions/api/status.js';
import { createToken, SESSION_TTL_MS } from '../lib/auth.js';

const ORIGIN = 'https://loja.example';
const SECRET = 'local-recovery-test-secret-that-is-long-enough';
const BASE = { ADMIN_PASSWORD: 'senha-local-recovery-123', COOKIE_SECRET: SECRET };
const makeRequest = ({ method = 'GET', status, cookie, origin = ORIGIN } = {}) => new Request(`${ORIGIN}/api/status`, {
  method,
  headers: {
    ...(origin ? { Origin: origin } : {}),
    ...(cookie ? { Cookie: `session=${cookie}` } : {}),
    ...(method === 'PUT' ? { 'Content-Type': 'application/json' } : {}),
  },
  body: method === 'PUT' ? JSON.stringify({ status }) : undefined,
});
const unavailable = async response => {
  assert.equal(response.status, 503);
  assert.equal((await response.json()).status, 'unavailable');
};

test('recuperação exige estado explícito e só closed/open válidos', async () => {
  const calls = [];
  const env = { ...BASE, SABOR_SORRISO_KV: {
    async get() { return null; },
    async put(...args) { calls.push(args); },
  } };
  const token = await createToken(SECRET);
  await unavailable(await onRequestGet({ env }));
  assert.equal((await onRequestPut({ request: makeRequest({ method: 'PUT', status: undefined, cookie: token }), env })).status, 400);
  assert.equal((await onRequestPut({ request: makeRequest({ method: 'PUT', status: 'busy', cookie: token }), env })).status, 400);
  assert.equal((await onRequestPut({ request: makeRequest({ method: 'PUT', status: 'closed', cookie: token }), env })).status, 200);
  assert.equal((await onRequestPut({ request: makeRequest({ method: 'PUT', status: 'open', cookie: token }), env })).status, 200);
  assert.deepEqual(calls.map(([key, value]) => [key, JSON.parse(value).status]), [['store_status', 'closed'], ['store_status', 'open']]);
});

test('GET nunca escreve; ausência, cookie adulterado/expirado e origem diferente mantêm indisponível', async () => {
  let writes = 0;
  const env = { ...BASE, SABOR_SORRISO_KV: {
    async get() { return ''; },
    async put() { writes += 1; },
  } };
  await unavailable(await onRequestGet({ env }));
  const valid = await createToken(SECRET);
  const expired = await createToken(SECRET, Date.now() - SESSION_TTL_MS - 1);
  for (const request of [
    makeRequest({ method: 'PUT', status: 'open' }),
    makeRequest({ method: 'PUT', status: 'open', cookie: `${valid}tampered` }),
    makeRequest({ method: 'PUT', status: 'open', cookie: expired }),
    makeRequest({ method: 'PUT', status: 'open', cookie: valid, origin: 'https://outro.example' }),
  ]) assert.ok([401, 403].includes((await onRequestPut({ request, env })).status));
  assert.equal(writes, 0);
  await unavailable(await onRequestGet({ env }));
});

test('falha de escrita continua indisponível e não expõe detalhes', async () => {
  const token = await createToken(SECRET);
  const env = { ...BASE, SABOR_SORRISO_KV: { async get() { return null; }, async put() { throw new Error('fixture only'); } } };
  const response = await onRequestPut({ request: makeRequest({ method: 'PUT', status: 'closed', cookie: token }), env });
  assert.equal(response.status, 503);
  assert.deepEqual(await response.json(), { error: 'Serviço temporariamente indisponível.' });
  await unavailable(await onRequestGet({ env }));
});
