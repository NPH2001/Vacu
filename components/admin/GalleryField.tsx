'use client';
import { useState } from 'react';
import MediaPicker from '@/components/admin/MediaPicker';

type Props = {
  /**
   * Uncontrolled: submits the list as repeated fields under this name, in
   * order, so the server can replace the whole set without diffing. Omit it in
   * controlled mode, where the parent serializes the value itself.
   */
  name?: string;
  defaultValue?: string[];
  /** Controlled mode — pass with onChange (the page builder does). */
  value?: string[];
  onChange?: (urls: string[]) => void;
  pickerTitle?: string;
  emptyTitle?: string;
  emptyHint?: string;
};

/**
 * Image list with reordering, shared by the product form (uncontrolled, posts
 * hidden fields) and the page builder's gallery block (controlled, serialized
 * into the block JSON).
 */
export default function GalleryField({
  name = 'gallery', defaultValue = [], value, onChange,
  pickerTitle = 'Chọn ảnh phụ cho sản phẩm',
  emptyTitle = 'Thêm ảnh phụ',
  emptyHint = 'Ảnh chụp thêm góc khác, khách xem ở trang chi tiết',
}: Props) {
  const [internal, setInternal] = useState<string[]>(defaultValue);
  const [pickerOpen, setPickerOpen] = useState(false);

  const controlled = value !== undefined;
  const urls = controlled ? value : internal;

  function setUrls(next: string[]) {
    if (!controlled) setInternal(next);
    onChange?.(next);
  }

  function move(from: number, to: number) {
    if (to < 0 || to >= urls.length) return;
    const next = [...urls];
    const [item] = next.splice(from, 1);
    next.splice(to, 0, item);
    setUrls(next);
  }

  return (
    <div className="space-y-2">
      {!controlled && urls.map((u) => <input key={u} type="hidden" name={name} value={u} />)}

      {urls.length === 0 ? (
        <button type="button" onClick={() => setPickerOpen(true)}
          className="w-full border-2 border-dashed border-stone-300 rounded-xl p-5 text-center hover:border-green-400 hover:bg-green-50/40 transition">
          <div className="text-2xl mb-1">🖼️</div>
          <div className="text-[13px] font-medium text-stone-800">{emptyTitle}</div>
          <div className="text-[11.5px] text-stone-500 mt-0.5">{emptyHint}</div>
        </button>
      ) : (
        <>
          <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
            {urls.map((u, i) => (
              <div key={u} className="relative group aspect-square rounded-lg overflow-hidden ring-1 ring-stone-200">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={u} alt="" className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-black/55 opacity-0 group-hover:opacity-100 transition flex items-center justify-center gap-1">
                  <button type="button" onClick={() => move(i, i - 1)} disabled={i === 0}
                    title="Chuyển lên trước"
                    className="bg-white/90 hover:bg-white text-stone-900 w-6 h-6 rounded text-xs disabled:opacity-30">←</button>
                  <button type="button" onClick={() => move(i, i + 1)} disabled={i === urls.length - 1}
                    title="Chuyển ra sau"
                    className="bg-white/90 hover:bg-white text-stone-900 w-6 h-6 rounded text-xs disabled:opacity-30">→</button>
                  <button type="button" onClick={() => setUrls(urls.filter((x) => x !== u))}
                    title="Gỡ ảnh này"
                    className="bg-red-600 hover:bg-red-700 text-white w-6 h-6 rounded text-xs">✕</button>
                </div>
                <span className="absolute top-1 left-1 bg-black/60 text-white text-[10px] px-1.5 rounded">
                  {i + 1}
                </span>
              </div>
            ))}
          </div>
          <button type="button" onClick={() => setPickerOpen(true)}
            className="text-[12.5px] text-green-700 hover:text-green-900 font-medium underline underline-offset-2">
            + Thêm ảnh nữa
          </button>
        </>
      )}

      <MediaPicker
        open={pickerOpen}
        onClose={() => setPickerOpen(false)}
        multiple
        title={pickerTitle}
        onSelect={(picked) => {
          // Skip ones already in the gallery — a duplicate would render twice
          // and collide on the React key.
          setUrls([...urls, ...picked.filter((p) => !urls.includes(p))]);
        }}
      />
    </div>
  );
}
