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
    <label className="text-[12px] text-stone-500 flex items-center gap-2">
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
        className="admin-input !py-1 !px-2.5 text-[12px] cursor-pointer appearance-none pr-7"
        style={{
          backgroundImage:
            "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='10' height='6' viewBox='0 0 10 6'><path d='M1 1l4 4 4-4' stroke='%2378716c' stroke-width='1.4' fill='none' stroke-linecap='round' stroke-linejoin='round'/></svg>\")",
          backgroundRepeat: 'no-repeat',
          backgroundPosition: 'right 8px center',
          backgroundSize: '10px 6px',
        }}>
        {sizes.map((s) => <option key={s} value={s}>{s}</option>)}
      </select>
      / trang
    </label>
  );
}
