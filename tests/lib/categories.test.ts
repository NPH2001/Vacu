import { describe, it, expect } from 'vitest';
import {
  buildCategoryTree, getDescendantIds, getAncestors,
  type CategoryNode,
} from '@/lib/categories';
import type { CategoryRow } from '@/db/schema';

function row(id: string, parentId: string | null = null, sortOrder = 0): CategoryRow {
  return {
    id,
    parentId,
    name: id,
    icon: '#',
    description: '',
    sortOrder,
    createdAt: new Date(),
    updatedAt: new Date(),
  };
}

describe('buildCategoryTree', () => {
  it('returns empty array for no rows', () => {
    expect(buildCategoryTree([])).toEqual([]);
  });

  it('returns single root with no children', () => {
    const t = buildCategoryTree([row('a')]);
    expect(t).toHaveLength(1);
    expect(t[0].id).toBe('a');
    expect(t[0].children).toEqual([]);
  });

  it('nests children under their parent', () => {
    const t = buildCategoryTree([row('a'), row('b', 'a'), row('c', 'a')]);
    expect(t).toHaveLength(1);
    expect(t[0].children.map((c: CategoryNode) => c.id).sort()).toEqual(['b', 'c']);
  });

  it('handles deep chains', () => {
    const t = buildCategoryTree([row('a'), row('b', 'a'), row('c', 'b'), row('d', 'c')]);
    expect(t[0].id).toBe('a');
    expect(t[0].children[0].id).toBe('b');
    expect(t[0].children[0].children[0].id).toBe('c');
    expect(t[0].children[0].children[0].children[0].id).toBe('d');
  });

  it('treats orphan parent_id as a root', () => {
    const t = buildCategoryTree([row('a', 'missing')]);
    expect(t).toHaveLength(1);
    expect(t[0].id).toBe('a');
  });

  it('returns multiple roots', () => {
    const t = buildCategoryTree([row('a'), row('b'), row('c', 'a')]);
    expect(t.map((n) => n.id).sort()).toEqual(['a', 'b']);
  });
});

describe('getDescendantIds', () => {
  it('returns just the root id when no children exist', () => {
    expect(getDescendantIds('a', [row('a')])).toEqual(['a']);
  });

  it('includes the root and all descendants in BFS order', () => {
    const rows = [row('a'), row('b', 'a'), row('c', 'b'), row('d', 'a')];
    expect(getDescendantIds('a', rows)).toEqual(['a', 'b', 'd', 'c']);
  });

  it('does not include siblings or unrelated branches', () => {
    const rows = [row('a'), row('b', 'a'), row('x'), row('y', 'x')];
    expect(getDescendantIds('a', rows).sort()).toEqual(['a', 'b']);
  });

  it('returns root id even if root not in rows (defensive)', () => {
    expect(getDescendantIds('ghost', [row('a')])).toEqual(['ghost']);
  });
});

describe('getAncestors', () => {
  it('returns empty array for a root', () => {
    expect(getAncestors('a', [row('a')])).toEqual([]);
  });

  it('returns the chain root → parent for a leaf', () => {
    const rows = [row('a'), row('b', 'a'), row('c', 'b')];
    expect(getAncestors('c', rows).map((r) => r.id)).toEqual(['a', 'b']);
  });

  it('stops at orphan parent_id without infinite loop', () => {
    const rows = [row('a', 'missing')];
    expect(getAncestors('a', rows)).toEqual([]);
  });
});
