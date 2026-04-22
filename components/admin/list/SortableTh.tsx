import Link from 'next/link';
import type { ParsedListParams, ListSchema } from '@/lib/admin/list-params';
import { sortHref } from '@/lib/admin/list-params';

export default function SortableTh({
  basePath,
  parsed,
  schema,
  sortKey,
  className = 'px-4 py-2.5 font-medium',
  children,
}: {
  basePath: string;
  parsed: ParsedListParams;
  schema: ListSchema;
  sortKey: string;
  className?: string;
  children: React.ReactNode;
}) {
  const active = parsed.sort?.key === sortKey ? parsed.sort.dir : null;
  const arrow = active === 'asc' ? '↑' : active === 'desc' ? '↓' : '↕';
  return (
    <th className={className}>
      <Link
        href={sortHref(basePath, parsed, sortKey, schema)}
        className="inline-flex items-center gap-1 hover:text-green-800"
        scroll={false}>
        <span>{children}</span>
        <span className={active ? 'text-green-700' : 'text-green-900/30'}>{arrow}</span>
      </Link>
    </th>
  );
}
