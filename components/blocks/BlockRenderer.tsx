import Link from 'next/link';
import type { Block } from '@/lib/blocks';
import { getProductsForBlock, getCategoriesForBlock } from '@/lib/data';
import ProductCard from '@/components/ProductCard';
import CategoryIcon from '@/components/CategoryIcon';
import AnimateOnScroll from '@/components/AnimateOnScroll';

/**
 * Renders one block. The markup mirrors the hand-built About page it replaced,
 * so migrating a page to the builder does not change how it looks.
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
        <section className="max-w-7xl mx-auto px-4 py-14">
          {block.title && (
            <h2 className="text-3xl font-bold text-green-950 font-display text-center mb-8 wrap-anywhere">{block.title}</h2>
          )}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
            {items.map((p) => <ProductCard key={p.id} p={p} />)}
          </div>
        </section>
      );
    }

    case 'categories': {
      const items = await getCategoriesForBlock(block);
      if (items.length === 0) return null;
      return (
        <section className="max-w-7xl mx-auto px-4 py-14">
          {block.title && (
            <h2 className="text-3xl font-bold text-green-950 font-display text-center mb-8 wrap-anywhere">{block.title}</h2>
          )}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {items.map((c) => (
              <Link key={c.id} href={`/danh-muc/${c.id}`}
                className="flex flex-col h-full bg-white rounded-2xl border border-green-100 p-5 text-center hover:shadow-lg hover:-translate-y-1 transition">
                <CategoryIcon value={c.icon} alt={c.name} className="w-14 h-14 mx-auto mb-2 text-4xl rounded-xl" />
                <div className="font-bold text-green-950 wrap-anywhere">{c.name}</div>
                <div className="text-xs text-green-800/60 mt-1 line-clamp-2">{c.description}</div>
              </Link>
            ))}
          </div>
        </section>
      );
    }
  }
}
