import ValuePropForm from '@/components/admin/ValuePropForm';
import { createValueProp } from '@/app/admin/actions/value-props';

export default function NewValuePropPage() {
  return (
    <div className="space-y-5">
      <h1 className="admin-title text-[28px]">Thêm điểm giá trị</h1>
      <ValuePropForm action={createValueProp} editing={false} />
    </div>
  );
}
