'use server';
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { eq } from 'drizzle-orm';
import { db } from '@/db/client';
import { products } from '@/db/schema';
import { productSchema } from '@/lib/validators';
import { requireAdmin } from '@/lib/session';

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
    tags: rawTags ? rawTags.split(',').map((t) => t.trim()).filter(Boolean) : [],
    featured: fd.get('featured') === 'on',
    inStock: fd.get('inStock') === 'on',
  });
}

export async function createProduct(_prev: ProductFormState, fd: FormData): Promise<ProductFormState> {
  await requireAdmin();
  const parsed = parseForm(fd);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? 'Dữ liệu không hợp lệ' };
  try {
    await db.insert(products).values({
      ...parsed.data,
      oldPrice: parsed.data.oldPrice ?? null,
      farmerId: parsed.data.farmerId ?? null,
    });
  } catch (e) {
    return { error: (e as Error).message };
  }
  revalidatePath('/admin/products');
  redirect('/admin/products');
}

export async function updateProduct(originalId: string, _prev: ProductFormState, fd: FormData): Promise<ProductFormState> {
  await requireAdmin();
  const parsed = parseForm(fd);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? 'Dữ liệu không hợp lệ' };
  try {
    await db.update(products).set({
      ...parsed.data,
      oldPrice: parsed.data.oldPrice ?? null,
      farmerId: parsed.data.farmerId ?? null,
      updatedAt: new Date(),
    }).where(eq(products.id, originalId));
  } catch (e) {
    return { error: (e as Error).message };
  }
  revalidatePath('/admin/products');
  revalidatePath(`/admin/products/${originalId}`);
  redirect('/admin/products');
}

export async function deleteProduct(id: string): Promise<void> {
  await requireAdmin();
  await db.delete(products).where(eq(products.id, id));
  revalidatePath('/admin/products');
  redirect('/admin/products');
}
