'use client';
import Link from 'next/link';
import { useActionState } from 'react';
import type { ContactTopicFormState } from '@/app/admin/actions/contact-topics';
import type { ContactTopicRow } from '@/db/schema';

export default function ContactTopicForm({
  action, defaults, editing,
}: {
  action: (prev: ContactTopicFormState, fd: FormData) => Promise<ContactTopicFormState>;
  defaults?: Partial<ContactTopicRow>;
  editing: boolean;
}) {
  const [state, formAction, pending] = useActionState<ContactTopicFormState, FormData>(action, null);
  const d = defaults ?? {};
  return (
    <form action={formAction} className="space-y-4 bg-white rounded-2xl border border-green-100 p-6">
      <L label="Nhãn chủ đề" required>
        <input name="label" defaultValue={d.label ?? ''} required
          className="w-full border border-green-200 rounded px-3 py-2"
          placeholder="VD: Hợp tác nông dân" />
      </L>
      <L label="Thứ tự">
        <input name="sortOrder" type="number" defaultValue={d.sortOrder ?? 0}
          className="w-32 border border-green-200 rounded px-3 py-2" />
      </L>
      {state?.error && <p role="alert" className="text-sm text-red-600">{state.error}</p>}
      <div className="flex justify-end gap-3">
        <Link href="/admin/contact-topics" className="px-4 py-2 text-sm text-green-800 hover:underline">Hủy</Link>
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
