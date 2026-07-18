import ThemeForm from '@/components/admin/ThemeForm';
import { getTheme } from '@/lib/data';
import { requireRole } from '@/lib/session';

export default async function ThemeAdminPage() {
  await requireRole('admin');
  const theme = await getTheme();
  return (
    <div className="space-y-4">
      <div>
        <h1 className="admin-title text-[28px]">Giao diện</h1>
        <p className="text-[12.5px] text-stone-500 mt-0.5">
          Đổi màu thương hiệu, màu nhấn, độ bo góc và font — áp dụng cho cả trang khách lẫn khu quản trị
        </p>
      </div>
      <ThemeForm defaults={theme} />
    </div>
  );
}
