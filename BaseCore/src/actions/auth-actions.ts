'use server';

import crypto from 'crypto';
import { cookies } from 'next/headers';
import {
  SESSION_COOKIE,
  SESSION_TTL_SECONDS,
  createSessionToken,
  safeEqual,
  verifySessionToken,
} from '@/lib/session';

// Hash de demonstração ("admin@admin.com:admin") — aceito SOMENTE fora de produção.
const DEV_DEMO_HASH =
  '4e803d52367ba4f3fb87440ba73693e55c3c0eb4d7e2f5f190e22709210c85c2';

const MAX_ATTEMPTS = 5;
const LOCK_WINDOW_MS = 15 * 60 * 1000;
const attempts = new Map<string, { count: number; firstAt: number }>();

function getExpectedHash(): string | null {
  const fromEnv = process.env.ADMIN_CREDENTIAL_HASH?.trim().toLowerCase();
  if (fromEnv) return fromEnv;
  return process.env.NODE_ENV === 'production' ? null : DEV_DEMO_HASH;
}

function isRateLimited(key: string): boolean {
  const entry = attempts.get(key);
  if (!entry) return false;
  if (Date.now() - entry.firstAt > LOCK_WINDOW_MS) {
    attempts.delete(key);
    return false;
  }
  return entry.count >= MAX_ATTEMPTS;
}

function registerFailure(key: string) {
  const entry = attempts.get(key);
  if (!entry) attempts.set(key, { count: 1, firstAt: Date.now() });
  else entry.count += 1;
}

export async function authenticateAdmin(
  email: string,
  pass: string
): Promise<boolean> {
  const trimmedEmail = String(email ?? '').trim().toLowerCase();
  if (!trimmedEmail || !pass || isRateLimited(trimmedEmail)) return false;

  const expectedHash = getExpectedHash();
  if (!expectedHash) {
    console.error('[auth] ADMIN_CREDENTIAL_HASH não configurado; login desativado.');
    return false;
  }

  const hash = crypto
    .createHash('sha256')
    .update(`${trimmedEmail}:${pass}`)
    .digest('hex');

  if (!safeEqual(hash, expectedHash)) {
    registerFailure(trimmedEmail);
    return false;
  }

  const token = await createSessionToken(trimmedEmail);
  if (!token) {
    console.error('[auth] ADMIN_SESSION_SECRET ausente/curto; sessão não criada.');
    return false;
  }

  attempts.delete(trimmedEmail);
  (await cookies()).set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    path: '/',
    maxAge: SESSION_TTL_SECONDS,
  });
  return true;
}

export async function logoutAdmin(): Promise<void> {
  (await cookies()).delete(SESSION_COOKIE);
}

/** Garante que a chamada vem de um admin autenticado (uso em outras Server Actions). */
export async function isAdminSession(): Promise<boolean> {
  return verifySessionToken((await cookies()).get(SESSION_COOKIE)?.value);
}
