import Link from 'next/link';
import type { ParsedListParams, ListSchema } from '@/lib/admin/list-params';
import { pageHref } from '@/lib/admin/list-params';

export default function Pagination({
  basePath,
  parsed,
  schema,
  total,
}: {
  basePath: string;
  parsed: ParsedListParams;
  schema?: ListSchema;
  total: number;
}) {
  const totalPages = Math.max(1, Math.ceil(total / parsed.pageSize));
  const current = Math.min(parsed.page, totalPages);
  const pages = pageWindow(current, totalPages);
  const from = total === 0 ? 0 : (current - 1) * parsed.pageSize + 1;
  const to = Math.min(total, current * parsed.pageSize);

  return (
    <div className="flex items-center gap-4 text-[12.5px] text-stone-500 px-1">
      <span>
        Hiển thị <span className="tabular-nums font-medium text-stone-900">{from}–{to}</span>{' '}
        trong <span className="tabular-nums font-medium text-stone-900">{total}</span>
      </span>
      {totalPages > 1 && (
        <nav className="flex items-center gap-1">
          <PageLink basePath={basePath} parsed={parsed} schema={schema} to={current - 1}
                    disabled={current === 1}>‹</PageLink>
          {pages.map((p, i) =>
            p === null
              ? <span key={`gap-${i}`} className="px-2 text-stone-400">…</span>
              : <PageLink key={p} basePath={basePath} parsed={parsed} schema={schema} to={p}
                          active={p === current}>{p}</PageLink>,
          )}
          <PageLink basePath={basePath} parsed={parsed} schema={schema} to={current + 1}
                    disabled={current === totalPages}>›</PageLink>
        </nav>
      )}
    </div>
  );
}

function PageLink({
  basePath, parsed, schema, to, disabled, active, children,
}: {
  basePath: string;
  parsed: ParsedListParams;
  schema?: ListSchema;
  to: number;
  disabled?: boolean;
  active?: boolean;
  children: React.ReactNode;
}) {
  const base =
    'min-w-[30px] h-7 px-2 inline-flex items-center justify-center rounded-md text-[12.5px] tabular-nums transition-colors';
  const classes = active
    ? `${base} bg-stone-900 text-white`
    : `${base} bg-white border border-stone-200 text-stone-600 hover:border-stone-400 hover:text-stone-900`;
  const disabledCls = disabled ? ' opacity-40 pointer-events-none' : '';
  if (disabled) return <span className={classes + disabledCls}>{children}</span>;
  return (
    <Link href={pageHref(basePath, parsed, to, schema)} className={classes + disabledCls} scroll={false}>
      {children}
    </Link>
  );
}

function pageWindow(current: number, total: number): (number | null)[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
  const out: (number | null)[] = [1];
  const start = Math.max(2, current - 1);
  const end = Math.min(total - 1, current + 1);
  if (start > 2) out.push(null);
  for (let p = start; p <= end; p++) out.push(p);
  if (end < total - 1) out.push(null);
  out.push(total);
  return out;
}
