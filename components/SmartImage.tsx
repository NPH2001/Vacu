'use client';
import { useState } from 'react';

/**
 * Drop-in replacement for a raw <img> that degrades to a neutral placeholder
 * tile when the source is empty or fails to load (e.g. an admin deleted/moved
 * the uploaded file, or a seed/external URL 404s). Without this the browser
 * shows its broken-image glyph on product cards, the cart, order history, etc.
 *
 * Pass the same `className` you'd give the <img> (e.g. "w-full h-full
 * object-cover"); the placeholder reuses it so it fills the same box. `fallback`
 * is the emoji shown in the placeholder (defaults to the 🌿 the post covers
 * already use).
 */
export default function SmartImage({
  src, alt, className = '', fallback = '🌿',
}: {
  src: string | null | undefined;
  alt: string;
  className?: string;
  fallback?: string;
}) {
  const [failed, setFailed] = useState(false);

  if (!src || failed) {
    return (
      <div className={`${className} flex items-center justify-center bg-green-50 text-green-300`} role="img" aria-label={alt}>
        <span className="text-4xl select-none" aria-hidden>{fallback}</span>
      </div>
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={src} alt={alt} className={className} onError={() => setFailed(true)} />
  );
}
