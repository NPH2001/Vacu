import Link from "next/link";
import {
  categories,
  getFeaturedProducts,
  farmers,
  testimonials,
  info,
  faqItems,
} from "@/lib/data";
import ProductCard from "@/components/ProductCard";
import FarmerCard from "@/components/FarmerCard";
import AnimateOnScroll from "@/components/AnimateOnScroll";
import FAQ from "@/components/FAQ";

export default function HomePage() {
  const featured = getFeaturedProducts(8);
  const topFarmers = farmers.slice(0, 3);

  return (
    <div>
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 -z-10">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/farm/1500937386664-56d1dfef3854.jpg"
            alt=""
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-br from-green-950/80 via-green-900/60 to-amber-900/40" />
        </div>
        <div className="max-w-7xl mx-auto px-4 py-20 md:py-32 text-white">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 bg-white/15 backdrop-blur px-4 py-1.5 rounded-full text-sm font-medium mb-6 border border-white/20">
              <span className="w-2 h-2 rounded-full bg-amber-300" />
              Thu hoạch sáng nay — giao chiều nay
            </div>
            <h1 className="text-4xl md:text-6xl font-bold font-display mb-6 leading-[1.1]">
              {info.tagline}
            </h1>
            <p className="text-lg md:text-xl text-green-50/90 mb-10 max-w-xl">
              Kết nối trực tiếp với {info.stats.farmers} nông dân uy tín khắp Việt Nam. Không trung gian, không hóa chất, giá nông dân.
            </p>
            <div className="flex flex-wrap gap-3">
              <Link
                href="/products"
                className="bg-amber-400 hover:bg-amber-500 text-green-950 font-bold px-7 py-4 rounded-full transition"
              >
                Đi chợ nông trại →
              </Link>
              <Link
                href="/farmers"
                className="bg-white/10 hover:bg-white/20 backdrop-blur text-white font-bold px-7 py-4 rounded-full border border-white/30 transition"
              >
                Gặp bà con nông dân
              </Link>
            </div>
            <div className="flex flex-wrap items-center gap-8 mt-12 pt-8 border-t border-white/20">
              <Stat value={info.stats.farmers} label="Nông dân" />
              <Stat value={info.stats.products} label="Sản phẩm" />
              <Stat value={info.stats.customers} label="Gia đình tin dùng" />
              <Stat value={info.stats.years} label="Năm kinh nghiệm" />
            </div>
          </div>
        </div>
      </section>

      {/* Values */}
      <section className="max-w-7xl mx-auto px-4 py-20">
        <div className="grid md:grid-cols-4 gap-6">
          {[
            { icon: "🌱", title: "Hữu cơ chứng nhận", desc: "100% nông sản đạt PGS, VietGAP hoặc tương đương." },
            { icon: "👨‍🌾", title: "Từ tay nông dân", desc: "Mua trực tiếp, nông dân nhận cao hơn 30-40% giá chợ." },
            { icon: "⏱️", title: "Tươi trong 24h", desc: "Thu hoạch buổi sáng, giao trong ngày tại nội thành." },
            { icon: "🔁", title: "Cam kết hoàn tiền", desc: "Rau không tươi? Chụp ảnh và báo, hoàn 100% trong 24h." },
          ].map((v, i) => (
            <AnimateOnScroll key={i} delay={i * 80}>
              <div className="bg-white p-6 rounded-3xl border border-green-100 h-full">
                <div className="text-4xl mb-3">{v.icon}</div>
                <h3 className="font-bold text-green-950 font-display text-lg mb-1.5">{v.title}</h3>
                <p className="text-green-900/70 text-sm">{v.desc}</p>
              </div>
            </AnimateOnScroll>
          ))}
        </div>
      </section>

      {/* Categories */}
      <section className="max-w-7xl mx-auto px-4 pb-16">
        <AnimateOnScroll>
          <div className="flex items-end justify-between mb-8">
            <div>
              <div className="text-green-700 text-sm font-bold tracking-widest uppercase mb-2">Danh mục</div>
              <h2 className="text-3xl md:text-4xl font-bold text-green-950 font-display">
                Thứ gì bạn đang cần?
              </h2>
            </div>
            <Link href="/products" className="hidden md:block text-green-700 font-semibold hover:underline">Tất cả →</Link>
          </div>
        </AnimateOnScroll>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {categories.map((c, i) => (
            <AnimateOnScroll key={c.id} delay={i * 50}>
              <Link
                href={`/products?c=${c.id}`}
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
                <div className="text-green-700 text-sm font-bold tracking-widest uppercase mb-2">Nổi bật tuần này</div>
                <h2 className="text-3xl md:text-4xl font-bold text-green-950 font-display">
                  Mùa nào thức nấy
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
              TIẾT KIỆM 20%
            </div>
            <h2 className="text-3xl md:text-5xl font-bold font-display leading-tight mb-4">
              Hộp rau tuần <br /> cho gia đình bận rộn
            </h2>
            <p className="text-green-100/80 mb-6 max-w-md">
              8-10 loại rau củ theo mùa, được cô nông dân chọn tay mỗi tuần. Giao 2 lần/tuần ngay tại cửa nhà bạn.
            </p>
            <ul className="space-y-2 mb-8 text-green-100/90">
              <li>✓ Tự động gia hạn, hủy bất cứ lúc nào</li>
              <li>✓ Tùy chỉnh món không ăn</li>
              <li>✓ Tham quan nông trại miễn phí</li>
            </ul>
            <Link
              href="/products?c=hop-qua"
              className="bg-amber-400 hover:bg-amber-500 text-green-950 font-bold px-7 py-3.5 rounded-full transition w-fit"
            >
              Đăng ký hộp rau →
            </Link>
          </div>
          <div className="relative min-h-[320px]">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/farm/1610348725531-843dff563e2c.jpg"
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
              <div className="text-green-700 text-sm font-bold tracking-widest uppercase mb-2">Gặp bà con</div>
              <h2 className="text-3xl md:text-4xl font-bold text-green-950 font-display">
                Người trồng rau cho bạn
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
              28.000+ gia đình đã tin dùng
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
            Câu hỏi thường gặp
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
