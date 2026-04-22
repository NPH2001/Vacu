import Link from "next/link";
import type { FarmerRow } from "@/db/schema";

export default function FarmerCard({ f }: { f: FarmerRow }) {
  return (
    <Link
      href={`/farmers/${f.id}`}
      className="group relative block rounded-3xl overflow-hidden border border-green-100 bg-white hover:shadow-xl transition"
    >
      <div className="relative aspect-[4/3] overflow-hidden">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={f.cover} alt={f.farm} className="w-full h-full object-cover group-hover:scale-105 transition duration-500" />
        <div className="absolute inset-0 bg-gradient-to-t from-green-950/80 via-green-950/20 to-transparent" />
        <div className="absolute bottom-4 left-4 right-4 flex items-end gap-3 text-white">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={f.avatar} alt={f.name} className="w-14 h-14 rounded-full border-2 border-white object-cover" />
          <div className="min-w-0">
            <div className="text-xs text-green-200">{f.years} năm kinh nghiệm</div>
            <div className="font-bold font-display text-lg truncate">{f.name}</div>
          </div>
        </div>
      </div>
      <div className="p-5">
        <div className="text-green-700 text-sm">📍 {f.location}</div>
        <div className="font-bold text-green-950 mt-1">{f.farm}</div>
        <p className="text-sm text-green-900/70 mt-2 line-clamp-2">{f.story}</p>
        <div className="flex flex-wrap gap-1.5 mt-3">
          {f.certifications.map((c) => (
            <span key={c} className="text-[10px] font-semibold bg-green-50 text-green-800 px-2 py-1 rounded-full border border-green-200">
              ✓ {c}
            </span>
          ))}
        </div>
      </div>
    </Link>
  );
}
