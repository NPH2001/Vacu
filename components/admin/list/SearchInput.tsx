'use client';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { useRef, useState } from 'react';

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
  const urlQ = params.get('q') ?? '';
  const [value, setValue] = useState(urlQ);
  const [lastUrlQ, setLastUrlQ] = useState(urlQ);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  if (urlQ !== lastUrlQ) {
    setLastUrlQ(urlQ);
    setValue(urlQ);
  }

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
      <span
        aria-hidden
        className="absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400 text-[13px] pointer-events-none">
        ⌕
      </span>
      <input
        type="search"
        value={value}
        placeholder={placeholder}
        aria-label={placeholder}
        onChange={(e) => { setValue(e.target.value); push(e.target.value, false); }}
        className="admin-input w-full sm:w-72 pl-9"
      />
    </form>
  );
}
