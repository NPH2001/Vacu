import { NextResponse, type NextRequest } from 'next/server';
import { clearSessionCookie } from '@/lib/session';

export async function POST(req: NextRequest) {
  await clearSessionCookie();
  return NextResponse.redirect(new URL('/admin/login', req.url), { status: 303 });
}
