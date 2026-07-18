import 'server-only';
import sanitizeHtml from 'sanitize-html';
import { decodeHTML } from 'entities';

/**
 * The rich-text editor is a *convenience*, not a trust boundary — its HTML
 * arrives as a plain form field and can be forged, so every path that stores
 * editor output runs it through here first. Rendering is
 * `dangerouslySetInnerHTML`, which means anything that survives this function
 * executes in the visitor's browser.
 */
const OPTIONS: sanitizeHtml.IOptions = {
  allowedTags: [
    'p', 'br', 'hr',
    'strong', 'b', 'em', 'i', 'u', 's', 'sub', 'sup',
    'h2', 'h3', 'h4',
    'ul', 'ol', 'li',
    'blockquote', 'code', 'pre',
    'a', 'img', 'figure', 'figcaption',
    'table', 'thead', 'tbody', 'tr', 'th', 'td',
    'span', 'div',
  ],
  allowedAttributes: {
    a: ['href', 'title', 'target', 'rel'],
    img: ['src', 'alt', 'title', 'width', 'height', 'loading'],
    th: ['colspan', 'rowspan'],
    td: ['colspan', 'rowspan'],
    '*': ['style'],
  },
  // Blocks `javascript:` and `data:` URIs. Relative URLs stay allowed so
  // /uploads/... images from the media library keep working.
  allowedSchemes: ['http', 'https', 'mailto', 'tel'],
  allowedSchemesAppliedToAttributes: ['href', 'src'],
  allowProtocolRelative: false,
  // Word/Google Docs paste drags in a mountain of inline styling. Rather than
  // strip style wholesale (which would lose alignment the editor sets), allow
  // only the properties the editor itself can produce.
  allowedStyles: {
    '*': {
      'text-align': [/^(left|right|center|justify)$/],
    },
  },
  transformTags: {
    // Untrusted outbound links must not get access to window.opener.
    a: (tagName, attribs) => {
      const href = attribs.href ?? '';
      const external = /^https?:\/\//i.test(href);
      return {
        tagName,
        attribs: {
          ...attribs,
          ...(external ? { target: '_blank', rel: 'noopener noreferrer nofollow' } : {}),
        },
      };
    },
  },
  // Drop the *contents* too, not just the tag — otherwise script bodies would
  // survive as visible text.
  nonTextTags: ['style', 'script', 'textarea', 'option', 'noscript', 'iframe', 'object', 'embed'],
};

export function sanitizeRichText(dirty: string): string {
  return sanitizeHtml(dirty, OPTIONS);
}

/** Block-level tags whose boundaries read as a word break once markup is gone. */
const BLOCK_TAGS = /<\/?(p|div|h[1-6]|li|ul|ol|br|blockquote|tr|td|th|figcaption|hr)\b[^>]*>/gi;

/**
 * Rich-text HTML → a plain-text summary for list cards and meta descriptions.
 *
 * Named for what it produces rather than `htmlToText`, which lib/mail.ts
 * already uses for a different job (email plain-text bodies, which keep their
 * line breaks).
 *
 * The result is plain text for text contexts — JSX children and Next's metadata
 * API, both of which escape on output. It must not be fed to
 * dangerouslySetInnerHTML: decoding is what makes it readable, and it is
 * exactly what would make raw HTML live again.
 */
export function htmlToExcerpt(html: string, max = 200): string {
  // Stripping tags alone would weld blocks together ("Tiêu đềNội dung"), so put
  // a space where each block boundary was before the markup is removed.
  const spaced = html.replace(BLOCK_TAGS, ' $&');

  // sanitize-html parses rather than regexes, so tags never survive — but it
  // *escapes* text on the way out, leaving "&amp;" as literal characters. The
  // decode turns those back into the "&" the admin actually typed; without it
  // readers see "Rau &amp; Củ" on the card and in Google.
  const stripped = sanitizeHtml(spaced, { allowedTags: [], allowedAttributes: {} });
  const text = decodeHTML(stripped)
    // &nbsp; decodes to U+00A0 — collapse it explicitly so excerpts never
    // carry invisible non-breaking spaces into meta tags.
    .replace(/\u00a0/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  return text.length > max ? text.slice(0, max - 1).trimEnd() + '…' : text;
}
