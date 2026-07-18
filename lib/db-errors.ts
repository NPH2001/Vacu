import 'server-only';

/**
 * Postgres surfaces constraint failures as opaque driver errors, and drizzle
 * wraps them, so the code may sit on the error or its cause.
 */
type PgErr = { message?: string; code?: string; cause?: { message?: string; code?: string } };

export function isFkViolation(e: unknown): boolean {
  const err = e as PgErr;
  if (err.code === '23503' || err.cause?.code === '23503') return true;
  const msg = `${err.message ?? ''} ${err.cause?.message ?? ''}`;
  return /violates foreign key|restrict/i.test(msg);
}

export function isUniqueViolation(e: unknown): boolean {
  const err = e as PgErr;
  if (err.code === '23505' || err.cause?.code === '23505') return true;
  const msg = `${err.message ?? ''} ${err.cause?.message ?? ''}`;
  return /duplicate key|unique constraint/i.test(msg);
}

/**
 * A safe, friendly Vietnamese message for a failed write. Never returns the raw
 * driver text (which leaked constraint names / SQL to the admin UI).
 */
export function friendlyWriteError(e: unknown): string {
  if (isUniqueViolation(e)) return 'Giá trị này đã tồn tại — vui lòng chọn giá trị khác.';
  if (isFkViolation(e)) return 'Không thực hiện được vì dữ liệu đang liên kết với mục khác.';
  return 'Không lưu được, vui lòng thử lại.';
}
