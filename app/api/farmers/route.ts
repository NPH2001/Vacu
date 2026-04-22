import { NextResponse } from 'next/server';
import { getAllFarmers } from '@/lib/data';

const CACHE = 'public, s-maxage=300, stale-while-revalidate=600';

export async function GET() {
  const rows = await getAllFarmers();
  return NextResponse.json({ data: rows }, { headers: { 'Cache-Control': CACHE } });
}
