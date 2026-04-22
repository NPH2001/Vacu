'use client';
import { useTransition } from 'react';

export default function DeleteButton({
  action, confirmText, label = 'Xóa',
}: {
  action: () => Promise<void>;
  confirmText: string;
  label?: string;
}) {
  const [pending, start] = useTransition();
  return (
    <button
      type="button"
      disabled={pending}
      onClick={() => {
        if (confirm(confirmText)) start(() => action());
      }}
      className="text-red-600 hover:underline disabled:opacity-50">
      {pending ? 'Đang xóa…' : label}
    </button>
  );
}
