'use server';

import { revalidatePath } from 'next/cache';
import { and, eq } from 'drizzle-orm';
import { db } from '@/db/client';
import { productReviews } from '@/db/schema';
import { friendlyWriteError } from '@/lib/db-errors';
import { productReviewSchema } from '@/lib/validators';
import { requireAdmin } from '@/lib/session';

export type ProductReviewFormState = { error?: string } | null;

function parseForm(fd: FormData) {
  return productReviewSchema.safeParse({
    name: fd.get('name'),
    avatar: fd.get('avatar'),
    content: fd.get('content'),
    rating: fd.get('rating'),
    sortOrder: fd.get('sortOrder'),
  });
}

function revalidateProductReviewPaths(productId: string) {
  revalidatePath(`/admin/products/${productId}`);
  revalidatePath(`/products/${productId}`);
}

export async function createProductReview(
  productId: string,
  _prev: ProductReviewFormState,
  fd: FormData,
): Promise<ProductReviewFormState> {
  await requireAdmin();
  const parsed = parseForm(fd);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? 'Dữ liệu không hợp lệ' };

  try {
    await db.insert(productReviews).values({ productId, ...parsed.data });
  } catch (error) {
    return { error: friendlyWriteError(error) };
  }
  revalidateProductReviewPaths(productId);
  return null;
}

export async function updateProductReview(
  productId: string,
  reviewId: number,
  _prev: ProductReviewFormState,
  fd: FormData,
): Promise<ProductReviewFormState> {
  await requireAdmin();
  const parsed = parseForm(fd);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? 'Dữ liệu không hợp lệ' };

  try {
    await db.update(productReviews)
      .set({ ...parsed.data, updatedAt: new Date() })
      .where(and(eq(productReviews.id, reviewId), eq(productReviews.productId, productId)));
  } catch (error) {
    return { error: friendlyWriteError(error) };
  }
  revalidateProductReviewPaths(productId);
  return null;
}

export async function deleteProductReview(productId: string, reviewId: number): Promise<void> {
  await requireAdmin();
  await db.delete(productReviews)
    .where(and(eq(productReviews.id, reviewId), eq(productReviews.productId, productId)));
  revalidateProductReviewPaths(productId);
}
