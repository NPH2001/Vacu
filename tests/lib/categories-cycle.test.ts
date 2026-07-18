import { describe, it, expect } from 'vitest';
import { getDescendantIds, getAncestors } from '@/lib/categories';
import type { CategoryRow } from '@/db/schema';

// Minimal rows with a parent_id cycle: a → b → a.
function cat(id: string, parentId: string | null): CategoryRow {
  return {
    id, parentId, name: id, icon: '🥬', description: '', coverImage: null,
    sortOrder: 0, createdAt: new Date(), updatedAt: new Date(),
  } as CategoryRow;
}

describe('category cycle safety', () => {
  const cyclic = [cat('a', 'b'), cat('b', 'a'), cat('c', 'a')];

  it('getDescendantIds terminates on a cycle (no infinite loop)', () => {
    const ids = getDescendantIds('a', cyclic);
    expect(ids).toContain('a');
    expect(new Set(ids).size).toBe(ids.length); // no duplicates → bounded
    expect(ids.length).toBeLessThanOrEqual(3);
  });

  it('getAncestors terminates on a cycle', () => {
    const chain = getAncestors('a', cyclic).map((c) => c.id);
    expect(chain.length).toBeLessThanOrEqual(3);
  });

  it('still works for a normal tree', () => {
    const tree = [cat('root', null), cat('child', 'root'), cat('grand', 'child')];
    expect(getDescendantIds('root', tree).sort()).toEqual(['child', 'grand', 'root']);
    expect(getAncestors('grand', tree).map((c) => c.id)).toEqual(['root', 'child']);
  });
});
