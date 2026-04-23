import ContactTopicForm from '@/components/admin/ContactTopicForm';
import { createContactTopic } from '@/app/admin/actions/contact-topics';

export default function NewContactTopicPage() {
  return (
    <div className="space-y-5">
      <h1 className="admin-title text-[28px]">Thêm chủ đề liên hệ</h1>
      <ContactTopicForm action={createContactTopic} editing={false} />
    </div>
  );
}
