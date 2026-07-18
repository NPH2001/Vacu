import Link from 'next/link';
import type { ParsedListParams, ListSchema } from '@/lib/admin/list-params';
import { sortHref } from '@/lib/admin/list-params';

export default function SortableTh({
  basePath,
  parsed,
  schema,
  sortKey,
  className,
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
  // Announce the column and its sort state to screen readers: scope ties data
  // cells to this header, aria-sort exposes the current direction, and the
  // link's title says what a click will do.
  const ariaSort = active === 'asc' ? 'ascending' : active === 'desc' ? 'descending' : 'none';
  const nextDir = active === 'asc' ? 'giảm dần' : 'tăng dần';
  return (
    <th scope="col" aria-sort={ariaSort} className={className}>
      <Link
        href={sortHref(basePath, parsed, sortKey, schema)}
        className="inline-flex items-center gap-1.5 hover:text-stone-900 transition-colors"
        title={`Sắp xếp ${nextDir}`}
        scroll={false}>
        <span>{children}</span>
        <span
          className={active ? 'text-stone-900' : 'text-stone-300'}
          aria-hidden>
          {arrow}
        </span>
      </Link>
    </th>
  );
}
