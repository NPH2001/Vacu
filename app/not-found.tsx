import Link from 'next/link';

/**
 * Root fallback for URLs that match no route at all (e.g. /a/b/c). Single-
 * segment misses are caught by the catch-all page and render the public 404
 * inside the site layout instead; this one has no layout of its own, so it
 * carries its own minimal styling.
 */
export default function RootNotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-green-50/40 px-4">
      <div className="text-center max-w-md">
        <div className="text-6xl mb-4">🌾</div>
        <h1 className="text-3xl font-bold text-green-950 font-display mb-3">
          Không tìm thấy trang này
        </h1>
        <p className="text-green-900/70 mb-8">
          Có thể đường dẫn bị gõ nhầm, hoặc trang đã được chuyển đi nơi khác.
        </p>
        <Link href="/"
          className="inline-block bg-green-700 hover:bg-green-800 text-white font-semibold px-6 py-3 rounded-full transition">
          Về trang chủ
        </Link>
      </div>
    </div>
  );
}
