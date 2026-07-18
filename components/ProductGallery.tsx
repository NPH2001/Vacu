'use client';
import { useState } from 'react';

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

  return (
    <div className="space-y-3">
      <div className="relative aspect-square rounded-3xl overflow-hidden bg-green-50">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={current} alt={alt} className="w-full h-full object-cover" />
        {discount > 0 && (
          <span className="absolute top-4 right-4 bg-amber-500 text-green-950 text-sm font-bold px-3 py-1.5 rounded-full">
            -{discount}%
          </span>
        )}
      </div>

      {images.length > 1 && (
        <div className="grid grid-cols-5 gap-2">
          {images.map((u, i) => (
            <button
              type="button"
              key={u}
              onClick={() => setActive(i)}
              aria-label={`Xem ảnh ${i + 1}`}
              aria-current={i === active}
              className={`aspect-square rounded-xl overflow-hidden border-2 transition ${
                i === active ? 'border-green-600' : 'border-transparent hover:border-green-300'
              }`}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={u} alt="" loading="lazy" className="w-full h-full object-cover" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
