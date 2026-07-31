import { describe, it, expect } from 'vitest';
import {
  MAX_MENU_DEPTH, buildMenuTree, flattenMenuTree, menuDepthOf, subtreeHeight,
  getMenuDescendantIds, canBeParent,
} from '@/lib/menu';
import type { MenuItemRow } from '@/db/schema';

function item(id: number, parentId: number | null, over: Partial<MenuItemRow> = {}): MenuItemRow {
  return {
    id,
    parentId,
    location: 'header',
    label: `m${id}`,
    href: `/m${id}`,
    openInNewTab: false,
    sortOrder: 0,
    ...over,
  } as MenuItemRow;
}

describe('buildMenuTree', () => {
  it('lồng con vào đúng cha và giữ mục gốc ở ngoài', () => {
    const tree = buildMenuTree([item(1, null), item(2, 1), item(3, 2), item(4, null)]);
    expect(tree.map((n) => n.id)).toEqual([1, 4]);
    expect(tree[0].children.map((n) => n.id)).toEqual([2]);
    expect(tree[0].children[0].children.map((n) => n.id)).toEqual([3]);
  });

  it('sắp anh em theo thứ tự rồi tới id', () => {
    const tree = buildMenuTree([
      item(1, null, { sortOrder: 20 }),
      item(2, null, { sortOrder: 10 }),
      item(3, null, { sortOrder: 10 }),
    ]);
    expect(tree.map((n) => n.id)).toEqual([2, 3, 1]);
  });

  it('mục trỏ tới cha không tồn tại vẫn hiện, coi như mục gốc', () => {
    const tree = buildMenuTree([item(1, 999)]);
    expect(tree.map((n) => n.id)).toEqual([1]);
  });

  // Nếu dữ liệu lỡ có vòng lặp, mục trong vòng không nhánh nào với tới được —
  // trả về thiếu là admin không còn đường sửa. Đưa chúng lên gốc để còn thấy.
  it('vòng lặp cha–con không làm mất mục và không treo', () => {
    const tree = buildMenuTree([item(1, 2), item(2, 1), item(3, null)]);
    const ids = flattenMenuTree(tree).map((r) => r.node.id).sort();
    expect(ids).toEqual([1, 2, 3]);
  });

  it('mỗi mục chỉ xuất hiện một lần', () => {
    const flat = flattenMenuTree(buildMenuTree([item(1, null), item(2, 1), item(3, 1)]));
    const ids = flat.map((r) => r.node.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});

describe('flattenMenuTree', () => {
  it('trả về đúng thứ tự hiển thị kèm độ sâu', () => {
    const tree = buildMenuTree([item(1, null), item(2, 1), item(3, 2), item(4, null)]);
    expect(flattenMenuTree(tree).map((r) => [r.node.id, r.depth])).toEqual([
      [1, 0], [2, 1], [3, 2], [4, 0],
    ]);
  });
});

describe('đo độ sâu', () => {
  const rows = [item(1, null), item(2, 1), item(3, 2)];

  it('menuDepthOf đếm từ 1', () => {
    expect(menuDepthOf(1, rows)).toBe(1);
    expect(menuDepthOf(3, rows)).toBe(3);
  });

  it('subtreeHeight đếm cả chính nó', () => {
    expect(subtreeHeight(1, rows)).toBe(3);
    expect(subtreeHeight(2, rows)).toBe(2);
    expect(subtreeHeight(3, rows)).toBe(1);
  });

  it('cả hai đều dừng khi gặp vòng lặp', () => {
    const cyclic = [item(1, 2), item(2, 1)];
    expect(menuDepthOf(1, cyclic)).toBeLessThanOrEqual(2);
    expect(subtreeHeight(1, cyclic)).toBeLessThanOrEqual(2);
  });
});

describe('getMenuDescendantIds', () => {
  it('gồm chính nó và toàn bộ nhánh dưới', () => {
    const rows = [item(1, null), item(2, 1), item(3, 2), item(4, null)];
    expect(getMenuDescendantIds(1, rows).sort()).toEqual([1, 2, 3]);
  });

  it('không lặp vô hạn khi dữ liệu có vòng', () => {
    const ids = getMenuDescendantIds(1, [item(1, 2), item(2, 1)]);
    expect(new Set(ids).size).toBe(ids.length);
  });
});

describe('canBeParent', () => {
  const rows = [item(1, null), item(2, 1), item(3, 2), item(9, null)];

  it('cho phép mục gốc nhận cha ở cấp 1', () => {
    expect(canBeParent(9, 1, rows)).toBe(true);
  });

  it('chặn tự làm cha của chính mình', () => {
    expect(canBeParent(1, 1, rows)).toBe(false);
  });

  it('chặn chọn cha là con cháu của chính nó (tạo vòng)', () => {
    expect(canBeParent(1, 3, rows)).toBe(false);
  });

  it(`chặn khi kết quả vượt quá ${MAX_MENU_DEPTH} cấp`, () => {
    // 3 đã ở cấp 3; nhận thêm con là thành cấp 4.
    expect(canBeParent(9, 3, rows)).toBe(false);
  });

  it('tính cả chiều cao nhánh đang chuyển, không chỉ mỗi mục đó', () => {
    // Nhánh 1→2→3 cao 3 cấp, gắn vào 9 (cấp 1) sẽ thành 4 cấp.
    expect(canBeParent(1, 9, rows)).toBe(false);
    // Nhánh 2→3 cao 2 cấp, gắn vào 9 vừa đúng 3 cấp.
    expect(canBeParent(2, 9, rows)).toBe(true);
  });

  it('mục mới (chưa có id) chỉ cần cha chưa ở cấp cuối', () => {
    expect(canBeParent(null, 2, rows)).toBe(true);
    expect(canBeParent(null, 3, rows)).toBe(false);
  });

  it('bỏ trống cha luôn hợp lệ', () => {
    expect(canBeParent(3, null, rows)).toBe(true);
  });

  it('chặn ghép hai vị trí khác nhau (header với footer)', () => {
    const mixed = [item(1, null), item(5, null, { location: 'footer' })];
    expect(canBeParent(5, 1, mixed)).toBe(false);
  });
});
