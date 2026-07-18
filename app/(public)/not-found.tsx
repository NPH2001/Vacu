import Link from 'next/link';

/**
 * Public 404. The catch-all /[slug] route calls notFound() for every unknown
 * single-segment URL, so this is what visitors see for mistyped links — it
 * renders inside the public layout, keeping the header and footer.
 */
export default function PublicNotFound() {
  return (
    <div className="max-w-2xl mx-auto px-4 py-24 text-center">
      <div className="text-6xl mb-4">🌾</div>
      <h1 className="text-3xl md:text-4xl font-bold text-green-950 font-display mb-3">
        Không tìm thấy trang này
      </h1>
      <p className="text-green-900/70 mb-8">
        Có thể đường dẫn bị gõ nhầm, hoặc trang đã được chuyển đi nơi khác.
      </p>
      {/* Re-search straight from the dead-end (plain GET → /products, no JS). */}
      <form action="/products" method="get" className="max-w-md mx-auto mb-8 flex gap-2">
        <input
          type="search"
          name="q"
          placeholder="Tìm nông sản…"
          aria-label="Tìm nông sản"
          className="flex-1 min-w-0 px-4 py-2.5 rounded-full border border-green-200 bg-white text-sm focus:border-green-600 focus:ring-2 focus:ring-green-600/40"
        />
        <button type="submit" className="bg-green-700 hover:bg-green-800 text-white font-semibold px-5 py-2.5 rounded-full transition whitespace-nowrap">
          Tìm
        </button>
      </form>
      <div className="flex flex-wrap gap-3 justify-center">
        <Link href="/"
          className="bg-green-700 hover:bg-green-800 text-white font-semibold px-6 py-3 rounded-full transition">
          Về trang chủ
        </Link>
        <Link href="/products"
          className="border border-green-200 hover:bg-green-50 text-green-900 font-semibold px-6 py-3 rounded-full transition">
          Xem nông sản
        </Link>
        <Link href="/tin-tuc"
          className="border border-green-200 hover:bg-green-50 text-green-900 font-semibold px-6 py-3 rounded-full transition">
          Đọc tin tức
        </Link>
      </div>
    </div>
  );
}
