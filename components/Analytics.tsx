import Script from 'next/script';

/**
 * Loads Google Analytics 4 when a measurement ID is configured.
 *
 * Rendered from the public layout only, so admin activity is never counted in
 * the site owner's marketing analytics. Renders nothing when the ID is blank —
 * a fresh install ships no third-party script at all.
 *
 * `afterInteractive` defers gtag until the page is usable, so analytics never
 * delays first paint.
 */
export default function Analytics({ measurementId, nonce }: { measurementId: string; nonce?: string }) {
  const id = measurementId.trim();
  // The id is interpolated raw into the inline gtag() script below, so a value
  // like `');<script>…` would execute for every visitor. The settings schema
  // now rejects bad ids, but validate again here (defense in depth, and to
  // neutralize any value already stored before that guard existed): only a real
  // GA/GTM id shape is allowed through.
  if (!id || !/^(G|UA|GT|AW|DC)-[A-Z0-9-]+$/i.test(id)) return null;

  return (
    <>
      {/* nonce lets these run under the strict-dynamic CSP set in proxy.ts */}
      <Script src={`https://www.googletagmanager.com/gtag/js?id=${id}`} strategy="afterInteractive" nonce={nonce} />
      <Script id="ga4-init" strategy="afterInteractive" nonce={nonce}>
        {`window.dataLayer = window.dataLayer || [];
function gtag(){dataLayer.push(arguments);}
gtag('js', new Date());
gtag('config', '${id}');`}
      </Script>
    </>
  );
}
