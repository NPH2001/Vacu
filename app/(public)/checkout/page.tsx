export const dynamic = 'force-dynamic';

import CheckoutForm from "@/components/CheckoutForm";
import { getActiveDeliverySlots, getSiteInfo } from "@/lib/data";

export default async function CheckoutPage() {
  const [slots, info] = await Promise.all([getActiveDeliverySlots(), getSiteInfo()]);
  const bankEnabled =
    info.bankEnabled &&
    !!info.bankBin &&
    !!info.bankAccountNumber &&
    !!info.bankAccountHolder;
  return <CheckoutForm slots={slots} bankEnabled={bankEnabled} />;
}
