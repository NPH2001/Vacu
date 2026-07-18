import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/session';
import { listMedia } from '@/lib/media';

export async function GET(req: Request): Promise<Response> {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const q = searchParams.get('q') ?? undefined;
  const page = Math.max(1, Number(searchParams.get('page') ?? '1') || 1);

  const result = await listMedia({ q, page, pageSize: 24 });
  return NextResponse.json(result);
}
