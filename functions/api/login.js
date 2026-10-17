// POST /api/login — somente emite sessão depois da decisão atômica persistida.
import {
  json, isConfigured, isSameOrigin, safeEqual, createToken, sessionCookie,
  decideLogin, SESSION_TTL_MS, MAX_PASSWORD_LENGTH,
} from '../../lib/auth.js';

const unavailable = () => json({ error: 'Serviço temporariamente indisponível.' }, 503);

export async function onRequestPost({ request, env }) {
  if (!isConfigured(env)) return unavailable();
  if (!isSameOrigin(request)) return json({ error: 'Origem não permitida.' }, 403);

  let password;
  try {
    ({ password } = await request.json());
  } catch {
    return json({ error: 'Requisição inválida.' }, 400);
  }
  if (typeof password !== 'string' || password.length === 0 || password.length > MAX_PASSWORD_LENGTH) {
    return json({ error: 'Requisição inválida.' }, 400);
  }

  try {
    const authenticated = await safeEqual(password, env.ADMIN_PASSWORD);
    const decision = await decideLogin(request, env, authenticated);
    if (!decision.allowed) {
      return json({ error: 'Muitas tentativas. Tente novamente mais tarde.' }, 429,
        { 'Retry-After': String(decision.retryAfter) });
    }
    if (!authenticated) return json({ error: 'Credenciais inválidas.' }, 401);
    const token = await createToken(env.COOKIE_SECRET);
    return json({ success: true }, 200, {
      'Set-Cookie': sessionCookie(request, token, Math.floor(SESSION_TTL_MS / 1000)),
    });
  } catch {
    // Qualquer falha de proteção ou assinatura impede a emissão de sessão.
    // Nunca incluir a exceção, o request ou segredos em logs/respostas.
    return unavailable();
  }
}
