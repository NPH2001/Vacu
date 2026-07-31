import CatalogForm from '@/components/admin/CatalogForm';
import { createCatalog } from '@/app/admin/actions/catalogs';

export default function NewCatalogPage() {
  return (
    <div className="space-y-5">
      <h1 className="admin-title text-[28px]">Thêm catalog</h1>
      <CatalogForm action={createCatalog} editing={false} />
    </div>
  );
}
