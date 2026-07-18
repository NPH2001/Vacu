import Link from 'next/link';
import { getAllPages } from '@/lib/pages';
import DeleteButton from '@/components/admin/DeleteButton';
import FlashBanner from '@/components/admin/FlashBanner';
import { deletePage } from '@/app/admin/actions/pages';
import { HOME_PAGE_ID } from '@/lib/blocks';

export default async function PagesAdminPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const [rows, sp] = await Promise.all([getAllPages(), searchParams]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="admin-title text-[28px]">Trang</h1>
          <p className="text-[12.5px] text-stone-500 mt-0.5">
            Tự tạo trang mới và xếp nội dung theo khối, không cần lập trình
          </p>
        </div>
        <Link href="/admin/pages/new" className="admin-btn-primary">+ Tạo trang mới</Link>
      </div>

      <FlashBanner code={sp.loi} basePath="/admin/pages" />

      {rows.length === 0 ? (
        <div className="admin-panel p-8 text-center">
          <div className="text-4xl mb-2">▤</div>
          <p className="text-sm text-stone-600 mb-3">Chưa có trang nào.</p>
          <Link href="/admin/pages/new" className="admin-btn-primary inline-flex">Tạo trang đầu tiên</Link>
        </div>
      ) : (
        <div className="admin-panel-flush">
          <table className="admin-table">
            <thead>
              <tr>
                <th className="px-4 py-2.5 font-medium">Tên trang</th>
                <th className="px-4 py-2.5 font-medium">Địa chỉ</th>
                <th className="px-4 py-2.5 font-medium">Số khối</th>
                <th className="px-4 py-2.5 font-medium">Trạng thái</th>
                <th className="px-4 py-2.5 font-medium text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((p) => {
                const isHome = p.id === HOME_PAGE_ID;
                const publicHref = isHome ? '/' : `/${p.id}`;
                return (
                <tr key={p.id}>
                  <td>
                    <Link href={`/admin/pages/${p.id}`} className="font-medium text-stone-900 hover:underline">
                      {p.title}
                    </Link>
                    {isHome && (
                      <span className="ml-2 admin-badge align-middle" style={{ background: '#fef3c7', color: '#92400e', borderColor: '#fde68a' }}>
                        Trang gốc
                      </span>
                    )}
                  </td>
                  <td className="text-stone-500 font-mono text-[12px]">{publicHref}</td>
                  <td className="tabular-nums text-stone-700">{p.blockCount}</td>
                  <td>
                    {p.status === 'published' ? (
                      <span className="admin-badge" style={{ background: '#dcfce7', color: '#166534', borderColor: '#bbf7d0' }}>
                        Đang hiện
                      </span>
                    ) : (
                      <span className="admin-badge" style={{ background: '#f5f5f4', color: '#57534e', borderColor: '#e7e5e4' }}>
                        Nháp
                      </span>
                    )}
                  </td>
                  <td className="text-right">
                    <div className="inline-flex items-center gap-3">
                      <Link href={isHome ? publicHref : `${publicHref}?preview=1`} target="_blank"
                        className="text-[12.5px] text-stone-600 hover:text-stone-900">Xem</Link>
                      <Link href={`/admin/pages/${p.id}`}
                        className="text-[12.5px] text-stone-600 hover:text-stone-900">Sửa</Link>
                      {isHome ? (
                        <span className="text-[12.5px] text-stone-300" title="Không thể xóa trang gốc">Xóa</span>
                      ) : (
                        <DeleteButton action={deletePage.bind(null, p.id)}
                          confirmText={`Xóa trang "${p.title}"? Toàn bộ khối nội dung của trang cũng mất theo.`} />
                      )}
                    </div>
                  </td>
                </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
