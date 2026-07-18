'use server';
import { redirect } from 'next/navigation';
import { friendlyWriteError } from '@/lib/db-errors';
import { revalidatePath } from 'next/cache';
import { eq, inArray } from 'drizzle-orm';
import { db } from '@/db/client';
import { products, productImages } from '@/db/schema';
import { productSchema } from '@/lib/validators';
import { requireAdmin } from '@/lib/session';
import { sanitizeRichText } from '@/lib/sanitize';

export type ProductFormState = { error?: string } | null;

function parseForm(fd: FormData) {
  const rawTags = String(fd.get('tags') ?? '').trim();
  return productSchema.safeParse({
    id: fd.get('id'),
    name: fd.get('name'),
    categoryId: fd.get('categoryId'),
    unit: fd.get('unit'),
    price: fd.get('price'),
    oldPrice: fd.get('oldPrice') ? fd.get('oldPrice') : undefined,
    image: fd.get('image'),
    farmerId: fd.get('farmerId') || undefined,
    description: fd.get('description'),
    body: fd.get('body') ?? '',
    tags: rawTags ? rawTags.split(',').map((t) => t.trim()).filter(Boolean) : [],
    featured: fd.get('featured') === 'on',
    inStock: fd.get('inStock') === 'on',
    gallery: fd.getAll('gallery').map(String).filter(Boolean),
  });
}

/**
 * The gallery is submitted as a complete ordered list, so it is replaced
 * wholesale rather than diffed — the form is the single source of truth for
 * both membership and order.
 */
// `exec` is the db or a transaction handle so the product row and its gallery
// are written atomically (a failed insert must not wipe the existing gallery).
type Executor = typeof db;
async function replaceGallery(exec: Executor, productId: string, urls: string[]) {
  await exec.delete(productImages).where(eq(productImages.productId, productId));
  if (urls.length === 0) return;
  await exec.insert(productImages).values(
    urls.map((url, i) => ({ productId, url, sortOrder: i * 10 })),
  );
}

export async function createProduct(_prev: ProductFormState, fd: FormData): Promise<ProductFormState> {
  await requireAdmin();
  const parsed = parseForm(fd);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? 'Dữ liệu không hợp lệ' };
  const { gallery, ...data } = parsed.data;
  try {
    await db.transaction(async (tx) => {
      await tx.insert(products).values({
        ...data,
        // Editor HTML arrives as a plain form field and can be forged.
        body: sanitizeRichText(data.body),
        oldPrice: data.oldPrice ?? null,
        farmerId: data.farmerId ?? null,
      });
      await replaceGallery(tx as unknown as Executor, data.id, gallery);
    });
  } catch (e) {
    return { error: friendlyWriteError(e) };
  }
  revalidatePath('/admin/products');
  revalidatePath('/products');
  redirect('/admin/products?ok=da-tao');
}

export async function updateProduct(originalId: string, _prev: ProductFormState, fd: FormData): Promise<ProductFormState> {
  await requireAdmin();
  const parsed = parseForm(fd);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? 'Dữ liệu không hợp lệ' };
  const { gallery, ...data } = parsed.data;
  try {
    await db.transaction(async (tx) => {
      await tx.update(products).set({
        ...data,
        body: sanitizeRichText(data.body),
        oldPrice: data.oldPrice ?? null,
        farmerId: data.farmerId ?? null,
        updatedAt: new Date(),
      }).where(eq(products.id, originalId));
      await replaceGallery(tx as unknown as Executor, originalId, gallery);
    });
  } catch (e) {
    return { error: friendlyWriteError(e) };
  }
  revalidatePath('/admin/products');
  revalidatePath(`/admin/products/${originalId}`);
  revalidatePath(`/products/${originalId}`);
  redirect('/admin/products?ok=da-luu');
}

// Images are intentionally left on disk here. Since the media library made
// uploads re-usable, the same file may back other products, posts or pages, so
// deleting it with one referrer would break the others. Unreferenced files are
// removed from /admin/media, which checks usage first.
export async function deleteProduct(id: string): Promise<void> {
  await requireAdmin();
  await db.delete(products).where(eq(products.id, id));
  revalidatePath('/admin/products');
  redirect('/admin/products?ok=da-xoa');
}

export async function bulkDeleteProducts(fd: FormData): Promise<void> {
  await requireAdmin();
  const ids = fd.getAll('ids').map(String).filter(Boolean);
  if (ids.length === 0) { redirect('/admin/products'); }
  await db.delete(products).where(inArray(products.id, ids));
  revalidatePath('/admin/products');
  redirect('/admin/products?ok=da-xoa');
}
