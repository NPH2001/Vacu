'use client';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';

export type SelectOption = { value: string; label: string };

export default function FilterSelect({
  filterKey,
  current,
  options,
  placeholder = 'Tất cả',
}: {
  filterKey: string;
  current: string | null;
  options: SelectOption[];
  placeholder?: string;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();

  return (
    <select
      value={current ?? ''}
      onChange={(e) => {
        const qs = new URLSearchParams(params.toString());
        if (e.target.value) qs.set(filterKey, e.target.value);
        else qs.delete(filterKey);
        qs.delete('page');
        router.replace(`${pathname}${qs.toString() ? `?${qs}` : ''}`, { scroll: false });
      }}
      className="admin-input pr-8 appearance-none cursor-pointer"
      style={{
        backgroundImage:
          "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='10' height='6' viewBox='0 0 10 6'><path d='M1 1l4 4 4-4' stroke='%2378716c' stroke-width='1.4' fill='none' stroke-linecap='round' stroke-linejoin='round'/></svg>\")",
        backgroundRepeat: 'no-repeat',
        backgroundPosition: 'right 12px center',
        backgroundSize: '10px 6px',
      }}>
      <option value="">{placeholder}</option>
      {options.map((opt) => (
        <option key={opt.value} value={opt.value}>{opt.label}</option>
      ))}
    </select>
  );
}
