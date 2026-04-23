import FaqForm from '@/components/admin/FaqForm';
import { createFaq } from '@/app/admin/actions/faq';

export default function NewFaqPage() {
  return (
    <div className="space-y-5">
      <h1 className="admin-title text-[28px]">Câu hỏi mới</h1>
      <FaqForm action={createFaq} editing={false} />
    </div>
  );
}
