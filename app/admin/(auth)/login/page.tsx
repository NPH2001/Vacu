'use client';
import { useActionState } from 'react';
import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';
import { signIn, type SignInState } from '@/app/admin/actions/auth';

function LoginForm() {
  const params = useSearchParams();
  const next = params.get('next') ?? '/admin';
  const [state, action, pending] = useActionState<SignInState, FormData>(signIn, null);

  return (
    <form action={action} className="bg-white rounded-2xl shadow-sm border border-green-100 p-8 w-full max-w-md space-y-4">
      <h1 className="text-2xl font-bold font-display text-green-950">Đăng nhập quản trị</h1>
      <input type="hidden" name="next" value={next} />
      <label className="block">
        <span className="text-sm font-medium text-green-950">Email</span>
        <input name="email" type="email" required className="mt-1 w-full border border-green-200 rounded px-3 py-2" />
      </label>
      <label className="block">
        <span className="text-sm font-medium text-green-950">Mật khẩu</span>
        <input name="password" type="password" required className="mt-1 w-full border border-green-200 rounded px-3 py-2" />
      </label>
      {state?.error && <p className="text-sm text-red-600">{state.error}</p>}
      <button
        type="submit"
        disabled={pending}
        className="w-full bg-green-700 hover:bg-green-800 disabled:opacity-60 text-white font-bold py-2.5 rounded-full">
        {pending ? 'Đang đăng nhập…' : 'Đăng nhập'}
      </button>
      <div className="text-center text-sm">
        <a href="/admin/forgot-password" className="text-green-700 hover:underline">Quên mật khẩu?</a>
      </div>
    </form>
  );
}

export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-green-50/60 px-4">
      <Suspense fallback={null}><LoginForm /></Suspense>
    </div>
  );
}
