export function formatPrice(v: number) {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency', currency: 'VND', maximumFractionDigits: 0,
  }).format(v);
}

// Vietnam time, set explicitly so the output is correct regardless of the
// server's ambient TZ (belt-and-braces with the container's TZ env).
const TZ = 'Asia/Ho_Chi_Minh';

/** dd/MM/yyyy — the app-wide short date. */
export function formatDate(d: Date | string | null | undefined): string {
  if (!d) return '';
  return new Date(d).toLocaleDateString('vi-VN', {
    day: '2-digit', month: '2-digit', year: 'numeric', timeZone: TZ,
  });
}

/** dd/MM/yyyy HH:mm — for timestamps (order placed, scheduled post, emails). */
export function formatDateTime(d: Date | string | null | undefined): string {
  if (!d) return '';
  return new Date(d).toLocaleString('vi-VN', {
    day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit', timeZone: TZ,
  });
}

/** "17 tháng 7, 2026" — the long form used on the article page. */
export function formatDateLong(d: Date | string | null | undefined): string {
  if (!d) return '';
  return new Date(d).toLocaleDateString('vi-VN', {
    day: '2-digit', month: 'long', year: 'numeric', timeZone: TZ,
  });
}
