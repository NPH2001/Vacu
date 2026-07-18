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
