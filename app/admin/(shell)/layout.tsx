import { requireAdmin } from '@/lib/session';
import Sidebar from '@/components/admin/Sidebar';
import Topbar from '@/components/admin/Topbar';

export default async function ShellLayout({ children }: { children: React.ReactNode }) {
  const user = await requireAdmin();
  return (
    <div className="min-h-screen flex bg-green-50/40">
      <Sidebar role={user.role as 'admin' | 'staff'} />
      <div className="flex-1 flex flex-col">
        <Topbar email={user.email} />
        <div className="flex-1 p-6 overflow-auto">{children}</div>
      </div>
    </div>
  );
}
