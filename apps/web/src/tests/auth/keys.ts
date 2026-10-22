import { exportJWK, generateKeyPair, SignJWT, type CryptoKey, type JWK } from 'jose';

export const ISSUER = 'http://localhost:8010';
export const AUDIENCE = 'knowledge-api';
export const USER_ID = '351a1fb1-c472-4834-ba49-ba5128e5e974';
export const SESSION_ID = '0f5f0c2e-6a3b-4d1e-9c1a-2b3c4d5e6f70';

export interface TestKey {
  privateKey: CryptoKey;
  jwk: JWK;
  kid: string;
}

export async function makeKey(kid: string): Promise<TestKey> {
  const { privateKey, publicKey } = await generateKeyPair('EdDSA', { extractable: true });
  const jwk = { ...(await exportJWK(publicKey)), kid, alg: 'EdDSA', use: 'sig' };
  return { privateKey, jwk, kid };
}

export interface TokenOptions {
  role?: string;
  sub?: string;
  sid?: string;
  issuer?: string;
  audience?: string;
  expiresIn?: string | number;
  kid?: string;
}

export async function signToken(key: TestKey, options: TokenOptions = {}): Promise<string> {
  return new SignJWT({ role: options.role ?? 'admin', sid: options.sid ?? SESSION_ID })
    .setProtectedHeader({ alg: 'EdDSA', kid: options.kid ?? key.kid })
    .setSubject(options.sub ?? USER_ID)
    .setIssuer(options.issuer ?? ISSUER)
    .setAudience(options.audience ?? AUDIENCE)
    .setIssuedAt()
    .setJti(crypto.randomUUID())
    .setExpirationTime(options.expiresIn ?? '10m')
    .sign(key.privateKey);
}
