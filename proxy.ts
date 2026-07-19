import { NextResponse, type NextRequest } from 'next/server';
import { jwtVerify } from 'jose';

const SECRET = new TextEncoder().encode(process.env.AUTH_SECRET || '');
const isDev = process.env.NODE_ENV !== 'production';

async function isSessionValid(jwt: string | undefined): Promise<boolean> {
  if (!jwt || SECRET.length === 0) return false;
  try { await jwtVerify(jwt, SECRET, { algorithms: ['HS256'] }); return true; }
  catch { return false; }
}

const PUBLIC_PATHS = new Set(['/admin/login', '/admin/forgot-password', '/admin/reset-password']);

// Per-request Content-Security-Policy with a nonce. This is what lets `script-src`
// drop `'unsafe-inline'`: only Next's own script tags (which Next stamps with this
// request's nonce) and scripts they load via `'strict-dynamic'` may execute, so an
// injected inline <script> from an XSS is blocked outright.
//
// `style-src` deliberately keeps `'unsafe-inline'`: next/font and the admin theme
// both emit inline <style>, and style-injection is a far weaker vector than script
// execution. The GA hosts stay listed as a fallback for browsers that don't grok
// `'strict-dynamic'` (which otherwise makes them ignore host allowlists).
//
// CSP lives HERE and ONLY here — a second CSP header from next.config.ts would be
// intersected with this one by the browser and the nonce would stop matching. The
// other, static security headers (X-Frame-Options, nosniff, HSTS, …) stay there.
function buildCsp(nonce: string): string {
  return [
    "default-src 'self'",
    "base-uri 'self'",
    "object-src 'none'",
    "frame-ancestors 'none'",
    "form-action 'self'",
    "img-src 'self' data: https:",
    `script-src 'self' 'nonce-${nonce}' 'strict-dynamic'${isDev ? " 'unsafe-eval'" : ''} https://www.googletagmanager.com https://www.google-analytics.com`,
    "style-src 'self' 'unsafe-inline'",
    "font-src 'self' data:",
    "connect-src 'self' https://www.googletagmanager.com https://*.google-analytics.com https://*.analytics.google.com",
    "frame-src 'self'",
  ].join('; ');
}

export async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Admin auth-gate (first line of defense; the (shell) layout's requireAdmin()
  // and every server action re-check server-side). Redirects need no CSP.
  if (pathname.startsWith('/admin') && !PUBLIC_PATHS.has(pathname)) {
    const jwt = req.cookies.get('ntx_session')?.value;
    if (!(await isSessionValid(jwt))) {
      const url = new URL('/admin/login', req.url);
      url.searchParams.set('next', pathname);
      return NextResponse.redirect(url);
    }
  }

  // Attach a per-request nonce: expose it to Server Components (read via
  // `headers()`) and hand Next the same value on the request's CSP header so it
  // stamps its own script tags with it.
  const nonce = btoa(crypto.randomUUID());
  const csp = buildCsp(nonce);
  const requestHeaders = new Headers(req.headers);
  requestHeaders.set('x-nonce', nonce);
  requestHeaders.set('Content-Security-Policy', csp);

  const res = NextResponse.next({ request: { headers: requestHeaders } });
  res.headers.set('Content-Security-Policy', csp);
  return res;
}

export const config = {
  // Run on document requests only. Skip API routes, uploaded files, Next's
  // static/image assets and the favicon — none are HTML needing a nonce — and
  // skip next/link prefetches (RSC payloads, not documents; the admin gate is
  // still enforced server-side by requireAdmin()).
  matcher: [
    {
      source: '/((?!api|uploads|_next/static|_next/image|favicon.ico).*)',
      missing: [
        { type: 'header', key: 'next-router-prefetch' },
        { type: 'header', key: 'purpose', value: 'prefetch' },
      ],
    },
  ],
};
