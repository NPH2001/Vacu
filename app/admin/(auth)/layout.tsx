// Nonce-based CSP (proxy.ts) requires dynamic rendering: a statically-prerendered
// login/forgot page would ship scripts stamped with a build-time nonce that can't
// match the per-request CSP header, so the browser would block all of them. The
// (shell) group is already dynamic via requireAdmin(); this covers the (auth) group.
export const dynamic = 'force-dynamic';

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
