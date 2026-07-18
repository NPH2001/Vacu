import Link from 'next/link';
import { sql } from 'drizzle-orm';
import { db } from '@/db/client';
import { contactTopics } from '@/db/schema';
import DeleteButton from '@/components/admin/DeleteButton';
import BulkDeleteForm from '@/components/admin/BulkDeleteForm';
import { deleteContactTopic, bulkDeleteContactTopics } from '@/app/admin/actions/contact-topics';
import SearchInput from '@/components/admin/list/SearchInput';
import Pagination from '@/components/admin/list/Pagination';
import PageSizeSelect from '@/components/admin/list/PageSizeSelect';
import ClearFiltersLink from '@/components/admin/list/ClearFiltersLink';
import {
  parseListParams, buildWhere, buildOrderBy, buildPagination,
  type ListSchema,
} from '@/lib/admin/list-params';

const BASE = '/admin/contact-topics';

export default async function ContactTopicsAdminPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;

  const schema: ListSchema = {
    searchFields: [contactTopics.label],
    sortable: {
      label: contactTopics.label,
      sortOrder: contactTopics.sortOrder,
    },
    defaultSort: 'sortOrder',
  };

  const parsed = parseListParams(sp, schema);
  const where = buildWhere(parsed, schema);
  const orderBy = buildOrderBy(parsed, schema);
  const { limit, offset } = buildPagination(parsed);

  const [rows, totalRows] = await Promise.all([
    db.select().from(contactTopics).where(where).orderBy(orderBy).limit(limit).offset(offset),
    db.select({ total: sql<number>`count(*)::int` }).from(contactTopics).where(where),
  ]);
  const total = totalRows[0]?.total ?? 0;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="admin-title text-[28px]">Chủ đề liên hệ</h1>
        <Link
          href="/admin/contact-topics/new"
          className="admin-btn-primary">
          + Thêm
        </Link>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <SearchInput placeholder="Tìm chủ đề…" />
        <div className="ml-auto"><ClearFiltersLink basePath={BASE} parsed={parsed} /></div>
      </div>

      {total === 0 ? (
        <div className="admin-panel p-6 text-sm text-stone-500">
          {parsed.q ? 'Không có kết quả phù hợp.' : 'Chưa có chủ đề nào.'}
        </div>
      ) : (
        <BulkDeleteForm action={bulkDeleteContactTopics}>
          <div className="admin-panel-flush">
            <ul className="divide-y divide-stone-100">
              {rows.map((r) => (
                <li key={r.id} className="p-5 flex gap-4 items-center">
                  <input type="checkbox" name="ids" aria-label="Chọn để xóa" value={r.id} />
                  <div className="flex-1">
                    <Link href={`/admin/contact-topics/${r.id}`} className="font-semibold text-green-950 hover:underline">{r.label}</Link>
                    <div className="text-xs text-green-900/50 mt-0.5">Thứ tự: {r.sortOrder}</div>
                  </div>
                  <div className="space-x-3 text-sm shrink-0">
                    <Link href={`/admin/contact-topics/${r.id}`} className="text-green-700 hover:underline">Sửa</Link>
                    <DeleteButton action={deleteContactTopic.bind(null, r.id)} confirmText="Xóa chủ đề này?" />
                  </div>
                </li>
              ))}
            </ul>
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
