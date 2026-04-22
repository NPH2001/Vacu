'use client';
import { useState } from 'react';

export default function ImageUpload({
  name, defaultValue, label,
}: { name: string; defaultValue?: string; label: string }) {
  const [url, setUrl] = useState(defaultValue ?? '');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function upload(file: File) {
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

  return (
    <div className="space-y-2">
      <label className="text-sm font-medium text-green-950">{label}</label>
      <input type="hidden" name={name} value={url} />
      <div className="flex items-start gap-4">
        {url && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={url} alt="" className="w-24 h-24 rounded-lg object-cover border border-green-100" />
        )}
        <div className="flex-1">
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp"
            disabled={busy}
            onChange={(e) => { const f = e.target.files?.[0]; if (f) upload(f); }}
            className="block text-sm"
          />
          <input
            type="text"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="hoặc dán URL"
            className="mt-2 w-full border border-green-200 rounded px-3 py-1.5 text-sm"
          />
          {busy && <p className="text-xs text-green-700 mt-1">Đang xử lý…</p>}
          {error && <p className="text-xs text-red-600 mt-1">{error}</p>}
        </div>
      </div>
    </div>
  );
}
