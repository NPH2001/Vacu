import Link from 'next/link';

/**
 * The eyebrow + title + "see all" row above a section.
 *
 * Stacks on phones: a bottom-aligned row leaves the link stranded beside the
 * second line of a wrapped title, which reads as a stray link rather than the
 * section's action.
 */
export default function SectionHeader({
  eyebrow, title, href, linkLabel,
}: {
  eyebrow?: string;
  title: string;
  href?: string;
  linkLabel?: string;
}) {
  // An admin can clear the eyebrow and title in Settings. Render nothing at all
  // rather than leave an empty <h2> (and a stranded "see all" link) reserving a
  // blank band above the section's cards.
  const hasHeading = Boolean(eyebrow || title);
  const hasLink = Boolean(href && linkLabel);
  if (!hasHeading && !hasLink) return null;

  return (
    <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-1.5 md:gap-4 mb-6 md:mb-8">
      {hasHeading && (
        <div className="min-w-0">
          {eyebrow && (
            <div className="text-green-700 text-xs md:text-sm font-bold tracking-widest uppercase mb-1.5 md:mb-2">
              {eyebrow}
            </div>
          )}
          {title && (
            <h2 className="text-3xl md:text-4xl font-bold text-green-950 font-display wrap-anywhere">
              {title}
            </h2>
          )}
        </div>
      )}
      {href && linkLabel && (
        // Kept visible on phones: a swipe strip has no end to scroll to, so
        // this is the only route to the full list.
        <Link
          href={href}
          className="shrink-0 self-start md:self-auto text-green-700 text-sm md:text-base font-semibold hover:underline"
        >
          {linkLabel} →
        </Link>
      )}
    </div>
  );
}
