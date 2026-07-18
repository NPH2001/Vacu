import Link from 'next/link';
import { sql, eq } from 'drizzle-orm';
import { db } from '@/db/client';
import { posts, postCategories } from '@/db/schema';
import DeleteButton from '@/components/admin/DeleteButton';
import BulkDeleteForm from '@/components/admin/BulkDeleteForm';
import { deletePost, bulkDeletePosts } from '@/app/admin/actions/posts';
import SearchInput from '@/components/admin/list/SearchInput';
import FilterSelect from '@/components/admin/list/FilterSelect';
import FilterChips from '@/components/admin/list/FilterChips';
import SortableTh from '@/components/admin/list/SortableTh';
import Pagination from '@/components/admin/list/Pagination';
import PageSizeSelect from '@/components/admin/list/PageSizeSelect';
import ClearFiltersLink from '@/components/admin/list/ClearFiltersLink';
import { getAllPostCategories } from '@/lib/posts';
import {
  parseListParams, buildWhere, buildOrderBy, buildPagination, type ListSchema,
} from '@/lib/admin/list-params';

const BASE = '/admin/posts';

/** Mirrors lib/posts livePosts(): published + publish time reached. */
function statusOf(status: string, publishedAt: Date | null) {
  if (status !== 'published') return { label: 'Nháp', style: { background: '#f5f5f4', color: '#57534e', borderColor: '#e7e5e4' } };
  if (publishedAt && publishedAt.getTime() > Date.now()) {
    return { label: `Hẹn ${publishedAt.toLocaleString('vi-VN', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}`,
      style: { background: '#fef3c7', color: '#92400e', borderColor: '#fde68a' } };
  }
  return { label: 'Đang hiện', style: { background: '#dcfce7', color: '#166534', borderColor: '#bbf7d0' } };
}

export default async function PostsAdminPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;
  const cats = await getAllPostCategories();

  const schema: ListSchema = {
    searchFields: [posts.title, posts.id, posts.excerpt],
    sortable: {
      title: posts.title,
      publishedAt: posts.publishedAt,
      updatedAt: posts.updatedAt,
    },
    defaultSort: '-updatedAt',
    filters: {
      categoryId: { type: 'equals', column: posts.categoryId, values: cats.map((c) => c.id) },
      status: { type: 'equals', column: posts.status, values: ['draft', 'published'] },
      featured: { type: 'boolean', column: posts.featured },
    },
  };

  const parsed = parseListParams(sp, schema);
  const where = buildWhere(parsed, schema);
  const orderBy = buildOrderBy(parsed, schema);
  const { limit, offset } = buildPagination(parsed);

  const [rows, totalRows] = await Promise.all([
    db.select({
      id: posts.id,
      title: posts.title,
      coverImage: posts.coverImage,
      status: posts.status,
      publishedAt: posts.publishedAt,
      featured: posts.featured,
      authorName: posts.authorName,
      categoryName: postCategories.name,
    }).from(posts)
      .leftJoin(postCategories, eq(posts.categoryId, postCategories.id))
      .where(where).orderBy(orderBy).limit(limit).offset(offset),
    db.select({ total: sql<number>`count(*)::int` }).from(posts).where(where),
  ]);
  const total = totalRows[0]?.total ?? 0;
  const hasFilter = parsed.q !== '' || Object.keys(parsed.filters).length > 0;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="admin-title text-[28px]">Bài viết</h1>
          <p className="text-[12.5px] text-stone-500 mt-0.5">Tin tức, mẹo hay, câu chuyện nông trại</p>
        </div>
        <Link href="/admin/posts/new" className="admin-btn-primary">+ Viết bài mới</Link>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <SearchInput placeholder="Tìm theo tiêu đề / đường dẫn…" />
        <FilterSelect
          filterKey="categoryId"
          current={parsed.filters.categoryId ?? null}
          options={cats.map((c) => ({ value: c.id, label: c.name }))}
          placeholder="Tất cả chuyên mục"
        />
        <FilterChips
          basePath={BASE}
          parsed={parsed}
          filterKey="status"
          options={[
            { value: null, label: 'Tất cả' },
            { value: 'published', label: 'Đã đăng' },
            { value: 'draft', label: 'Nháp' },
          ]}
        />
        <FilterChips
          basePath={BASE}
          parsed={parsed}
          filterKey="featured"
          options={[
            { value: null, label: 'Mọi bài' },
            { value: '1', label: '📌 Ghim' },
          ]}
        />
        <div className="ml-auto"><ClearFiltersLink basePath={BASE} parsed={parsed} /></div>
      </div>

      {total === 0 ? (
        <div className="admin-panel p-8 text-center">
          {hasFilter ? (
            <p className="text-sm text-stone-500">Không có bài viết nào phù hợp.</p>
          ) : (
            <>
              <div className="text-4xl mb-2">✎</div>
              <p className="text-sm text-stone-600 mb-3">Chưa có bài viết nào.</p>
              <Link href="/admin/posts/new" className="admin-btn-primary inline-flex">Viết bài đầu tiên</Link>
            </>
          )}
        </div>
      ) : (
        <BulkDeleteForm action={bulkDeletePosts}>
          <div className="admin-panel-flush">
            <table className="admin-table">
              <thead>
                <tr>
                  <th className="px-4 py-2.5 w-10"></th>
                  <th className="px-4 py-2.5 font-medium">Ảnh</th>
                  <SortableTh basePath={BASE} parsed={parsed} schema={schema} sortKey="title">Tiêu đề</SortableTh>
                  <th className="px-4 py-2.5 font-medium">Chuyên mục</th>
                  <th className="px-4 py-2.5 font-medium">Trạng thái</th>
                  <SortableTh basePath={BASE} parsed={parsed} schema={schema} sortKey="publishedAt">Ngày đăng</SortableTh>
                  <th className="px-4 py-2.5 font-medium text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((p) => {
                  const st = statusOf(p.status, p.publishedAt);
                  return (
                    <tr key={p.id}>
                      <td><input type="checkbox" name="ids" value={p.id} /></td>
                      <td>
                        {p.coverImage ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={p.coverImage} alt="" className="w-14 h-10 rounded-md object-cover ring-1 ring-stone-200" />
                        ) : (
                          <div className="w-14 h-10 rounded-md bg-stone-100 ring-1 ring-stone-200" />
                        )}
                      </td>
                      <td>
                        <div className="flex items-center gap-1.5">
                          {p.featured && <span title="Đã ghim">📌</span>}
                          <Link href={`/admin/posts/${p.id}`} className="font-medium text-stone-900 hover:underline">
                            {p.title}
                          </Link>
                        </div>
                        <div className="text-[11.5px] text-stone-400 mt-0.5">{p.authorName || '—'}</div>
                      </td>
                      <td className="text-stone-600">{p.categoryName ?? <span className="text-stone-400">—</span>}</td>
                      <td>
                        <span className="admin-badge" style={st.style}>{st.label}</span>
                      </td>
                      <td className="text-stone-600 tabular-nums text-[12.5px]">
                        {p.publishedAt ? new Date(p.publishedAt).toLocaleDateString('vi-VN') : '—'}
                      </td>
                      <td className="text-right">
                        <div className="inline-flex items-center gap-3">
                          <Link href={`/tin-tuc/${p.id}?preview=1`} target="_blank"
                            className="text-[12.5px] text-stone-600 hover:text-stone-900">Xem</Link>
                          <Link href={`/admin/posts/${p.id}`}
                            className="text-[12.5px] text-stone-600 hover:text-stone-900">Sửa</Link>
                          <DeleteButton action={deletePost.bind(null, p.id)} confirmText={`Xóa bài "${p.title}"?`} />
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </BulkDeleteForm>
      )}

      <div className="flex items-center justify-between">
        <Pagination basePath={BASE} parsed={parsed} schema={schema} total={total} />
        <PageSizeSelect />
      </div>
    </div>
  );
}
