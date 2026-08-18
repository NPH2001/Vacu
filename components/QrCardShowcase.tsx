'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useModalA11y } from '@/components/useModalA11y';

type ImageItem = { src: string; index: number };

/**
 * Displays cards and QR codes without cropping them. Each image opens in a
 * keyboard-accessible lightbox so small printed text and QR details stay usable.
 */
export default function QrCardShowcase({
  images, layout, title,
}: {
  images: string[];
  layout: 'slider' | 'grid';
  title: string;
}) {
  const [open, setOpen] = useState<ImageItem | null>(null);
  const items = images.map((src, index) => ({ src, index }));
  if (items.length === 0) return null;

  return (
    <>
      {layout === 'grid'
        ? <Grid items={items} title={title} onOpen={setOpen} />
        : <Slider items={items} title={title} onOpen={setOpen} />}
      {open && <Lightbox item={open} title={title} onClose={() => setOpen(null)} />}
    </>
  );
}

function Grid({
  items, title, onOpen,
}: {
  items: ImageItem[];
  title: string;
  onOpen: (item: ImageItem) => void;
}) {
  return (
    <ul className="grid grid-cols-2 gap-4 md:grid-cols-3 md:gap-6 lg:grid-cols-4">
      {items.map((item) => (
        <li key={`${item.src}-${item.index}`}>
          <ImageCard item={item} title={title} onOpen={onOpen} />
        </li>
      ))}
    </ul>
  );
}

function Slider({
  items, title, onOpen,
}: {
  items: ImageItem[];
  title: string;
  onOpen: (item: ImageItem) => void;
}) {
  const trackRef = useRef<HTMLUListElement>(null);
  const [atStart, setAtStart] = useState(true);
  const [atEnd, setAtEnd] = useState(false);
  const [page, setPage] = useState(0);
  const [pages, setPages] = useState(1);

  const measure = useCallback(() => {
    const el = trackRef.current;
    if (!el) return;
    const max = el.scrollWidth - el.clientWidth;
    const total = Math.max(1, Math.ceil(el.scrollWidth / Math.max(1, el.clientWidth)));
    setAtStart(el.scrollLeft <= 2);
    setAtEnd(el.scrollLeft >= max - 2);
    setPages(total);
    setPage(max <= 0 ? 0 : Math.round((el.scrollLeft / max) * (total - 1)));
  }, []);

  useEffect(() => {
    const el = trackRef.current;
    if (!el) return;
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(el);
    el.addEventListener('scroll', measure, { passive: true });
    return () => {
      observer.disconnect();
      el.removeEventListener('scroll', measure);
    };
  }, [measure]);

  const scrollByPage = (direction: -1 | 1) => {
    const el = trackRef.current;
    if (!el) return;
    el.scrollBy({ left: direction * el.clientWidth, behavior: 'smooth' });
  };

  const goToPage = (nextPage: number) => {
    const el = trackRef.current;
    if (!el) return;
    const max = el.scrollWidth - el.clientWidth;
    el.scrollTo({ left: (max / Math.max(1, pages - 1)) * nextPage, behavior: 'smooth' });
  };

  return (
    <div className="relative">
      <ul ref={trackRef} tabIndex={0} aria-label={title || 'Thẻ và mã QR'}
        className="hide-scrollbar flex snap-x snap-mandatory gap-4 overflow-x-auto rounded-2xl pb-1 scroll-px-1 focus-visible:outline-2 focus-visible:outline-green-700 md:gap-6">
        {items.map((item) => (
          <li key={`${item.src}-${item.index}`}
            className="w-[70vw] shrink-0 snap-start sm:w-[44vw] md:w-[30%] lg:w-[23%]">
            <ImageCard item={item} title={title} onOpen={onOpen} />
          </li>
        ))}
      </ul>

      {pages > 1 && (
        <>
          <NavButton direction="previous" disabled={atStart} onClick={() => scrollByPage(-1)} />
          <NavButton direction="next" disabled={atEnd} onClick={() => scrollByPage(1)} />
          <div className="mt-5 flex justify-center gap-1">
            {Array.from({ length: pages }, (_, i) => (
              <button key={i} type="button" onClick={() => goToPage(i)}
                aria-label={`Tới nhóm ảnh ${i + 1} trên ${pages}`}
                aria-current={i === page || undefined}
                className="group inline-flex h-11 min-w-11 items-center justify-center rounded-full">
                <span aria-hidden className={`h-2 rounded-full transition-all ${
                  i === page ? 'w-6 bg-green-700' : 'w-2 bg-green-700/25 group-hover:bg-green-700/50'
                }`} />
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

function ImageCard({
  item, title, onOpen,
}: {
  item: ImageItem;
  title: string;
  onOpen: (item: ImageItem) => void;
}) {
  const label = `${title || 'Thẻ và mã QR'} ${item.index + 1}`;
  return (
    <button type="button" onClick={() => onOpen(item)} aria-label={`Xem lớn: ${label}`}
      className="group h-full w-full text-left">
      <span className="relative flex aspect-[3/4] w-full items-center justify-center overflow-hidden rounded-2xl border border-green-100 bg-white p-3 shadow-[0_1px_3px_rgba(20,60,30,0.06)] transition group-hover:-translate-y-1 group-hover:shadow-xl">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={item.src} alt={label} loading="lazy" className="h-full w-full object-contain" />
        <span aria-hidden className="absolute bottom-3 right-3 flex h-8 w-8 items-center justify-center rounded-full border border-green-100 bg-white/95 text-sm text-green-800 opacity-0 shadow-sm transition group-hover:opacity-100">⌕</span>
      </span>
    </button>
  );
}

function NavButton({
  direction, disabled, onClick,
}: {
  direction: 'previous' | 'next';
  disabled: boolean;
  onClick: () => void;
}) {
  const previous = direction === 'previous';
  return (
    <button type="button" onClick={onClick} disabled={disabled}
      aria-label={previous ? 'Xem ảnh trước' : 'Xem ảnh tiếp theo'}
      className={`absolute top-[42%] z-20 hidden h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border border-green-100 bg-white text-green-900 shadow-lg transition hover:bg-green-50 disabled:pointer-events-none disabled:opacity-0 md:flex ${
        previous ? '-left-3 lg:-left-5' : '-right-3 lg:-right-5'
      }`}>
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" aria-hidden>
        <path d={previous ? 'M15 5l-7 7 7 7' : 'M9 5l7 7-7 7'} strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </button>
  );
}

function Lightbox({
  item, title, onClose,
}: {
  item: ImageItem;
  title: string;
  onClose: () => void;
}) {
  const panelRef = useModalA11y<HTMLDivElement>(true, onClose);
  const label = `${title || 'Thẻ và mã QR'} ${item.index + 1}`;

  useEffect(() => {
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = previous; };
  }, []);

  return (
    <div role="dialog" aria-modal="true" aria-label={label} onClick={onClose}
      className="fixed inset-0 z-[100] flex items-center justify-center overflow-y-auto bg-black/75 p-4 backdrop-blur-sm">
      <div ref={panelRef} onClick={(event) => event.stopPropagation()}
        className="relative flex max-h-[92vh] w-full max-w-4xl items-center justify-center rounded-3xl bg-white p-4 shadow-2xl md:p-6">
        <button type="button" onClick={onClose} aria-label="Đóng ảnh lớn"
          className="absolute right-3 top-3 z-10 flex h-10 w-10 items-center justify-center rounded-full bg-stone-900/75 text-xl text-white transition hover:bg-stone-900">×</button>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={item.src} alt={label} className="max-h-[82vh] max-w-full object-contain" />
      </div>
    </div>
  );
}
