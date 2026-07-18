'use client';
import { useActionState } from 'react';
import { resetPassword, type ResetPasswordState } from '@/app/admin/actions/password-reset';

export default function ResetPasswordForm({ token }: { token: string }) {
  const [state, formAction, pending] = useActionState<ResetPasswordState, FormData>(
    resetPassword,
    null,
  );
  return (
    <form action={formAction} className="space-y-3">
      <input type="hidden" name="token" value={token} />
      <label className="block">
        <span className="text-sm font-medium text-green-950">Mật khẩu mới</span>
        <input
          name="password"
          type="password"
          required
          minLength={8}
          autoComplete="new-password"
          className="mt-1 w-full admin-input"
        />
      </label>
      <button type="submit" disabled={pending}
        className="w-full bg-green-700 hover:bg-green-800 disabled:opacity-60 text-white font-semibold py-2 rounded-full">
        {pending ? 'Đang cập nhật…' : 'Đặt mật khẩu mới'}
      </button>
      {state?.error && <p role="alert" className="text-sm text-red-600">{state.error}</p>}
    </form>
  );
}
