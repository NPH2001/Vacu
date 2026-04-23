import { describe, it, expect } from 'vitest';
import { renderTemplate, htmlToText } from '@/lib/mail';

describe('renderTemplate', () => {
  it('substitutes {{var}} with HTML-escaped value', () => {
    const out = renderTemplate('Hi {{name}}', { name: 'A & B' });
    expect(out).toBe('Hi A &amp; B');
  });

  it('treats rawKeys as unescaped HTML', () => {
    const out = renderTemplate('X {{block}}', { block: '<b>bold</b>' }, ['block']);
    expect(out).toBe('X <b>bold</b>');
  });

  it('escapes regular keys but keeps rawKeys verbatim', () => {
    const out = renderTemplate(
      '{{name}} + {{raw}}',
      { name: '<script>', raw: '<script>ok</script>' },
      ['raw'],
    );
    expect(out).toContain('&lt;script&gt;');
    expect(out).toContain('<script>ok</script>');
  });

  it('handles whitespace inside {{ }}', () => {
    expect(renderTemplate('Hi {{  name  }}', { name: 'A' })).toBe('Hi A');
  });

  it('replaces missing vars with empty string', () => {
    expect(renderTemplate('Hi {{missing}}!', {})).toBe('Hi !');
  });

  it('replaces multiple occurrences', () => {
    expect(renderTemplate('{{x}}-{{x}}', { x: 'a' })).toBe('a-a');
  });
});

describe('htmlToText', () => {
  it('strips tags', () => {
    expect(htmlToText('<p>Hello <b>world</b></p>')).toContain('Hello world');
  });

  it('converts <br> to newline', () => {
    expect(htmlToText('a<br>b<br/>c')).toContain('a\nb\nc');
  });

  it('strips <style> blocks entirely', () => {
    const out = htmlToText('<style>body{color:red}</style>Hello');
    expect(out).not.toContain('color:red');
    expect(out).toContain('Hello');
  });

  it('strips <script> blocks entirely', () => {
    const out = htmlToText('<script>alert(1)</script>Hi');
    expect(out).not.toContain('alert');
    expect(out).toContain('Hi');
  });

  it('decodes common entities', () => {
    expect(htmlToText('A &amp; B &lt;x&gt; &quot;ok&quot;')).toBe('A & B <x> "ok"');
  });

  it('adds newlines after block tags', () => {
    expect(htmlToText('<h1>Title</h1><p>Body</p>')).toMatch(/Title\nBody/);
  });

  it('collapses 3+ newlines', () => {
    expect(htmlToText('<p>a</p><p></p><p></p><p>b</p>')).not.toMatch(/\n{3,}/);
  });
});
