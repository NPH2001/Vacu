import PostForm from '@/components/admin/PostForm';
import { createPost } from '@/app/admin/actions/posts';
import { getAllPostCategories } from '@/lib/posts';

export default async function NewPostPage() {
  const cats = await getAllPostCategories();
  return (
    <div className="space-y-5">
      <h1 className="admin-title text-[28px]">Viết bài mới</h1>
      <PostForm action={createPost} categories={cats} editing={false} initialMode="draft" />
    </div>
  );
}
