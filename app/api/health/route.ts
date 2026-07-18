import { NextResponse } from 'next/server';
import { sql } from 'drizzle-orm';
import { db } from '@/db/client';

export const dynamic = 'force-dynamic';

/**
 * Liveness/readiness probe for Docker/Traefik: confirms the process is up AND
 * can reach Postgres, so traffic isn't routed to a container whose DB is down
 * or whose migrations haven't finished.
 */
export async function GET(): Promise<Response> {
  try {
    await db.execute(sql`select 1`);
    return NextResponse.json({ status: 'ok' });
  } catch {
    return NextResponse.json({ status: 'error', db: 'unreachable' }, { status: 503 });
  }
}
