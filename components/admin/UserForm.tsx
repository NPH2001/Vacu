'use client';
import Link from 'next/link';
import { useActionState } from 'react';
import type { UserFormState } from '@/app/admin/actions/users';
import type { UserRow } from '@/db/schema';

export default function UserForm({
  action, defaults, editing,
}: {
  action: (prev: UserFormState, fd: FormData) => Promise<UserFormState>;
  defaults?: Partial<UserRow>;
  editing: boolean;
}) {
  const [state, formAction, pending] = useActionState<UserFormState, FormData>(action, null);
  const d = defaults ?? {};
  return (
    <form action={formAction} className="space-y-4 bg-white rounded-2xl border border-green-100 p-6">
      <div className="grid md:grid-cols-2 gap-4">
        <L label="Email" required>
          <input name="email" type="email" defaultValue={d.email ?? ''} required
            className="w-full border border-green-200 rounded px-3 py-2" />
        </L>
        <L label="Tên" required>
          <input name="name" defaultValue={d.name ?? ''} required
            className="w-full border border-green-200 rounded px-3 py-2" />
        </L>
        <L label="Vai trò" required>
          <select name="role" defaultValue={d.role ?? 'staff'} required
            className="w-full border border-green-200 rounded px-3 py-2 bg-white">
            <option value="staff">Nhân viên (staff)</option>
            <option value="admin">Quản trị (admin)</option>
          </select>
        </L>
        <L label={editing ? 'Mật khẩu mới (để trống nếu không đổi)' : 'Mật khẩu'} required={!editing}>
          <input name="password" type="password" minLength={8}
            required={!editing} placeholder={editing ? '••••••••' : ''}
            className="w-full border border-green-200 rounded px-3 py-2" />
        </L>
      </div>
      {state?.error && <p className="text-sm text-red-600">{state.error}</p>}
      <div className="flex justify-end gap-3">
        <Link href="/admin/users" className="px-4 py-2 text-sm text-green-800 hover:underline">Hủy</Link>
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
