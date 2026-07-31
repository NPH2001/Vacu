'use client';
import Link from 'next/link';
import { useActionState } from 'react';
import ImageUpload from '@/components/admin/ImageUpload';
import type { CertificateFormState } from '@/app/admin/actions/certificates';
import type { CertificateRow } from '@/db/schema';

export default function CertificateForm({
  action, defaults, editing,
}: {
  action: (prev: CertificateFormState, fd: FormData) => Promise<CertificateFormState>;
  defaults?: Partial<CertificateRow>;
  editing: boolean;
}) {
  const [state, formAction, pending] = useActionState<CertificateFormState, FormData>(action, null);
  const d = defaults ?? {};
  return (
    <form action={formAction} className="space-y-4 bg-white rounded-2xl border border-green-100 p-6">
      <L label="Ảnh chứng nhận" required hint="Ảnh chụp hoặc bản scan giấy chứng nhận. Nên để ảnh dọc, rõ chữ — khách bấm vào sẽ xem được ảnh lớn.">
        <ImageUpload name="image" defaultValue={d.image ?? ''} label="" />
      </L>
      <L label="Tên chứng nhận" required hint="Ví dụ: Chứng nhận OCOP 4 sao">
        <input name="name" defaultValue={d.name ?? ''} required maxLength={160}
          className="w-full admin-input" />
      </L>
      <L label="Nơi cấp" hint="Ví dụ: UBND tỉnh Lâm Đồng. Bỏ trống thì ẩn.">
        <input name="issuer" defaultValue={d.issuer ?? ''} maxLength={160}
          className="w-full admin-input" />
      </L>
      <L label="Mô tả ngắn" hint="Hiện khi khách bấm phóng to ảnh. Bỏ trống thì ẩn.">
        <textarea name="description" defaultValue={d.description ?? ''} rows={3} maxLength={600}
          className="w-full admin-input" />
      </L>
      <L label="Thứ tự" hint="Số nhỏ hiện trước.">
        <input name="sortOrder" type="number" defaultValue={d.sortOrder ?? 0}
          className="w-32 admin-input" />
      </L>
      {state?.error && <p role="alert" className="text-sm text-red-600">{state.error}</p>}
      <div className="flex justify-end gap-3">
        <Link href="/admin/certificates" className="px-4 py-2 text-sm text-green-800 hover:underline">Hủy</Link>
        <button type="submit" disabled={pending}
          className="bg-green-700 hover:bg-green-800 disabled:opacity-60 text-white font-semibold px-5 py-2 rounded-full">
          {pending ? 'Đang lưu…' : editing ? 'Cập nhật' : 'Tạo mới'}
        </button>
      </div>
    </form>
  );
}

function L({ label, required, hint, children }: {
  label: string; required?: boolean; hint?: string; children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="text-sm font-medium text-green-950">{label}{required && <span className="text-red-500"> *</span>}</span>
      {hint && <span className="block text-[11.5px] text-stone-500 mt-0.5">{hint}</span>}
      <div className="mt-1">{children}</div>
    </label>
  );
}
