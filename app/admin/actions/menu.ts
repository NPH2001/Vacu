'use server';
import { redirect } from 'next/navigation';
import { friendlyWriteError, isFkViolation } from '@/lib/db-errors';
import { revalidatePath } from 'next/cache';
import { eq, inArray } from 'drizzle-orm';
import { db } from '@/db/client';
import { menuItems } from '@/db/schema';
import type { MenuItemRow } from '@/db/schema';
import { menuItemSchema } from '@/lib/validators';
import { requireAdmin } from '@/lib/session';
import { MAX_MENU_DEPTH, canBeParent, getMenuDescendantIds } from '@/lib/menu';

export type MenuItemFormState = { error?: string } | null;

function parse(fd: FormData) {
  return menuItemSchema.safeParse({
    location: fd.get('location'),
    parentId: fd.get('parentId'),
    label: fd.get('label'),
    href: fd.get('href'),
    openInNewTab: fd.get('openInNewTab') === 'on',
    sortOrder: fd.get('sortOrder') || 0,
  });
}

/**
 * Kiểm mục cha trước khi ghi. Form đã lọc sẵn danh sách chọn, nhưng form là thứ
 * gửi lên từ trình duyệt — vòng lặp cha–con lọt xuống database sẽ làm hỏng menu
 * trên mọi trang công khai, nên chặn lại ở đây mới là chặn thật.
 *
 * Trả về câu giải thích khi không hợp lệ, null khi ổn.
 */
async function parentError(
  itemId: number | null,
  parentId: number | null,
  location: 'header' | 'footer',
  rows: MenuItemRow[],
): Promise<string | null> {
  if (parentId == null) return null;

  const parent = rows.find((r) => r.id === parentId);
  if (!parent) return 'Mục cha không tồn tại (có thể vừa bị xóa). Hãy tải lại trang.';
  if (parent.location !== location) {
    return 'Mục cha phải cùng vị trí với mục này — menu Header và Footer là hai cây riêng.';
  }

  // Đổi vị trí và đổi cha cùng lúc: xét theo vị trí MỚI, nếu không việc chuyển
  // cả nhánh sang Footer sẽ bị chính vị trí cũ của nó chặn lại.
  const view = itemId != null
    ? rows.map((r) => (r.id === itemId ? { ...r, location } : r))
    : rows;

  if (canBeParent(itemId, parentId, view)) return null;

  if (itemId != null && getMenuDescendantIds(itemId, view).includes(parentId)) {
    return 'Không đặt được: mục cha bạn chọn đang nằm bên trong chính mục này.';
  }
  return `Menu chỉ hỗ trợ tối đa ${MAX_MENU_DEPTH} cấp. Hãy chọn một mục cha ở cấp cao hơn.`;
}

export async function createMenuItem(_p: MenuItemFormState, fd: FormData): Promise<MenuItemFormState> {
  await requireAdmin();
  const r = parse(fd);
  if (!r.success) return { error: r.error.issues[0]?.message ?? 'Dữ liệu không hợp lệ' };

  const rows = await db.select().from(menuItems);
  const err = await parentError(null, r.data.parentId, r.data.location, rows);
  if (err) return { error: err };

  try {
    await db.insert(menuItems).values(r.data);
  } catch (e) { return { error: friendlyWriteError(e) }; }
  revalidatePath('/admin/menu');
  revalidatePath('/', 'layout');
  redirect('/admin/menu');
}

export async function updateMenuItem(id: number, _p: MenuItemFormState, fd: FormData): Promise<MenuItemFormState> {
  await requireAdmin();
  const r = parse(fd);
  if (!r.success) return { error: r.error.issues[0]?.message ?? 'Dữ liệu không hợp lệ' };

  const rows = await db.select().from(menuItems);
  const err = await parentError(id, r.data.parentId, r.data.location, rows);
  if (err) return { error: err };

  const current = rows.find((x) => x.id === id);
  try {
    await db.update(menuItems).set(r.data).where(eq(menuItems.id, id));

    // Chuyển vị trí thì kéo theo cả nhánh dưới. Bỏ lại mục con ở vị trí cũ sẽ
    // biến chúng thành mục gốc mồ côi bên Footer — admin không hề yêu cầu điều đó.
    if (current && current.location !== r.data.location) {
      const branch = getMenuDescendantIds(id, rows).filter((x) => x !== id);
      if (branch.length > 0) {
        await db.update(menuItems).set({ location: r.data.location })
          .where(inArray(menuItems.id, branch));
      }
    }
  } catch (e) { return { error: friendlyWriteError(e) }; }
  revalidatePath('/admin/menu');
  revalidatePath('/', 'layout');
  redirect('/admin/menu');
}

export async function deleteMenuItem(id: number): Promise<void> {
  await requireAdmin();
  try {
    await db.delete(menuItems).where(eq(menuItems.id, id));
  } catch (e) {
    // Khóa ngoại chặn vì mục còn con. Giải thích thay vì ném lỗi — xem lib/admin/flash.ts.
    if (isFkViolation(e)) redirect('/admin/menu?loi=menu-con-con');
    throw e;
  }
  revalidatePath('/admin/menu');
  revalidatePath('/', 'layout');
  redirect('/admin/menu');
}

export async function bulkDeleteMenuItems(fd: FormData): Promise<void> {
  await requireAdmin();
  const ids = fd.getAll('ids').map((v) => Number(v)).filter((n) => Number.isFinite(n));
  if (ids.length === 0) redirect('/admin/menu');
  try {
    // Xóa cả cha lẫn con trong CÙNG một câu lệnh thì Postgres kiểm khóa ngoại
    // sau khi câu lệnh chạy xong, nên xóa nguyên một nhánh vẫn được.
    await db.delete(menuItems).where(inArray(menuItems.id, ids));
  } catch (e) {
    if (isFkViolation(e)) redirect('/admin/menu?loi=menu-con-con-nhieu');
    throw e;
  }
  revalidatePath('/admin/menu');
  revalidatePath('/', 'layout');
  redirect('/admin/menu');
}
