export const dynamic = 'force-dynamic';

import { Fragment } from "react";
import Link from "next/link";
import { type HomeSectionKey } from "@/lib/home-sections";
import {
  getHomeSectionOrder,
  getAllCategories,
  getFeaturedProducts,
  getAllFarmers,
  getAllTestimonials,
  getSiteInfo,
  getAllFaqItems,
  getAllValueProps,
  getActiveHeroSlides,
} from "@/lib/data";
import ProductCard from "@/components/ProductCard";
import FarmerCard from "@/components/FarmerCard";
import HeroSlider from "@/components/HeroSlider";
import HScroll from "@/components/HScroll";
import SectionHeader from "@/components/SectionHeader";
import AnimateOnScroll from "@/components/AnimateOnScroll";
import FAQ from "@/components/FAQ";
import CategoryIcon from "@/components/CategoryIcon";

export default async function HomePage() {
  const [categories, featured, farmers, testimonials, info, faqRows, valueProps, order, heroSlides] = await Promise.all([
    getAllCategories(), getFeaturedProducts(8), getAllFarmers(),
    getAllTestimonials(), getSiteInfo(), getAllFaqItems(), getAllValueProps(),
    getHomeSectionOrder(), getActiveHeroSlides(),
  ]);
  const topFarmers = farmers.slice(0, 3);
  const faqItems = faqRows.map((f) => ({ q: f.question, a: f.answer }));
  const heroStats = [
    { value: info.statFarmers, label: info.statFarmersLabel },
    { value: info.statProducts, label: info.statProductsLabel },
    { value: info.statCustomers, label: info.statCustomersLabel },
    { value: info.statYears, label: info.statYearsLabel },
  ];

  // Each section keyed by name so the admin's stored order decides what renders
  // and in what sequence (see /admin/home-sections).
  const sections: Record<HomeSectionKey, React.ReactNode> = {
    // Slider when the admin has added slides; otherwise the single static hero.
    hero: heroSlides.length > 0 ? (
      <HeroSlider slides={heroSlides} stats={heroStats} />
    ) : (
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 -z-10">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={info.heroImage}
            alt=""
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-br from-green-950/80 via-green-900/60 to-amber-900/40" />
        </div>
        <div className="max-w-7xl mx-auto px-4 py-20 md:py-32 text-white">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 bg-white/15 backdrop-blur px-4 py-1.5 rounded-full text-sm font-medium mb-6 border border-white/20">
              <span className="w-2 h-2 rounded-full bg-amber-300" />
              {info.heroBadge}
            </div>
            <h1 className="text-4xl md:text-6xl font-bold font-display mb-6 leading-[1.1]">
              {info.tagline}
            </h1>
            <p className="text-lg md:text-xl text-green-50/90 mb-10 max-w-xl">
              {info.heroSubtitle}
            </p>
            <div className="flex flex-wrap gap-3">
              <Link
                href="/products"
                className="bg-amber-400 hover:bg-amber-500 text-green-950 font-bold px-7 py-4 rounded-full transition"
              >
                {info.heroCtaPrimary}
              </Link>
              <Link
                href="/farmers"
                className="bg-white/10 hover:bg-white/20 backdrop-blur text-white font-bold px-7 py-4 rounded-full border border-white/30 transition"
              >
                {info.heroCtaSecondary}
              </Link>
            </div>
            <div className="flex flex-wrap items-center gap-8 mt-12 pt-8 border-t border-white/20">
              <Stat value={info.statFarmers} label={info.statFarmersLabel} />
              <Stat value={info.statProducts} label={info.statProductsLabel} />
              <Stat value={info.statCustomers} label={info.statCustomersLabel} />
              <Stat value={info.statYears} label={info.statYearsLabel} />
            </div>
          </div>
        </div>
      </section>
    ),

    valueProps: valueProps.length > 0 && (
      <section className="max-w-7xl mx-auto px-4 py-12 md:py-20">
          <HScroll
            itemClass="w-[72vw] max-w-[280px]"
            gridClass={valueProps.length >= 4 ? 'md:grid-cols-4' : valueProps.length === 3 ? 'md:grid-cols-3' : 'md:grid-cols-2'}
          >
            {valueProps.map((v) => (
              <div key={v.id} className="bg-white p-6 rounded-3xl border border-green-100">
                <div className="text-4xl mb-3">{v.icon}</div>
                <h3 className="font-bold text-green-950 font-display text-lg mb-1.5 wrap-anywhere">{v.title}</h3>
                <p className="text-green-900/70 text-sm wrap-anywhere">{v.description}</p>
              </div>
            ))}
        </HScroll>
      </section>
    ),

    categories: (
      <section className="max-w-7xl mx-auto px-4 pb-12 md:pb-16">
        <AnimateOnScroll>
          <SectionHeader
            eyebrow={info.sectionCategoriesEyebrow}
            title={info.sectionCategoriesTitle}
            href="/products"
            linkLabel={info.sectionCategoriesLinkLabel}
          />
        </AnimateOnScroll>
        <HScroll itemClass="w-[42vw] max-w-[190px]" gridClass="md:grid-cols-3 lg:grid-cols-6">
          {categories.filter((c) => !c.parentId).map((c) => (
            <Link
              key={c.id}
              href={`/danh-muc/${c.id}`}
              className="flex flex-col h-full bg-white rounded-2xl border border-green-100 p-5 text-center hover:shadow-lg hover:-translate-y-1 transition"
            >
              <CategoryIcon value={c.icon} alt={c.name} className="w-14 h-14 mx-auto mb-2 text-4xl rounded-xl" />
              <div className="font-bold text-green-950 wrap-anywhere">{c.name}</div>
              <div className="text-xs text-green-800/60 mt-1 line-clamp-2">{c.description}</div>
            </Link>
          ))}
        </HScroll>
      </section>
    ),

    featured: (
      <section className="bg-green-50/60 py-12 md:py-20 texture-paper">
        <div className="max-w-7xl mx-auto px-4">
          <AnimateOnScroll>
            <SectionHeader
              eyebrow={info.sectionFeaturedEyebrow}
              title={info.sectionFeaturedTitle}
              href="/products"
              linkLabel={info.sectionFeaturedLinkLabel}
            />
          </AnimateOnScroll>
          <HScroll gridClass="md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {featured.map((p) => <ProductCard key={p.id} p={p} />)}
          </HScroll>
        </div>
      </section>
    ),

    subBox: (
      <section className="max-w-7xl mx-auto px-4 py-12 md:py-20">
        <div className="bg-gradient-to-br from-green-800 to-green-950 rounded-[2.5rem] overflow-hidden grid md:grid-cols-2">
          <div className="p-10 md:p-14 text-white flex flex-col justify-center">
            <div className="inline-block bg-amber-400 text-green-950 text-xs font-bold px-3 py-1 rounded-full w-fit mb-4">
              {info.subBoxBadge}
            </div>
            <h2 className="text-3xl md:text-5xl font-bold font-display leading-tight mb-4">
              {info.subBoxTitle}
            </h2>
            <p className="text-green-100/80 mb-6 max-w-md">
              {info.subBoxDescription}
            </p>
            <ul className="space-y-2 mb-8 text-green-100/90">
              {info.subBoxFeatures.map((f, i) => (
                <li key={i}>✓ {f}</li>
              ))}
            </ul>
            <Link
              href={info.subBoxLink}
              className="bg-amber-400 hover:bg-amber-500 text-green-950 font-bold px-7 py-3.5 rounded-full transition w-fit"
            >
              {info.subBoxCta}
            </Link>
          </div>
          <div className="relative min-h-[320px]">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={info.subBoxImage}
              alt=""
              className="absolute inset-0 w-full h-full object-cover"
            />
          </div>
        </div>
      </section>
    ),

    farmers: (
      <section className="max-w-7xl mx-auto px-4 pb-12 md:pb-20">
        <AnimateOnScroll>
          <SectionHeader
            eyebrow={info.sectionFarmersEyebrow}
            title={info.sectionFarmersTitle}
            href="/farmers"
            linkLabel={info.sectionFarmersLinkLabel}
          />
        </AnimateOnScroll>
        <HScroll itemClass="w-[82vw] max-w-[320px]" gridClass="md:grid-cols-3">
          {topFarmers.map((f) => <FarmerCard key={f.id} f={f} />)}
        </HScroll>
      </section>
    ),

    testimonials: (
      <section className="bg-green-50/60 py-12 md:py-20 texture-paper">
        <div className="max-w-7xl mx-auto px-4">
          <AnimateOnScroll>
            <h2 className="text-3xl md:text-4xl font-bold text-green-950 font-display text-center mb-12">
              {info.sectionTestimonialsTitle}
            </h2>
          </AnimateOnScroll>
          {/* A uniform grid: the old first-card-spans-two-columns trick only
              lined up when there were exactly five testimonials, and the admin
              can add any number. */}
          <HScroll itemClass="w-[82vw] max-w-[330px]" gridClass="md:grid-cols-2 lg:grid-cols-3">
            {testimonials.map((t, i) => (
              <div key={i} className="bg-white rounded-2xl border border-green-100 p-5 h-full flex flex-col">
                  <div className="text-amber-500 text-sm mb-2" aria-label={`${t.rating}/5 sao`}>
                    {'★'.repeat(t.rating)}<span className="text-stone-300">{'★'.repeat(5 - t.rating)}</span>
                  </div>
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
        </div>
      </section>
    ),

    faq: (
      <section className="max-w-3xl mx-auto px-4 py-12 md:py-20">
        <AnimateOnScroll>
          <h2 className="text-3xl md:text-4xl font-bold text-green-950 font-display text-center mb-3">
            {info.sectionFaqTitle}
          </h2>
          {/* {phone} in the admin-editable subtitle is swapped for the live
              phone, so the number stays current even after the text is edited. */}
          <p className="text-center text-green-900/70 mb-10 wrap-anywhere">
            {info.sectionFaqSubtitle.replaceAll('{phone}', info.phone)}
          </p>
        </AnimateOnScroll>
        <FAQ items={faqItems} />
      </section>
    ),
  };

  return (
    <div>
      {order
        .filter((s) => s.visible)
        .map((s) => <Fragment key={s.key}>{sections[s.key]}</Fragment>)}
    </div>
  );
}

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <div>
      <div className="text-2xl md:text-3xl font-bold font-display">{value}</div>
      <div className="text-xs text-green-100/70 uppercase tracking-wider">{label}</div>
    </div>
  );
}
