/**
 * Emits a <script type="application/ld+json"> block. `data` is server-built from
 * trusted DB fields (never user-controlled markup), so stringifying is safe;
 * the </script> guard defends against any stray sequence in text fields.
 */
export default function JsonLd({ data }: { data: Record<string, unknown> }) {
  const json = JSON.stringify(data).replace(/</g, '\\u003c');
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: json }} />;
}
