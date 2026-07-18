import { ProductGridSkeleton, SkeletonBox } from '@/components/skeletons';

export default function Loading() {
  return (
    <div>
      {/* Hero band placeholder */}
      <div className="relative bg-green-900/90 py-16 md:py-24">
        <div className="max-w-7xl mx-auto px-4 space-y-3">
          <SkeletonBox className="h-6 w-28 rounded-full" />
          <SkeletonBox className="h-12 w-72 max-w-full" />
          <SkeletonBox className="h-4 w-96 max-w-full" />
        </div>
      </div>
      <div className="max-w-7xl mx-auto px-4 py-10">
        <ProductGridSkeleton count={8} />
      </div>
    </div>
  );
}
