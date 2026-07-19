'use client';
import Image from 'next/image';
import { useState } from 'react';

/**
 * Drop-in image that:
 *  - optimizes same-origin uploads via next/image (responsive srcset + lazy),
 *  - renders external URLs `unoptimized` (skips the optimizer — external images
 *    are admin-set, so we don't turn the optimizer into an open image proxy),
 *  - degrades to a neutral placeholder tile when the src is empty or 404s.
 *
 * It self-wraps in a sized, relative box, so pass the same `className` you'd give
 * a plain <img> (e.g. "w-full h-full object-cover", or a fixed "w-14 h-14
 * rounded-full") — the wrapper takes the size/rounding and the image fills it
 * with object-cover. Callers already sit inside aspect-ratio / fixed-size boxes.
 * `sizes` is the responsive hint for the layout (default a conservative 100vw).
 */
export default function SmartImage({
  src, alt, className = '', fallback = '🌿', sizes = '100vw',
}: {
  src: string | null | undefined;
  alt: string;
  className?: string;
  fallback?: string;
  sizes?: string;
}) {
  const [failed, setFailed] = useState(false);

  if (!src || failed) {
    return (
      <span className={`${className} relative flex items-center justify-center bg-green-50 text-green-300 overflow-hidden`} role="img" aria-label={alt}>
        <span className="text-4xl select-none" aria-hidden>{fallback}</span>
      </span>
    );
  }

  const external = /^https?:\/\//i.test(src);
  return (
    <span className={`${className} relative block overflow-hidden`}>
      <Image
        src={src}
        alt={alt}
        fill
        sizes={sizes}
        unoptimized={external}
        onError={() => setFailed(true)}
        className="object-cover"
      />
    </span>
  );
}
