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
  return (
    <th className={className}>
      <Link
        href={sortHref(basePath, parsed, sortKey, schema)}
        className="inline-flex items-center gap-1.5 hover:text-stone-900 transition-colors"
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
