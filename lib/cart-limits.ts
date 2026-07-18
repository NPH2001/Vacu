/**
 * Max units of a single product per order line. Shared by the server (the
 * checkout cart schema) and the browser (cart controls) so the two can never
 * drift — a client that let a customer pick 100 while the server rejects the
 * whole order at 99 is exactly the mismatch this prevents.
 *
 * Deliberately dependency-free (no 'server-only') so both sides import it.
 */
export const MAX_LINE_QTY = 99;
