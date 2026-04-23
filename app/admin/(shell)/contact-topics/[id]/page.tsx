import { notFound } from 'next/navigation';
import { eq } from 'drizzle-orm';
import { db } from '@/db/client';
import { contactTopics } from '@/db/schema';
import ContactTopicForm from '@/components/admin/ContactTopicForm';
import { updateContactTopic } from '@/app/admin/actions/contact-topics';

export default async function EditContactTopicPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const num = Number(id);
  if (!Number.isFinite(num)) notFound();
  const rows = await db.select().from(contactTopics).where(eq(contactTopics.id, num)).limit(1);
  const row = rows[0];
  if (!row) notFound();
  const bound = updateContactTopic.bind(null, row.id);
  return (
    <div className="space-y-5">
      <h1 className="admin-title text-[28px]">Sửa chủ đề liên hệ</h1>
      <ContactTopicForm action={bound} defaults={row} editing />
    </div>
  );
}
