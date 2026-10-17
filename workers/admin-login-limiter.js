import { json, MAX_FAILED_LOGINS, LOGIN_WINDOW_SECONDS } from '../lib/auth.js';

// Um objeto por IP; somente o binding interno pode chamar esta classe.
// A verificação do limite, a contagem e o reset são UMA transação persistente.
export class AdminLoginLimiter {
  constructor(ctx) {
    this.storage = ctx.storage;
  }

  async fetch(request) {
    if (request.method !== 'POST') return json({ error: 'Requisição inválida.' }, 405);
    try {
      const body = await request.json();
      if (typeof body?.authenticated !== 'boolean') return json({ error: 'Requisição inválida.' }, 400);
      const result = await this.storage.transaction(async txn => {
        const now = Date.now();
        const stored = await txn.get('attempts');
        if (stored !== undefined && (!Number.isInteger(stored.count) || stored.count < 0
          || !Number.isFinite(stored.expiresAt))) throw new Error('Invalid limiter state');
        const current = stored && stored.expiresAt > now ? stored : { count: 0, expiresAt: 0 };
        if (current.count >= MAX_FAILED_LOGINS) {
          return { allowed: false, retryAfter: Math.max(1, Math.ceil((current.expiresAt - now) / 1000)) };
        }
        if (body.authenticated) {
          await txn.delete('attempts');
        } else {
          // Preserva a expiração do KV antigo: 15 min desde a última falha aceita.
          await txn.put('attempts', { count: current.count + 1, expiresAt: now + LOGIN_WINDOW_SECONDS * 1000 });
        }
        return { allowed: true, authenticated: body.authenticated };
      });
      return json(result);
    } catch {
      // Não registrar request, credencial, estado nem exceção de infraestrutura.
      return json({ error: 'Serviço temporariamente indisponível.' }, 503);
    }
  }
}

// Não há endpoint público para acessar decisões ou zerar contadores.
export default {
  fetch() { return new Response('Not found', { status: 404 }); },
};
