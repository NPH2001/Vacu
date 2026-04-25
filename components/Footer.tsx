import Link from "next/link";
import type { SiteInfoRow, CategoryRow, MenuItemRow } from "@/db/schema";

type Social = { key: string; label: string; url: string | null };

export default function Footer({
  info, categories, quickLinks,
}: {
  info: SiteInfoRow;
  categories: CategoryRow[];
  quickLinks: MenuItemRow[];
}) {
  const socials: Social[] = [
    { key: "FB", label: "Facebook", url: info.socialFacebook },
    { key: "IG", label: "Instagram", url: info.socialInstagram },
    { key: "YT", label: "YouTube", url: info.socialYoutube },
    { key: "TT", label: "TikTok", url: info.socialTiktok },
  ];
  const activeSocials = socials.filter((s) => s.url);
  const showQuickLinks = quickLinks.length > 0;

  return (
    <footer className="bg-green-950 text-green-100 mt-24">
      <div className="max-w-7xl mx-auto px-4 py-14 grid md:grid-cols-4 gap-10">
        <div className={showQuickLinks ? "md:col-span-1" : "md:col-span-2"}>
          <h3 className="text-2xl font-bold text-green-300 mb-3 font-display flex items-center gap-2">
            {info.logoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={info.logoUrl} alt={info.name} className="w-8 h-8 rounded-full object-cover" />
            ) : (
              <span>🌱</span>
            )}
            {info.name}
          </h3>
          <p className="text-green-200/80 max-w-md">{info.description}</p>
          {activeSocials.length > 0 && (
            <div className="flex gap-3 mt-5">
              {activeSocials.map((s) => (
                <a
                  key={s.key}
                  href={s.url!}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={s.label}
                  className="w-10 h-10 rounded-full bg-green-900 hover:bg-green-800 text-green-200 flex items-center justify-center text-xs font-bold transition"
                >
                  {s.key}
                </a>
              ))}
            </div>
          )}
        </div>
        <div>
          <h4 className="font-semibold mb-3 text-white font-display">Danh mục</h4>
          <ul className="text-sm space-y-2 text-green-200/80">
            {categories.slice(0, 5).map((c) => (
              <li key={c.id}>
                <Link href={`/danh-muc/${c.id}`} className="hover:text-white">
                  {c.icon} {c.name}
                </Link>
              </li>
            ))}
          </ul>
        </div>
        {showQuickLinks && (
          <div>
            <h4 className="font-semibold mb-3 text-white font-display">Liên kết nhanh</h4>
            <ul className="text-sm space-y-2 text-green-200/80">
              {quickLinks.map((l) => (
                <li key={l.id}>
                  <Link
                    href={l.href}
                    target={l.openInNewTab ? "_blank" : undefined}
                    rel={l.openInNewTab ? "noopener noreferrer" : undefined}
                    className="hover:text-white"
                  >
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        )}
        <div>
          <h4 className="font-semibold mb-3 text-white font-display">Liên hệ</h4>
          <ul className="text-sm space-y-2 text-green-200/80">
            <li>📍 {info.address}</li>
            <li>📞 {info.phone}</li>
            <li>✉️ {info.email}</li>
            <li>🕒 {info.hours}</li>
          </ul>
        </div>
      </div>
      {(info.businessName || info.taxCode) && (
        <div className="border-t border-green-900/60 py-4 px-4 text-center text-xs text-green-300/70 space-y-0.5">
          {info.businessName && <div>{info.businessName}</div>}
          {info.taxCode && <div>Mã số thuế: {info.taxCode}</div>}
        </div>
      )}
      <div className="border-t border-green-900 py-5 text-center text-xs text-green-300/60 space-y-1">
        <div>© {new Date().getFullYear()} {info.name} — {info.footerTagline}</div>
        <div>
          Xây dựng bởi{' '}
          <a
            href="https://idflow.vn"
            target="_blank"
            rel="noopener noreferrer"
            className="text-green-200 hover:text-white underline-offset-2 hover:underline"
          >
            idflow.vn
          </a>
        </div>
      </div>
    </footer>
  );
}
