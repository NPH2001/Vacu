import { cache } from 'react';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { eq } from 'drizzle-orm';
import { db } from '@/db/client';
import { users, type UserRow } from '@/db/schema';
import { signSession, verifySession, type SessionClaims } from './auth';

export const SESSION_COOKIE = 'ntx_session';
const MAX_AGE_SECONDS = 7 * 24 * 3600;

export async function setSessionCookie(claims: SessionClaims) {
  const jwt = await signSession(claims);
  const store = await cookies();
  store.set(SESSION_COOKIE, jwt, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: MAX_AGE_SECONDS,
  });
}

export async function clearSessionCookie() {
  const store = await cookies();
  store.delete(SESSION_COOKIE);
}

export async function getSession(): Promise<SessionClaims | null> {
  const store = await cookies();
  const raw = store.get(SESSION_COOKIE)?.value;
  if (!raw) return null;
  try {
    return await verifySession(raw);
  } catch {
    return null;
  }
}

/**
 * Cached per request: a single render can ask who the user is several times
 * (layout, page, generateMetadata, requireAdmin), and each was its own query.
 */
export const getCurrentUser = cache(async (): Promise<UserRow | null> => {
  const s = await getSession();
  if (!s) return null;
  const rows = await db.select().from(users).where(eq(users.id, s.sub)).limit(1);
  const u = rows[0];
  if (!u) return null;
  // Sessions minted before the password last changed are revoked.
  if (typeof s.pca === 'number' && Math.floor(u.passwordChangedAt.getTime() / 1000) > s.pca) {
    return null;
  }
  return u;
});

export async function requireAdmin(): Promise<UserRow> {
  const u = await getCurrentUser();
  if (!u) redirect('/admin/login');
  return u;
}

export async function requireRole(role: 'admin'): Promise<UserRow> {
  const u = await requireAdmin();
  if (u.role !== role) redirect('/admin');
  return u;
}
