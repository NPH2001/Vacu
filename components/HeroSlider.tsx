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
export default function HeroSlider({
  slides, stats, heading = 'h1',
}: { slides: HeroSlideRow[]; stats: Stat[]; heading?: 'h1' | 'h2' }) {
  const HeroHeading = heading;
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
      className="relative flex min-h-[620px] flex-col overflow-hidden md:min-h-[680px]"
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
          <img src={s.image} alt="" loading={i === 0 ? 'eager' : 'lazy'}
            fetchPriority={i === 0 ? 'high' : undefined} className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-r from-green-950/95 via-green-950/72 to-green-900/20" />
          <div className="absolute inset-0 bg-[linear-gradient(to_top,rgba(5,46,22,0.42),transparent_55%)]" />
        </div>
      ))}

      {/* Foreground text. The slides are grid-stacked in a single cell so the
          section grows to the tallest slide's content — no fixed height to
          overlap the stats on a phone, no empty band when a slide is short.
          flex-1 + items-center keeps it vertically centred on desktop. */}
      <div className="relative z-10 flex-1 flex items-center">
        <div className="mx-auto grid w-full max-w-7xl px-4 py-14 md:py-24">
          {slides.map((s, i) => (
            <div
              key={s.id}
              aria-hidden={i !== current}
              inert={i !== current || undefined}
              className={`[grid-area:1/1] transition-opacity duration-700 ease-in-out ${
                i === current ? 'opacity-100' : 'opacity-0 pointer-events-none'
              }`}
            >
              <div className="max-w-3xl text-white">
                {s.badge && (
                  <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/12 px-4 py-2 text-xs font-bold uppercase tracking-[0.12em] backdrop-blur md:mb-6">
                    <span className="h-2 w-2 rounded-full bg-lime-300" />
                    {s.badge}
                  </div>
                )}
                <HeroHeading className="mb-5 max-w-3xl wrap-anywhere font-display text-4xl font-semibold leading-[1.04] tracking-[-0.035em] text-balance md:text-6xl lg:text-7xl">
                  {s.title}
                </HeroHeading>
                {s.subtitle && (
                  <p className="mb-8 max-w-2xl wrap-anywhere text-base leading-relaxed text-green-50/88 md:text-xl">{s.subtitle}</p>
                )}
                <div className="flex flex-col gap-3 sm:flex-row">
                  {s.ctaPrimaryLabel && s.ctaPrimaryHref && (
                    <Link href={s.ctaPrimaryHref}
                      className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-amber-400 px-7 py-3.5 font-bold text-green-950 transition hover:bg-amber-300">
                      {s.ctaPrimaryLabel}<span aria-hidden>→</span>
                    </Link>
                  )}
                  {s.ctaSecondaryLabel && s.ctaSecondaryHref && (
                    <Link href={s.ctaSecondaryHref}
                      className="inline-flex min-h-12 items-center justify-center rounded-xl border border-white/30 bg-white/10 px-7 py-3.5 font-bold text-white backdrop-blur transition hover:bg-white/20">
                      {s.ctaSecondaryLabel}
                    </Link>
                  )}
                </div>
                <ul className="mt-7 flex flex-wrap gap-x-5 gap-y-2 text-sm text-green-50/80" aria-label="Cam kết mua hàng">
                  <li className="inline-flex items-center gap-1.5"><span className="text-lime-300" aria-hidden>✓</span> Nguồn gốc minh bạch</li>
                  <li className="inline-flex items-center gap-1.5"><span className="text-lime-300" aria-hidden>✓</span> Chọn lọc mỗi ngày</li>
                  <li className="inline-flex items-center gap-1.5"><span className="text-lime-300" aria-hidden>✓</span> Hỗ trợ đổi trả</li>
                </ul>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Persistent stats + controls — in normal flow at the bottom. */}
      <div className="relative z-10 w-full">
        {stats.length > 0 && (
          <div className="mx-auto max-w-7xl px-4 pb-5">
            <div className="grid grid-cols-2 gap-px overflow-hidden rounded-2xl border border-white/15 bg-white/10 text-white backdrop-blur-md md:grid-cols-4">
              {stats.map((s, i) => (
                <div key={i} className="bg-green-950/30 px-4 py-4 md:px-6">
                  <div className="font-display text-2xl font-semibold md:text-3xl">{s.value}</div>
                  <div className="mt-0.5 text-[11px] uppercase tracking-wider text-green-100/70">{s.label}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {count > 1 && (
          <div className="mx-auto flex max-w-7xl items-center gap-3 px-4 pb-6">
            <div className="flex gap-1">
              {slides.map((s, i) => (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => go(i)}
                  aria-label={`Slide ${i + 1}`}
                  aria-current={i === current}
                  className="group inline-flex h-11 min-w-11 items-center justify-center rounded-full"
                >
                  <span aria-hidden className={`h-2 rounded-full transition-all ${
                    i === current ? 'w-6 bg-white' : 'w-2 bg-white/40 group-hover:bg-white/70'
                  }`} />
                </button>
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
