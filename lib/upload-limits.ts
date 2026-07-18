/**
 * Upload rules shared by the server (lib/uploads.ts, the API route) and the
 * browser (lib/uploads-client.ts and the components that call it).
 *
 * Deliberately free of 'server-only' and of any Node import so both sides can
 * read the same numbers: when the client's idea of the limit drifts from the
 * server's, the UI either rejects files the server would take or accepts files
 * it then refuses.
 */
export const MAX_UPLOAD_BYTES = 4 * 1024 * 1024;

export const ALLOWED_MIME = ['image/jpeg', 'image/png', 'image/webp'] as const;

/** For an <input type="file"> accept attribute. */
export const ACCEPT_ATTR = ALLOWED_MIME.join(',');

/** "4MB" — for user-facing copy, derived so it cannot contradict the limit. */
export const MAX_UPLOAD_LABEL = `${MAX_UPLOAD_BYTES / 1024 / 1024}MB`;
