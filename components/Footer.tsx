import Link from "next/link";
import type { SiteInfoRow, CategoryRow } from "@/db/schema";

export default function Footer({ info, categories }: { info: SiteInfoRow; categories: CategoryRow[] }) {
  return (
    <footer className="bg-green-950 text-green-100 mt-24">
      <div className="max-w-7xl mx-auto px-4 py-14 grid md:grid-cols-4 gap-10">
        <div className="md:col-span-2">
          <h3 className="text-2xl font-bold text-green-300 mb-3 font-display flex items-center gap-2">
            <span>🌱</span> {info.name}
          </h3>
          <p className="text-green-200/80 max-w-md">{info.description}</p>
          <div className="flex gap-3 mt-5">
            {["FB", "IG", "YT", "TT"].map((s) => (
              <span key={s} className="w-10 h-10 rounded-full bg-green-900 text-green-200 flex items-center justify-center text-xs font-bold">{s}</span>
            ))}
          </div>
        </div>
        <div>
          <h4 className="font-semibold mb-3 text-white font-display">Danh mục</h4>
          <ul className="text-sm space-y-2 text-green-200/80">
            {categories.slice(0, 5).map((c) => (
              <li key={c.id}>
                <Link href={`/products?c=${c.id}`} className="hover:text-white">
                  {c.icon} {c.name}
                </Link>
              </li>
            ))}
          </ul>
        </div>
        <div>
          <h4 className="font-semibold mb-3 text-white font-display">Liên hệ</h4>
          <ul className="text-sm space-y-2 text-green-200/80">
            <li>📍 {info.address}</li>
            <li>📞 {info.phone}</li>
            <li>✉️ {info.email}</li>
            <li>🕒 {info.hours}</li>
          </ul>
        </div>
      </div>
      <div className="border-t border-green-900 py-5 text-center text-xs text-green-300/60">
        © {new Date().getFullYear()} {info.name} — Rau sạch, lòng sạch.
      </div>
    </footer>
  );
}
