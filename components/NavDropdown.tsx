'use client';
import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import type { MenuNode } from '@/lib/menu';

export function navLinkProps(l: MenuNode) {
  return {
    href: l.href,
    target: l.openInNewTab ? '_blank' : undefined,
    rel: l.openInNewTab ? 'noopener noreferrer' : undefined,
  };
}

/**
 * Mở khi rê chuột, cũng mở khi bấm hoặc dùng bàn phím.
 *
 * Hai độ trễ, mỗi cái chữa một lỗi khác nhau: mở chậm 90ms để lướt chuột ngang
 * qua thanh menu không bật lên hàng loạt panel; đóng chậm 180ms để khoảng hở
 * giữa nút và panel không nuốt mất con trỏ đang đi chéo xuống.
 */
function useHoverOpen() {
  const [open, setOpen] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clear = () => { if (timer.current) clearTimeout(timer.current); timer.current = null; };
  useEffect(() => clear, []);

  return {
    open,
    setOpen: (v: boolean) => { clear(); setOpen(v); },
    hoverIn: () => { clear(); timer.current = setTimeout(() => setOpen(true), 90); },
    hoverOut: () => { clear(); timer.current = setTimeout(() => setOpen(false), 180); },
  };
}

/**
 * `dir` = 'down' cho menu đổ xuống (mở thì lật lên), 'right' cho flyout đổ
 * ngang (luôn chỉ sang phải — chính panel bên cạnh đã cho biết nó đang mở).
 *
 * Một class xoay duy nhất mỗi lần render: ghép 'rotate-180' với '-rotate-90'
 * thì thứ tự trong CSS quyết định chứ không phải thứ tự mình viết, và mũi tên
 * sẽ chỉ sai hướng.
 */
function Caret({ open, dir = 'down' }: { open: boolean; dir?: 'down' | 'right' }) {
  const rotate = dir === 'right' ? '-rotate-90' : open ? 'rotate-180' : '';
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"
      className={`shrink-0 transition-transform ${rotate}`} aria-hidden>
      <path d="M6 9l6 6 6-6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/** Mục cấp 1 có con: link vẫn bấm được, nút mũi tên lo phần xổ menu. */
export function NavBranch({ node }: { node: MenuNode }) {
  const { open, setOpen, hoverIn, hoverOut } = useHoverOpen();
  const wrapRef = useRef<HTMLLIElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  // Escape đóng menu rồi trả tiêu điểm về nút — nhưng chính cú focus đó lại
  // kích hoạt onFocus và mở lại ngay. Bỏ qua đúng một lần.
  const skipFocusOpen = useRef(false);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (!wrapRef.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return;
      setOpen(false);
      skipFocusOpen.current = true;
      buttonRef.current?.focus(); // Escape mà mất luôn tiêu điểm thì bàn phím lạc chỗ.
    };
    window.addEventListener('mousedown', onDown);
    window.addEventListener('keydown', onKey);
    return () => {
      window.removeEventListener('mousedown', onDown);
      window.removeEventListener('keydown', onKey);
    };
  }, [open, setOpen]);

  return (
    <li ref={wrapRef} className="relative shrink-0"
      onMouseEnter={() => { skipFocusOpen.current = false; hoverIn(); }}
      onMouseLeave={hoverOut}
      onFocus={() => {
        if (skipFocusOpen.current) { skipFocusOpen.current = false; return; }
        setOpen(true);
      }}
      onBlur={(e) => { if (!e.currentTarget.contains(e.relatedTarget as Node)) setOpen(false); }}>
      <div className="flex items-center gap-1">
        <Link {...navLinkProps(node)} title={node.label}
          className="block max-w-56 truncate hover:text-green-700 transition">
          {node.label}
        </Link>
        <button
          ref={buttonRef}
          type="button"
          onClick={() => setOpen(!open)}
          aria-expanded={open}
          aria-label={`${open ? 'Đóng' : 'Mở'} menu con của ${node.label}`}
          className="p-0.5 -m-0.5 hover:text-green-700 transition">
          <Caret open={open} />
        </button>
      </div>

      {open && (
        <ul className="absolute left-0 top-full mt-3 min-w-52 max-w-72 bg-white rounded-2xl border border-green-100 shadow-xl py-2 z-50">
          {node.children.map((child) => (
            <SubItem key={child.id} node={child} onNavigate={() => setOpen(false)} />
          ))}
        </ul>
      )}
    </li>
  );
}

/** Mục cấp 2. Có con thì đổ tiếp sang ngang (cấp 3 — cấp cuối). */
function SubItem({ node, onNavigate }: { node: MenuNode; onNavigate: () => void }) {
  const { open, setOpen, hoverIn, hoverOut } = useHoverOpen();
  const hasChildren = node.children.length > 0;

  if (!hasChildren) {
    return (
      <li>
        <Link {...navLinkProps(node)} onClick={onNavigate}
          className="block px-4 py-2.5 text-green-900 hover:bg-green-50 truncate">
          {node.label}
        </Link>
      </li>
    );
  }

  return (
    <li className="relative"
      onMouseEnter={hoverIn} onMouseLeave={hoverOut}
      onFocus={() => setOpen(true)}
      onBlur={(e) => { if (!e.currentTarget.contains(e.relatedTarget as Node)) setOpen(false); }}>
      <div className="flex items-center">
        <Link {...navLinkProps(node)} onClick={onNavigate}
          className="flex-1 min-w-0 px-4 py-2.5 text-green-900 hover:bg-green-50 truncate">
          {node.label}
        </Link>
        <button type="button" onClick={() => setOpen(!open)}
          aria-expanded={open}
          aria-label={`${open ? 'Đóng' : 'Mở'} menu con của ${node.label}`}
          className="px-3 py-2.5 text-green-900/60 hover:text-green-700">
          <Caret open={open} dir="right" />
        </button>
      </div>

      {open && (
        // Đổ sang PHẢI, và khi sát mép phải màn hình thì lật sang trái — panel
        // tràn ra ngoài viewport là panel không bấm được.
        <ul className="absolute left-full top-0 ml-1 min-w-48 max-w-64 bg-white rounded-2xl border border-green-100 shadow-xl py-2 z-50
                       max-[1100px]:left-auto max-[1100px]:right-full max-[1100px]:ml-0 max-[1100px]:mr-1">
          {node.children.map((leaf) => (
            <li key={leaf.id}>
              <Link {...navLinkProps(leaf)} onClick={onNavigate}
                className="block px-4 py-2.5 text-green-900 hover:bg-green-50 truncate">
                {leaf.label}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </li>
  );
}

/**
 * Danh sách lồng cấp cho dropdown "Thêm ▾" và cho menu trên điện thoại: xổ hết
 * ra, thụt lề theo cấp. Trong một panel đã hẹp sẵn thì flyout chồng flyout là
 * cách nhanh nhất để không ai bấm trúng gì.
 */
export function NestedLinkList({
  nodes, depth = 0, onNavigate,
}: { nodes: MenuNode[]; depth?: number; onNavigate: () => void }) {
  return (
    <>
      {nodes.map((n) => (
        <li key={n.id}>
          <Link {...navLinkProps(n)} onClick={onNavigate}
            style={{ paddingLeft: 16 + depth * 16 }}
            className={`block pr-4 py-2.5 hover:bg-green-50 truncate ${
              depth === 0 ? 'text-green-900 font-medium' : 'text-green-900/80'
            }`}>
            {depth > 0 && <span className="text-green-900/30 mr-1.5" aria-hidden>└</span>}
            {n.label}
          </Link>
          {n.children.length > 0 && (
            <ul>
              <NestedLinkList nodes={n.children} depth={depth + 1} onNavigate={onNavigate} />
            </ul>
          )}
        </li>
      ))}
    </>
  );
}
