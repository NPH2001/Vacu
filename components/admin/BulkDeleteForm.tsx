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
  const [pending, start] = useTransition();
  const [count, setCount] = useState(0);

  return (
    <form
      ref={ref}
      action={action}
      onChange={() => {
        if (!ref.current) return;
        const fd = new FormData(ref.current);
        setCount(fd.getAll('ids').length);
      }}
      onSubmit={(e) => {
        e.preventDefault();
        if (!ref.current) return;
        const fd = new FormData(ref.current);
        const n = fd.getAll('ids').length;
        if (n === 0) { alert('Chưa chọn mục nào.'); return; }
        if (!confirm(`Xóa ${n} mục đã chọn?`)) return;
        start(() => action(fd));
      }}>
      <div className="flex justify-end pb-2">
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
