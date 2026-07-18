import { hash as argonHash, verify as argonVerify } from '@node-rs/argon2';
import { SignJWT, jwtVerify, type JWTPayload } from 'jose';

const ARGON_OPTS = { memoryCost: 19456, timeCost: 2, parallelism: 1 };

export async function hashPassword(plain: string): Promise<string> {
  return argonHash(plain, ARGON_OPTS);
}

export async function verifyPassword(plain: string, hash: string): Promise<boolean> {
  try {
    return await argonVerify(hash, plain);
  } catch {
    return false;
  }
}

// `pca` = password-changed-at, as epoch MILLISECONDS (passwordChangedAt.getTime()),
// at the moment the session was issued. getCurrentUser rejects a session whose
// `pca` is older than the user's current passwordChangedAt (also compared in ms),
// so a reset/change logs out every prior session.
// `iam` = issued-at, epoch MILLISECONDS, stamped by signSession. getCurrentUser
// rejects a session whose `iam` predates the user's sessionsRevokedAt, so logout
// invalidates the token server-side (ms precision, like `pca`).
export type SessionClaims = { sub: string; role: 'admin' | 'staff'; pca?: number; iam?: number };

function secret(): Uint8Array {
  const raw = process.env.AUTH_SECRET;
  if (!raw || raw.length < 32) {
    throw new Error('AUTH_SECRET must be set (>=32 chars)');
  }
  return new TextEncoder().encode(raw);
}

export async function signSession(claims: SessionClaims): Promise<string> {
  // Stamp the issue time in ms here so every caller gets it automatically.
  return new SignJWT({ ...claims, iam: Date.now() } as JWTPayload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('7d')
    .sign(secret());
}

export async function verifySession(jwt: string): Promise<SessionClaims & JWTPayload> {
  const { payload } = await jwtVerify(jwt, secret(), { algorithms: ['HS256'] });
  if (typeof payload.sub !== 'string' || (payload.role !== 'admin' && payload.role !== 'staff')) {
    throw new Error('invalid session');
  }
  return payload as SessionClaims & JWTPayload;
}
