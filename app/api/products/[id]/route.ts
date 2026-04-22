import { NextResponse } from 'next/server';
import { getProduct } from '@/lib/data';

const CACHE = 'public, s-maxage=60, stale-while-revalidate=300';

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const row = await getProduct(id);
  if (!row) return NextResponse.json({ error: 'Không tìm thấy' }, { status: 404 });
  return NextResponse.json({ data: row }, { headers: { 'Cache-Control': CACHE } });
}
