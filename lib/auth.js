// lib/auth.js
// Funções compartilhadas pelas Cloudflare Functions (login, logout, sessão e status).
// Fica FORA de /functions de propósito: assim não vira uma rota pública.

const encoder = new TextEncoder();

export const SESSION_COOKIE = 'session';
export const SESSION_TTL_MS = 8 * 60 * 60 * 1000; // 8 horas
export const MAX_FAILED_LOGINS = 5;                // tentativas erradas por IP...
export const LOGIN_WINDOW_SECONDS = 15 * 60;       // ...a cada 15 minutos
export const MAX_PASSWORD_LENGTH = 200; // Unidades UTF-16, como String.length na rota.

/* ---------- Respostas ---------- */

export function json(data, status = 200, extraHeaders = {}) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'no-store',
      'X-Content-Type-Options': 'nosniff',
      ...extraHeaders,
    },
  });
}

/* ---------- Base64 URL (seguro para cookie) ---------- */

function toBase64Url(bytes) {
  let bin = '';
  bytes.forEach(b => { bin += String.fromCharCode(b); });
  return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function fromBase64Url(text) {
  const b64 = text.replace(/-/g, '+').replace(/_/g, '/');
  const padded = b64 + '='.repeat((4 - (b64.length % 4)) % 4);
  const bin = atob(padded);
  return Uint8Array.from(bin, c => c.charCodeAt(0));
}

/* ---------- Configuração ---------- */

// Nunca "abre a porta" se faltar configuração: sem segredo, ninguém autentica.
export function isConfigured(env) {
  return validSecret(env?.ADMIN_PASSWORD, 12)
    && env.ADMIN_PASSWORD.length <= MAX_PASSWORD_LENGTH
    && validSecret(env?.COOKIE_SECRET, 32);
}

function validSecret(value, minimum) {
  if (typeof value !== 'string' || value.trim().length < minimum) return false;
  // Rejeita também os valores de exemplo da V4; não altera a senha real.
  return !/(troque|substitua|placeholder|change[\s_-]*me|replace[\s_-]*me|your[\s_-]*(password|secret)|sua[\s_-]*senha|seu[\s_-]*segredo|cole[\s_-]*aqui)/i.test(value);
}

/* ---------- Comparação em tempo constante ---------- */

async function sha256(text) {
  return new Uint8Array(await crypto.subtle.digest('SHA-256', encoder.encode(text)));
}

// Compara as senhas pelo hash (mesmo tamanho sempre) sem revelar, pelo tempo de resposta,
// quantos caracteres estavam certos.
export async function safeEqual(a, b) {
  const [ha, hb] = await Promise.all([sha256(String(a)), sha256(String(b))]);
  if (typeof crypto.subtle.timingSafeEqual === 'function') {
    return crypto.subtle.timingSafeEqual(ha, hb);
  }
  let diff = 0;
  for (let i = 0; i < ha.length; i += 1) diff |= ha[i] ^ hb[i];
  return diff === 0;
}

/* ---------- Token de sessão (HMAC-SHA256) ---------- */
// Formato: <payload em base64url>.<assinatura em base64url>

async function hmacKey(secret, usage) {
  return crypto.subtle.importKey('raw', encoder.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, [usage]);
}

export async function createToken(secret, now = Date.now()) {
  const payload = toBase64Url(encoder.encode(JSON.stringify({ exp: now + SESSION_TTL_MS })));
  const signature = await crypto.subtle.sign('HMAC', await hmacKey(secret, 'sign'), encoder.encode(payload));
  return `${payload}.${toBase64Url(new Uint8Array(signature))}`;
}

export async function verifyToken(token, secret, now = Date.now()) {
  try {
    if (typeof token !== 'string' || !secret) return false;
    const parts = token.split('.');
    if (parts.length !== 2 || !parts[0] || !parts[1]) return false;
    const [payload, signature] = parts;

    const valid = await crypto.subtle.verify(
      'HMAC', await hmacKey(secret, 'verify'), fromBase64Url(signature), encoder.encode(payload)
    );
    if (!valid) return false;

    const data = JSON.parse(new TextDecoder().decode(fromBase64Url(payload)));
    return typeof data.exp === 'number' && data.exp > now;
  } catch {
    return false; // token malformado nunca derruba a função
  }
}

/* ---------- Cookies ---------- */

export function readCookie(request, name) {
  const header = request.headers.get('Cookie') || '';
  for (const part of header.split(';')) {
    const index = part.indexOf('=');
    if (index === -1) continue;
    if (part.slice(0, index).trim() === name) return part.slice(index + 1).trim();
  }
  return null;
}

export function sessionCookie(request, value, maxAgeSeconds) {
  const secure = new URL(request.url).protocol === 'https:' ? '; Secure' : ''; // http só no teste local
  return `${SESSION_COOKIE}=${value}; Path=/; HttpOnly; SameSite=Strict; Max-Age=${maxAgeSeconds}${secure}`;
}

export async function isAuthenticated(request, env) {
  if (!isConfigured(env)) return false;
  return verifyToken(readCookie(request, SESSION_COOKIE), env.COOKIE_SECRET);
}

/* ---------- Proteção extra contra CSRF ---------- */
// Além do cookie SameSite, exige que pedidos que alteram dados venham do próprio site.

export function isSameOrigin(request) {
  const origin = request.headers.get('Origin');
  if (origin) return origin === new URL(request.url).origin;
  const site = request.headers.get('Sec-Fetch-Site');
  return !site || site === 'same-origin' || site === 'none';
}

/* ---------- Decisão atômica de login (Durable Object, nunca KV) ---------- */

const clientIp = request => request.headers.get('CF-Connecting-IP') || 'local';

export async function decideLogin(request, env, authenticated) {
  const binding = env.ADMIN_LOGIN_LIMITER;
  if (!binding || typeof binding.idFromName !== 'function' || typeof binding.get !== 'function') {
    throw new Error('Login protection unavailable');
  }
  // O objeto recebe somente o resultado da comparação, nunca senha ou IP bruto.
  // Sem IP, usa um bucket comum, sem permitir bypass.
  const digest = await sha256(clientIp(request));
  const name = Array.from(digest, b => b.toString(16).padStart(2, '0')).join('');
  const stub = binding.get(binding.idFromName(name));
  const controller = new AbortController();
  let timer;
  try {
    const decision = await Promise.race([
      (async () => {
        const response = await stub.fetch('https://login-limiter.internal/decide', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ authenticated }), signal: controller.signal,
        });
        if (!response.ok) throw new Error('Login protection unavailable');
        return response.json();
      })(),
      new Promise((_, reject) => {
        timer = setTimeout(() => { controller.abort(); reject(new Error('Login protection timeout')); }, 3000);
      }),
    ]);
    if (decision?.allowed === false && Number.isInteger(decision.retryAfter)
      && decision.retryAfter >= 1 && decision.retryAfter <= LOGIN_WINDOW_SECONDS) return decision;
    if (decision?.allowed === true && decision.authenticated === authenticated) return decision;
    throw new Error('Invalid login protection response');
  } finally {
    clearTimeout(timer);
  }
}
