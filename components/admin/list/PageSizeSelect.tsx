'use client';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';

export default function PageSizeSelect({
  sizes = [10, 25, 50],
  defaultSize = 25,
}: {
  sizes?: readonly number[];
  defaultSize?: number;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const current = Number.parseInt(params.get('pageSize') ?? '', 10) || defaultSize;

  return (
    <label className="text-xs text-green-900/70 flex items-center gap-1">
      <select
        value={current}
        onChange={(e) => {
          const next = Number.parseInt(e.target.value, 10);
          const qs = new URLSearchParams(params.toString());
          if (next === defaultSize) qs.delete('pageSize');
          else qs.set('pageSize', String(next));
          qs.delete('page');
          router.replace(`${pathname}${qs.toString() ? `?${qs}` : ''}`, { scroll: false });
        }}
        className="rounded border border-green-200 bg-white px-2 py-1 text-xs
                   focus:border-green-500 focus:outline-none">
        {sizes.map((s) => <option key={s} value={s}>{s}</option>)}
      </select>
      / trang
    </label>
  );
}
