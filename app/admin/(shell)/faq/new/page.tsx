import FaqForm from '@/components/admin/FaqForm';
import { createFaq } from '@/app/admin/actions/faq';

export default function NewFaqPage() {
  return (
    <div className="space-y-5">
      <h1 className="text-2xl font-bold font-display text-green-950">Câu hỏi mới</h1>
      <FaqForm action={createFaq} editing={false} />
    </div>
  );
}
