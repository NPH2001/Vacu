/**
 * Loading placeholders shown by route-level loading.tsx files while a
 * force-dynamic page fetches on the server. They mirror the real layout's
 * shape so the page doesn't visibly jump when content arrives.
 */

function Box({ className = '' }: { className?: string }) {
  return <div className={`skeleton ${className}`} />;
}

/** One product card placeholder: image + two text lines + price row. */
export function ProductCardSkeleton() {
  return (
    <div className="bg-white rounded-3xl border border-green-100 overflow-hidden">
      <Box className="aspect-[4/3] rounded-none" />
      <div className="p-4 space-y-3">
        <Box className="h-5 w-4/5" />
        <Box className="h-3 w-3/5" />
        <div className="flex items-center justify-between pt-3">
          <Box className="h-6 w-20" />
          <Box className="h-9 w-9 rounded-full" />
        </div>
      </div>
    </div>
  );
}

export function ProductGridSkeleton({ count = 8 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
      {Array.from({ length: count }).map((_, i) => <ProductCardSkeleton key={i} />)}
    </div>
  );
}

export function FarmerCardSkeleton() {
  return (
    <div className="rounded-3xl border border-green-100 overflow-hidden bg-white">
      <Box className="aspect-[4/3] rounded-none" />
      <div className="p-5 space-y-3">
        <Box className="h-4 w-1/3" />
        <Box className="h-5 w-2/3" />
        <Box className="h-3 w-full" />
        <Box className="h-3 w-4/5" />
      </div>
    </div>
  );
}

export function PostCardSkeleton() {
  return (
    <div className="bg-white rounded-3xl border border-green-100 overflow-hidden">
      <Box className="aspect-[16/10] rounded-none" />
      <div className="p-5 space-y-3">
        <Box className="h-3 w-2/5" />
        <Box className="h-6 w-full" />
        <Box className="h-3 w-full" />
        <Box className="h-3 w-3/4" />
      </div>
    </div>
  );
}

/** A section title + optional "see all" link placeholder. */
export function SectionHeaderSkeleton() {
  return (
    <div className="flex items-end justify-between mb-8">
      <div className="space-y-2">
        <Box className="h-3 w-24" />
        <Box className="h-8 w-56" />
      </div>
      <Box className="h-4 w-20" />
    </div>
  );
}

export { Box as SkeletonBox };
