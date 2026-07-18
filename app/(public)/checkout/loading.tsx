import { SkeletonBox } from '@/components/skeletons';

export default function Loading() {
  return (
    <div className="max-w-6xl mx-auto px-4 py-12">
      <SkeletonBox className="h-9 w-48 mb-8" />
      <div className="grid md:grid-cols-5 gap-8">
        <div className="md:col-span-3 rounded-3xl border border-green-100 p-7 space-y-4">
          {Array.from({ length: 5 }).map((_, i) => <SkeletonBox key={i} className="h-12 w-full" />)}
        </div>
        <div className="md:col-span-2 rounded-3xl border border-green-100 p-7 space-y-3">
          <SkeletonBox className="h-6 w-32" />
          <SkeletonBox className="h-4 w-full" />
          <SkeletonBox className="h-4 w-2/3" />
          <SkeletonBox className="h-12 w-full rounded-full mt-4" />
        </div>
      </div>
    </div>
  );
}
