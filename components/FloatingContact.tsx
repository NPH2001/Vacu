import Image from "next/image";

function digitsOnly(s: string) {
  return s.replace(/\D/g, "");
}

/**
 * One always-visible action button, ringed in red with a continuous ping
 * animation — the "nhấp nháy" attention-grabber common on VN storefront sites
 * for hotline/Zalo buttons.
 */
function ContactButton({
  href, external, label, rounded, className, children,
}: {
  href: string; external: boolean; label: string; rounded: string; className: string; children: React.ReactNode;
}) {
  return (
    <a
      href={href}
      target={external ? "_blank" : undefined}
      rel={external ? "noopener noreferrer" : undefined}
      aria-label={label}
      title={label}
      className="relative block w-14 h-14"
    >
      <span className={`absolute inset-0 ${rounded} border-2 border-red-500 animate-ping`} aria-hidden />
      <span className={`relative flex items-center justify-center w-14 h-14 ${rounded} border-2 border-red-500 shadow-xl transition overflow-hidden ${className}`}>
        {children}
      </span>
    </a>
  );
}

/**
 * Two contact channels always on screen — hotline call + Zalo chat — one tap
 * away from anywhere on the site, instead of making a shopper go through the
 * /contact form to ask a question before buying.
 */
export default function FloatingContact({ phone }: { phone: string }) {
  const phoneDigits = digitsOnly(phone);
  if (!phoneDigits) return null;

  return (
    // bottom-24 on mobile clears the product page's sticky "add to cart" bar
    // (ProductBuyBox) so the two never overlap or fight for taps.
    <div className="fixed bottom-24 right-4 md:bottom-6 md:right-6 z-40 flex flex-col items-end gap-3 print:hidden">
      <ContactButton
        href={`https://zalo.me/${phoneDigits}`}
        external
        label="Chat Zalo"
        rounded="rounded-full"
        className="bg-white"
      >
        <Image src="/brand/zalo-logo.png" alt="Chat Zalo" width={56} height={56} className="w-full h-full object-cover" />
      </ContactButton>
      <ContactButton
        href={`tel:${phoneDigits}`}
        external={false}
        label={`Gọi ${phone}`}
        rounded="rounded-full"
        className="bg-green-700 hover:bg-green-800"
      >
        <span aria-hidden className="text-2xl text-white">📞</span>
      </ContactButton>
    </div>
  );
}
