'use client';
import { useActionState } from 'react';
import { requestPasswordReset, type RequestResetState } from '@/app/admin/actions/password-reset';

export default function ForgotPasswordForm() {
  const [state, formAction, pending] = useActionState<RequestResetState, FormData>(
    requestPasswordReset,
    null,
  );
  return (
    <form action={formAction} className="space-y-3">
      <label className="block">
        <span className="text-sm font-medium text-green-950">Email</span>
        <input
          name="email"
          type="email"
          required
          className="mt-1 w-full admin-input"
          placeholder="admin@vacu.com.vn"
        />
      </label>
      <button type="submit" disabled={pending}
        className="w-full bg-green-700 hover:bg-green-800 disabled:opacity-60 text-white font-semibold py-2 rounded-full">
        {pending ? 'Đang gửi…' : 'Gửi link đặt lại'}
      </button>
      {state?.ok && (
        <p className="text-sm text-green-700">
          ✓ Nếu email khớp với tài khoản, link đặt lại đã được gửi. Kiểm tra hộp thư (và spam).
        </p>
      )}
      {state?.error && <p role="alert" className="text-sm text-red-600">{state.error}</p>}
    </form>
  );
}
