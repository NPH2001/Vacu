'use client';
import { useEffect } from 'react';

/**
 * Only fires when the root layout itself fails, which means it replaces the
 * whole document — hence its own <html>/<body> and inline styles: no layout,
 * stylesheet or font is guaranteed to have loaded at this point.
 */
export default function GlobalError({
  error, reset,
}: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error('Global error:', error);
  }, [error]);

  return (
    <html lang="vi">
      <body style={{ margin: 0, fontFamily: 'system-ui, -apple-system, sans-serif', background: '#f6f8f3' }}>
        <div style={{
          minHeight: '100vh', display: 'flex', alignItems: 'center',
          justifyContent: 'center', padding: '1rem', textAlign: 'center',
        }}>
          <div style={{ maxWidth: '28rem' }}>
            <div style={{ fontSize: '3.5rem', marginBottom: '1rem' }}>🌱</div>
            <h1 style={{ fontSize: '1.75rem', color: '#14321b', margin: '0 0 0.75rem' }}>
              Website đang gặp trục trặc
            </h1>
            <p style={{ color: '#4b5e4b', lineHeight: 1.6, margin: '0 0 2rem' }}>
              Lỗi từ phía chúng tôi. Vui lòng thử tải lại trang, hoặc quay lại sau ít phút.
            </p>
            <button
              type="button"
              onClick={reset}
              style={{
                background: '#15803d', color: '#fff', border: 0, cursor: 'pointer',
                padding: '0.75rem 1.5rem', borderRadius: '9999px', fontWeight: 600, fontSize: '1rem',
              }}
            >
              Tải lại trang
            </button>
            {error.digest && (
              <p style={{ marginTop: '2rem', fontSize: '0.75rem', color: '#9ca3af' }}>
                Mã lỗi: <code>{error.digest}</code>
              </p>
            )}
          </div>
        </div>
      </body>
    </html>
  );
}
