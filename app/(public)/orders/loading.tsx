import { SkeletonBox } from '@/components/skeletons';

export default function Loading() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-12 space-y-4">
      <SkeletonBox className="h-9 w-56 max-w-full" />
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="rounded-2xl border border-green-100 p-5 space-y-3">
          <div className="flex justify-between">
            <SkeletonBox className="h-5 w-32" />
            <SkeletonBox className="h-5 w-24 rounded-full" />
          </div>
          <SkeletonBox className="h-4 w-full" />
          <SkeletonBox className="h-4 w-2/3" />
        </div>
      ))}
    </div>
  );
}
