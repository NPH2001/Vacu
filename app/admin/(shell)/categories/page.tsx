import Link from 'next/link';
import { asc } from 'drizzle-orm';
import { db } from '@/db/client';
import { categories } from '@/db/schema';
import DeleteButton from '@/components/admin/DeleteButton';
import BulkDeleteForm from '@/components/admin/BulkDeleteForm';
import { deleteCategory, bulkDeleteCategories } from '@/app/admin/actions/categories';

export default async function CategoriesAdminPage() {
  const rows = await db.select().from(categories).orderBy(asc(categories.sortOrder), asc(categories.name));

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold font-display text-green-950">Danh mục</h1>
        <Link href="/admin/categories/new"
          className="bg-green-700 hover:bg-green-800 text-white font-semibold px-4 py-2 rounded-full text-sm">
          + Thêm danh mục
        </Link>
      </div>

      {rows.length === 0 ? (
        <div className="bg-white rounded-2xl border border-green-100 p-6 text-sm text-green-900/70">Chưa có danh mục.</div>
      ) : (
        <BulkDeleteForm action={bulkDeleteCategories}>
          <div className="bg-white rounded-2xl border border-green-100 overflow-hidden">
            <table className="w-full text-sm">
              <thead className="text-left text-green-900/70 bg-green-50/60">
                <tr>
                  <th className="px-4 py-2.5 w-10"></th>
                  <th className="px-4 py-2.5 font-medium w-14">Icon</th>
                  <th className="px-4 py-2.5 font-medium">Tên</th>
                  <th className="px-4 py-2.5 font-medium">Slug</th>
                  <th className="px-4 py-2.5 font-medium">Thứ tự</th>
                  <th className="px-4 py-2.5 font-medium text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.id} className="border-t border-green-50">
                    <td className="px-4 py-2"><input type="checkbox" name="ids" value={r.id} /></td>
                    <td className="px-4 py-2 text-xl">{r.icon}</td>
                    <td className="px-4 py-2">
                      <Link href={`/admin/categories/${r.id}`} className="font-medium text-green-950 hover:underline">{r.name}</Link>
                      <div className="text-xs text-green-900/60 line-clamp-1">{r.description}</div>
                    </td>
                    <td className="px-4 py-2 font-mono text-xs">{r.id}</td>
                    <td className="px-4 py-2">{r.sortOrder}</td>
                    <td className="px-4 py-2 text-right space-x-3">
                      <Link href={`/admin/categories/${r.id}`} className="text-green-700 hover:underline">Sửa</Link>
                      <DeleteButton action={deleteCategory.bind(null, r.id)} confirmText={`Xóa danh mục "${r.name}"?`} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </BulkDeleteForm>
      )}
    </div>
  );
}
