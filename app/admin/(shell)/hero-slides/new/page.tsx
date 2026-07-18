import HeroSlideForm from '@/components/admin/HeroSlideForm';
import { createHeroSlide } from '@/app/admin/actions/hero-slides';

export default function NewHeroSlidePage() {
  return (
    <div className="space-y-5">
      <h1 className="admin-title text-[28px]">Slide mới</h1>
      <HeroSlideForm action={createHeroSlide} editing={false} />
    </div>
  );
}
