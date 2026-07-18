import type { NextConfig } from "next";

const isDev = process.env.NODE_ENV !== "production";

// Content-Security-Policy. Next injects inline bootstrap/hydration scripts and
// the app uses an inline theme <style> + inline GA snippet, so `script-src`/
// `style-src` keep `'unsafe-inline'` (a nonce-based strict policy would be the
// stricter follow-up). Even so, this locks the high-value directives:
//   - object-src 'none'      → no plugins/Flash
//   - base-uri 'self'        → no injected <base> to hijack relative URLs
//   - frame-ancestors 'none' → clickjacking protection
//   - form-action 'self'     → forms can't be pointed at an attacker origin
//   - script/connect allow-listed to self + Google Analytics only
// `img-src https:` allows admin-set external images and the VietQR image.
const csp = [
  "default-src 'self'",
  "base-uri 'self'",
  "object-src 'none'",
  "frame-ancestors 'none'",
  "form-action 'self'",
  "img-src 'self' data: https:",
  `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ""} https://www.googletagmanager.com https://www.google-analytics.com`,
  "style-src 'self' 'unsafe-inline'",
  "font-src 'self' data:",
  "connect-src 'self' https://www.googletagmanager.com https://www.google-analytics.com https://region1.google-analytics.com",
  "frame-src 'self'",
].join("; ");

const securityHeaders = [
  { key: "Content-Security-Policy", value: csp },
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
