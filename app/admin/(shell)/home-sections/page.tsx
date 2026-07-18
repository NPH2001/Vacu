import Link from 'next/link';
import HomeSectionsForm from '@/components/admin/HomeSectionsForm';
import { saveHomeSections } from '@/app/admin/actions/home-sections';
import { getHomeSectionOrder } from '@/lib/data';

export default async function HomeSectionsAdminPage() {
  const order = await getHomeSectionOrder();

  return (
    <div className="space-y-4">
      <div>
        <h1 className="admin-title text-[28px]">Bố cục trang chủ</h1>
        <p className="text-[12.5px] text-stone-500 mt-0.5">
          Sắp xếp thứ tự và bật/tắt từng khối trên trang chủ
        </p>
      </div>

      <div className="admin-panel p-3.5 bg-stone-50 max-w-3xl">
        <p className="text-[12.5px] text-stone-600 leading-relaxed">
          Đây là <b>thứ tự các khối</b> trên trang chủ, từ trên xuống. Ẩn một khối không xóa nội dung của nó
          — bật lại lúc nào cũng được. Còn <b>chữ nghĩa bên trong</b> mỗi khối thì sửa ở{' '}
          <Link href="/admin/settings" className="text-green-700 hover:underline">Cài đặt → Trang chủ</Link>{' '}
          và ở các mục nội dung tương ứng.
        </p>
      </div>

      <HomeSectionsForm action={saveHomeSections} defaultValue={order} />
    </div>
  );
}
