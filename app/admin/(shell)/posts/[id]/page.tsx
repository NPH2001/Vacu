import { notFound } from 'next/navigation';
import { eq } from 'drizzle-orm';
import { db } from '@/db/client';
import { posts } from '@/db/schema';
import PostForm from '@/components/admin/PostForm';
import { publishModeOf } from '@/lib/publish-mode';
import { updatePost } from '@/app/admin/actions/posts';
import { getAllPostCategories } from '@/lib/posts';

export default async function EditPostPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [rows, cats] = await Promise.all([
    db.select().from(posts).where(eq(posts.id, id)).limit(1),
    getAllPostCategories(),
  ]);
  const row = rows[0];
  if (!row) notFound();

  const boundUpdate = updatePost.bind(null, row.id);

  return (
    <div className="space-y-5">
      <h1 className="admin-title text-[28px] truncate">Sửa bài: {row.title}</h1>
      <PostForm
        action={boundUpdate}
        defaults={row}
        categories={cats}
        editing
        initialMode={publishModeOf(row.status, row.publishedAt, new Date())}
      />
    </div>
  );
}
