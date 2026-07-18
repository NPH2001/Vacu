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
export default function Analytics({ measurementId }: { measurementId: string }) {
  const id = measurementId.trim();
  if (!id) return null;

  return (
    <>
      <Script src={`https://www.googletagmanager.com/gtag/js?id=${id}`} strategy="afterInteractive" />
      <Script id="ga4-init" strategy="afterInteractive">
        {`window.dataLayer = window.dataLayer || [];
function gtag(){dataLayer.push(arguments);}
gtag('js', new Date());
gtag('config', '${id}');`}
      </Script>
    </>
  );
}
