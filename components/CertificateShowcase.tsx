'use client';
import { useCallback, useEffect, useRef, useState } from 'react';
import type { CertificateRow } from '@/db/schema';

/**
 * Hai kiểu hiển thị chứng nhận, dùng chung một thẻ và một khung xem ảnh lớn:
 *
 * - `slider`: băng ngang có nút trái/phải và chấm trang. Hợp với trang chủ, nơi
 *   chứng nhận là một mục trong nhiều mục nên không được chiếm quá một màn hình.
 * - `grid`: xếp lưới, hiện hết. Hợp với trang Chứng nhận, nơi khách vào đúng để
 *   xem cho đủ — bắt bấm nút mới xem tiếp là vô lý.
 */
export default function CertificateShowcase({
  items, layout,
}: {
  items: CertificateRow[];
  layout: 'slider' | 'grid';
}) {
  const [open, setOpen] = useState<CertificateRow | null>(null);
  if (items.length === 0) return null;

  return (
    <>
      {layout === 'grid'
        ? <Grid items={items} onOpen={setOpen} />
        : <Slider items={items} onOpen={setOpen} />}
      {open && <Lightbox cert={open} onClose={() => setOpen(null)} />}
    </>
  );
}

function Grid({ items, onOpen }: { items: CertificateRow[]; onOpen: (c: CertificateRow) => void }) {
  return (
    <ul className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
      {items.map((c) => (
        <li key={c.id}><Card cert={c} onOpen={onOpen} /></li>
      ))}
    </ul>
  );
}

function Slider({ items, onOpen }: { items: CertificateRow[]; onOpen: (c: CertificateRow) => void }) {
  const trackRef = useRef<HTMLUListElement>(null);
  const [atStart, setAtStart] = useState(true);
  const [atEnd, setAtEnd] = useState(false);
  const [page, setPage] = useState(0);
  const [pages, setPages] = useState(1);

  // Đo từ DOM thay vì đoán số thẻ mỗi trang theo breakpoint: chiều rộng thẻ do
  // CSS quyết định, hard-code ở đây là hai nơi cùng nói một chuyện và sẽ lệch.
  const measure = useCallback(() => {
    const el = trackRef.current;
    if (!el) return;
    const max = el.scrollWidth - el.clientWidth;
    setAtStart(el.scrollLeft <= 2);
    setAtEnd(el.scrollLeft >= max - 2);
    const total = Math.max(1, Math.ceil(el.scrollWidth / Math.max(1, el.clientWidth)));
    setPages(total);
    setPage(max <= 0 ? 0 : Math.round((el.scrollLeft / max) * (total - 1)));
  }, []);

  useEffect(() => {
    const el = trackRef.current;
    if (!el) return;
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    el.addEventListener('scroll', measure, { passive: true });
    return () => { ro.disconnect(); el.removeEventListener('scroll', measure); };
  }, [measure]);

  // Cuộn đúng một khung nhìn: luôn khớp với chiều rộng thật, kể cả khi số thẻ
  // vừa màn hình thay đổi lúc xoay ngang điện thoại.
  const scrollByPage = (dir: -1 | 1) => {
    const el = trackRef.current;
    if (!el) return;
    el.scrollBy({ left: dir * el.clientWidth, behavior: 'smooth' });
  };

  const goToPage = (i: number) => {
    const el = trackRef.current;
    if (!el) return;
    const max = el.scrollWidth - el.clientWidth;
    el.scrollTo({ left: (max / Math.max(1, pages - 1)) * i, behavior: 'smooth' });
  };

  return (
    <div className="relative">
      <ul
        ref={trackRef}
        // tabIndex + aria-label: khung cuộn được thì người dùng bàn phím phải
        // focus vào được, nếu không mũi tên trái/phải chẳng cuộn được gì.
        tabIndex={0}
        aria-label="Danh sách chứng nhận"
        className="flex gap-4 md:gap-6 overflow-x-auto snap-x snap-mandatory hide-scrollbar
                   scroll-px-1 pb-1 rounded-2xl focus-visible:outline-2 focus-visible:outline-green-700">
        {items.map((c) => (
          <li key={c.id}
            className="snap-start shrink-0 w-[70vw] sm:w-[44vw] md:w-[30%] lg:w-[23%]">
            <Card cert={c} onOpen={onOpen} />
          </li>
        ))}
      </ul>

      {/* Nút chỉ có nghĩa khi thật sự còn chỗ để cuộn. */}
      {pages > 1 && (
        <>
          <NavButton side="left" disabled={atStart} onClick={() => scrollByPage(-1)} />
          <NavButton side="right" disabled={atEnd} onClick={() => scrollByPage(1)} />

          <div className="flex justify-center gap-2 mt-5">
            {Array.from({ length: pages }, (_, i) => (
              <button
                key={i}
                type="button"
                onClick={() => goToPage(i)}
                aria-label={`Tới nhóm ${i + 1} trên ${pages}`}
                aria-current={i === page || undefined}
                className={`h-2 rounded-full transition-all ${
                  i === page ? 'w-6 bg-green-700' : 'w-2 bg-green-700/25 hover:bg-green-700/50'
                }`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}

function NavButton({
  side, disabled, onClick,
}: { side: 'left' | 'right'; disabled: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={side === 'left' ? 'Xem chứng nhận trước' : 'Xem chứng nhận tiếp theo'}
      // Nằm đè lên mép dải trên máy tính; trên điện thoại ẩn đi vì vuốt tay
      // nhanh hơn, và nút sẽ che mất thẻ trên màn hình hẹp.
      className={`hidden md:flex absolute top-[38%] -translate-y-1/2 z-20 w-11 h-11 items-center justify-center
        rounded-full bg-white border border-green-100 shadow-lg text-green-900
        transition hover:bg-green-50 disabled:opacity-0 disabled:pointer-events-none
        ${side === 'left' ? '-left-3 lg:-left-5' : '-right-3 lg:-right-5'}`}>
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" aria-hidden>
        <path d={side === 'left' ? 'M15 5l-7 7 7 7' : 'M9 5l7 7-7 7'} strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </button>
  );
}

/** Thẻ chứng nhận: ảnh, TÊN, nơi cấp. Tên là thứ khách quét mắt tìm trước tiên. */
function Card({ cert, onOpen }: { cert: CertificateRow; onOpen: (c: CertificateRow) => void }) {
  return (
    <button
      type="button"
      onClick={() => onOpen(cert)}
      aria-label={`Xem lớn: ${cert.name}`}
      className="group w-full h-full text-left">
      <div className="h-full flex flex-col bg-white rounded-2xl border border-green-100 overflow-hidden
        shadow-[0_1px_3px_rgba(20,60,30,0.06)] transition group-hover:shadow-xl group-hover:-translate-y-1">
        <div className="relative bg-stone-50">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={cert.image} alt={cert.name} loading="lazy"
            className="w-full aspect-[3/4] object-cover object-top" />
          {/* Kính lúp báo cho biết ảnh bấm được — giấy chứng nhận thu nhỏ thì
              không đọc nổi chữ, mà chữ mới là thứ khách muốn xem. */}
          <span className="absolute bottom-2 right-2 w-8 h-8 rounded-full bg-white/90 border border-green-100
            flex items-center justify-center text-green-800 text-sm opacity-0 group-hover:opacity-100 transition"
            aria-hidden>⌕</span>
        </div>
        <div className="p-3.5 flex-1 flex flex-col">
          <div className="font-semibold text-green-950 text-[14px] leading-snug line-clamp-3 wrap-anywhere">
            {cert.name}
          </div>
          {cert.issuer && (
            <div className="text-[12px] text-green-900/60 mt-1 line-clamp-2 wrap-anywhere">{cert.issuer}</div>
          )}
          <span className="mt-2.5 text-[12px] font-medium text-green-700 group-hover:underline">
            Xem chứng nhận →
          </span>
        </div>
      </div>
    </button>
  );
}

/** Ảnh lớn kèm tên, nơi cấp và mô tả — chữ trên giấy chứng nhận mới là thứ khách muốn đọc. */
function Lightbox({ cert, onClose }: { cert: CertificateRow; onClose: () => void }) {
  const closeRef = useRef<HTMLButtonElement>(null);
  // Trả tiêu điểm về đúng chỗ đã bấm khi đóng, nếu không người dùng bàn phím
  // bị ném về đầu trang.
  const returnTo = useRef<HTMLElement | null>(null);

  useEffect(() => {
    returnTo.current = document.activeElement as HTMLElement | null;
    closeRef.current?.focus();
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    // Khóa cuộn nền: cuộn trang phía sau trong lúc xem ảnh lớn là mất phương hướng.
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = prev;
      returnTo.current?.focus?.();
    };
  }, [onClose]);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={cert.name}
      onClick={onClose}
      className="fixed inset-0 z-[100] bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div onClick={(e) => e.stopPropagation()}
        className="bg-white rounded-3xl max-w-3xl w-full my-auto overflow-hidden shadow-2xl">
        <div className="flex items-start justify-between gap-4 p-4 border-b border-green-100">
          <div className="min-w-0">
            <h3 className="font-bold text-green-950 font-display text-lg wrap-anywhere">{cert.name}</h3>
            {cert.issuer && <p className="text-sm text-green-900/60 mt-0.5 wrap-anywhere">{cert.issuer}</p>}
          </div>
          <button ref={closeRef} type="button" onClick={onClose} aria-label="Đóng"
            className="shrink-0 w-9 h-9 rounded-full hover:bg-green-50 text-green-900 text-xl leading-none">
            ✕
          </button>
        </div>
        <div className="p-4">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={cert.image} alt={cert.name}
            className="w-full max-h-[70vh] object-contain rounded-xl bg-stone-50" />
          {cert.description && (
            <p className="text-sm text-green-900/80 mt-4 leading-relaxed wrap-anywhere">{cert.description}</p>
          )}
        </div>
      </div>
    </div>
  );
}
