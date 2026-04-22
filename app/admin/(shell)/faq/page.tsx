import Link from 'next/link';
import { sql } from 'drizzle-orm';
import { db } from '@/db/client';
import { faqItems } from '@/db/schema';
import DeleteButton from '@/components/admin/DeleteButton';
import BulkDeleteForm from '@/components/admin/BulkDeleteForm';
import { deleteFaq, bulkDeleteFaq } from '@/app/admin/actions/faq';
import SearchInput from '@/components/admin/list/SearchInput';
import Pagination from '@/components/admin/list/Pagination';
import PageSizeSelect from '@/components/admin/list/PageSizeSelect';
import ClearFiltersLink from '@/components/admin/list/ClearFiltersLink';
import {
  parseListParams, buildWhere, buildOrderBy, buildPagination,
  type ListSchema,
} from '@/lib/admin/list-params';

const BASE = '/admin/faq';

export default async function FaqAdminPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;

  const schema: ListSchema = {
    searchFields: [faqItems.question, faqItems.answer],
    sortable: {
      sortOrder: faqItems.sortOrder,
      question: faqItems.question,
    },
    defaultSort: 'sortOrder',
  };

  const parsed = parseListParams(sp, schema);
  const where = buildWhere(parsed, schema);
  const orderBy = buildOrderBy(parsed, schema);
  const { limit, offset } = buildPagination(parsed);

  const [rows, totalRows] = await Promise.all([
    db.select().from(faqItems).where(where).orderBy(orderBy).limit(limit).offset(offset),
    db.select({ total: sql<number>`count(*)::int` }).from(faqItems).where(where),
  ]);
  const total = totalRows[0]?.total ?? 0;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="admin-title text-[28px]">Câu hỏi thường gặp</h1>
        <Link
          href="/admin/faq/new"
          className="admin-btn-primary">
          + Thêm FAQ
        </Link>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <SearchInput placeholder="Tìm câu hỏi…" />
        <div className="ml-auto"><ClearFiltersLink basePath={BASE} parsed={parsed} /></div>
      </div>

      {total === 0 ? (
        <div className="admin-panel p-6 text-sm text-stone-500">
          {parsed.q ? 'Không có kết quả phù hợp.' : 'Chưa có câu hỏi nào.'}
        </div>
      ) : (
        <BulkDeleteForm action={bulkDeleteFaq}>
          <div className="admin-panel-flush">
            <ul className="divide-y divide-stone-100">
              {rows.map((r) => (
                <li key={r.id} className="p-5 flex gap-4 items-start">
                  <input type="checkbox" name="ids" value={r.id} className="mt-1" />
                  <div className="flex-1">
                    <Link href={`/admin/faq/${r.id}`} className="font-semibold text-green-950 hover:underline">{r.question}</Link>
                    <div className="text-sm text-green-900/70 mt-1 line-clamp-2">{r.answer}</div>
                    <div className="text-xs text-green-900/50 mt-1">Thứ tự: {r.sortOrder}</div>
                  </div>
                  <div className="space-x-3 text-sm shrink-0">
                    <Link href={`/admin/faq/${r.id}`} className="text-green-700 hover:underline">Sửa</Link>
                    <DeleteButton action={deleteFaq.bind(null, r.id)} confirmText={`Xóa câu hỏi này?`} />
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
