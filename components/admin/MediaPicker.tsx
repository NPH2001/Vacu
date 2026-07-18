'use client';
import { useCallback, useEffect, useRef, useState } from 'react';
import type { MediaRow } from '@/db/schema';
import { uploadImage } from '@/lib/uploads-client';
import { ACCEPT_ATTR, MAX_UPLOAD_LABEL } from '@/lib/upload-limits';

type Props = {
  open: boolean;
  onClose: () => void;
  onSelect: (urls: string[]) => void;
  multiple?: boolean;
  title?: string;
};

export default function MediaPicker({ open, onClose, onSelect, multiple = false, title = 'Thư viện ảnh' }: Props) {
  const [rows, setRows] = useState<MediaRow[]>([]);
  const [q, setQ] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(false);
  const [picked, setPicked] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(0);
  const [dragging, setDragging] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const load = useCallback(async (search: string, p: number) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/media?q=${encodeURIComponent(search)}&page=${p}`);
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Không tải được thư viện');
      setRows(json.rows);
      setTotalPages(json.totalPages);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }, []);

  // Debounce search so typing doesn't fire a request per keystroke.
  useEffect(() => {
    if (!open) return;
    const t = setTimeout(() => load(q, page), q ? 250 : 0);
    return () => clearTimeout(t);
  }, [open, q, page, load]);

  // Drop the selection on the way out, so reopening never starts with a stale
  // pick from last time.
  const close = useCallback(() => {
    setPicked([]);
    onClose();
  }, [onClose]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') close(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, close]);

  async function uploadFiles(files: File[]) {
    const images = files.filter((f) => f.type.startsWith('image/'));
    if (images.length === 0) {
      setError('Chỉ chấp nhận ảnh (JPG, PNG, WebP).');
      return;
    }
    setError(null);
    setUploading(images.length);
    const uploaded: string[] = [];
    for (const file of images) {
      try {
        uploaded.push(await uploadImage(file));
      } catch (e) {
        // Keep going: one oversized file shouldn't abandon the rest of a batch.
        setError((e as Error).message);
      } finally {
        setUploading((n) => n - 1);
      }
    }
    if (uploaded.length) {
      setPicked((prev) => (multiple ? [...prev, ...uploaded] : uploaded.slice(-1)));
      setPage(1);
      await load(q, 1);
    }
  }

  function toggle(url: string) {
    setPicked((prev) =>
      multiple
        ? prev.includes(url) ? prev.filter((u) => u !== url) : [...prev, url]
        : [url],
    );
  }

  function confirm() {
    if (picked.length === 0) return;
    onSelect(picked);
    close();
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-[1px]" onClick={close} aria-hidden />

      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className="relative bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[85vh] flex flex-col overflow-hidden"
      >
        <div className="flex items-center gap-3 px-5 py-4 border-b border-green-100">
          <h2 className="font-display text-lg text-green-950 flex-1">{title}</h2>
          <input
            value={q}
            onChange={(e) => { setQ(e.target.value); setPage(1); }}
            placeholder="Tìm theo tên ảnh…"
            className="border border-green-200 rounded-full px-4 py-1.5 text-sm w-56"
          />
          <button type="button" onClick={close} aria-label="Đóng"
            className="text-green-900/50 hover:text-green-950 text-xl leading-none w-8 h-8 rounded-full hover:bg-green-50">
            ✕
          </button>
        </div>

        <div
          onDragEnter={(e) => { e.preventDefault(); setDragging(true); }}
          onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDragging(false);
            uploadFiles(Array.from(e.dataTransfer.files ?? []));
          }}
          className={`flex-1 overflow-y-auto p-5 transition ${dragging ? 'bg-green-50 ring-2 ring-inset ring-green-500' : ''}`}
        >
          <div className="flex items-center gap-3 mb-4">
            <button type="button" onClick={() => fileRef.current?.click()} disabled={uploading > 0}
              className="bg-green-700 hover:bg-green-800 disabled:opacity-60 text-white text-sm font-semibold px-4 py-2 rounded-full">
              {uploading > 0 ? `Đang tải lên ${uploading} ảnh…` : '↑ Tải ảnh mới'}
            </button>
            <span className="text-xs text-green-900/60">
              Hoặc kéo thả ảnh vào đây · JPG, PNG, WebP · tối đa {MAX_UPLOAD_LABEL}
            </span>
            <input
              ref={fileRef}
              type="file"
              accept={ACCEPT_ATTR}
              multiple
              onChange={(e) => { uploadFiles(Array.from(e.target.files ?? [])); e.target.value = ''; }}
              className="sr-only"
            />
          </div>

          {error && <p className="text-sm text-red-600 mb-3">{error}</p>}

          {loading && rows.length === 0 ? (
            <p className="text-sm text-green-900/60 py-12 text-center">Đang tải…</p>
          ) : rows.length === 0 ? (
            <div className="py-12 text-center text-green-900/60">
              <div className="text-4xl mb-2">🖼️</div>
              <p className="text-sm">
                {q ? `Không tìm thấy ảnh nào khớp "${q}".` : 'Thư viện chưa có ảnh nào. Tải ảnh đầu tiên lên nhé.'}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3">
              {rows.map((m) => {
                const sel = picked.includes(m.url);
                const idx = picked.indexOf(m.url);
                return (
                  <button
                    type="button"
                    key={m.id}
                    onClick={() => toggle(m.url)}
                    title={m.filename}
                    className={`relative aspect-square rounded-xl overflow-hidden border-2 transition ${
                      sel ? 'border-green-600 ring-2 ring-green-200' : 'border-green-100 hover:border-green-300'
                    }`}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={m.url} alt={m.alt || m.filename} loading="lazy" className="w-full h-full object-cover" />
                    {sel && (
                      <span className="absolute top-1.5 right-1.5 bg-green-600 text-white text-[11px] font-bold w-5 h-5 rounded-full flex items-center justify-center shadow">
                        {multiple ? idx + 1 : '✓'}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          )}

          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 mt-5 text-sm">
              <button type="button" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}
                className="px-3 py-1 rounded-full border border-green-200 disabled:opacity-40 hover:bg-green-50">
                ← Trước
              </button>
              <span className="text-green-900/60">Trang {page}/{totalPages}</span>
              <button type="button" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}
                className="px-3 py-1 rounded-full border border-green-200 disabled:opacity-40 hover:bg-green-50">
                Sau →
              </button>
            </div>
          )}
        </div>

        <div className="flex items-center gap-3 px-5 py-4 border-t border-green-100 bg-green-50/40">
          <span className="text-sm text-green-900/70 flex-1">
            {picked.length > 0 ? `Đã chọn ${picked.length} ảnh` : 'Bấm vào ảnh để chọn'}
          </span>
          <button type="button" onClick={close} className="px-4 py-2 text-sm text-green-800 hover:underline">
            Hủy
          </button>
          <button type="button" onClick={confirm} disabled={picked.length === 0}
            className="bg-green-700 hover:bg-green-800 disabled:opacity-40 text-white font-semibold px-5 py-2 rounded-full text-sm">
            Dùng ảnh này
          </button>
        </div>
      </div>
    </div>
  );
}
