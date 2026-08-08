'use client';

import { useActionState } from 'react';
import ImageUpload from '@/components/admin/ImageUpload';
import {
  createProductReview, deleteProductReview, updateProductReview,
  type ProductReviewFormState,
} from '@/app/admin/actions/product-reviews';
import type { ProductReviewRow } from '@/db/schema';

export default function ProductReviewManager({ productId, reviews }: {
  productId: string;
  reviews: ProductReviewRow[];
}) {
  const createAction = createProductReview.bind(null, productId);
  const [createState, createFormAction, creating] = useActionState<ProductReviewFormState, FormData>(createAction, null);

  return (
    <section className="admin-panel p-5 space-y-5">
      <div>
        <h2 className="font-display text-lg text-stone-900">Đánh giá khách hàng</h2>
        <p className="mt-1 text-[12px] text-stone-500">
          Chỉ hiện tại trang chi tiết của sản phẩm này. Đặt thứ tự nhỏ hơn để hiện trước.
        </p>
      </div>

      {reviews.length > 0 && (
        <div className="space-y-4">
          {reviews.map((review) => <ReviewForm key={review.id} productId={productId} review={review} />)}
        </div>
      )}

      <form action={createFormAction} className="border-t border-stone-200 pt-5 space-y-3">
        <h3 className="font-medium text-stone-900">Thêm đánh giá</h3>
        <ReviewFields />
        {createState?.error && <p role="alert" className="text-sm text-red-600">{createState.error}</p>}
        <button type="submit" disabled={creating} className="admin-btn-primary disabled:opacity-60">
          {creating ? 'Đang thêm…' : 'Thêm đánh giá'}
        </button>
      </form>
    </section>
  );
}

function ReviewForm({ productId, review }: { productId: string; review: ProductReviewRow }) {
  const updateAction = updateProductReview.bind(null, productId, review.id);
  const [state, formAction, pending] = useActionState<ProductReviewFormState, FormData>(updateAction, null);
  const deleteAction = deleteProductReview.bind(null, productId, review.id);

  return (
    <form action={formAction} className="rounded-xl border border-stone-200 p-4 space-y-3">
      <ReviewFields review={review} />
      {state?.error && <p role="alert" className="text-sm text-red-600">{state.error}</p>}
      <div className="flex flex-wrap gap-2">
        <button type="submit" disabled={pending} className="admin-btn-primary disabled:opacity-60">
          {pending ? 'Đang lưu…' : 'Lưu đánh giá'}
        </button>
        <button formAction={deleteAction} type="submit" className="admin-btn-ghost text-red-700 hover:bg-red-50">
          Xóa
        </button>
      </div>
    </form>
  );
}

function ReviewFields({ review }: { review?: ProductReviewRow }) {
  return (
    <>
      <div className="grid md:grid-cols-2 gap-3">
        <label className="block">
          <span className="text-[13px] font-medium text-stone-900">Tên khách hàng <span className="text-red-500">*</span></span>
          <input name="name" required maxLength={120} defaultValue={review?.name ?? ''} className="mt-1 w-full admin-input" />
        </label>
        <label className="block">
          <span className="text-[13px] font-medium text-stone-900">Số sao <span className="text-red-500">*</span></span>
          <select name="rating" defaultValue={String(review?.rating ?? 5)} className="mt-1 w-full admin-input bg-white">
            <option value="5">★★★★★ (5 sao)</option>
            <option value="4">★★★★ (4 sao)</option>
            <option value="3">★★★ (3 sao)</option>
            <option value="2">★★ (2 sao)</option>
            <option value="1">★ (1 sao)</option>
          </select>
        </label>
      </div>
      <div className="grid md:grid-cols-[1fr_160px] gap-3 items-end">
        <label className="block">
          <span className="text-[13px] font-medium text-stone-900">Nội dung <span className="text-red-500">*</span></span>
          <textarea name="content" required maxLength={1000} rows={3} defaultValue={review?.content ?? ''}
            className="mt-1 w-full admin-input" />
        </label>
        <label className="block">
          <span className="text-[13px] font-medium text-stone-900">Thứ tự</span>
          <input name="sortOrder" type="number" min={0} step={1} defaultValue={review?.sortOrder ?? 0}
            className="mt-1 w-full admin-input" />
        </label>
      </div>
      <ImageUpload name="avatar" defaultValue={review?.avatar ?? ''} label="Ảnh đại diện (không bắt buộc)" />
    </>
  );
}
