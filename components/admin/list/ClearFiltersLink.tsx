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
      className="text-sm text-green-900/60 hover:text-green-900 underline underline-offset-2">
      {label} ✕
    </Link>
  );
}
