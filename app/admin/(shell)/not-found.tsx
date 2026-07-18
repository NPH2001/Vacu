import Link from 'next/link';

/**
 * Shown when an admin opens a record that no longer exists — usually a stale
 * tab or a bookmark to something since deleted.
 */
export default function AdminNotFound() {
  return (
    <div className="max-w-xl mx-auto py-16">
      <div className="admin-panel p-8 text-center">
        <div className="text-4xl mb-3">🔎</div>
        <h1 className="admin-title text-[22px] mb-2">Không tìm thấy mục này</h1>
        <p className="text-[13.5px] text-stone-600 leading-relaxed mb-6">
          Mục bạn mở không còn tồn tại — có thể đã bị xóa, hoặc đường dẫn đã đổi.
          Thử mở lại từ danh sách nhé.
        </p>
        <Link href="/admin" className="admin-btn-primary inline-flex">Về Dashboard</Link>
      </div>
    </div>
  );
}
