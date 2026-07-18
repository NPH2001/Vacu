'use client';
import Link from 'next/link';
import { useEffect } from 'react';

/**
 * Last resort for the admin area — expected refusals (a category still in use,
 * self-delete) are handled as flash messages in lib/admin/flash.ts and never
 * reach here.
 *
 * Deliberately does not promise the admin's work was saved: by the time a
 * render throws, whether the write landed is unknown, and "mất dữ liệu" panic
 * is worse than asking them to check.
 */
export default function AdminError({
  error, reset,
}: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error('Admin error:', error);
  }, [error]);

  return (
    <div className="max-w-xl mx-auto py-16">
      <div className="admin-panel p-8 text-center">
        <div className="text-4xl mb-3">⚠</div>
        <h1 className="admin-title text-[22px] mb-2">Thao tác này gặp lỗi</h1>
        <p className="text-[13.5px] text-stone-600 leading-relaxed mb-6">
          Hệ thống chưa xử lý được yêu cầu vừa rồi. Bấm “Thử lại” để tải lại phần này.
          Nếu bạn vừa bấm lưu, hãy mở lại danh sách kiểm tra xem nội dung đã vào chưa trước khi nhập lại.
        </p>
        <div className="flex flex-wrap gap-2 justify-center">
          <button type="button" onClick={reset} className="admin-btn-primary">Thử lại</button>
          <Link href="/admin" className="admin-btn-ghost border border-stone-200">Về Dashboard</Link>
        </div>
        {error.digest && (
          <p className="mt-6 text-[11px] text-stone-400">
            Mã lỗi để báo kỹ thuật: <code className="font-mono">{error.digest}</code>
          </p>
        )}
      </div>
    </div>
  );
}
