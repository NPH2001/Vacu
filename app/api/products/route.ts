import { NextResponse, type NextRequest } from 'next/server';
import { getAllProducts, getProductsByCategory, getFeaturedProducts } from '@/lib/data';

const CACHE = 'public, s-maxage=60, stale-while-revalidate=300';

export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams;
  const category = sp.get('category');
  const featured = sp.get('featured');

  // Clamp the client-supplied limit: `?limit=abc` (NaN) or `?limit=-5` would
  // otherwise reach SQL LIMIT and 500 the endpoint (route handlers have no
  // error boundary).
  const parsedLimit = Math.floor(Number(sp.get('limit') ?? 8));
  const limit = Number.isFinite(parsedLimit) ? Math.min(Math.max(parsedLimit, 1), 48) : 8;

  const rows = featured === 'true'
    ? await getFeaturedProducts(limit)
    : category
      ? await getProductsByCategory(category)
      : await getAllProducts();

  return NextResponse.json({ data: rows }, { headers: { 'Cache-Control': CACHE } });
}
