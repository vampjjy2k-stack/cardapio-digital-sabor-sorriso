import test from 'node:test';
import assert from 'node:assert/strict';
import { build } from 'esbuild';
import { Miniflare, convertV4MiniflareOptions } from 'miniflare';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const PASSWORD = 'senha-teste-local-123';
const COOKIE_SECRET = 'runtime-test-only-not-a-production-secret-123456789';
const bundle = async options => (await build({ bundle: true, write: false, format: 'esm', platform: 'browser', ...options })).outputFiles[0].text;
const app = await bundle({ stdin: { contents: `
import { onRequestPost as login } from './functions/api/login.js';
import { onRequestGet as session } from './functions/api/session.js';
import { onRequestPost as logout } from './functions/api/logout.js';
export default { fetch(request, env) {
const path = new URL(request.url).pathname;
return (path === '/api/session' ? session : path === '/api/logout' ? logout : login)({request, env});
}};`, resolveDir: process.cwd() } });
const limiter = await bundle({ entryPoints: ['workers/admin-login-limiter.js'] });
const makeRuntime = (path, { noBinding = false, broken = false, slow = false, invalid = false } = {}) => new Miniflare(convertV4MiniflareOptions({
  resourcePersistencePath: path,
  workers: [
    { name: 'pages', modules: true, script: app, compatibilityDate: '2025-09-01',
      bindings: { ADMIN_PASSWORD: PASSWORD, COOKIE_SECRET },
      durableObjects: noBinding ? {} : { ADMIN_LOGIN_LIMITER: { className: 'AdminLoginLimiter', scriptName: 'limiter', useSQLite: true } } },
    { name: 'limiter', modules: true, compatibilityDate: '2025-09-01',
      script: slow ? 'export class AdminLoginLimiter {async fetch(){await new Promise(resolve=>setTimeout(resolve,4000));return Response.json({allowed:true,authenticated:true})}}; export default {fetch(){return new Response("Not found",{status:404})}}' : invalid ? 'export class AdminLoginLimiter {fetch(){return Response.json({allowed:true})}}; export default {fetch(){return new Response("Not found",{status:404})}}' : broken ? 'export class AdminLoginLimiter {fetch(){throw new Error("unavailable")}}; export default {fetch(){return new Response("Not found",{status:404})}}' : limiter,
      durableObjects: { ADMIN_LOGIN_LIMITER: { className: 'AdminLoginLimiter', useSQLite: true } } },
    { name: 'pages-replica', modules: true, script: app, compatibilityDate: '2025-09-01',
      bindings: { ADMIN_PASSWORD: PASSWORD, COOKIE_SECRET },
      durableObjects: noBinding ? {} : { ADMIN_LOGIN_LIMITER: { className: 'AdminLoginLimiter', scriptName: 'limiter', useSQLite: true } } },
  ],
}));
const attempt = (mf, password, ip = '203.0.113.1') => mf.dispatchFetch('https://loja.example/api/login', {
  method: 'POST', headers: { Origin: 'https://loja.example', 'CF-Connecting-IP': ip, 'Content-Type': 'application/json' }, body: JSON.stringify({ password }),
});

test('runtime workerd/SQLite: 40 falhas concorrentes, IP independente e persistência após reinício', async () => {
  const path = await mkdtemp(join(tmpdir(), 'login-runtime-'));
  let mf = makeRuntime(path);
  try {
    const replica = await mf.getWorker('pages-replica');
    const responses = await Promise.all(Array.from({ length: 40 }, (_, i) => i % 2 === 0
      ? attempt(mf, 'incorreta') : replica.fetch('https://loja.example/api/login', {
        method: 'POST', headers: { 'CF-Connecting-IP': '203.0.113.1' },
        body: JSON.stringify({ password: 'incorreta' }),
      })));
    assert.equal(responses.filter(r => r.status === 401).length, 5);
    assert.equal(responses.filter(r => r.status === 429).length, 35);
    assert.ok(responses.every(r => !r.headers.has('Set-Cookie')));
    assert.equal((await attempt(mf, PASSWORD)).status, 429);
    const ok = await attempt(mf, PASSWORD, '203.0.113.2');
    assert.equal(ok.status, 200);
    const cookie = ok.headers.get('Set-Cookie');
    assert.match(cookie, /HttpOnly/); assert.match(cookie, /Secure/); assert.match(cookie, /SameSite=Strict/); assert.match(cookie, /Max-Age=28800/);
    const session = await mf.dispatchFetch('https://loja.example/api/session', { headers: { Cookie: cookie.split(';')[0] } });
    assert.deepEqual(await session.json(), { authenticated: true });
    const publicWorker = await mf.getWorker('limiter');
    assert.equal((await publicWorker.fetch('https://limiter.example/decide')).status, 404);
    await mf.dispose();
    mf = makeRuntime(path);
    assert.equal((await attempt(mf, PASSWORD)).status, 429);
  } finally { await mf.dispose(); await rm(path, { recursive: true, force: true }); }
});

for (const mode of ['noBinding', 'broken', 'slow', 'invalid']) {
  test(`runtime: ${mode} impede login válido sem emitir sessão`, async () => {
    const mf = makeRuntime(undefined, { [mode]: true });
    try {
      const response = await attempt(mf, PASSWORD);
      assert.equal(response.status, 503);
      assert.equal(response.headers.get('Set-Cookie'), null);
      assert.deepEqual(await response.json(), { error: 'Serviço temporariamente indisponível.' });
    } finally { await mf.dispose(); }
  });
}
