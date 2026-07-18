'use client';
import { useState } from 'react';
import type { PublishMode } from '@/lib/publish-mode';

/** `datetime-local` needs local wall-clock time, but Date.toISOString() is UTC. */
function toLocalInputValue(d: Date): string {
  return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
}

/**
 * Presents three plain-language choices and maps them onto the two fields the
 * server understands (`status` + `publishedAt`). "Scheduled" isn't a stored
 * state — a published post with a future `publishedAt` simply isn't live yet.
 */
export default function PublishBox({
  initialMode, publishedAt, editing, pending, previewHref,
}: {
  initialMode: PublishMode;
  publishedAt: Date | null;
  editing: boolean;
  pending: boolean;
  previewHref?: string;
}) {
  const [mode, setMode] = useState<PublishMode>(initialMode);
  const [local, setLocal] = useState(publishedAt ? toLocalInputValue(publishedAt) : '');
  const [inPast, setInPast] = useState(false);

  // Clock reads live in handlers, where impurity is fine.
  function pickSchedule() {
    setMode('schedule');
    if (!local) {
      setLocal(toLocalInputValue(new Date(Date.now() + 3600_000)));
      setInPast(false);
    }
  }

  function changeLocal(v: string) {
    setLocal(v);
    const t = new Date(v).getTime();
    setInPast(Number.isFinite(t) && t <= Date.now());
  }

  // The server receives an absolute instant, so a scheduled time means the same
  // moment no matter what timezone the server runs in.
  const iso = (() => {
    if (mode === 'draft') return publishedAt ? publishedAt.toISOString() : '';
    if (mode === 'now') return '';
    const d = new Date(local);
    return Number.isNaN(d.getTime()) ? '' : d.toISOString();
  })();

  return (
    <div className="admin-panel p-4 space-y-3">
      <h3 className="font-display text-[15px] text-stone-900">Đăng bài</h3>

      <input type="hidden" name="status" value={mode === 'draft' ? 'draft' : 'published'} />
      <input type="hidden" name="publishedAt" value={iso} />

      <div className="space-y-1.5">
        <Choice checked={mode === 'draft'} onChange={() => setMode('draft')}
          label="Lưu nháp" hint="Chỉ mình bạn thấy. Khách vào web không thấy bài này." />
        <Choice checked={mode === 'now'} onChange={() => setMode('now')}
          label="Đăng ngay" hint="Bài hiện lên web ngay khi bấm lưu." />
        <Choice checked={mode === 'schedule'} onChange={pickSchedule}
          label="Hẹn giờ đăng" hint="Bài tự động hiện lên vào đúng giờ bạn chọn." />
      </div>

      {mode === 'schedule' && (
        <div className="pl-6 space-y-1">
          <input
            type="datetime-local"
            value={local}
            onChange={(e) => changeLocal(e.target.value)}
            className="w-full border border-stone-300 rounded px-2.5 py-1.5 text-sm"
          />
          {inPast && (
            <p className="text-[12px] text-amber-700">
              ⚠ Giờ này đã trôi qua — bài sẽ hiện lên ngay khi lưu.
            </p>
          )}
        </div>
      )}

      <div className="pt-2 border-t border-stone-200 flex items-center gap-2">
        <button type="submit" disabled={pending}
          className="admin-btn-primary disabled:opacity-60 flex-1 justify-center">
          {pending ? 'Đang lưu…' : editing ? 'Cập nhật' : 'Lưu bài'}
        </button>
        {editing && previewHref && (
          <a href={previewHref} target="_blank" rel="noopener noreferrer"
            className="admin-btn-ghost text-[12.5px] shrink-0" title="Mở bài viết trong tab mới">
            Xem thử ↗
          </a>
        )}
      </div>
    </div>
  );
}

function Choice({
  checked, onChange, label, hint,
}: { checked: boolean; onChange: () => void; label: string; hint: string }) {
  return (
    <label className="flex gap-2 cursor-pointer">
      <input type="radio" checked={checked} onChange={onChange} className="mt-1 accent-green-700" />
      <span className="leading-tight">
        <span className="text-[13.5px] font-medium text-stone-900">{label}</span>
        <span className="block text-[11.5px] text-stone-500">{hint}</span>
      </span>
    </label>
  );
}
