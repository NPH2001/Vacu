'use client';

import { useState } from 'react';
import Link from 'next/link';
import type { CategoryRow } from '@/db/schema';
import { buildCategoryTree, type CategoryNode } from '@/lib/categories';

export default function CategoryDrawer({
  allCategories, productCounts, activeId,
}: {
  allCategories: CategoryRow[];
  productCounts: Record<string, number>;
  activeId: string | null;
}) {
  const [open, setOpen] = useState(false);
  // Path of category ids the user has drilled into. Empty = root view.
  const [path, setPath] = useState<string[]>([]);
  const tree = buildCategoryTree(allCategories);

  const close = () => {
    setOpen(false);
    // Reset drill state on close so reopening starts fresh.
    setPath([]);
  };

  // Resolve the current node and the children to render at this level.
  const currentNode = path.reduce<CategoryNode | null>((node, id) => {
    const list = node ? node.children : tree;
    return list.find((n) => n.id === id) ?? null;
  }, null);
  const visibleChildren: CategoryNode[] = currentNode ? currentNode.children : tree;

  const parentOfCurrent: CategoryNode | null =
    path.length >= 2
      ? path.slice(0, -1).reduce<CategoryNode | null>((node, id) => {
          const list = node ? node.children : tree;
          return list.find((n) => n.id === id) ?? null;
        }, null)
      : null;
  const backLabel =
    path.length === 0 ? null : parentOfCurrent ? parentOfCurrent.name : 'Tất cả danh mục';

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="shrink-0 px-5 py-2.5 rounded-full text-sm font-bold border bg-white text-green-900 border-green-200 hover:border-green-400 transition"
      >
        Tất cả danh mục →
      </button>

      <div
        onClick={close}
        className={`fixed inset-0 bg-green-950/50 z-[60] transition-opacity ${
          open ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
      />
      <aside
        className={`fixed top-0 right-0 bottom-0 w-full max-w-md bg-white z-[70] shadow-2xl transition-transform duration-300 flex flex-col ${
          open ? 'translate-x-0' : 'translate-x-full'
        }`}
        aria-hidden={!open}
      >
        <div className="flex items-center justify-between p-5 border-b border-green-100">
          <h2 className="text-xl font-bold text-green-950 font-display">
            {currentNode ? `${currentNode.icon} ${currentNode.name}` : 'Tất cả danh mục'}
          </h2>
          <button
            type="button"
            onClick={close}
            aria-label="Đóng"
            className="w-10 h-10 rounded-full hover:bg-green-50 text-green-900 text-lg"
          >
            ✕
          </button>
        </div>

        {backLabel && (
          <button
            type="button"
            onClick={() => setPath((p) => p.slice(0, -1))}
            className="flex items-center gap-2 px-5 py-3 text-sm font-semibold text-green-700 hover:bg-green-50 border-b border-green-100"
          >
            ← {backLabel}
          </button>
        )}

        <nav className="flex-1 overflow-y-auto p-3">
          {currentNode ? (
            <Link
              href={`/danh-muc/${currentNode.id}`}
              onClick={close}
              className={`block px-3 py-2.5 rounded-lg text-sm font-semibold mb-1 ${
                activeId === currentNode.id
                  ? 'bg-green-700 text-white'
                  : 'bg-green-50 text-green-900 hover:bg-green-100'
              }`}
            >
              Xem tất cả {currentNode.name}
              <span className={`float-right ${activeId === currentNode.id ? 'text-green-100' : 'text-green-700/70'}`}>
                {productCounts[currentNode.id] ?? 0}
              </span>
            </Link>
          ) : (
            <Link
              href="/products"
              onClick={close}
              className={`block px-3 py-2.5 rounded-lg text-sm font-semibold mb-1 ${
                activeId === null ? 'bg-green-700 text-white' : 'bg-green-50 text-green-900 hover:bg-green-100'
              }`}
            >
              Tất cả nông sản
            </Link>
          )}

          <ul>
            {visibleChildren.map((node) => (
              <ChildItem
                key={node.id}
                node={node}
                activeId={activeId}
                productCounts={productCounts}
                onDrill={() => setPath((p) => [...p, node.id])}
                onNavigate={close}
              />
            ))}
          </ul>
        </nav>
      </aside>
    </>
  );
}

function ChildItem({
  node, activeId, productCounts, onDrill, onNavigate,
}: {
  node: CategoryNode;
  activeId: string | null;
  productCounts: Record<string, number>;
  onDrill: () => void;
  onNavigate: () => void;
}) {
  const isActive = activeId === node.id;
  const count = productCounts[node.id] ?? 0;
  const hasChildren = node.children.length > 0;

  if (hasChildren) {
    return (
      <li>
        <button
          type="button"
          onClick={onDrill}
          className={`w-full text-left flex items-center justify-between px-3 py-2.5 rounded-lg text-sm ${
            isActive ? 'bg-green-700 text-white' : 'text-green-950 hover:bg-green-50'
          }`}
        >
          <span>{node.icon} {node.name}</span>
          <span className="flex items-center gap-2 text-xs">
            <span className={isActive ? 'text-green-100' : 'text-green-900/50'}>{count}</span>
            <span className={isActive ? 'text-green-100' : 'text-green-900/40'}>›</span>
          </span>
        </button>
      </li>
    );
  }

  return (
    <li>
      <Link
        href={`/danh-muc/${node.id}`}
        onClick={onNavigate}
        className={`flex items-center justify-between px-3 py-2.5 rounded-lg text-sm ${
          isActive ? 'bg-green-700 text-white' : 'text-green-950 hover:bg-green-50'
        }`}
      >
        <span>{node.icon} {node.name}</span>
        <span className={`text-xs ${isActive ? 'text-green-100' : 'text-green-900/50'}`}>{count}</span>
      </Link>
    </li>
  );
}
