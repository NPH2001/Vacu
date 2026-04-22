import { requireAdmin } from '@/lib/session';
import Sidebar from '@/components/admin/Sidebar';
import Topbar from '@/components/admin/Topbar';

export default async function ShellLayout({ children }: { children: React.ReactNode }) {
  const user = await requireAdmin();
  return (
    <div className="admin-shell h-screen flex overflow-hidden">
      <Sidebar role={user.role as 'admin' | 'staff'} />
      <div className="flex-1 flex flex-col min-w-0">
        <Topbar email={user.email} />
        <main className="flex-1 overflow-auto">
          <div className="px-8 py-7 max-w-[1440px] mx-auto w-full">{children}</div>
        </main>
      </div>
    </div>
  );
}
