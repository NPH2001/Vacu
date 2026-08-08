import Link from "next/link";
import type { SiteInfoRow, CategoryRow } from "@/db/schema";
import type { MenuNode } from "@/lib/menu";
import CategoryIcon from "@/components/CategoryIcon";

type Social = { key: string; label: string; url: string | null };

export default function Footer({
  info, categories, quickLinks,
}: {
  info: SiteInfoRow;
  categories: CategoryRow[];
  quickLinks: MenuNode[];
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
    <footer className="mt-20 bg-green-950 text-green-100">
      <div className="border-b border-white/10 bg-green-900/70">
        <div className="mx-auto grid max-w-7xl grid-cols-2 gap-px px-4 py-5 text-sm md:grid-cols-4">
          {[
            ['Nguồn gốc minh bạch', 'Thông tin nông hộ và vùng sản xuất'],
            ['Chọn lọc mỗi ngày', 'Ưu tiên độ tươi và đúng mùa'],
            ['Giao hàng cẩn thận', 'Đóng gói phù hợp từng sản phẩm'],
            ['Hỗ trợ tận tâm', info.hours],
          ].map(([title, text]) => (
            <div key={title} className="px-3 py-2 md:px-5">
              <div className="font-bold text-white">{title}</div>
              <div className="mt-1 text-xs leading-relaxed text-green-100/65">{text}</div>
            </div>
          ))}
        </div>
      </div>
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-14 md:grid-cols-4">
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
          <p className="max-w-md text-sm leading-relaxed text-green-200/80">{info.description}</p>
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
          <ul className="space-y-2.5 text-sm text-green-200/80">
            {categories.filter((c) => !c.parentId).slice(0, 5).map((c) => (
              <li key={c.id}>
                <Link href={`/danh-muc/${c.id}`} className="hover:text-white inline-flex items-center gap-1.5">
                  <CategoryIcon value={c.icon} alt="" className="w-4 h-4 rounded" />
                  <span>{c.name}</span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
        {showQuickLinks && (
          <div>
            <h4 className="font-semibold mb-3 text-white font-display">Liên kết nhanh</h4>
            <ul className="space-y-2.5 text-sm text-green-200/80">
              <FooterLinks nodes={quickLinks} />
            </ul>
          </div>
        )}
        <div>
          <h4 className="font-semibold mb-3 text-white font-display">Liên hệ</h4>
          <ul className="space-y-3 text-sm text-green-200/80">
            <li><span className="mb-0.5 block text-[10px] font-bold uppercase tracking-wider text-green-300/60">Địa chỉ</span>{info.address}</li>
            <li><span className="mb-0.5 block text-[10px] font-bold uppercase tracking-wider text-green-300/60">Hotline</span><a href={`tel:${info.phone.replace(/\D/g, '')}`} className="hover:text-white">{info.phone}</a></li>
            <li><span className="mb-0.5 block text-[10px] font-bold uppercase tracking-wider text-green-300/60">Email</span><a href={`mailto:${info.email}`} className="hover:text-white">{info.email}</a></li>
            <li><span className="mb-0.5 block text-[10px] font-bold uppercase tracking-wider text-green-300/60">Giờ hỗ trợ</span>{info.hours}</li>
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
        {info.footerBuiltByLabel && (
          <div>
            Xây dựng bởi{' '}
            {info.footerBuiltByUrl ? (
              <a
                href={info.footerBuiltByUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-green-200 underline underline-offset-2 hover:text-white"
              >
                {info.footerBuiltByLabel}
              </a>
            ) : (
              <span className="text-green-200">{info.footerBuiltByLabel}</span>
            )}
          </div>
        )}
      </div>
    </footer>
  );
}

/** Footer không có dropdown: mục con hiện luôn, chỉ thụt vào cho thấy quan hệ. */
function FooterLinks({ nodes, depth = 0 }: { nodes: MenuNode[]; depth?: number }) {
  return (
    <>
      {nodes.map((l) => (
        <li key={l.id} style={depth > 0 ? { paddingLeft: depth * 12 } : undefined}>
          <Link
            href={l.href}
            target={l.openInNewTab ? "_blank" : undefined}
            rel={l.openInNewTab ? "noopener noreferrer" : undefined}
            className={depth > 0 ? "hover:text-white text-green-200/60" : "hover:text-white"}
          >
            {depth > 0 && <span className="mr-1 text-green-200/40" aria-hidden>└</span>}
            {l.label}
          </Link>
          {l.children.length > 0 && (
            <ul className="mt-2 space-y-2">
              <FooterLinks nodes={l.children} depth={depth + 1} />
            </ul>
          )}
        </li>
      ))}
    </>
  );
}
