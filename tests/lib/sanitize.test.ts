import { describe, it, expect } from 'vitest';
import { sanitizeRichText, htmlToExcerpt } from '@/lib/sanitize';

/**
 * The rich-text editor posts HTML as an ordinary form field, so a hostile
 * client can send anything. Post bodies are rendered with
 * dangerouslySetInnerHTML — whatever survives here runs in a visitor's browser.
 */
describe('sanitizeRichText — hostile input', () => {
  it('drops script tags and their contents', () => {
    const out = sanitizeRichText('<p>Xin chào</p><script>alert(document.cookie)</script>');
    expect(out).toContain('Xin chào');
    expect(out).not.toContain('<script');
    // The body must not survive as bare text either.
    expect(out).not.toContain('alert');
  });

  it('strips inline event handlers', () => {
    const out = sanitizeRichText('<p onclick="steal()" onmouseover="x()">text</p>');
    expect(out).not.toContain('onclick');
    expect(out).not.toContain('onmouseover');
    expect(out).toContain('text');
  });

  it('blocks javascript: links', () => {
    const out = sanitizeRichText('<a href="javascript:alert(1)">bấm</a>');
    expect(out).not.toContain('javascript:');
  });

  it('blocks data: URIs on images', () => {
    const out = sanitizeRichText('<img src="data:text/html;base64,PHNjcmlwdD5hbGVydCgxKTwvc2NyaXB0Pg==">');
    expect(out).not.toContain('data:text/html');
  });

  it('removes iframes, objects and embeds', () => {
    const out = sanitizeRichText(
      '<iframe src="https://evil.example"></iframe><object data="x"></object><embed src="y">',
    );
    expect(out).not.toContain('<iframe');
    expect(out).not.toContain('<object');
    expect(out).not.toContain('<embed');
  });

  it('strips style tags that could hide or reposition content', () => {
    const out = sanitizeRichText('<style>body{display:none}</style><p>hi</p>');
    expect(out).not.toContain('<style');
    expect(out).not.toContain('display:none');
    expect(out).toContain('hi');
  });

  it('allows only text-align in inline styles', () => {
    const out = sanitizeRichText(
      '<p style="text-align:center;position:fixed;top:0;background:url(evil)">giữa</p>',
    );
    expect(out).toContain('text-align:center');
    expect(out).not.toContain('position');
    expect(out).not.toContain('evil');
  });
});

describe('sanitizeRichText — legitimate editor output survives', () => {
  it('keeps the formatting the toolbar can produce', () => {
    const html =
      '<h2>Tiêu đề</h2><p><strong>đậm</strong> <em>nghiêng</em> <u>gạch chân</u></p>' +
      '<ul><li>một</li><li>hai</li></ul><ol><li>a</li></ol><blockquote>trích</blockquote><hr>';
    const out = sanitizeRichText(html);
    for (const tag of ['<h2>', '<strong>', '<em>', '<u>', '<ul>', '<li>', '<ol>', '<blockquote>', '<hr']) {
      expect(out).toContain(tag);
    }
  });

  it('keeps media-library images with relative paths', () => {
    const out = sanitizeRichText('<img src="/uploads/2026/07/rau.webp" alt="Rau tươi">');
    expect(out).toContain('/uploads/2026/07/rau.webp');
    expect(out).toContain('alt="Rau tươi"');
  });

  it('keeps tables pasted from Word', () => {
    const out = sanitizeRichText('<table><tbody><tr><td colspan="2">ô</td></tr></tbody></table>');
    expect(out).toContain('<table>');
    expect(out).toContain('colspan="2"');
  });

  it('hardens external links but leaves internal ones alone', () => {
    const ext = sanitizeRichText('<a href="https://example.com">ngoài</a>');
    expect(ext).toContain('rel="noopener noreferrer nofollow"');
    expect(ext).toContain('target="_blank"');

    const internal = sanitizeRichText('<a href="/tin-tuc/bai-viet">trong</a>');
    expect(internal).toContain('href="/tin-tuc/bai-viet"');
    expect(internal).not.toContain('target="_blank"');
  });

  it('is idempotent — re-saving a post does not degrade it', () => {
    const once = sanitizeRichText('<h2>T</h2><p style="text-align:center">x</p><a href="https://e.com">l</a>');
    expect(sanitizeRichText(once)).toBe(once);
  });
});

describe('htmlToExcerpt', () => {
  it('flattens markup to plain text for excerpts', () => {
    expect(htmlToExcerpt('<h2>Tiêu đề</h2><p>Nội dung <b>đậm</b>.</p>')).toBe('Tiêu đề Nội dung đậm.');
  });

  it('truncates with an ellipsis and never exceeds the limit', () => {
    const out = htmlToExcerpt(`<p>${'a'.repeat(500)}</p>`, 50);
    expect(out.length).toBeLessThanOrEqual(50);
    expect(out.endsWith('…')).toBe(true);
  });

  it('does not leak script contents into an auto-generated excerpt', () => {
    expect(htmlToExcerpt('<script>alert(1)</script><p>Thật</p>')).toBe('Thật');
  });

  /**
   * The editor stores "&" as "&amp;", and the excerpt is rendered as text — so
   * anything left encoded here reaches the reader literally, on the card and in
   * Google's snippet.
   */
  it('decodes entities instead of showing them raw', () => {
    expect(htmlToExcerpt('<p>Rau &amp; Củ</p>')).toBe('Rau & Củ');
    expect(htmlToExcerpt('<p>Giá &lt; 50k &gt; 20k</p>')).toBe('Giá < 50k > 20k');
    expect(htmlToExcerpt('<p>Bơ &quot;sáp&quot; Đắk Lắk</p>')).toBe('Bơ "sáp" Đắk Lắk');
    expect(htmlToExcerpt("<p>Rau c&#7911;a m&#7865; &#39;ngon&#39;</p>")).toBe("Rau của mẹ 'ngon'");
  });

  it('collapses &nbsp; to a plain space, not an invisible U+00A0', () => {
    const out = htmlToExcerpt('<p>Rau&nbsp;sạch</p>');
    expect(out).toBe('Rau sạch');
    expect(out).not.toContain(' ');
  });

  it('decodes tag-like text without reviving it as markup', () => {
    // Escaped source stays inert: the output is plain text for a text context.
    const out = htmlToExcerpt('<p>Dùng thẻ &lt;b&gt; để in đậm</p>');
    expect(out).toBe('Dùng thẻ <b> để in đậm');
  });
});
