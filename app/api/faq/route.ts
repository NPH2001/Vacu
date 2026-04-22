import { NextResponse } from 'next/server';
import { getAllFaqItems } from '@/lib/data';

const CACHE = 'public, s-maxage=300, stale-while-revalidate=600';

export async function GET() {
  const rows = await getAllFaqItems();
  return NextResponse.json({ data: rows }, { headers: { 'Cache-Control': CACHE } });
}
