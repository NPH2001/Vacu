'use client';
import { useActionState, useState } from 'react';
import { saveTheme, resetTheme, type ThemeFormState } from '@/app/admin/actions/theme';
import {
  generateThemeCss, BODY_FONTS, HEADING_FONTS, RADIUS_MIN, RADIUS_MAX, type ThemeConfig,
} from '@/lib/theme';

export default function ThemeForm({ defaults }: { defaults: ThemeConfig }) {
  const [brandColor, setBrand] = useState(defaults.brandColor);
  const [accentColor, setAccent] = useState(defaults.accentColor);
  const [radiusScale, setRadius] = useState(defaults.radiusScale);
  const [fontBody, setFontBody] = useState(defaults.fontBody);
  const [fontHeading, setFontHeading] = useState(defaults.fontHeading);
  const [state, formAction, pending] = useActionState<ThemeFormState, FormData>(saveTheme, null);

  const cfg: ThemeConfig = { brandColor, accentColor, radiusScale, fontBody, fontHeading };
  const previewCss = generateThemeCss(cfg, '.theme-preview');

  return (
    <div className="grid lg:grid-cols-[360px_1fr] gap-5 items-start">
      {/* Scoped preview variables — same generator the live site uses. */}
      <style dangerouslySetInnerHTML={{ __html: previewCss }} />

      <form action={formAction} className="admin-panel p-5 space-y-5">
        <input type="hidden" name="brandColor" value={brandColor} />
        <input type="hidden" name="accentColor" value={accentColor} />
        <input type="hidden" name="radiusScale" value={radiusScale} />
        <input type="hidden" name="fontBody" value={fontBody} />
        <input type="hidden" name="fontHeading" value={fontHeading} />

        <ColorField label="Màu thương hiệu" hint="Màu chính — nút, hero, tiêu đề, viền."
          value={brandColor} onChange={setBrand} />
        <ColorField label="Màu nhấn" hint="Nút phụ, huy hiệu, sao đánh giá."
          value={accentColor} onChange={setAccent} />

        <label className="block">
          <span className="text-[13px] font-medium text-stone-900">Bo góc</span>
          <span className="block text-[11.5px] text-stone-500 mb-1">Vuông ← → bo tròn nhiều</span>
          <div className="flex items-center gap-3">
            <input type="range" min={RADIUS_MIN} max={RADIUS_MAX} step={0.1} value={radiusScale}
              onChange={(e) => setRadius(Number(e.target.value))} className="flex-1" />
            <span className="tabular-nums text-[12px] text-stone-500 w-10 text-right">{radiusScale.toFixed(1)}×</span>
          </div>
        </label>

        <FontSelect label="Font tiêu đề" value={fontHeading} onChange={setFontHeading} options={HEADING_FONTS} />
        <FontSelect label="Font nội dung" value={fontBody} onChange={setFontBody} options={BODY_FONTS} />

        {state?.error && <p role="alert" className="text-sm text-red-700">{state.error}</p>}
        {state?.ok && <p className="text-sm text-green-700">✓ Đã lưu — toàn site đã đổi theo.</p>}

        <div className="flex items-center gap-2 pt-1">
          <button type="submit" disabled={pending}
            className="admin-btn-primary disabled:opacity-60 flex-1 justify-center">
            {pending ? 'Đang lưu…' : 'Lưu giao diện'}
          </button>
        </div>
        <button type="submit" formAction={resetTheme}
          className="admin-btn-ghost text-[12.5px] w-full justify-center">
          Khôi phục mặc định
        </button>
      </form>

      {/* Live preview: sample public UI that reads the scoped variables. */}
      <div className="theme-preview font-sans admin-panel overflow-hidden">
        <div className="relative bg-green-950 text-white p-8">
          <div className="absolute inset-0 bg-gradient-to-br from-green-900/70 to-amber-900/30" />
          <div className="relative">
            <span className="inline-flex items-center gap-2 bg-white/15 px-3 py-1 rounded-full text-xs font-medium mb-4 border border-white/20">
              <span className="w-2 h-2 rounded-full bg-amber-300" /> Xem trước giao diện
            </span>
            <h2 className="font-display text-3xl md:text-4xl font-bold leading-tight mb-2">Rau sạch tận vườn</h2>
            <p className="text-green-50/80 mb-5 max-w-md">Kết nối trực tiếp với nông dân — không trung gian, giá nông dân.</p>
            <div className="flex flex-wrap gap-3">
              <button type="button" className="bg-amber-400 hover:bg-amber-500 text-green-950 font-bold px-6 py-3 rounded-full transition">Đi chợ ngay →</button>
              <button type="button" className="bg-white/10 hover:bg-white/20 text-white font-bold px-6 py-3 rounded-full border border-white/30 transition">Gặp bà con</button>
            </div>
          </div>
        </div>

        <div className="p-6 grid sm:grid-cols-2 gap-4 bg-green-50/40">
          <div className="bg-white rounded-2xl border border-green-100 p-5">
            <div className="text-3xl mb-2">🥬</div>
            <h3 className="font-display font-bold text-green-950 mb-1">Rau cải hữu cơ</h3>
            <p className="text-sm text-green-900/70 mb-3">Thu hoạch sáng nay, giao trong ngày.</p>
            <div className="flex items-center justify-between">
              <span className="font-bold text-green-800 text-lg">32.000₫</span>
              <button type="button" className="bg-green-700 hover:bg-green-800 text-white text-sm font-semibold px-4 py-2 rounded-full transition">Thêm</button>
            </div>
          </div>
          <div className="bg-white rounded-2xl border border-green-100 p-5">
            <div className="text-amber-500 mb-1">★★★★★</div>
            <p className="text-sm text-green-900/80 italic mb-3">&ldquo;Rau tươi, giao nhanh, cả nhà mê.&rdquo;</p>
            <span className="inline-block bg-green-100 text-green-800 text-xs font-semibold px-3 py-1 rounded-full">Khách quen</span>
          </div>
        </div>
      </div>
    </div>
  );
}

function ColorField({
  label, hint, value, onChange,
}: { label: string; hint: string; value: string; onChange: (v: string) => void }) {
  return (
    <div>
      <span className="text-[13px] font-medium text-stone-900">{label}</span>
      <span className="block text-[11.5px] text-stone-500 mb-1">{hint}</span>
      <div className="flex items-center gap-2">
        <input type="color" value={value} onChange={(e) => onChange(e.target.value)}
          className="h-9 w-12 rounded border border-stone-300 bg-white p-0.5 cursor-pointer" aria-label={label} />
        <input type="text" value={value} onChange={(e) => onChange(e.target.value)} spellCheck={false}
          className="w-32 admin-input text-sm font-mono" />
      </div>
    </div>
  );
}

function FontSelect({
  label, value, onChange, options,
}: { label: string; value: string; onChange: (v: string) => void; options: { key: string; label: string }[] }) {
  return (
    <label className="block">
      <span className="text-[13px] font-medium text-stone-900">{label}</span>
      <select value={value} onChange={(e) => onChange(e.target.value)}
        className="mt-1 w-full admin-input text-sm bg-white">
        {options.map((o) => <option key={o.key} value={o.key}>{o.label}</option>)}
      </select>
    </label>
  );
}
