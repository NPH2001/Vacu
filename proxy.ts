import { NextResponse, type NextRequest } from 'next/server';
import { jwtVerify } from 'jose';

const SECRET = new TextEncoder().encode(process.env.AUTH_SECRET || '');

async function isSessionValid(jwt: string | undefined): Promise<boolean> {
  if (!jwt || SECRET.length === 0) return false;
  try { await jwtVerify(jwt, SECRET, { algorithms: ['HS256'] }); return true; }
  catch { return false; }
}

export async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;
  if (pathname === '/admin/login') return NextResponse.next();
  const jwt = req.cookies.get('ntx_session')?.value;
  if (await isSessionValid(jwt)) return NextResponse.next();
  const url = new URL('/admin/login', req.url);
  url.searchParams.set('next', pathname);
  return NextResponse.redirect(url);
}

export const config = {
  matcher: ['/admin/:path*'],
};
