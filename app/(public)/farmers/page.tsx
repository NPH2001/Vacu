// Nonce-based CSP (proxy.ts) requires dynamic rendering, so this can't be ISR:
// a statically-cached page would ship scripts stamped with a stale nonce and the
// browser would block them. Rendered per-request; content is always fresh.
export const dynamic = 'force-dynamic';

import type { Metadata } from "next";
import { getAllFarmers, getSiteInfo } from "@/lib/data";
import { seoMeta } from "@/lib/seo";
import FarmerCard from "@/components/FarmerCard";
import AnimateOnScroll from "@/components/AnimateOnScroll";

export async function generateMetadata(): Promise<Metadata> {
  const info = await getSiteInfo();
  return seoMeta({
    title: `${info.farmersHeroTitle || "Nông dân"} — ${info.name}`,
    description: info.farmersHeroSubtitle?.replaceAll("{count}", "nhiều"),
    canonical: "/farmers",
  });
}

export default async function FarmersPage() {
  const [farmers, info] = await Promise.all([getAllFarmers(), getSiteInfo()]);
  return (
    <div>
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 -z-10">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={info.farmersHeroImage}
            alt=""
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-br from-green-950/85 to-green-800/60" />
        </div>
        <div className="max-w-7xl mx-auto px-4 py-20 text-white">
          <div className="text-amber-300 text-sm font-bold tracking-widest uppercase mb-2 wrap-anywhere">{info.farmersHeroEyebrow}</div>
          <h1 className="text-4xl md:text-5xl font-bold font-display mb-4 max-w-2xl wrap-anywhere">
            {info.farmersHeroTitle}
          </h1>
          <p className="text-green-100/90 max-w-xl text-lg wrap-anywhere">
            {info.farmersHeroSubtitle.replaceAll('{count}', String(farmers.length))}
          </p>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 py-16">
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {farmers.map((f, i) => (
            <AnimateOnScroll key={f.id} delay={i * 60}>
              <FarmerCard f={f} />
            </AnimateOnScroll>
          ))}
        </div>
      </div>
    </div>
  );
}
