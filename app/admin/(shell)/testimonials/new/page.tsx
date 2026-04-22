import TestimonialForm from '@/components/admin/TestimonialForm';
import { createTestimonial } from '@/app/admin/actions/testimonials';

export default function NewTestimonialPage() {
  return (
    <div className="space-y-5">
      <h1 className="text-2xl font-bold font-display text-green-950">Cảm nhận mới</h1>
      <TestimonialForm action={createTestimonial} editing={false} />
    </div>
  );
}
