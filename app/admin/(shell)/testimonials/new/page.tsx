import TestimonialForm from '@/components/admin/TestimonialForm';
import { createTestimonial } from '@/app/admin/actions/testimonials';

export default function NewTestimonialPage() {
  return (
    <div className="space-y-5">
      <h1 className="admin-title text-[28px]">Cảm nhận mới</h1>
      <TestimonialForm action={createTestimonial} editing={false} />
    </div>
  );
}
