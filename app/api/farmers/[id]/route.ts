import { NextResponse } from 'next/server';
import { getFarmer, getProductsByFarmer } from '@/lib/data';

const CACHE = 'public, s-maxage=300, stale-while-revalidate=600';

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const row = await getFarmer(id);
  if (!row) return NextResponse.json({ error: 'Không tìm thấy' }, { status: 404 });
  const products = await getProductsByFarmer(id);
  return NextResponse.json({ data: { ...row, products } }, { headers: { 'Cache-Control': CACHE } });
}
