import { Children } from 'react';

/**
 * A row of cards that swipes sideways on phones and becomes a normal grid from
 * `md` up.
 *
 * Why: stacking a row of cards into a phone-width column makes sections
 * enormous (featured products measured 3936px tall on a 390px screen). Swiping
 * keeps a section near one screen tall.
 *
 * Two details that make it feel native rather than like a stretched grid:
 *
 * - Full bleed. `-mx-4` cancels the page gutter so the strip starts at the
 *   screen edge and cards slide off it, while the matching `px-4` keeps the
 *   first card aligned with the headings above. Without this the strip would
 *   sit in a 358px box and waste both margins.
 * - Peek. Cards are sized in `vw` so the next one is partly visible — that
 *   sliver is what tells a reader there is more to swipe, with no arrows or
 *   dots to maintain.
 *
 * The wrapper is a plain sizing element, never a styled card: the children are
 * the cards, and a card inside a card reads as a boxed-in mess.
 */
export default function HScroll({
  children,
  /** Card width while swiping. Leave the default unless cards are unusually wide. */
  itemClass = 'w-[78vw] max-w-[300px]',
  /** Grid used from `md` up, where there is room for a real grid. */
  gridClass = 'md:grid-cols-3 lg:grid-cols-4',
  className = '',
}: {
  children: React.ReactNode;
  itemClass?: string;
  gridClass?: string;
  className?: string;
}) {
  return (
    <div
      className={
        'flex gap-4 overflow-x-auto snap-x snap-mandatory scroll-px-4 px-4 -mx-4 pb-1 hide-scrollbar ' +
        // From md the same markup is a grid: overflow-visible stops the scroll
        // container from clipping hover shadows, and the negative margin goes.
        'md:grid md:gap-6 md:overflow-visible md:mx-0 md:px-0 md:pb-0 ' +
        gridClass + ' ' + className
      }
    >
      {Children.map(children, (child, i) => (
        <div
          key={i}
          // shrink-0 stops flex from squeezing cards to fit; md:w-auto hands
          // sizing back to the grid. `[&>*]:h-full` stretches the card to the
          // tallest in the row so the strip has one clean bottom edge instead
          // of a ragged one.
          className={`snap-start shrink-0 ${itemClass} md:w-auto md:max-w-none [&>*]:h-full`}
        >
          {child}
        </div>
      ))}
    </div>
  );
}
