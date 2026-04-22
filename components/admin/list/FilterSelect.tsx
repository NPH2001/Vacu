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
      className="rounded-full border border-green-200 bg-white px-3 py-1.5 text-sm
                 focus:border-green-500 focus:outline-none">
      <option value="">{placeholder}</option>
      {options.map((opt) => (
        <option key={opt.value} value={opt.value}>{opt.label}</option>
      ))}
    </select>
  );
}
