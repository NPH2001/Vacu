import Link from 'next/link';
import { asc } from 'drizzle-orm';
import { db } from '@/db/client';
import { heroSlides } from '@/db/schema';
import DeleteButton from '@/components/admin/DeleteButton';
import BulkDeleteForm from '@/components/admin/BulkDeleteForm';
import { deleteHeroSlide, bulkDeleteHeroSlides } from '@/app/admin/actions/hero-slides';

export default async function HeroSlidesAdminPage() {
  const rows = await db.select().from(heroSlides).orderBy(asc(heroSlides.sortOrder), asc(heroSlides.id));

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="admin-title text-[28px]">Slider trang chủ</h1>
          <p className="text-[12.5px] text-stone-500 mt-0.5">Các ảnh bìa lớn tự chuyển ở đầu trang chủ</p>
        </div>
        <Link href="/admin/hero-slides/new" className="admin-btn-primary">+ Thêm slide</Link>
      </div>

      <div className="admin-panel p-3.5 bg-stone-50">
        <p className="text-[12.5px] text-stone-600 leading-relaxed">
          Khi có ít nhất một slide đang bật, trang chủ hiển thị <b>slider tự chuyển</b>. Nếu không có slide nào,
          trang chủ dùng ảnh bìa tĩnh cấu hình ở{' '}
          <Link href="/admin/settings" className="text-green-700 hover:underline">Cài đặt → Trang chủ</Link>.
        </p>
      </div>

      {rows.length === 0 ? (
        <div className="admin-panel p-8 text-center">
          <div className="text-4xl mb-2">🖼️</div>
          <p className="text-sm text-stone-600 mb-3">Chưa có slide nào. Trang chủ đang dùng ảnh bìa tĩnh.</p>
          <Link href="/admin/hero-slides/new" className="admin-btn-primary inline-flex">Tạo slide đầu tiên</Link>
        </div>
      ) : (
        <BulkDeleteForm action={bulkDeleteHeroSlides}>
          <div className="admin-panel-flush">
            <ul className="divide-y divide-stone-100">
              {rows.map((r) => (
                <li key={r.id} className="p-4 flex gap-4 items-center">
                  <input type="checkbox" name="ids" aria-label="Chọn để xóa" value={r.id} className="shrink-0" />
                  <div className="w-24 h-14 rounded-lg overflow-hidden bg-stone-100 ring-1 ring-stone-200 shrink-0">
                    {r.image ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={r.image} alt="" className="w-full h-full object-cover" />
                    ) : null}
                  </div>
                  <div className="flex-1 min-w-0">
                    <Link href={`/admin/hero-slides/${r.id}`} className="font-semibold text-stone-900 hover:underline line-clamp-1">
                      {r.title}
                    </Link>
                    {r.subtitle && <div className="text-[12.5px] text-stone-500 mt-0.5 line-clamp-1">{r.subtitle}</div>}
                    <div className="text-[11.5px] text-stone-400 mt-0.5">Thứ tự: {r.sortOrder}</div>
                  </div>
                  {!r.active && (
                    <span className="admin-badge shrink-0" style={{ background: '#f5f5f4', color: '#57534e', borderColor: '#e7e5e4' }}>
                      Đang ẩn
                    </span>
                  )}
                  <div className="space-x-3 text-sm shrink-0">
                    <Link href={`/admin/hero-slides/${r.id}`} className="text-stone-600 hover:text-stone-900">Sửa</Link>
                    <DeleteButton action={deleteHeroSlide.bind(null, r.id)} confirmText={`Xóa slide "${r.title}"?`} />
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </BulkDeleteForm>
      )}
    </div>
  );
}
