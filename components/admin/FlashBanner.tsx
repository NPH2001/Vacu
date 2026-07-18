import Link from 'next/link';
import { flashOf } from '@/lib/admin/flash';

/**
 * Renders the outcome of a redirecting action. `basePath` is where the dismiss
 * link goes, so closing the banner drops the code from the URL rather than
 * leaving it to reappear on refresh.
 */
export default function FlashBanner({
  code, basePath,
}: { code: string | string[] | undefined; basePath: string }) {
  const flash = flashOf(code);
  if (!flash) return null;

  const isError = flash.kind === 'error';
  return (
    <div
      role="status"
      className={`admin-panel p-3.5 flex items-start gap-3 ${
        isError ? 'border-red-200 bg-red-50' : 'border-green-200 bg-green-50'
      }`}
    >
      <span className={`text-lg leading-none mt-0.5 ${isError ? 'text-red-600' : 'text-green-700'}`}>
        {isError ? '⚠' : '✓'}
      </span>
      <p className={`flex-1 text-[13px] leading-relaxed ${isError ? 'text-red-800' : 'text-green-900'}`}>
        {flash.text}
      </p>
      <Link href={basePath} aria-label="Đóng thông báo"
        className={`shrink-0 text-sm leading-none px-1.5 py-0.5 rounded hover:bg-white/60 ${
          isError ? 'text-red-500' : 'text-green-600'
        }`}>
        ✕
      </Link>
    </div>
  );
}
