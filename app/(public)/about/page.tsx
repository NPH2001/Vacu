export const dynamic = 'force-dynamic';

import Link from "next/link";
import { getSiteInfo } from "@/lib/data";
import AnimateOnScroll from "@/components/AnimateOnScroll";

export default async function AboutPage() {
  const info = await getSiteInfo();
  return (
    <div>
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 -z-10">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={info.aboutHeroImage}
            alt=""
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-br from-green-950/90 to-green-900/60" />
        </div>
        <div className="max-w-4xl mx-auto px-4 py-20 text-white">
          <div className="text-amber-300 text-sm font-bold tracking-widest uppercase mb-2">{info.aboutHeroBadge}</div>
          <h1 className="text-4xl md:text-6xl font-bold font-display leading-tight">
            {info.aboutHeroTitle}
          </h1>
        </div>
      </section>

      {info.aboutStory.length > 0 && (
        <section className="max-w-3xl mx-auto px-4 py-16 text-green-900/90 text-lg leading-relaxed space-y-6">
          {info.aboutStory.map((p, i) => (
            <p key={i}>{p}</p>
          ))}
        </section>
      )}

      {info.aboutCommitments.length > 0 && (
        <section className="bg-green-50/60 py-16 texture-paper">
          <div className="max-w-5xl mx-auto px-4">
            <AnimateOnScroll>
              <h2 className="text-3xl md:text-4xl font-bold text-green-950 font-display text-center mb-12">{info.aboutCommitmentsTitle}</h2>
            </AnimateOnScroll>
            <div className={`grid gap-6 ${info.aboutCommitments.length >= 3 ? 'md:grid-cols-3' : 'md:grid-cols-2'}`}>
              {info.aboutCommitments.map((v) => (
                <div key={v.num} className="bg-white rounded-3xl p-7 border border-green-100">
                  <div className="text-amber-500 text-5xl font-display mb-2">{v.num}</div>
                  <h3 className="font-bold text-green-950 font-display text-xl mb-2">{v.title}</h3>
                  <p className="text-green-900/70">{v.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      <section className="max-w-7xl mx-auto px-4 py-16">
        <h2 className="text-3xl font-bold text-green-950 font-display text-center mb-10">{info.aboutStatsTitle}</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {[
            { value: info.statFarmers, label: "Hộ nông dân" },
            { value: info.statProducts, label: "Sản phẩm" },
            { value: info.statCustomers, label: "Gia đình tin dùng" },
            { value: info.statYears + " năm", label: "Cùng đồng hành" },
          ].map((s) => (
            <div key={s.label} className="bg-white rounded-3xl p-8 border border-green-100 text-center">
              <div className="text-4xl md:text-5xl font-bold text-green-800 font-display">{s.value}</div>
              <div className="text-sm text-green-900/60 uppercase tracking-wider mt-2">{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      <section className="max-w-5xl mx-auto px-4 pb-16">
        <div className="bg-gradient-to-br from-green-800 to-green-950 rounded-[2rem] p-10 md:p-14 text-center text-white">
          <h2 className="text-3xl md:text-4xl font-bold font-display mb-4">{info.aboutCtaTitle}</h2>
          <p className="text-green-100/80 max-w-lg mx-auto mb-8">
            {info.aboutCtaSubtitle}
          </p>
          <Link href="/farmers" className="inline-block bg-amber-400 hover:bg-amber-500 text-green-950 font-bold px-8 py-3.5 rounded-full transition">
            {info.aboutCtaLabel}
          </Link>
        </div>
      </section>
    </div>
  );
}
