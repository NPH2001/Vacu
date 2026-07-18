'use client';
import Link from 'next/link';
import { useActionState } from 'react';
import ImageUpload from '@/components/admin/ImageUpload';
import type { TestimonialFormState } from '@/app/admin/actions/testimonials';
import type { TestimonialRow } from '@/db/schema';

export default function TestimonialForm({
  action, defaults, editing,
}: {
  action: (prev: TestimonialFormState, fd: FormData) => Promise<TestimonialFormState>;
  defaults?: Partial<TestimonialRow>;
  editing: boolean;
}) {
  const [state, formAction, pending] = useActionState<TestimonialFormState, FormData>(action, null);
  const d = defaults ?? {};
  return (
    <form action={formAction} className="space-y-4 bg-white rounded-2xl border border-green-100 p-6">
      <div className="grid md:grid-cols-2 gap-4">
        <L label="Tên" required>
          <input name="name" defaultValue={d.name ?? ''} required className="w-full border border-green-200 rounded px-3 py-2" />
        </L>
        <L label="Vai trò / Mô tả ngắn" required>
          <input name="role" defaultValue={d.role ?? ''} required className="w-full border border-green-200 rounded px-3 py-2" />
        </L>
        <L label="Số sao">
          <select name="rating" defaultValue={String(d.rating ?? 5)}
            className="w-full border border-green-200 rounded px-3 py-2 bg-white">
            <option value="5">★★★★★ (5 sao)</option>
            <option value="4">★★★★ (4 sao)</option>
            <option value="3">★★★ (3 sao)</option>
            <option value="2">★★ (2 sao)</option>
            <option value="1">★ (1 sao)</option>
          </select>
        </L>
        <L label="Thứ tự">
          <input name="sortOrder" type="number" defaultValue={d.sortOrder ?? 0} className="w-full border border-green-200 rounded px-3 py-2" />
        </L>
      </div>
      <ImageUpload name="avatar" defaultValue={d.avatar ?? ''} label="Ảnh đại diện *" />
      <L label="Nội dung" required>
        <textarea name="content" defaultValue={d.content ?? ''} required rows={4}
          className="w-full border border-green-200 rounded px-3 py-2" />
      </L>
      {state?.error && <p className="text-sm text-red-600">{state.error}</p>}
      <div className="flex justify-end gap-3">
        <Link href="/admin/testimonials" className="px-4 py-2 text-sm text-green-800 hover:underline">Hủy</Link>
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
