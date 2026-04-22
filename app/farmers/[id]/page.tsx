import Link from "next/link";
import { notFound } from "next/navigation";
import { farmers, getProductsByFarmer } from "@/lib/data";
import ProductCard from "@/components/ProductCard";

type Params = Promise<{ id: string }>;

export default async function FarmerDetailPage({ params }: { params: Params }) {
  const { id } = await params;
  const f = farmers.find((x) => x.id === id);
  if (!f) notFound();

  const products = getProductsByFarmer(f.id);

  return (
    <div>
      <section className="relative h-[55vh] min-h-[420px] overflow-hidden">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={f.cover} alt={f.farm} className="absolute inset-0 w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-green-950 via-green-950/50 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 max-w-7xl mx-auto px-4 pb-10 text-white">
          <div className="flex items-end gap-5">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={f.avatar} alt={f.name} className="w-24 h-24 rounded-full border-4 border-white object-cover" />
            <div>
              <div className="text-amber-300 text-sm font-bold mb-1">📍 {f.location} · {f.years} năm</div>
              <h1 className="text-3xl md:text-5xl font-bold font-display">{f.name}</h1>
              <div className="text-green-100/80 mt-1">{f.farm} — {f.specialty}</div>
            </div>
          </div>
        </div>
      </section>

      <div className="max-w-4xl mx-auto px-4 py-14">
        <div className="flex flex-wrap gap-2 mb-6">
          {f.certifications.map((c) => (
            <span key={c} className="text-xs font-semibold bg-green-50 text-green-800 px-3 py-1.5 rounded-full border border-green-200">
              ✓ {c}
            </span>
          ))}
        </div>
        <div className="prose prose-green max-w-none">
          <h2 className="text-2xl md:text-3xl font-bold font-display text-green-950 mb-4">Câu chuyện nông trại</h2>
          <p className="text-green-900/80 text-lg leading-relaxed">{f.story}</p>
        </div>
      </div>

      {products.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 py-10 pb-20">
          <h2 className="text-2xl md:text-3xl font-bold text-green-950 font-display mb-6">
            Sản phẩm của {f.name.split(" ").slice(-2).join(" ")}
          </h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {products.map((p) => (
              <ProductCard key={p.id} p={p} />
            ))}
          </div>
        </section>
      )}

      <div className="max-w-7xl mx-auto px-4 pb-16">
        <Link href="/farmers" className="text-green-700 font-semibold hover:underline">← Về trang Nông dân</Link>
      </div>
    </div>
  );
}
