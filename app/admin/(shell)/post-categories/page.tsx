import Link from 'next/link';
import { eq, sql, asc } from 'drizzle-orm';
import { db } from '@/db/client';
import { postCategories, posts } from '@/db/schema';
import DeleteButton from '@/components/admin/DeleteButton';
import { deletePostCategory } from '@/app/admin/actions/post-categories';

export default async function PostCategoriesAdminPage() {
  const rows = await db.select({
    id: postCategories.id,
    name: postCategories.name,
    description: postCategories.description,
    sortOrder: postCategories.sortOrder,
    count: sql<number>`count(${posts.id})::int`,
  })
    .from(postCategories)
    .leftJoin(posts, eq(posts.categoryId, postCategories.id))
    .groupBy(postCategories.id, postCategories.name, postCategories.description, postCategories.sortOrder)
    .orderBy(asc(postCategories.sortOrder), asc(postCategories.name));

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="admin-title text-[28px]">Chuyên mục tin tức</h1>
          <p className="text-[12.5px] text-stone-500 mt-0.5">Nhóm các bài viết theo chủ đề</p>
        </div>
        <Link href="/admin/post-categories/new" className="admin-btn-primary">+ Thêm chuyên mục</Link>
      </div>

      {rows.length === 0 ? (
        <div className="admin-panel p-8 text-center">
          <div className="text-4xl mb-2">⊞</div>
          <p className="text-sm text-stone-600 mb-3">
            Chưa có chuyên mục nào. Bài viết vẫn đăng được, chỉ là chưa phân loại.
          </p>
          <Link href="/admin/post-categories/new" className="admin-btn-primary inline-flex">Tạo chuyên mục đầu tiên</Link>
        </div>
      ) : (
        <div className="admin-panel-flush">
          <table className="admin-table">
            <thead>
              <tr>
                <th className="px-4 py-2.5 font-medium">Tên</th>
                <th className="px-4 py-2.5 font-medium">Mô tả</th>
                <th className="px-4 py-2.5 font-medium">Số bài</th>
                <th className="px-4 py-2.5 font-medium">Thứ tự</th>
                <th className="px-4 py-2.5 font-medium text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((c) => (
                <tr key={c.id}>
                  <td>
                    <Link href={`/admin/post-categories/${c.id}`} className="font-medium text-stone-900 hover:underline">
                      {c.name}
                    </Link>
                    <div className="text-[11.5px] text-stone-400 font-mono mt-0.5">{c.id}</div>
                  </td>
                  <td className="text-stone-600 max-w-md">
                    {c.description || <span className="text-stone-400">—</span>}
                  </td>
                  <td className="tabular-nums text-stone-700">{c.count}</td>
                  <td className="tabular-nums text-stone-500">{c.sortOrder}</td>
                  <td className="text-right">
                    <div className="inline-flex items-center gap-3">
                      <Link href={`/admin/post-categories/${c.id}`}
                        className="text-[12.5px] text-stone-600 hover:text-stone-900">Sửa</Link>
                      <DeleteButton
                        action={deletePostCategory.bind(null, c.id)}
                        confirmText={
                          c.count > 0
                            ? `Xóa chuyên mục "${c.name}"? ${c.count} bài viết trong đó sẽ KHÔNG bị xóa, chỉ chuyển về "chưa phân loại".`
                            : `Xóa chuyên mục "${c.name}"?`
                        }
                      />
                    </div>
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
