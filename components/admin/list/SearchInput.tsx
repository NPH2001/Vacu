'use client';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';

export default function SearchInput({
  placeholder = 'Tìm kiếm…',
  debounceMs = 250,
}: {
  placeholder?: string;
  debounceMs?: number;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const initial = params.get('q') ?? '';
  const [value, setValue] = useState(initial);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    setValue(initial);
  }, [initial]);

  function push(next: string, immediate: boolean) {
    const qs = new URLSearchParams(params.toString());
    if (next) qs.set('q', next); else qs.delete('q');
    qs.delete('page');
    const href = `${pathname}${qs.toString() ? `?${qs}` : ''}`;
    const go = () => router.replace(href, { scroll: false });
    if (timer.current) clearTimeout(timer.current);
    if (immediate) go();
    else timer.current = setTimeout(go, debounceMs);
  }

  return (
    <form
      onSubmit={(e) => { e.preventDefault(); push(value, true); }}
      className="relative">
      <input
        type="search"
        value={value}
        placeholder={placeholder}
        onChange={(e) => { setValue(e.target.value); push(e.target.value, false); }}
        className="w-64 rounded-full border border-green-200 bg-white px-4 py-1.5 text-sm
                   focus:border-green-500 focus:outline-none"
      />
    </form>
  );
}
