'use client';
import Link from 'next/link';
import { useActionState } from 'react';
import ImageUpload from '@/components/admin/ImageUpload';
import SlugInput from '@/components/admin/SlugInput';
import type { FarmerFormState } from '@/app/admin/actions/farmers';
import type { FarmerRow } from '@/db/schema';

export default function FarmerForm({
  action, defaults, editing,
}: {
  action: (prev: FarmerFormState, fd: FormData) => Promise<FarmerFormState>;
  defaults?: Partial<FarmerRow>;
  editing: boolean;
}) {
  const [state, formAction, pending] = useActionState<FarmerFormState, FormData>(action, null);
  const d = defaults ?? {};
  return (
    <form action={formAction} className="space-y-4 bg-white rounded-2xl border border-green-100 p-6">
      <div className="grid md:grid-cols-2 gap-4">
        <L label="Slug (ID)" required>
          <SlugInput defaultValue={d.id ?? ''} editing={editing} />
        </L>
        <L label="Tên" required>
          <input name="name" defaultValue={d.name ?? ''} required className="w-full admin-input" />
        </L>
        <L label="Nông trại" required>
          <input name="farm" defaultValue={d.farm ?? ''} required className="w-full admin-input" />
        </L>
        <L label="Địa điểm" required>
          <input name="location" defaultValue={d.location ?? ''} required className="w-full admin-input" />
        </L>
        <L label="Năm kinh nghiệm" required>
          <input name="years" type="number" min="0" defaultValue={d.years ?? 0} required className="w-full admin-input" />
        </L>
        <L label="Chuyên môn" required>
          <input name="specialty" defaultValue={d.specialty ?? ''} required className="w-full admin-input" />
        </L>
      </div>
      <div className="grid md:grid-cols-2 gap-4">
        <ImageUpload name="avatar" defaultValue={d.avatar ?? ''} label="Avatar *" />
        <ImageUpload name="cover" defaultValue={d.cover ?? ''} label="Ảnh bìa *" />
      </div>
      <L label="Chứng nhận (phẩy ngăn cách)">
        <input name="certifications" defaultValue={(d.certifications ?? []).join(', ')}
          className="w-full admin-input" placeholder="PGS Việt Nam, VietGAP" />
      </L>
      <L label="Câu chuyện" required>
        <textarea name="story" defaultValue={d.story ?? ''} required rows={5} className="w-full admin-input" />
      </L>
      {state?.error && <p role="alert" className="text-sm text-red-600">{state.error}</p>}
      <div className="flex justify-end gap-3">
        <Link href="/admin/farmers" className="px-4 py-2 text-sm text-green-800 hover:underline">Hủy</Link>
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
