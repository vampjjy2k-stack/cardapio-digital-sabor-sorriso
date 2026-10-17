import test from 'node:test';
import assert from 'node:assert/strict';
import { build } from 'esbuild';
import { Miniflare, convertV4MiniflareOptions } from 'miniflare';
import { createToken, SESSION_TTL_MS } from '../lib/auth.js';

const SECRET = 'status-runtime-only-signing-key-not-for-production-123';
const script = (await build({ bundle: true, write: false, format: 'esm', platform: 'browser', stdin: {
  resolveDir: process.cwd(), contents: `
import {onRequestGet, onRequestPut} from './functions/api/status.js';
export default {fetch(request,env){return (request.method === 'PUT' ? onRequestPut : onRequestGet)({request,env});}};`,
} })).outputFiles[0].text;

const url = 'https://loja.example/api/status';
const put = (cookie, status, extra = {}) => ({ method: 'PUT', headers: {
  Cookie: `session=${cookie}`, Origin: extra.origin ?? 'https://loja.example', 'Content-Type': 'application/json',
}, body: JSON.stringify({ status }) });

async function makeMf() {
  return new Miniflare(convertV4MiniflareOptions({ modules: true, script,
    compatibilityDate: '2025-09-01', kvNamespaces: ['SABOR_SORRISO_KV'],
    bindings: { ADMIN_PASSWORD: 'senha-local-runtime-123', COOKIE_SECRET: SECRET },
    kvPersist: false,
  }));
}

test('runtime workerd/KV: vazio/inválido fica indisponível e GET não escreve', async () => {
  const mf = await makeMf();
  try {
    const ns = await mf.getKVNamespace('SABOR_SORRISO_KV');
    for (const value of [null, '', 'garbage', '{"status":"busy"}']) {
      await ns.delete('store_status');
      if (value !== null) await ns.put('store_status', value);
      const response = await mf.dispatchFetch(url);
      assert.equal(response.status, 503);
      assert.equal((await response.json()).status, 'unavailable');
      assert.equal(await ns.get('store_status'), value);
    }
  } finally { await mf.dispose(); }
});

test('runtime workerd/KV: sem auth, cookie adulterado/expirado e origem diferente não escrevem', async () => {
  const mf = await makeMf();
  try {
    const ns = await mf.getKVNamespace('SABOR_SORRISO_KV');
    const before = await ns.get('store_status');
    const valid = await createToken(SECRET);
    const expired = await createToken(SECRET, Date.now() - SESSION_TTL_MS - 1);
    const cases = [
      { request: { method: 'PUT', headers: { Origin: 'https://loja.example', 'Content-Type': 'application/json' }, body: JSON.stringify({ status: 'open' }) } },
      { request: put(`${valid}x`, 'open') },
      { request: put(expired, 'open') },
      { request: put(valid, 'open', { origin: 'https://malicioso.example' }) },
      { request: put(valid, 'busy') },
      { request: put(valid, undefined) },
    ];
    for (const { request } of cases) {
      const response = await mf.dispatchFetch(url, request);
      assert.ok([400, 401, 403].includes(response.status));
    }
    assert.equal(await ns.get('store_status'), before);
    assert.equal((await mf.dispatchFetch(url)).status, 503);
  } finally { await mf.dispose(); }
});

test('runtime workerd/KV: closed recupera; open somente por PUT explícito', async () => {
  const mf = await makeMf();
  try {
    const token = await createToken(SECRET);
    const ns = await mf.getKVNamespace('SABOR_SORRISO_KV');
    for (const initial of [null, '', 'garbage', '{"status":"busy"}']) {
      await ns.delete('store_status');
      if (initial !== null) await ns.put('store_status', initial);
      assert.equal((await mf.dispatchFetch(url)).status, 503);
      const written = await mf.dispatchFetch(url, put(token, 'closed'));
      assert.equal(written.status, 200);
      const data = await written.json();
      assert.equal(data.status, 'closed');
      assert.match(data.updatedAt, /^\d{4}-\d{2}-\d{2}T/);
      let response = await mf.dispatchFetch(url);
      assert.equal(response.status, 200);
      assert.equal(response.headers.get('Cache-Control'), 'no-store');
      assert.equal((await response.json()).status, 'closed');
      assert.equal((await mf.dispatchFetch(url, put(token, 'open'))).status, 200);
      response = await mf.dispatchFetch(url);
      assert.equal(response.status, 200);
      assert.equal((await response.json()).status, 'open');
    }
  } finally { await mf.dispose(); }
});
