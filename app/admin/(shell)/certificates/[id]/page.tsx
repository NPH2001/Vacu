import { notFound } from 'next/navigation';
import { eq } from 'drizzle-orm';
import { db } from '@/db/client';
import { certificates } from '@/db/schema';
import CertificateForm from '@/components/admin/CertificateForm';
import { updateCertificate } from '@/app/admin/actions/certificates';

export default async function EditCertificatePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const num = Number(id);
  if (!Number.isFinite(num)) notFound();
  const rows = await db.select().from(certificates).where(eq(certificates.id, num)).limit(1);
  const row = rows[0];
  if (!row) notFound();
  const bound = updateCertificate.bind(null, row.id);
  return (
    <div className="space-y-5">
      <h1 className="admin-title text-[28px]">Sửa chứng nhận</h1>
      <CertificateForm action={bound} defaults={row} editing />
    </div>
  );
}
