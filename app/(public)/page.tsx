export const dynamic = 'force-dynamic';

import Link from "next/link";
import {
  getAllCategories,
  getFeaturedProducts,
  getAllFarmers,
  getAllTestimonials,
  getSiteInfo,
  getAllFaqItems,
  getAllValueProps,
} from "@/lib/data";
import ProductCard from "@/components/ProductCard";
import FarmerCard from "@/components/FarmerCard";
import AnimateOnScroll from "@/components/AnimateOnScroll";
import FAQ from "@/components/FAQ";

export default async function HomePage() {
  const [categories, featured, farmers, testimonials, info, faqRows, valueProps] = await Promise.all([
    getAllCategories(), getFeaturedProducts(8), getAllFarmers(),
    getAllTestimonials(), getSiteInfo(), getAllFaqItems(), getAllValueProps(),
  ]);
  const topFarmers = farmers.slice(0, 3);
  const faqItems = faqRows.map((f) => ({ q: f.question, a: f.answer }));

  return (
    <div>
      {/* Hero */}
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
              <Stat value={info.statFarmers} label="Nông dân" />
              <Stat value={info.statProducts} label="Sản phẩm" />
              <Stat value={info.statCustomers} label="Gia đình tin dùng" />
              <Stat value={info.statYears} label="Năm kinh nghiệm" />
            </div>
          </div>
        </div>
      </section>

      {/* Values */}
      {valueProps.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 py-20">
          <div className={`grid gap-6 ${valueProps.length >= 4 ? 'md:grid-cols-4' : valueProps.length === 3 ? 'md:grid-cols-3' : 'md:grid-cols-2'}`}>
            {valueProps.map((v, i) => (
              <AnimateOnScroll key={v.id} delay={i * 80}>
                <div className="bg-white p-6 rounded-3xl border border-green-100 h-full">
                  <div className="text-4xl mb-3">{v.icon}</div>
                  <h3 className="font-bold text-green-950 font-display text-lg mb-1.5">{v.title}</h3>
                  <p className="text-green-900/70 text-sm">{v.description}</p>
                </div>
              </AnimateOnScroll>
            ))}
          </div>
        </section>
      )}

      {/* Categories */}
      <section className="max-w-7xl mx-auto px-4 pb-16">
        <AnimateOnScroll>
          <div className="flex items-end justify-between mb-8">
            <div>
              <div className="text-green-700 text-sm font-bold tracking-widest uppercase mb-2">{info.sectionCategoriesEyebrow}</div>
              <h2 className="text-3xl md:text-4xl font-bold text-green-950 font-display">
                {info.sectionCategoriesTitle}
              </h2>
            </div>
            <Link href="/products" className="hidden md:block text-green-700 font-semibold hover:underline">Tất cả →</Link>
          </div>
        </AnimateOnScroll>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {categories.map((c, i) => (
            <AnimateOnScroll key={c.id} delay={i * 50}>
              <Link
                href={`/danh-muc/${c.id}`}
                className="block bg-white rounded-2xl border border-green-100 p-5 text-center hover:shadow-lg hover:-translate-y-1 transition h-full"
              >
                <div className="text-4xl mb-2">{c.icon}</div>
                <div className="font-bold text-green-950">{c.name}</div>
                <div className="text-xs text-green-800/60 mt-1 line-clamp-2">{c.description}</div>
              </Link>
            </AnimateOnScroll>
          ))}
        </div>
      </section>

      {/* Featured products */}
      <section className="bg-green-50/60 py-20 texture-paper">
        <div className="max-w-7xl mx-auto px-4">
          <AnimateOnScroll>
            <div className="flex items-end justify-between mb-8">
              <div>
                <div className="text-green-700 text-sm font-bold tracking-widest uppercase mb-2">{info.sectionFeaturedEyebrow}</div>
                <h2 className="text-3xl md:text-4xl font-bold text-green-950 font-display">
                  {info.sectionFeaturedTitle}
                </h2>
              </div>
              <Link href="/products" className="hidden md:block text-green-700 font-semibold hover:underline">Xem tất cả →</Link>
            </div>
          </AnimateOnScroll>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {featured.map((p, i) => (
              <AnimateOnScroll key={p.id} delay={i * 60}>
                <ProductCard p={p} />
              </AnimateOnScroll>
            ))}
          </div>
        </div>
      </section>

      {/* Subscription box */}
      <section className="max-w-7xl mx-auto px-4 py-20">
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

      {/* Farmers */}
      <section className="max-w-7xl mx-auto px-4 pb-20">
        <AnimateOnScroll>
          <div className="flex items-end justify-between mb-8">
            <div>
              <div className="text-green-700 text-sm font-bold tracking-widest uppercase mb-2">{info.sectionFarmersEyebrow}</div>
              <h2 className="text-3xl md:text-4xl font-bold text-green-950 font-display">
                {info.sectionFarmersTitle}
              </h2>
            </div>
            <Link href="/farmers" className="hidden md:block text-green-700 font-semibold hover:underline">Toàn bộ →</Link>
          </div>
        </AnimateOnScroll>
        <div className="grid md:grid-cols-3 gap-6">
          {topFarmers.map((f, i) => (
            <AnimateOnScroll key={f.id} delay={i * 80}>
              <FarmerCard f={f} />
            </AnimateOnScroll>
          ))}
        </div>
      </section>

      {/* Testimonials */}
      <section className="bg-green-50/60 py-20 texture-paper">
        <div className="max-w-7xl mx-auto px-4">
          <AnimateOnScroll>
            <h2 className="text-3xl md:text-4xl font-bold text-green-950 font-display text-center mb-12">
              {info.sectionTestimonialsTitle}
            </h2>
          </AnimateOnScroll>
          <div className="grid md:grid-cols-2 lg:grid-cols-5 gap-4">
            {testimonials.map((t, i) => (
              <AnimateOnScroll key={i} delay={i * 60} className={i === 0 ? "lg:col-span-2" : ""}>
                <div className="bg-white rounded-2xl border border-green-100 p-5 h-full flex flex-col">
                  <div className="text-amber-500 text-sm mb-2">★★★★★</div>
                  <p className="text-green-900/80 flex-1 italic leading-relaxed">&ldquo;{t.content}&rdquo;</p>
                  <div className="flex items-center gap-3 mt-4 pt-4 border-t border-green-100">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={t.avatar} alt={t.name} className="w-10 h-10 rounded-full object-cover" />
                    <div>
                      <div className="font-bold text-green-950 text-sm">{t.name}</div>
                      <div className="text-xs text-green-900/60">{t.role}</div>
                    </div>
                  </div>
                </div>
              </AnimateOnScroll>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="max-w-3xl mx-auto px-4 py-20">
        <AnimateOnScroll>
          <h2 className="text-3xl md:text-4xl font-bold text-green-950 font-display text-center mb-3">
            {info.sectionFaqTitle}
          </h2>
          <p className="text-center text-green-900/70 mb-10">Còn thắc mắc? Gọi {info.phone} để trò chuyện với chúng tôi.</p>
        </AnimateOnScroll>
        <FAQ items={faqItems} />
      </section>
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
