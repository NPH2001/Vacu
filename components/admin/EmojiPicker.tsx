'use client';
import { useEffect, useRef, useState } from 'react';
import { EMOJI_GROUPS, searchEmojis, type EmojiEntry } from '@/lib/emojis';

export default function EmojiPicker({
  value, onChange, name, required, placeholder = '🌱',
}: {
  value: string;
  onChange: (v: string) => void;
  name?: string;
  required?: boolean;
  placeholder?: string;
}) {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState('');
  const [activeGroup, setActiveGroup] = useState(EMOJI_GROUPS[0].id);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  // Close and return focus to the trigger (instead of dropping it to <body>).
  const close = () => { setOpen(false); triggerRef.current?.focus(); };

  useEffect(() => {
    if (!open) return;
    const onDocClick = (e: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setOpen(false); // outside click: don't steal focus back
      }
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close();
    };
    document.addEventListener('mousedown', onDocClick);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDocClick);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  const pick = (e: string) => {
    onChange(e);
    close();
    setQ('');
  };

  const searching = q.trim().length > 0;
  const results: EmojiEntry[] = searching
    ? searchEmojis(q)
    : EMOJI_GROUPS.find((g) => g.id === activeGroup)?.items ?? [];

  return (
    <div ref={wrapperRef} className="relative inline-block">
      <div className="flex gap-2 items-center">
        <input
          type="text"
          name={name}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          required={required}
          placeholder={placeholder}
          aria-label="Biểu tượng (emoji)"
          className="w-20 admin-input text-2xl text-center"
        />
        <button
          ref={triggerRef}
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-haspopup="dialog"
          aria-expanded={open}
          className="px-3 py-2 text-sm rounded border border-green-200 bg-white hover:bg-green-50 text-green-800"
        >
          Chọn emoji
        </button>
      </div>

      {open && (
        <div
          className="absolute z-30 mt-2 left-0 w-[22rem] max-w-[90vw] bg-white border border-green-200 rounded-2xl shadow-xl p-3"
          role="dialog"
          aria-label="Chọn emoji"
        >
          <input
            autoFocus
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Tìm emoji (VD: rau, cà rốt, gia đình, tim)…"
            className="w-full admin-input text-sm mb-2"
          />
          {!searching && (
            <div className="flex gap-1 mb-2 overflow-x-auto">
              {EMOJI_GROUPS.map((g) => (
                <button
                  key={g.id}
                  type="button"
                  onClick={() => setActiveGroup(g.id)}
                  className={`whitespace-nowrap px-2.5 py-1 rounded-full text-xs border transition ${
                    activeGroup === g.id
                      ? 'bg-green-700 text-white border-green-700'
                      : 'bg-white text-green-900 border-green-200 hover:border-green-400'
                  }`}
                >
                  {g.label}
                </button>
              ))}
            </div>
          )}
          <div className="grid grid-cols-8 gap-1 max-h-64 overflow-y-auto">
            {results.length === 0 ? (
              <div className="col-span-8 py-8 text-center text-sm text-green-900/60">Không có kết quả</div>
            ) : (
              results.map((it) => (
                <button
                  key={it.e}
                  type="button"
                  onClick={() => pick(it.e)}
                  title={it.vi.join(', ')}
                  className="aspect-square rounded hover:bg-green-50 text-2xl flex items-center justify-center"
                >
                  {it.e}
                </button>
              ))
            )}
          </div>
          <div className="mt-2 text-xs text-green-900/60">
            Gõ trực tiếp cũng được — ô bên trái nhận mọi emoji bạn paste vào.
          </div>
        </div>
      )}
    </div>
  );
}
