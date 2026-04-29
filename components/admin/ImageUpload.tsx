'use client';
import { useEffect, useRef, useState } from 'react';

export default function ImageUpload({
  name, defaultValue, label, onChange,
}: { name: string; defaultValue?: string; label: string; onChange?: (url: string) => void }) {
  const [url, setUrl] = useState(defaultValue ?? '');
  useEffect(() => { onChange?.(url); }, [url, onChange]);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [dragging, setDragging] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  async function upload(file: File) {
    if (!file.type.startsWith('image/')) {
      setError('Chỉ chấp nhận ảnh (JPG, PNG, WebP).');
      return;
    }
    if (file.size > 4 * 1024 * 1024) {
      setError('File quá lớn (tối đa 4MB).');
      return;
    }
    setBusy(true); setError(null);
    try {
      const fd = new FormData();
      fd.set('file', file);
      const res = await fetch('/api/upload', { method: 'POST', body: fd });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Upload lỗi');
      setUrl(json.url);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const f = e.dataTransfer.files?.[0];
    if (f) upload(f);
  };

  return (
    <div className="space-y-2">
      <div className="text-sm font-medium text-green-950">{label}</div>
      <input type="hidden" name={name} value={url} />

      {url ? (
        <div className="relative inline-block group">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={url}
            alt=""
            className="w-40 h-40 rounded-xl object-cover border border-green-200 shadow-sm"
          />
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 rounded-xl transition flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100">
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              disabled={busy}
              className="bg-white text-green-900 text-xs font-semibold px-3 py-1.5 rounded-full shadow hover:bg-green-50"
            >
              Đổi ảnh
            </button>
            <button
              type="button"
              onClick={() => { setUrl(''); setError(null); }}
              className="bg-red-600 hover:bg-red-700 text-white text-xs font-semibold px-3 py-1.5 rounded-full shadow"
            >
              Gỡ
            </button>
          </div>
        </div>
      ) : (
        <label
          onDragEnter={(e) => { e.preventDefault(); setDragging(true); }}
          onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          onDrop={onDrop}
          className={`block w-full border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition ${
            busy
              ? 'border-green-300 bg-green-50/50'
              : dragging
                ? 'border-green-600 bg-green-50'
                : 'border-green-200 bg-green-50/30 hover:border-green-400 hover:bg-green-50/60'
          }`}
        >
          {busy ? (
            <div className="flex flex-col items-center gap-2 text-green-800">
              <svg className="w-8 h-8 animate-spin" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="12" r="9" stroke="currentColor" strokeOpacity="0.25" strokeWidth="3" />
                <path d="M12 3a9 9 0 0 1 9 9" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
              </svg>
              <span className="text-sm font-medium">Đang tải lên…</span>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-2 text-green-900/80">
              <div className="w-12 h-12 rounded-full bg-white border border-green-200 flex items-center justify-center text-2xl">
                📷
              </div>
              <div className="text-sm font-semibold text-green-950">
                Kéo thả ảnh vào đây, hoặc <span className="text-green-700 underline">bấm để chọn</span>
              </div>
              <div className="text-xs text-green-900/60">
                JPG · PNG · WebP (tối đa 4MB)
              </div>
            </div>
          )}
          <input
            ref={fileRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            disabled={busy}
            onChange={(e) => { const f = e.target.files?.[0]; if (f) upload(f); }}
            className="sr-only"
          />
        </label>
      )}

      {error && <p className="text-sm text-red-600">{error}</p>}
    </div>
  );
}
