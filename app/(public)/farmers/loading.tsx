import { FarmerCardSkeleton, SkeletonBox } from '@/components/skeletons';

export default function Loading() {
  return (
    <div>
      <div className="relative bg-green-900/90 py-16 md:py-20">
        <div className="max-w-7xl mx-auto px-4 space-y-3">
          <SkeletonBox className="h-4 w-24" />
          <SkeletonBox className="h-10 w-80 max-w-full" />
          <SkeletonBox className="h-4 w-72 max-w-full" />
        </div>
      </div>
      <div className="max-w-7xl mx-auto px-4 py-16">
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, i) => <FarmerCardSkeleton key={i} />)}
        </div>
      </div>
    </div>
  );
}
