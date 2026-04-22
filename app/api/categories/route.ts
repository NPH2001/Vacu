import { NextResponse } from 'next/server';
import { getAllCategories } from '@/lib/data';

const CACHE = 'public, s-maxage=300, stale-while-revalidate=600';

export async function GET() {
  const rows = await getAllCategories();
  return NextResponse.json({ data: rows }, { headers: { 'Cache-Control': CACHE } });
}
