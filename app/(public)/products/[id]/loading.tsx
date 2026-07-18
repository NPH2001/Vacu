import { SkeletonBox, ProductGridSkeleton } from '@/components/skeletons';

export default function Loading() {
  return (
    <div className="max-w-6xl mx-auto px-4 py-10">
      <SkeletonBox className="h-4 w-64 mb-6" />
      <div className="grid md:grid-cols-2 gap-10">
        <SkeletonBox className="aspect-square rounded-3xl" />
        <div className="space-y-4">
          <SkeletonBox className="h-6 w-40" />
          <SkeletonBox className="h-10 w-3/4" />
          <SkeletonBox className="h-4 w-full" />
          <SkeletonBox className="h-4 w-5/6" />
          <SkeletonBox className="h-24 w-full rounded-2xl mt-4" />
          <SkeletonBox className="h-12 w-full rounded-full" />
        </div>
      </div>
      <div className="mt-20">
        <SkeletonBox className="h-8 w-56 mb-6" />
        <ProductGridSkeleton count={4} />
      </div>
    </div>
  );
}
