import PostCategoryForm from '@/components/admin/PostCategoryForm';
import { createPostCategory } from '@/app/admin/actions/post-categories';

export default function NewPostCategoryPage() {
  return (
    <div className="space-y-5">
      <h1 className="admin-title text-[28px]">Chuyên mục mới</h1>
      <PostCategoryForm action={createPostCategory} editing={false} />
    </div>
  );
}
