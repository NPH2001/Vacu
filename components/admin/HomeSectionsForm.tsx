'use client';
import Link from 'next/link';
import { useActionState, useState } from 'react';
import { HOME_SECTIONS, type HomeSectionKey, type HomeSectionState } from '@/lib/home-sections';
import type { HomeSectionsFormState } from '@/app/admin/actions/home-sections';

export default function HomeSectionsForm({
  action, defaultValue,
}: {
  action: (prev: HomeSectionsFormState, fd: FormData) => Promise<HomeSectionsFormState>;
  defaultValue: HomeSectionState[];
}) {
  const [state, formAction, pending] = useActionState<HomeSectionsFormState, FormData>(action, null);
  const [items, setItems] = useState<HomeSectionState[]>(defaultValue);

  function move(i: number, to: number) {
    if (to < 0 || to >= items.length) return;
    const next = [...items];
    const [item] = next.splice(i, 1);
    next.splice(to, 0, item);
    setItems(next);
  }

  const hiddenCount = items.filter((i) => !i.visible).length;

  return (
    <form action={formAction} className="space-y-4 max-w-3xl">
      <input type="hidden" name="sections" value={JSON.stringify(items)} />

      <div className="space-y-2">
        {items.map((s, i) => {
          const meta = HOME_SECTIONS[s.key as HomeSectionKey];
          return (
            <div key={s.key}
              className={`admin-panel p-3 flex items-center gap-3 ${s.visible ? '' : 'opacity-60'}`}>
              <span className="text-stone-300 text-[12px] font-mono w-5 text-center tabular-nums">{i + 1}</span>

              <div className="flex-1 min-w-0">
                <div className="text-[13.5px] font-medium text-stone-900">{meta.name}</div>
                <div className="text-[11.5px] text-stone-500">{meta.hint}</div>
              </div>

              <button type="button" onClick={() => move(i, i - 1)} disabled={i === 0}
                title="Chuyển lên trên" className="admin-btn-ghost px-2 disabled:opacity-25">↑</button>
              <button type="button" onClick={() => move(i, i + 1)} disabled={i === items.length - 1}
                title="Chuyển xuống dưới" className="admin-btn-ghost px-2 disabled:opacity-25">↓</button>
              <button type="button"
                onClick={() => setItems(items.map((x, idx) => (idx === i ? { ...x, visible: !x.visible } : x)))}
                title={s.visible ? 'Đang hiện — bấm để ẩn' : 'Đang ẩn — bấm để hiện'}
                className={`text-[11.5px] px-2.5 py-1 rounded border w-14 ${
                  s.visible
                    ? 'bg-green-50 text-green-800 border-green-200'
                    : 'bg-stone-100 text-stone-500 border-stone-200'
                }`}>
                {s.visible ? 'Hiện' : 'Ẩn'}
              </button>
            </div>
          );
        })}
      </div>

      {state?.error && (
        <div className="admin-panel p-3 border-red-200 bg-red-50">
          <p className="text-sm text-red-700">{state.error}</p>
        </div>
      )}
      {state?.ok && (
        <div className="admin-panel p-3 border-green-200 bg-green-50">
          <p className="text-sm text-green-800">
            ✓ Đã lưu. <Link href="/" target="_blank" className="underline">Mở trang chủ để xem →</Link>
          </p>
        </div>
      )}

      <div className="flex items-center gap-3 pt-1">
        <button type="submit" disabled={pending} className="admin-btn-primary disabled:opacity-60">
          {pending ? 'Đang lưu…' : 'Lưu thay đổi'}
        </button>
        <span className="text-[12px] text-stone-500">
          {hiddenCount > 0 ? `${hiddenCount} khối đang ẩn khỏi trang chủ` : 'Tất cả khối đang hiện'}
        </span>
      </div>
    </form>
  );
}
