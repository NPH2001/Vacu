/**
 * Fire a GA4 event if analytics is loaded. No-ops when GA isn't configured
 * (window.gtag undefined) or on the server, so callers never need to guard.
 */
export function trackEvent(name: string, params: Record<string, unknown>): void {
  if (typeof window === 'undefined') return;
  const g = (window as unknown as { gtag?: (...args: unknown[]) => void }).gtag;
  if (typeof g === 'function') g('event', name, params);
}
