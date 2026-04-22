import { eq } from 'drizzle-orm';
import { db } from '@/db/client';
import { siteInfo } from '@/db/schema';
import SettingsForm from '@/components/admin/SettingsForm';
import { updateSiteInfo } from '@/app/admin/actions/settings';

export default async function SettingsPage() {
  const rows = await db.select().from(siteInfo).where(eq(siteInfo.id, 1)).limit(1);
  const row = rows[0];
  if (!row) {
    return (
      <div className="space-y-4">
        <h1 className="text-2xl font-bold font-display text-green-950">Cài đặt</h1>
        <p className="text-sm text-red-600">Bảng <code>site_info</code> chưa có dữ liệu. Chạy <code>npm run db:seed</code> trước.</p>
      </div>
    );
  }
  return (
    <div className="space-y-5">
      <h1 className="text-2xl font-bold font-display text-green-950">Cài đặt website</h1>
      <SettingsForm action={updateSiteInfo} defaults={row} />
    </div>
  );
}
