'use client';
import { useEffect, useRef, useState } from 'react';
import { slugify } from '@/lib/slugify';

const DEFAULT_CLASS =
  'w-full border border-green-200 rounded px-3 py-2 read-only:bg-green-50 read-only:text-green-900/70';

export default function SlugInput({
  defaultValue, sourceName = 'name', editing, className, placeholder, mono,
}: {
  defaultValue?: string;
  sourceName?: string;
  editing: boolean;
  className?: string;
  placeholder?: string;
  mono?: boolean;
}) {
  const initial = defaultValue ?? '';
  const [value, setValue] = useState(initial);
  const [touched, setTouched] = useState(initial.length > 0);
  const ref = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editing || touched) return;
    const input = ref.current;
    const form = input?.closest('form');
    if (!form) return;
    const source = form.querySelector<HTMLInputElement | HTMLTextAreaElement>(`[name="${sourceName}"]`);
    if (!source) return;
    const handler = () => setValue(slugify(source.value));
    source.addEventListener('input', handler);
    return () => source.removeEventListener('input', handler);
  }, [editing, sourceName, touched]);

  return (
    <input
      ref={ref}
      type="text"
      name="id"
      value={value}
      readOnly={editing}
      required
      pattern="[a-z0-9-]+"
      placeholder={placeholder}
      className={`${className ?? DEFAULT_CLASS}${mono ? ' font-mono' : ''}`}
      onChange={(e) => {
        setTouched(true);
        setValue(e.target.value);
      }}
    />
  );
}
