'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const LABELS: Record<string, string> = {
  admin: 'Dashboard',
  products: 'Sản phẩm',
  categories: 'Danh mục',
  farmers: 'Nông dân',
  testimonials: 'Cảm nhận',
  faq: 'Câu hỏi',
  'value-props': 'Điểm giá trị',
  orders: 'Đơn hàng',
  'order-statuses': 'Trạng thái đơn',
  users: 'Tài khoản',
  settings: 'Cài đặt',
  'delivery-slots': 'Khung giờ giao',
  'payment-methods': 'Thanh toán',
  'contact-topics': 'Chủ đề liên hệ',
  'email-templates': 'Mẫu email',
  account: 'Tài khoản của tôi',
  new: 'Thêm mới',
};

function formatCrumb(segment: string): string {
  if (LABELS[segment]) return LABELS[segment];
  if (segment.length > 16) return segment.slice(0, 8) + '…';
  return segment;
}

export default function Topbar({ email }: { email: string }) {
  const pathname = usePathname() ?? '';
  const segments = pathname.split('/').filter(Boolean); // e.g. ['admin','orders','NTX-1']

  // Build cumulative paths for crumb links; skip the leading 'admin' as a text-only crumb.
  const crumbs = segments.map((seg, i) => {
    const href = '/' + segments.slice(0, i + 1).join('/');
    return { label: formatCrumb(seg), href, isLast: i === segments.length - 1 };
  });

  return (
    <header
      className="h-14 shrink-0 flex items-center justify-between px-7"
      style={{
        borderBottom: '1px solid var(--admin-hairline)',
        background: 'rgba(255,255,255,0.72)',
        backdropFilter: 'saturate(140%) blur(6px)',
      }}>
      <nav className="flex items-center gap-1.5 text-[13px]">
        {crumbs.map((c, i) => (
          <span key={c.href} className="flex items-center gap-1.5">
            {i > 0 && <span className="text-stone-300 select-none">›</span>}
            {c.isLast ? (
              <span className="font-medium text-stone-900">{c.label}</span>
            ) : (
              <Link
                href={c.href}
                className="text-stone-500 hover:text-stone-900 transition-colors">
                {c.label}
              </Link>
            )}
          </span>
        ))}
      </nav>

      <div className="flex items-center gap-3">
        <Link
          href="/admin/account"
          className="flex items-center gap-2 text-[13px] text-stone-600 hover:text-stone-900 transition-colors">
          <span
            className="inline-flex h-7 w-7 items-center justify-center rounded-full text-[11px] font-semibold text-stone-700"
            style={{
              background: '#f5f5f4',
              border: '1px solid var(--admin-hairline)',
            }}>
            {email.slice(0, 2).toUpperCase()}
          </span>
          <span className="hidden sm:inline max-w-[180px] truncate">{email}</span>
        </Link>
        <span className="h-5 w-px bg-stone-200" />
        <form action="/api/auth/logout" method="post">
          <button type="submit" className="admin-btn-ghost">
            Đăng xuất
          </button>
        </form>
      </div>
    </header>
  );
}
