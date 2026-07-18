export const dynamic = 'force-dynamic';

// Personal, transient page — keep it out of the index (robots.txt already
// disallows it; this is belt-and-braces for externally-linked URLs).
export const metadata = { robots: { index: false, follow: false } };

import CheckoutForm from "@/components/CheckoutForm";
import { getActiveDeliverySlots, getActivePaymentMethods, getSiteInfo } from "@/lib/data";

export default async function CheckoutPage() {
  const [slots, methods, info] = await Promise.all([
    getActiveDeliverySlots(),
    getActivePaymentMethods(),
    getSiteInfo(),
  ]);
  const bankEnabled =
    info.bankEnabled &&
    !!info.bankBin &&
    !!info.bankAccountNumber &&
    !!info.bankAccountHolder;

  // The order enum only supports cod/bank, so the checkout renders just those
  // two — but their label/hint come from the admin-managed payment_methods
  // table, falling back to sensible defaults when a row is missing or blank.
  const byId = new Map(methods.map((m) => [m.id, m]));
  const cod = byId.get('cod');
  const bank = byId.get('bank');
  const payment = {
    cod: {
      label: cod?.label || '💵 Tiền mặt khi nhận',
      hint: cod?.hint || 'Trả khi nông dân giao tới',
    },
    bank: {
      label: bank?.label || '🏦 Chuyển khoản (QR)',
      hint: bank?.hint || 'Quét mã VietQR sau khi đặt',
    },
  };

  return (
    <CheckoutForm
      slots={slots}
      bankEnabled={bankEnabled}
      payment={payment}
      slotNote={info.checkoutSlotNote}
      shippingLabel={info.shippingLabel}
      emptyCartTitle={info.cartEmptyTitle}
      emptyCartText={info.cartEmptyText}
    />
  );
}
