import type { NextConfig } from "next";

// Static security headers. The Content-Security-Policy is NOT here — it's set
// per-request in proxy.ts, which mints a fresh nonce so `script-src` can drop
// `'unsafe-inline'`. A second CSP header from this file would be intersected
// with the proxy's by the browser and the nonce would stop matching, so CSP
// must live in exactly one place.
const securityHeaders = [
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), browsing-topics=()" },
  // Ignored over plain http (dev), enforced over https (prod).
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
];

const nextConfig: NextConfig = {
  output: "standalone",
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
};

export default nextConfig;
