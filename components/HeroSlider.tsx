'use client';
import Link from 'next/link';
import { useCallback, useEffect, useRef, useState } from 'react';
import type { HeroSlideRow } from '@/db/schema';

type Stat = { value: string; label: string };

const INTERVAL = 6000;

/**
 * Rotating homepage hero. Slides crossfade; autoplay pauses on hover/focus and
 * is disabled entirely for reduced-motion users. The stats strip is persistent
 * (it belongs to the site, not a slide) so it never flickers between slides.
 */
export default function HeroSlider({ slides, stats }: { slides: HeroSlideRow[]; stats: Stat[] }) {
  const [current, setCurrent] = useState(0);
  const [paused, setPaused] = useState(false);
  const touchX = useRef<number | null>(null);

  const count = slides.length;
  const go = useCallback((i: number) => setCurrent(((i % count) + count) % count), [count]);
  const next = useCallback(() => go(current + 1), [current, go]);
  const prev = useCallback(() => go(current - 1), [current, go]);

  // Autoplay — skipped for a single slide or when the user prefers reduced motion.
  useEffect(() => {
    if (count <= 1 || paused) return;
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return;
    const t = setInterval(() => setCurrent((c) => (c + 1) % count), INTERVAL);
    return () => clearInterval(t);
  }, [count, paused]);

  const onTouchStart = (e: React.TouchEvent) => { touchX.current = e.touches[0].clientX; };
  const onTouchEnd = (e: React.TouchEvent) => {
    if (touchX.current === null) return;
    const dx = e.changedTouches[0].clientX - touchX.current;
    if (Math.abs(dx) > 45) {
      if (dx < 0) next(); else prev();
    }
    touchX.current = null;
  };

  return (
    <section
      className="relative overflow-hidden flex flex-col md:min-h-[600px]"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocusCapture={() => setPaused(true)}
      onBlurCapture={() => setPaused(false)}
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
      aria-roledescription="carousel"
    >
      {/* Crossfading backgrounds only — full-bleed behind everything. */}
      {slides.map((s, i) => (
        <div
          key={s.id}
          aria-hidden
          className={`absolute inset-0 -z-10 transition-opacity duration-700 ease-in-out ${
            i === current ? 'opacity-100' : 'opacity-0'
          }`}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={s.image} alt="" loading={i === 0 ? 'eager' : 'lazy'} className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-br from-green-950/80 via-green-900/60 to-amber-900/40" />
        </div>
      ))}

      {/* Foreground text. The slides are grid-stacked in a single cell so the
          section grows to the tallest slide's content — no fixed height to
          overlap the stats on a phone, no empty band when a slide is short.
          flex-1 + items-center keeps it vertically centred on desktop. */}
      <div className="relative z-10 flex-1 flex items-center">
        <div className="grid max-w-7xl mx-auto px-4 w-full py-12 md:py-20">
          {slides.map((s, i) => (
            <div
              key={s.id}
              aria-hidden={i !== current}
              className={`[grid-area:1/1] transition-opacity duration-700 ease-in-out ${
                i === current ? 'opacity-100' : 'opacity-0 pointer-events-none'
              }`}
            >
              <div className="max-w-2xl text-white">
                {s.badge && (
                  <div className="inline-flex items-center gap-2 bg-white/15 backdrop-blur px-4 py-1.5 rounded-full text-sm font-medium mb-5 md:mb-6 border border-white/20">
                    <span className="w-2 h-2 rounded-full bg-amber-300" />
                    {s.badge}
                  </div>
                )}
                <h1 className="text-4xl md:text-6xl font-bold font-display mb-4 md:mb-6 leading-[1.1] wrap-anywhere">
                  {s.title}
                </h1>
                {s.subtitle && (
                  <p className="text-lg md:text-xl text-green-50/90 mb-6 md:mb-10 max-w-xl wrap-anywhere">{s.subtitle}</p>
                )}
                <div className="flex flex-wrap gap-3">
                  {s.ctaPrimaryLabel && s.ctaPrimaryHref && (
                    <Link href={s.ctaPrimaryHref}
                      className="bg-amber-400 hover:bg-amber-500 text-green-950 font-bold px-7 py-4 rounded-full transition">
                      {s.ctaPrimaryLabel}
                    </Link>
                  )}
                  {s.ctaSecondaryLabel && s.ctaSecondaryHref && (
                    <Link href={s.ctaSecondaryHref}
                      className="bg-white/10 hover:bg-white/20 backdrop-blur text-white font-bold px-7 py-4 rounded-full border border-white/30 transition">
                      {s.ctaSecondaryLabel}
                    </Link>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Persistent stats + controls — in normal flow at the bottom. */}
      <div className="relative z-10 w-full">
        {stats.length > 0 && (
          <div className="max-w-7xl mx-auto px-4 pb-6">
            <div className="flex flex-wrap items-center gap-x-8 gap-y-3 pt-6 border-t border-white/20 text-white">
              {stats.map((s, i) => (
                <div key={i}>
                  <div className="text-2xl md:text-3xl font-bold font-display">{s.value}</div>
                  <div className="text-xs text-green-100/70 uppercase tracking-wider">{s.label}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {count > 1 && (
          <div className="max-w-7xl mx-auto px-4 pb-6 flex items-center gap-3">
            <div className="flex gap-2">
              {slides.map((s, i) => (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => go(i)}
                  aria-label={`Slide ${i + 1}`}
                  aria-current={i === current}
                  className={`h-2 rounded-full transition-all ${
                    i === current ? 'w-6 bg-white' : 'w-2 bg-white/40 hover:bg-white/70'
                  }`}
                />
              ))}
            </div>
            <div className="ml-auto flex gap-2">
              <button type="button" onClick={prev} aria-label="Slide trước"
                className="w-9 h-9 rounded-full bg-white/15 hover:bg-white/30 backdrop-blur text-white flex items-center justify-center">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M15 18l-6-6 6-6" /></svg>
              </button>
              <button type="button" onClick={next} aria-label="Slide sau"
                className="w-9 h-9 rounded-full bg-white/15 hover:bg-white/30 backdrop-blur text-white flex items-center justify-center">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M9 18l6-6-6-6" /></svg>
              </button>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
