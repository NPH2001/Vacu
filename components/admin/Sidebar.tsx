'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect } from 'react';
import { useMobileNav, setMobileNavOpen } from '@/lib/admin/mobile-nav';

type NavItem = { href: string; label: string; icon: string; adminOnly?: boolean };

const SECTIONS: { title: string; items: NavItem[] }[] = [
  {
    title: 'Tổng quan',
    items: [{ href: '/admin', label: 'Dashboard', icon: '◆' }],
  },
  {
    title: 'Bán hàng',
    items: [
      { href: '/admin/orders', label: 'Đơn hàng', icon: '✦' },
      { href: '/admin/products', label: 'Sản phẩm', icon: '✿' },
      { href: '/admin/categories', label: 'Danh mục', icon: '❖' },
    ],
  },
  {
    title: 'Nội dung',
    items: [
      { href: '/admin/farmers', label: 'Nông dân', icon: '❀' },
      { href: '/admin/testimonials', label: 'Cảm nhận', icon: '❝' },
      { href: '/admin/faq', label: 'Câu hỏi', icon: '?' },
      { href: '/admin/value-props', label: 'Điểm giá trị', icon: '★' },
      { href: '/admin/menu', label: 'Menu', icon: '☰' },
    ],
  },
  {
    title: 'Vận hành',
    items: [
      { href: '/admin/delivery-slots', label: 'Khung giờ giao', icon: '◷' },
      { href: '/admin/payment-methods', label: 'Thanh toán', icon: '◐' },
      { href: '/admin/order-statuses', label: 'Trạng thái đơn', icon: '⎯' },
      { href: '/admin/contact-topics', label: 'Chủ đề liên hệ', icon: '✉' },
      { href: '/admin/email-templates', label: 'Mẫu email', icon: '✎' },
    ],
  },
  {
    title: 'Hệ thống',
    items: [
      { href: '/admin/users', label: 'Tài khoản', icon: '◉', adminOnly: true },
      { href: '/admin/settings', label: 'Cài đặt', icon: '⚙' },
    ],
  },
];

export default function Sidebar({ role }: { role: 'admin' | 'staff' }) {
  const pathname = usePathname() ?? '';
  const open = useMobileNav();

  // Close drawer when route changes (mobile UX).
  useEffect(() => {
    setMobileNavOpen(false);
  }, [pathname]);

  return (
    <>
      {/* Backdrop — mobile only */}
      <div
        onClick={() => setMobileNavOpen(false)}
        className={`fixed inset-0 z-30 bg-black/45 backdrop-blur-[1px] lg:hidden transition-opacity ${
          open ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
        aria-hidden
      />

      <aside
        className={`w-64 shrink-0 flex flex-col fixed inset-y-0 left-0 z-40 transform transition-transform duration-200 ease-out lg:static lg:translate-x-0 ${
          open ? 'translate-x-0' : '-translate-x-full'
        }`}
        style={{
          background: 'var(--admin-nav-bg)',
          borderRight: '1px solid #0b0b0a',
        }}>
        <div className="px-5 pt-5 pb-4 flex items-center gap-2.5">
          <span
            className="h-8 w-8 rounded-md inline-flex items-center justify-center"
            style={{
              background:
                'linear-gradient(135deg, #15803d 0%, #14532d 55%, #0f3b22 100%)',
              boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.12)',
            }}>
            <span
              className="font-display font-bold text-white text-sm leading-none"
              style={{ letterSpacing: '-0.04em' }}>
              V
            </span>
          </span>
          <div className="leading-tight flex-1">
            <div
              className="font-display text-[15px] text-stone-50"
              style={{ letterSpacing: '-0.01em' }}>
              Vacu
            </div>
            <div className="text-[10px] tracking-widest uppercase text-stone-500">
              Console
            </div>
          </div>
          <button
            type="button"
            onClick={() => setMobileNavOpen(false)}
            className="lg:hidden text-stone-400 hover:text-stone-100 text-lg leading-none w-7 h-7 inline-flex items-center justify-center rounded-md hover:bg-white/5"
            aria-label="Đóng menu">
            ✕
          </button>
        </div>

        <div className="mx-4" style={{ borderTop: '1px solid #2a2a27' }} />

        <nav className="flex-1 px-4 pb-4 overflow-y-auto">
          {SECTIONS.map((section) => {
            const items = section.items.filter((i) => !i.adminOnly || role === 'admin');
            if (items.length === 0) return null;
            return (
              <div key={section.title}>
                <div className="admin-nav-section">{section.title}</div>
                <div className="space-y-0.5">
                  {items.map((item) => {
                    const isActive =
                      item.href === '/admin'
                        ? pathname === '/admin'
                        : pathname === item.href || pathname.startsWith(item.href + '/');
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        className="admin-nav-link"
                        data-active={isActive || undefined}>
                        <span className="admin-nav-icon">{item.icon}</span>
                        <span>{item.label}</span>
                      </Link>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </nav>

        <div
          className="px-5 py-4 text-[11px] text-stone-500"
          style={{ borderTop: '1px solid #2a2a27' }}>
          <div className="flex items-center gap-1.5">
            <span
              className="h-1.5 w-1.5 rounded-full"
              style={{ background: '#86efac', boxShadow: '0 0 6px #4ade80' }}
            />
            <span>Hệ thống ổn định</span>
          </div>
          <div className="mt-1 text-stone-600">Vacu CMS · v0.9</div>
        </div>
      </aside>
    </>
  );
}
