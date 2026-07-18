import { listMedia } from '@/lib/media';
import MediaGrid from '@/components/admin/MediaGrid';
import SearchInput from '@/components/admin/list/SearchInput';
import Link from 'next/link';

const PAGE_SIZE = 48;

export default async function MediaAdminPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;
  const q = typeof sp.q === 'string' ? sp.q : '';
  const page = Math.max(1, Number(typeof sp.page === 'string' ? sp.page : '1') || 1);

  const { rows, total, totalPages } = await listMedia({ q, page, pageSize: PAGE_SIZE });

  const href = (p: number) => {
    const params = new URLSearchParams();
    if (q) params.set('q', q);
    if (p > 1) params.set('page', String(p));
    const qs = params.toString();
    return qs ? `/admin/media?${qs}` : '/admin/media';
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="admin-title text-[28px]">Thư viện ảnh</h1>
          <p className="text-[12.5px] text-stone-500 mt-0.5">
            {total > 0 ? `${total} ảnh` : 'Kho ảnh dùng chung cho sản phẩm, bài viết và trang'}
          </p>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <SearchInput placeholder="Tìm theo tên file hoặc mô tả…" />
        {q && (
          <Link href="/admin/media" className="admin-btn-ghost text-[12.5px]">Xóa tìm kiếm</Link>
        )}
      </div>

      <MediaGrid rows={rows} />

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-3 pt-2 text-sm">
          {page > 1
            ? <Link href={href(page - 1)} className="admin-btn-ghost">← Trước</Link>
            : <span className="admin-btn-ghost opacity-40">← Trước</span>}
          <span className="text-stone-500 text-[12.5px]">Trang {page}/{totalPages}</span>
          {page < totalPages
            ? <Link href={href(page + 1)} className="admin-btn-ghost">Sau →</Link>
            : <span className="admin-btn-ghost opacity-40">Sau →</span>}
        </div>
      )}
    </div>
  );
}
