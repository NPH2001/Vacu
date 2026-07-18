import { SkeletonBox } from '@/components/skeletons';

export default function Loading() {
  return (
    <article>
      <header className="max-w-3xl mx-auto px-4 pt-12 pb-8 space-y-4">
        <SkeletonBox className="h-3 w-40" />
        <SkeletonBox className="h-12 w-full" />
        <SkeletonBox className="h-12 w-2/3" />
        <SkeletonBox className="h-4 w-48 mt-2" />
      </header>
      <div className="max-w-5xl mx-auto px-4 mb-10">
        <SkeletonBox className="h-[360px] w-full rounded-3xl" />
      </div>
      <div className="max-w-3xl mx-auto px-4 space-y-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <SkeletonBox key={i} className={`h-4 ${i % 3 === 2 ? 'w-3/5' : 'w-full'}`} />
        ))}
      </div>
    </article>
  );
}
