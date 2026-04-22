import Link from 'next/link';
import { asc } from 'drizzle-orm';
import { db } from '@/db/client';
import { faqItems } from '@/db/schema';
import DeleteButton from '@/components/admin/DeleteButton';
import { deleteFaq } from '@/app/admin/actions/faq';

export default async function FaqAdminPage() {
  const rows = await db.select().from(faqItems).orderBy(asc(faqItems.sortOrder), asc(faqItems.id));

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold font-display text-green-950">Câu hỏi thường gặp</h1>
        <Link href="/admin/faq/new"
          className="bg-green-700 hover:bg-green-800 text-white font-semibold px-4 py-2 rounded-full text-sm">
          + Thêm FAQ
        </Link>
      </div>
      <div className="bg-white rounded-2xl border border-green-100 overflow-hidden">
        {rows.length === 0 ? (
          <div className="p-6 text-sm text-green-900/70">Chưa có câu hỏi nào.</div>
        ) : (
          <ul className="divide-y divide-green-50">
            {rows.map((r) => (
              <li key={r.id} className="p-5 flex gap-4">
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
        )}
      </div>
    </div>
  );
}
