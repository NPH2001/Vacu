import Link from 'next/link';

const LINKS = [
  { href: '/admin', label: 'Dashboard', icon: '🏠' },
  { href: '/admin/products', label: 'Sản phẩm', icon: '🥬' },
  { href: '/admin/categories', label: 'Danh mục', icon: '🏷️' },
  { href: '/admin/farmers', label: 'Nông dân', icon: '👨‍🌾' },
  { href: '/admin/testimonials', label: 'Cảm nhận', icon: '💬' },
  { href: '/admin/faq', label: 'FAQ', icon: '❓' },
  { href: '/admin/orders', label: 'Đơn hàng', icon: '📦' },
  { href: '/admin/users', label: 'Tài khoản', icon: '👤', adminOnly: true },
  { href: '/admin/settings', label: 'Cài đặt', icon: '⚙️' },
];

export default function Sidebar({ role }: { role: 'admin' | 'staff' }) {
  return (
    <nav className="w-60 bg-white border-r border-green-100 p-4 space-y-1">
      <div className="text-sm font-bold text-green-700 px-3 mb-2">Nông Trại Xanh CMS</div>
      {LINKS.filter((l) => !l.adminOnly || role === 'admin').map((l) => (
        <Link key={l.href} href={l.href} className="block px-3 py-2 rounded-lg hover:bg-green-50 text-green-950 text-sm">
          <span className="mr-2">{l.icon}</span>{l.label}
        </Link>
      ))}
    </nav>
  );
}
