import Link from 'next/link';
import { asc } from 'drizzle-orm';
import { db } from '@/db/client';
import { emailTemplates } from '@/db/schema';

export default async function EmailTemplatesAdminPage() {
  const rows = await db.select().from(emailTemplates).orderBy(asc(emailTemplates.name));
  return (
    <div className="space-y-5">
      <h1 className="admin-title text-[28px]">Mẫu email</h1>
      <p className="text-sm text-green-900/70">
        4 mẫu cố định cho các trường hợp hệ thống gửi mail. Bạn có thể sửa chủ đề, nội dung HTML và tạm tắt từng mẫu.
        Biến thay thế dạng <code className="bg-green-50 px-1 rounded">{'{{tênBiến}}'}</code> — danh sách biến hiển thị trong trang sửa.
      </p>
      {rows.length === 0 ? (
        <div className="admin-panel p-6 text-sm text-red-600">
          Chưa seed mẫu email. Chạy migration lại.
        </div>
      ) : (
        <div className="admin-panel-flush">
          <table className="admin-table">
            <thead className="text-left bg-green-50/60 text-green-900/70">
              <tr>
                <th className="px-4 py-2.5 font-medium">Key</th>
                <th className="px-4 py-2.5 font-medium">Tên</th>
                <th className="px-4 py-2.5 font-medium">Chủ đề</th>
                <th className="px-4 py-2.5 font-medium">Trạng thái</th>
                <th className="px-4 py-2.5 font-medium"></th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.key}>
                  <td className="px-4 py-2 font-mono text-xs">{r.key}</td>
                  <td className="px-4 py-2 font-semibold text-green-950">{r.name}</td>
                  <td className="px-4 py-2 text-green-900/80 line-clamp-1 max-w-xs">{r.subject}</td>
                  <td className="px-4 py-2">
                    <span className={`text-xs px-2 py-0.5 rounded-full ${
                      r.enabled ? 'bg-green-100 text-green-800' : 'bg-stone-100 text-stone-600'
                    }`}>{r.enabled ? 'Bật' : 'Tắt'}</span>
                  </td>
                  <td className="px-4 py-2 text-right">
                    <Link href={`/admin/email-templates/${r.key}`} className="text-green-700 hover:underline text-sm">Sửa</Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
