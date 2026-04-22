import FarmerForm from '@/components/admin/FarmerForm';
import { createFarmer } from '@/app/admin/actions/farmers';

export default function NewFarmerPage() {
  return (
    <div className="space-y-5">
      <h1 className="text-2xl font-bold font-display text-green-950">Nông dân mới</h1>
      <FarmerForm action={createFarmer} editing={false} />
    </div>
  );
}
