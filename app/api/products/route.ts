import { NextResponse, type NextRequest } from 'next/server';
import { getAllProducts, getProductsByCategory, getFeaturedProducts } from '@/lib/data';

const CACHE = 'public, s-maxage=60, stale-while-revalidate=300';

export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams;
  const category = sp.get('category');
  const featured = sp.get('featured');

  const rows = featured === 'true'
    ? await getFeaturedProducts(Number(sp.get('limit') ?? 8))
    : category
      ? await getProductsByCategory(category)
      : await getAllProducts();

  return NextResponse.json({ data: rows }, { headers: { 'Cache-Control': CACHE } });
}
