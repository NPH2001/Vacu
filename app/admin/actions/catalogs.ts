'use server';
import { redirect } from 'next/navigation';
import { friendlyWriteError } from '@/lib/db-errors';
import { revalidatePath } from 'next/cache';
import { eq, inArray } from 'drizzle-orm';
import { db } from '@/db/client';
import { catalogs, catalogImages } from '@/db/schema';
import { catalogSchema } from '@/lib/validators';
import { requireAdmin } from '@/lib/session';

export type CatalogFormState = { error?: string } | null;

function parse(fd: FormData) {
  return catalogSchema.safeParse({
    name: fd.get('name'),
    description: fd.get('description') ?? '',
    pages: fd.getAll('pages').map(String).filter(Boolean),
    // Ô tick không gửi gì khi bỏ chọn, nên không thể để schema tự mặc định
    // true ở đây — bỏ tick phải ra false.
    visible: fd.get('visible') === 'on',
    sortOrder: fd.get('sortOrder') || 0,
  });
}

type Executor = typeof db;

/**
 * Form gửi lên trọn bộ danh sách trang theo đúng thứ tự, nên thay cả set thay vì
 * so từng dòng — form là nguồn duy nhất quyết định cả thành phần lẫn thứ tự.
 */
async function replacePages(exec: Executor, catalogId: number, urls: string[]) {
  await exec.delete(catalogImages).where(eq(catalogImages.catalogId, catalogId));
  if (urls.length === 0) return;
  await exec.insert(catalogImages).values(
    urls.map((url, i) => ({ catalogId, url, sortOrder: i * 10 })),
  );
}

export async function createCatalog(_p: CatalogFormState, fd: FormData): Promise<CatalogFormState> {
  await requireAdmin();
  const r = parse(fd);
  if (!r.success) return { error: r.error.issues[0]?.message ?? 'Dữ liệu không hợp lệ' };
  const { pages, ...data } = r.data;
  try {
    // Một giao dịch: catalog không có trang nào là catalog rỗng trên web, nên
    // hai lần ghi phải cùng thành công hoặc cùng không.
    await db.transaction(async (tx) => {
      const [row] = await tx.insert(catalogs).values(data).returning();
      await replacePages(tx as unknown as Executor, row.id, pages);
    });
  } catch (e) { return { error: friendlyWriteError(e) }; }
  revalidatePath('/admin/catalogs');
  revalidatePath('/', 'layout');
  redirect('/admin/catalogs');
}

export async function updateCatalog(id: number, _p: CatalogFormState, fd: FormData): Promise<CatalogFormState> {
  await requireAdmin();
  const r = parse(fd);
  if (!r.success) return { error: r.error.issues[0]?.message ?? 'Dữ liệu không hợp lệ' };
  const { pages, ...data } = r.data;
  try {
    await db.transaction(async (tx) => {
      await tx.update(catalogs).set({ ...data, updatedAt: new Date() }).where(eq(catalogs.id, id));
      await replacePages(tx as unknown as Executor, id, pages);
    });
  } catch (e) { return { error: friendlyWriteError(e) }; }
  revalidatePath('/admin/catalogs');
  revalidatePath('/', 'layout');
  redirect('/admin/catalogs');
}

export async function deleteCatalog(id: number): Promise<void> {
  await requireAdmin();
  // Các trang tự xoá theo (khóa ngoại cascade); file ảnh vẫn nằm trong Thư
  // viện ảnh để dùng lại — xoá file là việc riêng, làm trong Thư viện ảnh.
  await db.delete(catalogs).where(eq(catalogs.id, id));
  revalidatePath('/admin/catalogs');
  revalidatePath('/', 'layout');
  redirect('/admin/catalogs');
}

export async function bulkDeleteCatalogs(fd: FormData): Promise<void> {
  await requireAdmin();
  const ids = fd.getAll('ids').map((v) => Number(v)).filter((n) => Number.isFinite(n));
  if (ids.length === 0) redirect('/admin/catalogs');
  await db.delete(catalogs).where(inArray(catalogs.id, ids));
  revalidatePath('/admin/catalogs');
  revalidatePath('/', 'layout');
  redirect('/admin/catalogs');
}
