'use client';
import { useActionState } from 'react';
import { lookupOrder, type LookupState } from '@/app/(public)/orders/actions';

/**
 * Recover a guest order by code + phone when the browser cookie is gone (cleared
 * cookies, a different device, or the confirmation link opened elsewhere).
 */
export default function OrderLookupForm() {
  const [state, action, pending] = useActionState<LookupState, FormData>(lookupOrder, null);

  return (
    <form action={action} className="bg-white rounded-2xl border border-green-100 p-5 sm:p-6">
      <h2 className="font-bold text-green-950 font-display text-lg mb-1">Tra cứu đơn hàng</h2>
      <p className="text-sm text-green-900/60 mb-4">
        Nhập mã đơn (VD: NTX-A1B2C3D4) và số điện thoại bạn đã đặt để xem lại đơn.
      </p>
      <div className="flex flex-col sm:flex-row gap-3">
        <input
          name="orderCode"
          required
          placeholder="Mã đơn"
          autoComplete="off"
          className="flex-1 min-w-0 px-4 py-2.5 rounded-full border border-green-200 bg-white text-sm uppercase focus:border-green-600 focus:ring-2 focus:ring-green-600/40"
        />
        <input
          name="phone"
          type="tel"
          inputMode="tel"
          autoComplete="tel"
          required
          placeholder="Số điện thoại"
          className="flex-1 min-w-0 px-4 py-2.5 rounded-full border border-green-200 bg-white text-sm focus:border-green-600 focus:ring-2 focus:ring-green-600/40"
        />
        <button
          type="submit"
          disabled={pending}
          className="bg-green-700 hover:bg-green-800 disabled:opacity-60 text-white font-semibold px-6 py-2.5 rounded-full transition whitespace-nowrap"
        >
          {pending ? 'Đang tìm…' : 'Tra cứu'}
        </button>
      </div>
      {state?.error && (
        <p role="alert" aria-live="assertive" className="text-sm text-red-600 mt-3">{state.error}</p>
      )}
    </form>
  );
}
