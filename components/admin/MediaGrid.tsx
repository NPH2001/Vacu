'use client';
import { useRouter } from 'next/navigation';
import { useRef, useState, useTransition } from 'react';
import Link from 'next/link';
import type { MediaRow } from '@/db/schema';
import { useModalA11y } from '@/components/useModalA11y';
import { deleteMedia, updateMediaAlt, getMediaUsage } from '@/app/admin/actions/media';
import type { MediaUsage } from '@/lib/media';
import { uploadImage } from '@/lib/uploads-client';
import { ACCEPT_ATTR, MAX_UPLOAD_LABEL } from '@/lib/upload-limits';
import { formatDate } from '@/lib/format';

function prettySize(bytes: number) {
  if (!bytes) return '—';
  return bytes >= 1024 * 1024
    ? `${(bytes / 1024 / 1024).toFixed(1)} MB`
    : `${Math.round(bytes / 1024)} KB`;
}

export default function MediaGrid({ rows }: { rows: MediaRow[] }) {
  const router = useRouter();
  const [active, setActive] = useState<MediaRow | null>(null);
  const [uploading, setUploading] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  async function uploadFiles(files: File[]) {
    const images = files.filter((f) => f.type.startsWith('image/'));
    if (images.length === 0) return;
    setError(null);
    setUploading(images.length);
    for (const file of images) {
      try {
        await uploadImage(file);
      } catch (e) {
        // Keep going: one oversized file shouldn't abandon the rest of a batch.
        setError((e as Error).message);
      } finally {
        setUploading((n) => n - 1);
      }
    }
    router.refresh();
  }

  return (
    <div
      onDragEnter={(e) => { e.preventDefault(); setDragging(true); }}
      onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
      onDragLeave={() => setDragging(false)}
      onDrop={(e) => {
        e.preventDefault();
        setDragging(false);
        uploadFiles(Array.from(e.dataTransfer.files ?? []));
      }}
      className={`rounded-2xl transition ${dragging ? 'ring-2 ring-green-500 bg-green-50/50' : ''}`}
    >
      <div className="flex items-center gap-3 mb-4">
        <button type="button" onClick={() => fileRef.current?.click()} disabled={uploading > 0}
          className="admin-btn-primary disabled:opacity-60">
          {uploading > 0 ? `Đang tải lên ${uploading} ảnh…` : '+ Tải ảnh lên'}
        </button>
        <span className="text-[12.5px] text-stone-500">
          Kéo thả nhiều ảnh vào trang này cũng được · JPG, PNG, WebP · tối đa {MAX_UPLOAD_LABEL}
        </span>
        <input ref={fileRef} type="file" accept={ACCEPT_ATTR} multiple
          onChange={(e) => { uploadFiles(Array.from(e.target.files ?? [])); e.target.value = ''; }}
          className="sr-only" />
      </div>

      {error && <p role="alert" className="text-sm text-red-600 mb-3">{error}</p>}

      {rows.length === 0 ? (
        <div className="admin-panel p-10 text-center">
          <div className="text-4xl mb-2">🖼️</div>
          <p className="text-sm text-stone-500">
            Chưa có ảnh nào. Tải ảnh lên đây một lần, rồi dùng lại ở mọi nơi: sản phẩm, bài viết, trang.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 lg:grid-cols-6 gap-3">
          {rows.map((m) => (
            <button type="button" key={m.id} onClick={() => setActive(m)}
              className="group relative aspect-square rounded-xl overflow-hidden ring-1 ring-stone-200 hover:ring-green-500 transition text-left">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={m.url} alt={m.alt || m.filename} loading="lazy" className="w-full h-full object-cover" />
              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent p-2 opacity-0 group-hover:opacity-100 transition">
                <div className="text-[11px] text-white truncate">{m.filename}</div>
              </div>
              {!m.alt && (
                <span title="Chưa có mô tả ảnh (ảnh hưởng SEO và người khiếm thị)"
                  className="absolute top-1.5 left-1.5 bg-amber-400 text-amber-950 text-[10px] font-bold px-1.5 py-0.5 rounded">
                  !
                </span>
              )}
            </button>
          ))}
        </div>
      )}

      {active && (
        <MediaDetail
          key={active.id}
          row={active}
          onClose={() => setActive(null)}
          onChanged={() => { setActive(null); router.refresh(); }}
        />
      )}
    </div>
  );
}

function MediaDetail({
  row, onClose, onChanged,
}: { row: MediaRow; onClose: () => void; onChanged: () => void }) {
  const [alt, setAlt] = useState(row.alt);
  const [usage, setUsage] = useState<MediaUsage[] | null>(null);
  const [msg, setMsg] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const [copied, setCopied] = useState(false);
  // Always mounted-when-open (the parent renders it only when a row is active),
  // so pass open=true: focus into the dialog, trap Tab, Escape closes, restore
  // focus on close. This dialog previously had no keyboard handling at all.
  const panelRef = useModalA11y<HTMLDivElement>(true, onClose);

  function save() {
    startTransition(async () => {
      const res = await updateMediaAlt(row.url, alt);
      setMsg(res?.ok ?? res?.error ?? null);
    });
  }

  function remove(force: boolean) {
    startTransition(async () => {
      const res = await deleteMedia(row.url, force);
      if (res.deleted) {
        onChanged();
      } else {
        // Still referenced — show where, and let the admin decide.
        setUsage(res.usage);
        setMsg(null);
      }
    });
  }

  function checkUsage() {
    startTransition(async () => setUsage(await getMediaUsage(row.url)));
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} aria-hidden />
      <div ref={panelRef} role="dialog" aria-modal="true" aria-label={row.filename}
        className="relative bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[85vh] overflow-y-auto">
        <div className="flex items-center px-5 py-4 border-b border-stone-200">
          <h2 className="font-display text-lg text-stone-900 flex-1 truncate">{row.filename}</h2>
          <button type="button" onClick={onClose} aria-label="Đóng"
            className="text-stone-400 hover:text-stone-900 text-xl w-8 h-8 rounded-full hover:bg-stone-100">✕</button>
        </div>

        <div className="grid md:grid-cols-2 gap-5 p-5">
          <div className="bg-stone-50 rounded-xl p-3 flex items-center justify-center">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={row.url} alt={row.alt || row.filename} className="max-h-72 rounded-lg object-contain" />
          </div>

          <div className="space-y-4">
            <dl className="text-[12.5px] text-stone-600 space-y-1">
              <div className="flex gap-2">
                <dt className="w-24 text-stone-400">Kích thước</dt>
                <dd>{row.width && row.height ? `${row.width} × ${row.height}px` : '—'} · {prettySize(row.size)}</dd>
              </div>
              <div className="flex gap-2">
                <dt className="w-24 text-stone-400">Tải lên</dt>
                <dd>{formatDate(row.createdAt)}</dd>
              </div>
              <div className="flex gap-2 items-center">
                <dt className="w-24 text-stone-400 shrink-0">Đường dẫn</dt>
                <dd className="flex items-center gap-2 min-w-0">
                  <code className="font-mono text-[11px] truncate">{row.url}</code>
                  <button type="button"
                    onClick={() => { navigator.clipboard.writeText(row.url); setCopied(true); setTimeout(() => setCopied(false), 1500); }}
                    className="text-[11px] text-green-700 hover:underline shrink-0">
                    {copied ? '✓ Đã chép' : 'Chép'}
                  </button>
                </dd>
              </div>
            </dl>

            <label className="block">
              <span className="text-sm font-medium text-stone-900">Mô tả ảnh (alt)</span>
              <span className="block text-xs text-stone-500 mt-0.5">
                Mô tả ngắn nội dung ảnh. Giúp Google hiểu ảnh và người khiếm thị nghe được.
              </span>
              <input value={alt} onChange={(e) => setAlt(e.target.value)}
                placeholder="Ví dụ: Rổ cà chua vừa hái tại vườn Đà Lạt"
                className="mt-1 w-full border border-stone-300 rounded px-3 py-2 text-sm" />
            </label>

            <div className="flex items-center gap-2">
              <button type="button" onClick={save} disabled={pending || alt === row.alt}
                className="admin-btn-primary disabled:opacity-50 text-sm">
                {pending ? 'Đang lưu…' : 'Lưu mô tả'}
              </button>
              {usage === null && (
                <button type="button" onClick={checkUsage} disabled={pending}
                  className="admin-btn-ghost text-sm">
                  Xem ảnh này dùng ở đâu
                </button>
              )}
            </div>

            {msg && <p className="text-sm text-green-700">{msg}</p>}

            {usage !== null && (
              <div className="rounded-xl border border-stone-200 p-3 bg-stone-50">
                {usage.length === 0 ? (
                  <p className="text-[12.5px] text-stone-600">
                    Ảnh này hiện <b>không được dùng ở đâu cả</b> — xóa an toàn.
                  </p>
                ) : (
                  <>
                    <p className="text-[12.5px] text-amber-900 font-medium mb-2">
                      ⚠ Đang được dùng ở {usage.length} nơi. Xóa sẽ làm mất ảnh tại:
                    </p>
                    <ul className="space-y-1 max-h-32 overflow-y-auto">
                      {usage.map((u, i) => (
                        <li key={i} className="text-[12.5px]">
                          <span className="text-stone-400">{u.kind}:</span>{' '}
                          <Link href={u.href} className="text-green-700 hover:underline">{u.label}</Link>
                        </li>
                      ))}
                    </ul>
                  </>
                )}
              </div>
            )}

            <div className="pt-2 border-t border-stone-200">
              {usage !== null && usage.length > 0 ? (
                <button type="button" onClick={() => remove(true)} disabled={pending}
                  className="text-sm text-red-600 hover:text-red-800 font-medium">
                  Vẫn xóa ảnh này
                </button>
              ) : (
                <button type="button" onClick={() => remove(false)} disabled={pending}
                  className="text-sm text-red-600 hover:text-red-800 font-medium">
                  {pending ? 'Đang xóa…' : 'Xóa ảnh'}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
