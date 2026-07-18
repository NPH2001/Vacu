'use client';
import { useRef, useState, useTransition } from 'react';

export default function BulkDeleteForm({
  action, children, label = 'Xóa các mục đã chọn',
}: {
  action: (fd: FormData) => Promise<void>;
  children: React.ReactNode;
  label?: string;
}) {
  const ref = useRef<HTMLFormElement>(null);
  const selectAllRef = useRef<HTMLInputElement>(null);
  const [pending, start] = useTransition();
  const [count, setCount] = useState(0);

  // Keep the count and the select-all checkbox's checked/indeterminate state in
  // sync with the row checkboxes, whichever the user toggled.
  function sync() {
    if (!ref.current) return;
    const boxes = ref.current.querySelectorAll<HTMLInputElement>('input[name="ids"]');
    const checked = [...boxes].filter((b) => b.checked).length;
    setCount(checked);
    if (selectAllRef.current) {
      selectAllRef.current.checked = checked > 0 && checked === boxes.length;
      selectAllRef.current.indeterminate = checked > 0 && checked < boxes.length;
    }
  }

  function toggleAll(on: boolean) {
    if (!ref.current) return;
    ref.current.querySelectorAll<HTMLInputElement>('input[name="ids"]').forEach((b) => { b.checked = on; });
    sync();
  }

  return (
    <form
      ref={ref}
      action={action}
      onChange={sync}
      onSubmit={(e) => {
        e.preventDefault();
        if (!ref.current) return;
        const fd = new FormData(ref.current);
        const n = fd.getAll('ids').length;
        if (n === 0) { alert('Chưa chọn mục nào.'); return; }
        if (!confirm(`Xóa ${n} mục đã chọn?`)) return;
        start(() => action(fd));
      }}>
      <div className="flex items-center justify-between pb-2">
        <label className="flex items-center gap-2 text-[13px] text-stone-600 cursor-pointer select-none">
          <input
            ref={selectAllRef}
            type="checkbox"
            aria-label="Chọn tất cả trên trang này"
            onChange={(e) => toggleAll(e.target.checked)}
            className="w-4 h-4 accent-green-700"
          />
          Chọn tất cả
        </label>
        <button
          type="submit"
          disabled={pending || count === 0}
          className="text-sm px-3 py-1.5 rounded-full border border-red-200 text-red-700 hover:bg-red-50 disabled:opacity-40 disabled:hover:bg-white">
          {pending ? 'Đang xóa…' : `${label}${count ? ` (${count})` : ''}`}
        </button>
      </div>
      {children}
    </form>
  );
}
