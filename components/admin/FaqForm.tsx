'use client';
import Link from 'next/link';
import { useActionState } from 'react';
import type { FaqFormState } from '@/app/admin/actions/faq';
import type { FaqRow } from '@/db/schema';

export default function FaqForm({
  action, defaults, editing,
}: {
  action: (prev: FaqFormState, fd: FormData) => Promise<FaqFormState>;
  defaults?: Partial<FaqRow>;
  editing: boolean;
}) {
  const [state, formAction, pending] = useActionState<FaqFormState, FormData>(action, null);
  const d = defaults ?? {};
  return (
    <form action={formAction} className="space-y-4 bg-white rounded-2xl border border-green-100 p-6">
      <L label="Câu hỏi" required>
        <input name="question" defaultValue={d.question ?? ''} required
          className="w-full border border-green-200 rounded px-3 py-2" />
      </L>
      <L label="Câu trả lời" required>
        <textarea name="answer" defaultValue={d.answer ?? ''} required rows={5}
          className="w-full border border-green-200 rounded px-3 py-2" />
      </L>
      <L label="Thứ tự">
        <input name="sortOrder" type="number" defaultValue={d.sortOrder ?? 0}
          className="w-32 border border-green-200 rounded px-3 py-2" />
      </L>
      {state?.error && <p className="text-sm text-red-600">{state.error}</p>}
      <div className="flex justify-end gap-3">
        <Link href="/admin/faq" className="px-4 py-2 text-sm text-green-800 hover:underline">Hủy</Link>
        <button type="submit" disabled={pending}
          className="bg-green-700 hover:bg-green-800 disabled:opacity-60 text-white font-semibold px-5 py-2 rounded-full">
          {pending ? 'Đang lưu…' : editing ? 'Cập nhật' : 'Tạo mới'}
        </button>
      </div>
    </form>
  );
}

function L({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="text-sm font-medium text-green-950">{label}{required && <span className="text-red-500"> *</span>}</span>
      <div className="mt-1">{children}</div>
    </label>
  );
}
