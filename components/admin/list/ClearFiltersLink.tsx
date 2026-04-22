import Link from 'next/link';
import type { ParsedListParams } from '@/lib/admin/list-params';
import { clearHref, hasAnyListParam } from '@/lib/admin/list-params';

export default function ClearFiltersLink({
  basePath,
  parsed,
  label = 'Xoá bộ lọc',
}: {
  basePath: string;
  parsed: ParsedListParams;
  label?: string;
}) {
  if (!hasAnyListParam(parsed)) return null;
  return (
    <Link
      href={clearHref(basePath)}
      className="text-[12px] text-stone-500 hover:text-stone-900 transition-colors inline-flex items-center gap-1">
      {label}
      <span aria-hidden>✕</span>
    </Link>
  );
}
