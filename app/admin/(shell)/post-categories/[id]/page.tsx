import { notFound } from 'next/navigation';
import { eq } from 'drizzle-orm';
import { db } from '@/db/client';
import { postCategories } from '@/db/schema';
import PostCategoryForm from '@/components/admin/PostCategoryForm';
import { updatePostCategory } from '@/app/admin/actions/post-categories';

export default async function EditPostCategoryPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const rows = await db.select().from(postCategories).where(eq(postCategories.id, id)).limit(1);
  const row = rows[0];
  if (!row) notFound();

  return (
    <div className="space-y-5">
      <h1 className="admin-title text-[28px]">Sửa chuyên mục: {row.name}</h1>
      <PostCategoryForm action={updatePostCategory.bind(null, row.id)} defaults={row} editing />
    </div>
  );
}
