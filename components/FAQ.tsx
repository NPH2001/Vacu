"use client";

import { useState } from "react";

type Item = { q: string; a: string };

export default function FAQ({ items }: { items: Item[] }) {
  const [openIdx, setOpenIdx] = useState<number | null>(0);
  return (
    <div className="space-y-3">
      {items.map((it, i) => {
        const isOpen = openIdx === i;
        return (
          <div key={i} className="bg-white rounded-2xl border border-green-100 overflow-hidden">
            <button
              onClick={() => setOpenIdx(isOpen ? null : i)}
              className="w-full flex items-center justify-between p-5 text-left hover:bg-green-50/60 transition"
            >
              <span className="font-semibold text-green-950">{it.q}</span>
              <span className={`text-green-700 text-2xl transition-transform ${isOpen ? "rotate-45" : ""}`}>+</span>
            </button>
            {isOpen && <div className="px-5 pb-5 text-green-900/80 leading-relaxed">{it.a}</div>}
          </div>
        );
      })}
    </div>
  );
}
