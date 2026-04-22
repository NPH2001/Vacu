import Link from 'next/link';
import type { ParsedListParams } from '@/lib/admin/list-params';
import { filterHref } from '@/lib/admin/list-params';

export type ChipOption = { value: string | null; label: string };

export default function FilterChips({
  basePath,
  parsed,
  filterKey,
  options,
}: {
  basePath: string;
  parsed: ParsedListParams;
  filterKey: string;
  options: ChipOption[];
}) {
  const active = parsed.filters[filterKey] ?? null;
  return (
    <div className="flex gap-2 flex-wrap">
      {options.map((opt) => {
        const isActive = active === opt.value;
        return (
          <Link
            key={opt.label}
            href={filterHref(basePath, parsed, filterKey, opt.value)}
            className="admin-chip"
            data-active={isActive || undefined}>
            {opt.label}
          </Link>
        );
      })}
    </div>
  );
}
