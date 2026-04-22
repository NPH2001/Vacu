'use client';
import { useActionState } from 'react';
import type { SettingsFormState } from '@/app/admin/actions/settings';
import type { SiteInfoRow } from '@/db/schema';

export default function SettingsForm({
  action, defaults,
}: {
  action: (prev: SettingsFormState, fd: FormData) => Promise<SettingsFormState>;
  defaults: SiteInfoRow;
}) {
  const [state, formAction, pending] = useActionState<SettingsFormState, FormData>(action, null);
  const d = defaults;
  return (
    <form action={formAction} className="space-y-5 bg-white rounded-2xl border border-green-100 p-6">
      <section>
        <h2 className="font-bold text-green-950 mb-3">Thương hiệu</h2>
        <div className="grid md:grid-cols-2 gap-4">
          <L label="Tên đầy đủ" required><input name="name" defaultValue={d.name} required className={inputCls} /></L>
          <L label="Tên ngắn" required><input name="shortName" defaultValue={d.shortName} required className={inputCls} /></L>
          <L label="Tagline" required><input name="tagline" defaultValue={d.tagline} required className={inputCls} /></L>
        </div>
        <div className="mt-4">
          <L label="Mô tả" required>
            <textarea name="description" defaultValue={d.description} required rows={3} className={inputCls} />
          </L>
        </div>
      </section>

      <section>
        <h2 className="font-bold text-green-950 mb-3">Liên hệ</h2>
        <div className="grid md:grid-cols-2 gap-4">
          <L label="Địa chỉ" required><input name="address" defaultValue={d.address} required className={inputCls} /></L>
          <L label="Điện thoại" required><input name="phone" defaultValue={d.phone} required className={inputCls} /></L>
          <L label="Email" required><input name="email" type="email" defaultValue={d.email} required className={inputCls} /></L>
          <L label="Giờ mở cửa" required><input name="hours" defaultValue={d.hours} required className={inputCls} /></L>
        </div>
      </section>

      <section>
        <h2 className="font-bold text-green-950 mb-3">Số liệu hiển thị</h2>
        <div className="grid md:grid-cols-4 gap-4">
          <L label="Nông dân" required><input name="statFarmers" defaultValue={d.statFarmers} required className={inputCls} /></L>
          <L label="Sản phẩm" required><input name="statProducts" defaultValue={d.statProducts} required className={inputCls} /></L>
          <L label="Khách hàng" required><input name="statCustomers" defaultValue={d.statCustomers} required className={inputCls} /></L>
          <L label="Năm hoạt động" required><input name="statYears" defaultValue={d.statYears} required className={inputCls} /></L>
        </div>
      </section>

      <div className="flex items-center justify-end gap-3 pt-2">
        {state?.ok && <span className="text-sm text-green-700">Đã lưu ✓</span>}
        {state?.error && <span className="text-sm text-red-600">{state.error}</span>}
        <button type="submit" disabled={pending}
          className="bg-green-700 hover:bg-green-800 disabled:opacity-60 text-white font-semibold px-5 py-2 rounded-full">
          {pending ? 'Đang lưu…' : 'Lưu thay đổi'}
        </button>
      </div>
    </form>
  );
}

const inputCls = 'w-full border border-green-200 rounded px-3 py-2';

function L({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="text-sm font-medium text-green-950">{label}{required && <span className="text-red-500"> *</span>}</span>
      <div className="mt-1">{children}</div>
    </label>
  );
}
