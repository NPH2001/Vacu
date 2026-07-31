import CertificateForm from '@/components/admin/CertificateForm';
import { createCertificate } from '@/app/admin/actions/certificates';

export default function NewCertificatePage() {
  return (
    <div className="space-y-5">
      <h1 className="admin-title text-[28px]">Thêm chứng nhận</h1>
      <CertificateForm action={createCertificate} editing={false} />
    </div>
  );
}
