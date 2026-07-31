import type { MenuItemRow } from '@/db/schema';

/**
 * Menu nhiều cấp. Mọi hàm ở đây đều phải chịu được dữ liệu hỏng (cha trỏ vòng
 * quanh, cha không tồn tại): menu render trên MỌI trang công khai, nên một vòng
 * lặp không được phép biến thành treo server — cùng lý do với lib/categories.ts.
 */

export type MenuNode = MenuItemRow & { children: MenuNode[] };

/** Cha → con → cháu. Sâu hơn thì không bấm nổi trên màn hình thật. */
export const MAX_MENU_DEPTH = 3;

function siblingOrder(a: MenuItemRow, b: MenuItemRow): number {
  return a.sortOrder - b.sortOrder || a.id - b.id;
}

/**
 * Dựng cây từ danh sách phẳng. Mục có cha không tồn tại — hoặc nằm trong một
 * vòng lặp, tức không nhánh nào với tới — được đưa lên gốc thay vì biến mất:
 * mục vô hình là mục admin không sửa được.
 */
export function buildMenuTree(rows: MenuItemRow[]): MenuNode[] {
  const byId = new Map<number, MenuNode>(rows.map((r) => [r.id, { ...r, children: [] }]));
  const roots: MenuNode[] = [];

  /** Leo ngược từ `from` lên gốc: có gặp lại `target` không? */
  const climbsBackTo = (target: MenuNode, from: MenuNode): boolean => {
    const seen = new Set<number>();
    let cur: MenuNode | undefined = from;
    while (cur && !seen.has(cur.id)) {
      if (cur.id === target.id) return true;
      seen.add(cur.id);
      cur = cur.parentId != null ? byId.get(cur.parentId) : undefined;
    }
    return false;
  };

  for (const node of byId.values()) {
    const parent = node.parentId != null ? byId.get(node.parentId) : undefined;
    // Cắt liên kết cha ngay tại đây khi nó tạo vòng: nối vào rồi mới vớt ra thì
    // cây đã không còn là cây, và mọi hàm duyệt sau đó sẽ đệ quy vô tận.
    if (!parent || parent.id === node.id || climbsBackTo(node, parent)) roots.push(node);
    else parent.children.push(node);
  }

  const sortDeep = (nodes: MenuNode[]) => {
    nodes.sort(siblingOrder);
    for (const n of nodes) sortDeep(n.children);
  };
  sortDeep(roots);
  return roots;
}

/** Duyệt cây theo đúng thứ tự hiển thị, kèm độ sâu (gốc = 0). */
export function flattenMenuTree(nodes: MenuNode[]): { node: MenuNode; depth: number }[] {
  const out: { node: MenuNode; depth: number }[] = [];
  const walk = (list: MenuNode[], depth: number) => {
    for (const n of list) {
      out.push({ node: n, depth });
      walk(n.children, depth + 1);
    }
  };
  walk(nodes, 0);
  return out;
}

/** Cấp của một mục, đếm từ 1. Gặp vòng lặp thì dừng thay vì chạy mãi. */
export function menuDepthOf(id: number, rows: MenuItemRow[]): number {
  const byId = new Map(rows.map((r) => [r.id, r]));
  const seen = new Set<number>();
  let depth = 1;
  let current = byId.get(id);
  while (current?.parentId != null && !seen.has(current.id)) {
    seen.add(current.id);
    const parent = byId.get(current.parentId);
    if (!parent || seen.has(parent.id)) break;
    depth++;
    current = parent;
  }
  return depth;
}

/** Số cấp của nhánh tính từ mục này xuống, kể cả chính nó (lá = 1). */
export function subtreeHeight(id: number, rows: MenuItemRow[]): number {
  const childrenByParent = new Map<number, number[]>();
  for (const r of rows) {
    if (r.parentId == null || r.parentId === r.id) continue;
    const arr = childrenByParent.get(r.parentId) ?? [];
    arr.push(r.id);
    childrenByParent.set(r.parentId, arr);
  }
  const seen = new Set<number>();
  const walk = (cur: number): number => {
    if (seen.has(cur)) return 0; // vòng lặp → dừng nhánh này
    seen.add(cur);
    let best = 1;
    for (const kid of childrenByParent.get(cur) ?? []) best = Math.max(best, 1 + walk(kid));
    return best;
  };
  return walk(id);
}

/** Chính nó cộng toàn bộ nhánh bên dưới. */
export function getMenuDescendantIds(id: number, rows: MenuItemRow[]): number[] {
  const childrenByParent = new Map<number, number[]>();
  for (const r of rows) {
    if (r.parentId == null || r.parentId === r.id) continue;
    const arr = childrenByParent.get(r.parentId) ?? [];
    arr.push(r.id);
    childrenByParent.set(r.parentId, arr);
  }
  const seen = new Set<number>([id]);
  const ids = [id];
  const queue = [id];
  while (queue.length) {
    const cur = queue.shift()!;
    for (const kid of childrenByParent.get(cur) ?? []) {
      if (seen.has(kid)) continue; // vòng lặp → không lặp vô hạn
      seen.add(kid);
      ids.push(kid);
      queue.push(kid);
    }
  }
  return ids;
}

/**
 * Mục `itemId` có được đặt dưới `parentId` không. Truyền itemId = null khi đang
 * tạo mới.
 *
 * Kiểm cả CHIỀU CAO nhánh đang chuyển, không chỉ mỗi mục đó: kéo một mục có sẵn
 * con cháu xuống dưới một mục cấp 2 sẽ đẩy đám cháu xuống cấp 4 — mỗi cái nhìn
 * vào mục được chuyển thì thấy vẫn hợp lệ.
 */
export function canBeParent(
  itemId: number | null,
  parentId: number | null,
  rows: MenuItemRow[],
): boolean {
  if (parentId == null) return true;
  if (itemId != null && parentId === itemId) return false;

  const byId = new Map(rows.map((r) => [r.id, r]));
  const parent = byId.get(parentId);
  if (!parent) return false;

  if (itemId != null) {
    const item = byId.get(itemId);
    // Hai vị trí khác nhau không lồng vào nhau được: menu header và footer là
    // hai cây riêng.
    if (item && item.location !== parent.location) return false;
    if (getMenuDescendantIds(itemId, rows).includes(parentId)) return false;
  }

  const height = itemId != null ? subtreeHeight(itemId, rows) : 1;
  return menuDepthOf(parentId, rows) + height <= MAX_MENU_DEPTH;
}
