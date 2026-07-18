'use client';
import Link from 'next/link';
import { useEffect } from 'react';

/**
 * Root-segment error boundary. It catches failures that the per-section
 * boundaries can't — most importantly a throw inside the `(public)` layout
 * itself (e.g. getSiteInfo() when the DB is unseeded), which would otherwise
 * fall through to the bare, unstyled global-error page. This renders inside the
 * root layout, so it keeps the site chrome/fonts. Next redacts the real message
 * in production and gives only `digest` — the copy stays generic and surfaces
 * it as the only handle support has to the matching server log.
 */
export default function RootError({
  error, reset,
}: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error('Root error boundary:', error);
  }, [error]);

  return (
    <div className="max-w-2xl mx-auto px-4 py-24 text-center">
      <div className="text-6xl mb-4">🌱</div>
      <h1 className="text-3xl md:text-4xl font-bold text-green-950 font-display mb-3">
        Trang đang gặp trục trặc
      </h1>
      <p className="text-green-900/70 mb-8">
        Lỗi từ phía chúng tôi, không phải do bạn. Thử tải lại xem sao — nếu vẫn vậy, xin quay lại sau ít phút.
      </p>
      <div className="flex flex-wrap gap-3 justify-center">
        <button type="button" onClick={reset}
          className="bg-green-700 hover:bg-green-800 text-white font-semibold px-6 py-3 rounded-full transition">
          Thử lại
        </button>
        <Link href="/"
          className="border border-green-200 hover:bg-green-50 text-green-900 font-semibold px-6 py-3 rounded-full transition">
          Về trang chủ
        </Link>
      </div>
      {error.digest && (
        <p className="mt-8 text-xs text-green-900/40">
          Mã lỗi: <code className="font-mono">{error.digest}</code>
        </p>
      )}
    </div>
  );
}
