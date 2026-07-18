import { NextResponse, type NextRequest } from 'next/server';
import { eq } from 'drizzle-orm';
import { db } from '@/db/client';
import { users } from '@/db/schema';
import { getSession, clearSessionCookie } from '@/lib/session';

export async function POST(req: NextRequest) {
  // This is a route handler, so Next's built-in server-action CSRF (Origin/Host)
  // check does NOT apply. Reject a clearly cross-site forced-logout: if an Origin
  // is present it must match the request host (or the proxied host). A missing
  // Origin (some same-origin navigations omit it) is allowed.
  const origin = req.headers.get('origin');
  if (origin) {
    let originHost = '\0';
    try { originHost = new URL(origin).host; } catch { /* malformed → no match */ }
    const host = req.headers.get('host');
    const fwdHost = req.headers.get('x-forwarded-host');
    if (originHost !== host && originHost !== fwdHost) {
      return new NextResponse('forbidden', { status: 403 });
    }
  }

  // Revoke every session for this user server-side (not just drop the cookie):
  // bumping sessionsRevokedAt invalidates any outstanding token, so a copied/
  // exfiltrated token stops working the moment the user logs out.
  const s = await getSession();
  if (s?.sub) {
    await db.update(users).set({ sessionsRevokedAt: new Date() }).where(eq(users.id, s.sub));
  }
  await clearSessionCookie();
  return NextResponse.redirect(new URL('/admin/login', req.url), { status: 303 });
}
