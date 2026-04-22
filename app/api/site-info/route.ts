import { NextResponse } from 'next/server';
import { getSiteInfo } from '@/lib/data';

const CACHE = 'public, s-maxage=300, stale-while-revalidate=600';

export async function GET() {
  const row = await getSiteInfo();
  return NextResponse.json({ data: row }, { headers: { 'Cache-Control': CACHE } });
}
