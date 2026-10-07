/**
 * Sessão administrativa assinada (HMAC-SHA256) armazenada em cookie httpOnly.
 * Usa apenas Web Crypto para funcionar tanto no Proxy quanto em Server Actions.
 */
export const SESSION_COOKIE = 'sst_admin_session';
export const SESSION_TTL_SECONDS = 60 * 60 * 8; // 8h

const DEV_FALLBACK_SECRET = 'dev-only-insecure-secret-change-me';

function getSecret(): string | null {
  const secret = process.env.ADMIN_SESSION_SECRET;
  if (secret && secret.length >= 32) return secret;
  return process.env.NODE_ENV === 'production' ? null : DEV_FALLBACK_SECRET;
}

const encoder = new TextEncoder();

function toBase64Url(bytes: ArrayBuffer): string {
  let bin = '';
  for (const b of new Uint8Array(bytes)) bin += String.fromCharCode(b);
  return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

async function hmac(data: string, secret: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  return toBase64Url(await crypto.subtle.sign('HMAC', key, encoder.encode(data)));
}

/** Comparação em tempo constante para strings de mesmo alfabeto. */
export function safeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

export async function createSessionToken(subject: string): Promise<string | null> {
  const secret = getSecret();
  if (!secret) return null;
  const expiresAt = Math.floor(Date.now() / 1000) + SESSION_TTL_SECONDS;
  const payload = `${encodeURIComponent(subject)}.${expiresAt}`;
  return `${payload}.${await hmac(payload, secret)}`;
}

export async function verifySessionToken(token: string | undefined): Promise<boolean> {
  if (!token) return false;
  const secret = getSecret();
  if (!secret) return false;

  const parts = token.split('.');
  if (parts.length !== 3) return false;
  const [subject, expiresAt, signature] = parts;
  if (Number(expiresAt) < Math.floor(Date.now() / 1000)) return false;

  return safeEqual(signature, await hmac(`${subject}.${expiresAt}`, secret));
}
