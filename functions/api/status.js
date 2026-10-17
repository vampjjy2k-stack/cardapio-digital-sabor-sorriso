// /api/status
//   GET  → público: { status: "open" | "closed" | "unavailable", updatedAt }
//   PUT  → só com login: { "status": "open" | "closed" }
// O KV é a única fonte da verdade: vale para todos os celulares ao mesmo tempo.

import { json, isAuthenticated, isSameOrigin } from '../../lib/auth.js';

const KEY = 'store_status';

const UNAVAILABLE = {
  status: 'unavailable',
  updatedAt: null,
  error: 'Serviço temporariamente indisponível.',
};

// KV não oferece cancelamento: o timeout limita a resposta, não desfaz gravação.
async function withKvTimeout(operation) {
  let timer;
  try {
    return await Promise.race([
      operation(),
      new Promise((_, reject) => {
        timer = setTimeout(() => reject(new Error('KV timeout')), 3000);
      }),
    ]);
  } finally {
    clearTimeout(timer);
  }
}

async function readStatus(env) {
  const raw = await withKvTimeout(() => env.SABOR_SORRISO_KV.get(KEY));
  if (raw === 'open' || raw === 'closed') return { status: raw, updatedAt: null };
  if (typeof raw !== 'string' || raw.trim() === '') throw new Error('Invalid KV value');
  const data = JSON.parse(raw);
  if (!data || typeof data !== 'object' || (data.status !== 'open' && data.status !== 'closed')) {
    throw new Error('Invalid KV value');
  }
  return { status: data.status, updatedAt: data.updatedAt ?? null };
}

export async function onRequestGet({ env }) {
  if (!env.SABOR_SORRISO_KV || typeof env.SABOR_SORRISO_KV.get !== 'function') return json(UNAVAILABLE, 503);
  try {
    return json(await readStatus(env));
  } catch {
    return json(UNAVAILABLE, 503);
  }
}

export async function onRequestPut({ request, env }) {
  if (!(await isAuthenticated(request, env))) return json({ error: 'Não autorizado.' }, 401);
  if (!isSameOrigin(request)) return json({ error: 'Origem não permitida.' }, 403);
  if (!env.SABOR_SORRISO_KV || typeof env.SABOR_SORRISO_KV.put !== 'function') {
    return json({ error: 'Serviço temporariamente indisponível.' }, 503);
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return json({ error: 'Requisição inválida.' }, 400);
  }

  const status = body && body.status;
  if (status !== 'open' && status !== 'closed') return json({ error: 'Status inválido.' }, 400);

  const updatedAt = new Date().toISOString();
  try {
    await withKvTimeout(() => env.SABOR_SORRISO_KV.put(KEY, JSON.stringify({ status, updatedAt })));
    return json({ success: true, status, updatedAt });
  } catch {
    return json({ error: 'Serviço temporariamente indisponível.' }, 503);
  }
}
