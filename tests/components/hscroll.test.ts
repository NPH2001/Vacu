import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import HScroll from '@/components/HScroll';

describe('HScroll accessibility', () => {
  it('exposes a named, keyboard-focusable scroll region', () => {
    const html = renderToStaticMarkup(HScroll({
      ariaLabel: 'Sản phẩm nổi bật',
      children: createElement('article', null, 'Rau sạch'),
    }));

    expect(html).toContain('role="region"');
    expect(html).toContain('aria-label="Sản phẩm nổi bật"');
    expect(html).toContain('tabindex="0"');
  });
});
