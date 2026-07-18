import Link from 'next/link';
import type { Block } from '@/lib/blocks';
import {
  getProductsForBlock, getCategoriesForBlock, getActiveHeroSlides, getAllValueProps,
  getAllFarmers, getAllTestimonials, getAllFaqItems, getSiteInfo,
} from '@/lib/data';
import ProductCard from '@/components/ProductCard';
import CategoryIcon from '@/components/CategoryIcon';
import FarmerCard from '@/components/FarmerCard';
import HeroSlider from '@/components/HeroSlider';
import FAQ from '@/components/FAQ';
import HScroll from '@/components/HScroll';
import SectionHeader from '@/components/SectionHeader';
import AnimateOnScroll from '@/components/AnimateOnScroll';

/** Full-bleed section band. `muted` paints the soft green separator background. */
function Band({
  tone, narrow = false, children,
}: { tone: 'default' | 'muted'; narrow?: boolean; children: React.ReactNode }) {
  return (
    <section className={`${tone === 'muted' ? 'bg-green-50/60 texture-paper ' : ''}py-12 md:py-20`}>
      <div className={`${narrow ? 'max-w-3xl' : 'max-w-7xl'} mx-auto px-4`}>{children}</div>
    </section>
  );
}

/**
 * Renders one block. The markup mirrors the hand-built pages it replaced, so
 * migrating a page (including the homepage) to the builder does not change how
 * it looks.
 */
export default async function BlockRenderer({ block }: { block: Block }) {
  switch (block.type) {
    case 'hero':
      return (
        <section className="relative overflow-hidden">
          {block.image && (
            <div className="absolute inset-0 -z-10">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={block.image} alt="" className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-gradient-to-br from-green-950/90 to-green-900/60" />
            </div>
          )}
          <div className={`max-w-4xl mx-auto px-4 py-20 ${block.image ? 'text-white' : ''}`}>
            {block.badge && (
              <div className={`text-sm font-bold tracking-widest uppercase mb-2 ${block.image ? 'text-amber-300' : 'text-amber-600'}`}>
                {block.badge}
              </div>
            )}
            {block.title && (
              <h1 className={`text-4xl md:text-6xl font-bold font-display leading-tight wrap-anywhere ${block.image ? '' : 'text-green-950'}`}>
                {block.title}
              </h1>
            )}
            {block.subtitle && (
              <p className={`mt-4 text-lg max-w-2xl ${block.image ? 'text-green-50/80' : 'text-green-900/70'}`}>
                {block.subtitle}
              </p>
            )}
          </div>
        </section>
      );

    case 'richtext':
      if (!block.html.trim()) return null;
      return (
        <section className="max-w-3xl mx-auto px-4 py-14">
          {/* Sanitized on write in actions/pages.ts via sanitizeRichText. */}
          <div className="product-prose" dangerouslySetInnerHTML={{ __html: block.html }} />
        </section>
      );

    case 'cards': {
      const items = block.items.filter((i) => i.title || i.desc);
      if (items.length === 0) return null;
      return (
        <section className="bg-green-50/60 py-16 texture-paper">
          <div className="max-w-5xl mx-auto px-4">
            {block.title && (
              <AnimateOnScroll>
                <h2 className="text-3xl md:text-4xl font-bold text-green-950 font-display text-center mb-12 wrap-anywhere">
                  {block.title}
                </h2>
              </AnimateOnScroll>
            )}
            <div className={`grid gap-6 ${items.length >= 3 ? 'md:grid-cols-3' : 'md:grid-cols-2'}`}>
              {items.map((v, i) => (
                <div key={i} className="bg-white rounded-3xl p-7 border border-green-100">
                  {v.num && <div className="text-amber-500 text-5xl font-display mb-2">{v.num}</div>}
                  <h3 className="font-bold text-green-950 font-display text-xl mb-2">{v.title}</h3>
                  <p className="text-green-900/70">{v.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      );
    }

    case 'stats': {
      const items = block.items.filter((i) => i.value || i.label);
      if (items.length === 0) return null;
      return (
        <section className="max-w-7xl mx-auto px-4 py-16">
          {block.title && (
            <h2 className="text-3xl font-bold text-green-950 font-display text-center mb-10 wrap-anywhere">{block.title}</h2>
          )}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {items.map((s, i) => (
              <div key={i} className="bg-white rounded-3xl p-8 border border-green-100 text-center">
                <div className="text-4xl md:text-5xl font-bold text-green-800 font-display">{s.value}</div>
                <div className="text-sm text-green-900/60 uppercase tracking-wider mt-2">{s.label}</div>
              </div>
            ))}
          </div>
        </section>
      );
    }

    case 'cta':
      if (!block.title && !block.label) return null;
      return (
        <section className="max-w-5xl mx-auto px-4 py-16">
          <div className="bg-gradient-to-br from-green-800 to-green-950 rounded-[2rem] p-10 md:p-14 text-center text-white">
            {block.title && <h2 className="text-3xl md:text-4xl font-bold font-display mb-4 wrap-anywhere">{block.title}</h2>}
            {block.subtitle && <p className="text-green-100/80 max-w-lg mx-auto mb-8">{block.subtitle}</p>}
            {block.label && block.href && (
              <Link href={block.href}
                className="inline-block bg-amber-400 hover:bg-amber-500 text-green-950 font-bold px-8 py-3.5 rounded-full transition">
                {block.label}
              </Link>
            )}
          </div>
        </section>
      );

    case 'gallery': {
      if (block.images.length === 0) return null;
      return (
        <section className="max-w-6xl mx-auto px-4 py-14">
          {block.title && (
            <h2 className="text-3xl font-bold text-green-950 font-display text-center mb-8 wrap-anywhere">{block.title}</h2>
          )}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {block.images.map((src, i) => (
              // eslint-disable-next-line @next/next/no-img-element
              <img key={i} src={src} alt="" loading="lazy"
                className="w-full aspect-[4/3] object-cover rounded-2xl border border-green-100" />
            ))}
          </div>
        </section>
      );
    }

    case 'products': {
      const items = await getProductsForBlock(block);
      if (items.length === 0) return null;
      return (
        <Band tone={block.tone}>
          <AnimateOnScroll>
            <SectionHeader eyebrow={block.eyebrow} title={block.title}
              href={block.linkHref || undefined} linkLabel={block.linkLabel} />
          </AnimateOnScroll>
          <HScroll gridClass="md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {items.map((p) => <ProductCard key={p.id} p={p} />)}
          </HScroll>
        </Band>
      );
    }

    case 'categories': {
      const items = await getCategoriesForBlock(block);
      if (items.length === 0) return null;
      return (
        <Band tone={block.tone}>
          <AnimateOnScroll>
            <SectionHeader eyebrow={block.eyebrow} title={block.title}
              href={block.linkHref || undefined} linkLabel={block.linkLabel} />
          </AnimateOnScroll>
          <HScroll itemClass="w-[42vw] max-w-[190px]" gridClass="md:grid-cols-3 lg:grid-cols-6">
            {items.map((c) => (
              <Link key={c.id} href={`/danh-muc/${c.id}`}
                className="flex flex-col h-full bg-white rounded-2xl border border-green-100 p-5 text-center hover:shadow-lg hover:-translate-y-1 transition">
                <CategoryIcon value={c.icon} alt={c.name} className="w-14 h-14 mx-auto mb-2 text-4xl rounded-xl" />
                <div className="font-bold text-green-950 wrap-anywhere">{c.name}</div>
                <div className="text-xs text-green-800/60 mt-1 line-clamp-2">{c.description}</div>
              </Link>
            ))}
          </HScroll>
        </Band>
      );
    }

    case 'heroSlider': {
      const [slides, info] = await Promise.all([getActiveHeroSlides(), getSiteInfo()]);
      const stats = [
        { value: info.statFarmers, label: info.statFarmersLabel },
        { value: info.statProducts, label: info.statProductsLabel },
        { value: info.statCustomers, label: info.statCustomersLabel },
        { value: info.statYears, label: info.statYearsLabel },
      ];
      if (slides.length > 0) return <HeroSlider slides={slides} stats={stats} />;
      // Static fallback when no slide is active.
      return (
        <section className="relative overflow-hidden">
          <div className="absolute inset-0 -z-10">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={info.heroImage} alt="" fetchPriority="high" className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-br from-green-950/80 via-green-900/60 to-amber-900/40" />
          </div>
          <div className="max-w-7xl mx-auto px-4 py-20 md:py-32 text-white">
            <div className="max-w-2xl">
              <div className="inline-flex items-center gap-2 bg-white/15 backdrop-blur px-4 py-1.5 rounded-full text-sm font-medium mb-6 border border-white/20">
                <span className="w-2 h-2 rounded-full bg-amber-300" />
                {info.heroBadge}
              </div>
              <h1 className="text-4xl md:text-6xl font-bold font-display mb-6 leading-[1.1] wrap-anywhere">{info.tagline}</h1>
              <p className="text-lg md:text-xl text-green-50/90 mb-10 max-w-xl wrap-anywhere">{info.heroSubtitle}</p>
              <div className="flex flex-wrap gap-3">
                <Link href="/products" className="bg-amber-400 hover:bg-amber-500 text-green-950 font-bold px-7 py-4 rounded-full transition">
                  {info.heroCtaPrimary}
                </Link>
                <Link href="/farmers" className="bg-white/10 hover:bg-white/20 backdrop-blur text-white font-bold px-7 py-4 rounded-full border border-white/30 transition">
                  {info.heroCtaSecondary}
                </Link>
              </div>
              <div className="flex flex-wrap items-center gap-8 mt-12 pt-8 border-t border-white/20">
                {stats.map((s, i) => (
                  <div key={i}>
                    <div className="text-2xl md:text-3xl font-bold font-display">{s.value}</div>
                    <div className="text-xs text-green-100/70 uppercase tracking-wider">{s.label}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>
      );
    }

    case 'valueProps': {
      const all = await getAllValueProps();
      const items = block.limit > 0 ? all.slice(0, block.limit) : all;
      if (items.length === 0) return null;
      return (
        <Band tone={block.tone}>
          {block.title && (
            <h2 className="text-3xl md:text-4xl font-bold text-green-950 font-display text-center mb-8 wrap-anywhere">{block.title}</h2>
          )}
          <HScroll
            itemClass="w-[72vw] max-w-[280px]"
            gridClass={items.length >= 4 ? 'md:grid-cols-4' : items.length === 3 ? 'md:grid-cols-3' : 'md:grid-cols-2'}
          >
            {items.map((v) => (
              <div key={v.id} className="bg-white p-6 rounded-3xl border border-green-100">
                <div className="text-4xl mb-3">{v.icon}</div>
                <h3 className="font-bold text-green-950 font-display text-lg mb-1.5 wrap-anywhere">{v.title}</h3>
                <p className="text-green-900/70 text-sm wrap-anywhere">{v.description}</p>
              </div>
            ))}
          </HScroll>
        </Band>
      );
    }

    case 'subBox': {
      const info = await getSiteInfo();
      // Skip the whole promo when there is nothing to show (blank config).
      if (!info.subBoxTitle && !info.subBoxDescription) return null;
      const hasImage = Boolean(info.subBoxImage);
      return (
        <section className="max-w-7xl mx-auto px-4 py-12 md:py-20">
          <div className={`bg-gradient-to-br from-green-800 to-green-950 rounded-[2.5rem] overflow-hidden grid ${hasImage ? 'md:grid-cols-2' : ''}`}>
            <div className="p-10 md:p-14 text-white flex flex-col justify-center">
              <div className="inline-block bg-amber-400 text-green-950 text-xs font-bold px-3 py-1 rounded-full w-fit mb-4">
                {info.subBoxBadge}
              </div>
              <h2 className="text-3xl md:text-5xl font-bold font-display leading-tight mb-4">{info.subBoxTitle}</h2>
              <p className="text-green-100/80 mb-6 max-w-md">{info.subBoxDescription}</p>
              <ul className="space-y-2 mb-8 text-green-100/90">
                {(Array.isArray(info.subBoxFeatures) ? info.subBoxFeatures : []).map((f, i) => <li key={i}>✓ {f}</li>)}
              </ul>
              <Link href={info.subBoxLink}
                className="bg-amber-400 hover:bg-amber-500 text-green-950 font-bold px-7 py-3.5 rounded-full transition w-fit">
                {info.subBoxCta}
              </Link>
            </div>
            {hasImage && (
              <div className="relative min-h-[320px]">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={info.subBoxImage} alt="" className="absolute inset-0 w-full h-full object-cover" />
              </div>
            )}
          </div>
        </section>
      );
    }

    case 'farmers': {
      const all = await getAllFarmers();
      const items = block.limit > 0 ? all.slice(0, block.limit) : all;
      if (items.length === 0) return null;
      return (
        <Band tone={block.tone}>
          <AnimateOnScroll>
            <SectionHeader eyebrow={block.eyebrow} title={block.title}
              href={block.linkHref || undefined} linkLabel={block.linkLabel} />
          </AnimateOnScroll>
          <HScroll itemClass="w-[82vw] max-w-[320px]" gridClass="md:grid-cols-3">
            {items.map((f) => <FarmerCard key={f.id} f={f} />)}
          </HScroll>
        </Band>
      );
    }

    case 'testimonials': {
      const all = await getAllTestimonials();
      const items = block.limit > 0 ? all.slice(0, block.limit) : all;
      if (items.length === 0) return null;
      return (
        <Band tone={block.tone}>
          {block.title && (
            <AnimateOnScroll>
              <h2 className="text-3xl md:text-4xl font-bold text-green-950 font-display text-center mb-12 wrap-anywhere">{block.title}</h2>
            </AnimateOnScroll>
          )}
          <HScroll itemClass="w-[82vw] max-w-[330px]" gridClass="md:grid-cols-2 lg:grid-cols-3">
            {items.map((t, i) => (
              <div key={i} className="bg-white rounded-2xl border border-green-100 p-5 h-full flex flex-col">
                {(() => { const r = Math.max(0, Math.min(5, t.rating)); return (
                  <div className="text-amber-500 text-sm mb-2" aria-label={`${r}/5 sao`}>
                    {'★'.repeat(r)}<span className="text-stone-300">{'★'.repeat(5 - r)}</span>
                  </div>
                ); })()}
                <p className="text-green-900/80 flex-1 italic leading-relaxed wrap-anywhere">&ldquo;{t.content}&rdquo;</p>
                <div className="flex items-center gap-3 mt-4 pt-4 border-t border-green-100">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={t.avatar} alt={t.name} className="w-10 h-10 rounded-full object-cover shrink-0" />
                  <div className="min-w-0">
                    <div className="font-bold text-green-950 text-sm truncate">{t.name}</div>
                    <div className="text-xs text-green-900/60 truncate">{t.role}</div>
                  </div>
                </div>
              </div>
            ))}
          </HScroll>
        </Band>
      );
    }

    case 'faq': {
      const [rows, info] = await Promise.all([getAllFaqItems(), getSiteInfo()]);
      if (rows.length === 0) return null;
      const items = rows.map((f) => ({ q: f.question, a: f.answer }));
      return (
        <Band tone={block.tone} narrow>
          <AnimateOnScroll>
            {block.title && (
              <h2 className="text-3xl md:text-4xl font-bold text-green-950 font-display text-center mb-3 wrap-anywhere">{block.title}</h2>
            )}
            {block.subtitle && (
              <p className="text-center text-green-900/70 mb-10 wrap-anywhere">
                {block.subtitle.replaceAll('{phone}', info.phone)}
              </p>
            )}
          </AnimateOnScroll>
          <FAQ items={items} />
        </Band>
      );
    }
  }
}
