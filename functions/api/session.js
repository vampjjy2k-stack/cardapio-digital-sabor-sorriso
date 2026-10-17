// GET /api/session — responde { authenticated: true | false } (sempre 200, para não sujar o console).
// Usado pelo painel /admin ao abrir. Não altera nada, ao contrário de "testar com um PUT".

import { json, isAuthenticated } from '../../lib/auth.js';

export async function onRequestGet({ request, env }) {
  return json({ authenticated: await isAuthenticated(request, env) });
}
