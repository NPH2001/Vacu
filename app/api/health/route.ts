import { NextResponse } from 'next/server';
import { sql } from 'drizzle-orm';
import { db } from '@/db/client';

export const dynamic = 'force-dynamic';

/**
 * Liveness/readiness probe for Docker/Traefik: confirms the process is up AND
 * can reach Postgres, so traffic isn't routed to a container whose DB is down
 * or whose migrations haven't finished.
 *
 * Also fails fast on a misconfigured AUTH_SECRET: without a strong one, every
 * session token is forgeable, so a pod that booted with a missing/short secret
 * must never be marked ready — better to fail the probe than serve auth that
 * can be bypassed.
 */
export async function GET(): Promise<Response> {
  if (!process.env.AUTH_SECRET || process.env.AUTH_SECRET.length < 32) {
    return NextResponse.json({ status: 'error', auth: 'misconfigured' }, { status: 503 });
  }
  try {
    await db.execute(sql`select 1`);
    return NextResponse.json({ status: 'ok' });
  } catch {
    return NextResponse.json({ status: 'error', db: 'unreachable' }, { status: 503 });
  }
}
