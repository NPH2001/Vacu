import { PostCardSkeleton, SkeletonBox } from '@/components/skeletons';

export default function Loading() {
  return (
    <div>
      <div className="bg-green-50/60 border-b border-green-100">
        <div className="max-w-6xl mx-auto px-4 py-14 flex flex-col items-center gap-3">
          <SkeletonBox className="h-4 w-20" />
          <SkeletonBox className="h-10 w-72 max-w-full" />
          <SkeletonBox className="h-4 w-96 max-w-full" />
        </div>
      </div>
      <div className="max-w-6xl mx-auto px-4 py-12">
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, i) => <PostCardSkeleton key={i} />)}
        </div>
      </div>
    </div>
  );
}
