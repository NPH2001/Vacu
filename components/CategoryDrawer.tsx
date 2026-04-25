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
  const tree = buildCategoryTree(allCategories);

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
        onClick={() => setOpen(false)}
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
          <h2 className="text-xl font-bold text-green-950 font-display">Tất cả danh mục</h2>
          <button
            type="button"
            onClick={() => setOpen(false)}
            aria-label="Đóng"
            className="w-10 h-10 rounded-full hover:bg-green-50 text-green-900 text-lg"
          >
            ✕
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto p-3">
          <Link
            href="/products"
            onClick={() => setOpen(false)}
            className={`block px-3 py-2.5 rounded-lg text-sm font-semibold ${
              activeId === null ? 'bg-green-700 text-white' : 'text-green-950 hover:bg-green-50'
            }`}
          >
            Tất cả nông sản
          </Link>
          <ul className="mt-1">
            {tree.map((node) => (
              <TreeItem
                key={node.id}
                node={node}
                level={0}
                activeId={activeId}
                productCounts={productCounts}
                onNavigate={() => setOpen(false)}
              />
            ))}
          </ul>
        </nav>
      </aside>
    </>
  );
}

function TreeItem({
  node, level, activeId, productCounts, onNavigate,
}: {
  node: CategoryNode;
  level: number;
  activeId: string | null;
  productCounts: Record<string, number>;
  onNavigate: () => void;
}) {
  const isActive = activeId === node.id;
  const count = productCounts[node.id] ?? 0;
  return (
    <li>
      <Link
        href={`/danh-muc/${node.id}`}
        onClick={onNavigate}
        style={{ paddingLeft: `${12 + level * 16}px` }}
        className={`flex items-center justify-between pr-3 py-2.5 rounded-lg text-sm ${
          isActive ? 'bg-green-700 text-white' : 'text-green-950 hover:bg-green-50'
        }`}
      >
        <span>
          {node.icon} {node.name}
        </span>
        <span className={`text-xs ${isActive ? 'text-green-100' : 'text-green-900/50'}`}>
          {count}
        </span>
      </Link>
      {node.children.length > 0 && (
        <ul>
          {node.children.map((c) => (
            <TreeItem
              key={c.id}
              node={c}
              level={level + 1}
              activeId={activeId}
              productCounts={productCounts}
              onNavigate={onNavigate}
            />
          ))}
        </ul>
      )}
    </li>
  );
}
