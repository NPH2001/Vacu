import Image from "next/image";

function digitsOnly(s: string) {
  return s.replace(/\D/g, "");
}

/**
 * Compact persistent contact action. Kept intentionally quiet so it remains
 * useful without competing with product and checkout CTAs.
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
      className="group relative block h-12 w-12"
    >
      <span
        aria-hidden
        className={`absolute -inset-1 animate-ping border-2 border-red-500/80 ${rounded}`}
      />
      <span className={`relative z-10 flex h-12 w-12 items-center justify-center overflow-hidden border border-white/80 shadow-[0_10px_25px_-10px_rgba(5,46,22,0.55)] transition duration-200 group-hover:-translate-y-0.5 group-hover:shadow-xl ${rounded} ${className}`}>
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
    // (ProductBuyBox); desktop keeps the same clearance above ScrollToTop.
    <div className="fixed bottom-24 right-3 z-40 flex flex-col items-end gap-2 print:hidden md:bottom-20 md:right-6">
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
        className="bg-green-800 hover:bg-green-900"
      >
        <svg aria-hidden viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" className="h-5 w-5 text-white">
          <path d="M7.2 3.5 9.5 7 7.8 9.1c1.2 2.4 3 4.2 5.5 5.4l2-1.7 3.3 2.4c.4.3.6.8.4 1.3l-.7 2.5c-.2.6-.7 1-1.3 1C9.8 19.6 4.3 14.1 4 7c0-.6.4-1.1 1-1.3l.9-2.1c.2-.5.8-.6 1.3-.1Z" strokeLinejoin="round" />
        </svg>
      </ContactButton>
    </div>
  );
}
