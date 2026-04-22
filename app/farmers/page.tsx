import { farmers } from "@/lib/data";
import FarmerCard from "@/components/FarmerCard";
import AnimateOnScroll from "@/components/AnimateOnScroll";

export default function FarmersPage() {
  return (
    <div>
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 -z-10">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/farm/1464226184884-fa280b87c399.jpg"
            alt=""
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-br from-green-950/85 to-green-800/60" />
        </div>
        <div className="max-w-7xl mx-auto px-4 py-20 text-white">
          <div className="text-amber-300 text-sm font-bold tracking-widest uppercase mb-2">Hậu phương</div>
          <h1 className="text-4xl md:text-5xl font-bold font-display mb-4 max-w-2xl">
            Những người âm thầm trồng rau cho bạn
          </h1>
          <p className="text-green-100/90 max-w-xl text-lg">
            {farmers.length} bà con nông dân từ Đà Lạt, Mộc Châu, Đắk Lắk, Hà Giang. Mỗi cọng rau là một câu chuyện.
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
