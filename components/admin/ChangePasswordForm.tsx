'use client';
import { useActionState, useRef, useEffect } from 'react';
import type { ChangePasswordState } from '@/app/admin/actions/account';

export default function ChangePasswordForm({
  action,
}: {
  action: (prev: ChangePasswordState, fd: FormData) => Promise<ChangePasswordState>;
}) {
  const [state, formAction, pending] = useActionState<ChangePasswordState, FormData>(action, null);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state?.ok) formRef.current?.reset();
  }, [state?.ok]);

  return (
    <form ref={formRef} action={formAction} className="bg-white rounded-2xl border border-green-100 p-6 space-y-4">
      <L label="Mật khẩu hiện tại">
        <input name="current" type="password" required className={inputCls} />
      </L>
      <L label="Mật khẩu mới (≥ 8 ký tự)">
        <input name="next" type="password" minLength={8} required className={inputCls} />
      </L>
      <L label="Nhập lại mật khẩu mới">
        <input name="confirm" type="password" minLength={8} required className={inputCls} />
      </L>
      <div className="flex items-center justify-end gap-3">
        {state?.ok && <span className="text-sm text-green-700">Đã đổi mật khẩu ✓</span>}
        {state?.error && <span role="alert" className="text-sm text-red-600">{state.error}</span>}
        <button type="submit" disabled={pending}
          className="bg-green-700 hover:bg-green-800 disabled:opacity-60 text-white font-semibold px-5 py-2 rounded-full">
          {pending ? 'Đang lưu…' : 'Đổi mật khẩu'}
        </button>
      </div>
    </form>
  );
}

const inputCls = 'w-full border border-green-200 rounded px-3 py-2';

function L({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="text-sm font-medium text-green-950">{label}</span>
      <div className="mt-1">{children}</div>
    </label>
  );
}
