'use client';
import { useState } from 'react';
import SmartImage from './SmartImage';

/**
 * `primary` is products.image and always leads; `extra` are the gallery rows.
 * With no extra shots this renders exactly the single-image markup it replaced.
 */
export default function ProductGallery({
  primary, extra, alt, discount,
}: { primary: string; extra: string[]; alt: string; discount: number }) {
  const images = [primary, ...extra.filter((u) => u !== primary)];
  const [active, setActive] = useState(0);
  const current = images[active] ?? primary;
  const panelId = 'product-gallery-panel';

  return (
    <section className="space-y-3" aria-label="Thư viện ảnh sản phẩm">
      <div
        id={panelId}
        className="relative aspect-square rounded-3xl overflow-hidden border border-green-100 bg-green-50"
      >
        <SmartImage
          src={current}
          alt={alt}
          sizes="(max-width: 1024px) 100vw, 45vw"
          className="w-full h-full object-cover"
        />
        {discount > 0 && (
          <span className="absolute top-4 right-4 bg-amber-500 text-green-950 text-sm font-bold px-3 py-1.5 rounded-full">
            -{discount}%
          </span>
        )}
        {images.length > 1 && (
          <div className="absolute left-4 bottom-4 rounded-full bg-white/92 px-3 py-1 text-xs font-semibold text-green-950 shadow-sm">
            Ảnh {active + 1}/{images.length}
          </div>
        )}
      </div>
      {images.length > 1 && <p className="sr-only" aria-live="polite">{`Đang xem ảnh ${active + 1} trong ${images.length}`}</p>}

      {images.length > 1 && (
        <div
          className="grid grid-cols-5 gap-2 sm:gap-3"
          role="tablist"
          aria-label="Chọn ảnh sản phẩm"
        >
          {images.map((u, i) => (
            <button
              type="button"
              key={`${u}-${i}`}
              onClick={() => setActive(i)}
              role="tab"
              aria-label={`Xem ảnh ${i + 1}`}
              aria-selected={i === active}
              aria-controls={panelId}
              tabIndex={i === active ? 0 : -1}
              className={`aspect-square rounded-xl overflow-hidden border-2 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-700 focus-visible:ring-offset-2 ${
                i === active ? 'border-green-600 shadow-sm' : 'border-transparent hover:border-green-300'
              }`}
            >
              <SmartImage src={u} alt="" className="w-full h-full object-cover" />
            </button>
          ))}
        </div>
      )}
    </section>
  );
}
