import type { CategoryRow } from '@/db/schema';

export type CategoryNode = CategoryRow & { children: CategoryNode[] };

export function buildCategoryTree(rows: CategoryRow[]): CategoryNode[] {
  const byId = new Map<string, CategoryNode>(
    rows.map((r) => [r.id, { ...r, children: [] }]),
  );
  const roots: CategoryNode[] = [];
  for (const node of byId.values()) {
    if (node.parentId && byId.has(node.parentId)) {
      byId.get(node.parentId)!.children.push(node);
    } else {
      roots.push(node);
    }
  }
  return roots;
}

export function getDescendantIds(rootId: string, rows: CategoryRow[]): string[] {
  const childrenByParent = new Map<string, string[]>();
  for (const r of rows) {
    if (r.parentId) {
      const arr = childrenByParent.get(r.parentId) ?? [];
      arr.push(r.id);
      childrenByParent.set(r.parentId, arr);
    }
  }
  const seen = new Set<string>([rootId]);
  const ids: string[] = [rootId];
  const queue: string[] = [rootId];
  while (queue.length) {
    const cur = queue.shift()!;
    for (const kid of childrenByParent.get(cur) ?? []) {
      if (seen.has(kid)) continue; // guard against a parent_id cycle → no infinite loop
      seen.add(kid);
      ids.push(kid);
      queue.push(kid);
    }
  }
  return ids;
}

export function getAncestors(id: string, rows: CategoryRow[]): CategoryRow[] {
  const byId = new Map(rows.map((r) => [r.id, r]));
  const chain: CategoryRow[] = [];
  const seen = new Set<string>();
  let current = byId.get(id);
  while (current?.parentId && !seen.has(current.id)) {
    seen.add(current.id); // guard against a parent_id cycle → no infinite loop
    const parent = byId.get(current.parentId);
    if (!parent || seen.has(parent.id)) break;
    chain.unshift(parent);
    current = parent;
  }
  return chain;
}
