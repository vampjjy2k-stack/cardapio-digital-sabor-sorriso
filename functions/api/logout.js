// POST /api/logout — apaga o cookie de sessão.

import { json, isSameOrigin, sessionCookie } from '../../lib/auth.js';

export async function onRequestPost({ request }) {
  if (!isSameOrigin(request)) return json({ error: 'Origem não permitida.' }, 403);
  return json({ success: true }, 200, { 'Set-Cookie': sessionCookie(request, '', 0) });
}
