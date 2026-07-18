import { ProductGridSkeleton, SkeletonBox } from '@/components/skeletons';

export default function Loading() {
  return (
    <div>
      <div className="relative h-[55vh] min-h-[420px] bg-green-900/90" />
      <div className="max-w-7xl mx-auto px-4 py-12 space-y-6">
        <SkeletonBox className="h-6 w-64 max-w-full" />
        <SkeletonBox className="h-4 w-full max-w-2xl" />
        <ProductGridSkeleton count={4} />
      </div>
    </div>
  );
}
