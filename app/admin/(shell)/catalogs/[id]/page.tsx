import { notFound } from 'next/navigation';
import { asc, eq } from 'drizzle-orm';
import { db } from '@/db/client';
import { catalogs, catalogImages } from '@/db/schema';
import CatalogForm from '@/components/admin/CatalogForm';
import { updateCatalog } from '@/app/admin/actions/catalogs';

export default async function EditCatalogPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const num = Number(id);
  if (!Number.isFinite(num)) notFound();

  const [rows, pageRows] = await Promise.all([
    db.select().from(catalogs).where(eq(catalogs.id, num)).limit(1),
    db.select({ url: catalogImages.url }).from(catalogImages)
      .where(eq(catalogImages.catalogId, num))
      .orderBy(asc(catalogImages.sortOrder), asc(catalogImages.id)),
  ]);
  const row = rows[0];
  if (!row) notFound();

  const bound = updateCatalog.bind(null, row.id);
  return (
    <div className="space-y-5">
      <h1 className="admin-title text-[28px]">Sửa catalog</h1>
      <CatalogForm action={bound} defaults={row} pages={pageRows.map((p) => p.url)} editing />
    </div>
  );
}
