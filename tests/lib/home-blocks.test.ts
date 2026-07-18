import { describe, it, expect } from 'vitest';
import { DEFAULT_HOME_BLOCKS } from '@/lib/home-blocks';
import { blockSchema, emptyBlock, BLOCK_LABELS, type BlockType } from '@/lib/blocks';

describe('default homepage layout (data/home-blocks.json)', () => {
  it('parses and lists the sections in the expected order', () => {
    expect(DEFAULT_HOME_BLOCKS.map((b) => b.data.type)).toEqual([
      'heroSlider', 'valueProps', 'categories', 'products', 'subBox', 'farmers', 'testimonials', 'faq',
    ]);
  });

  it('every default block is visible', () => {
    expect(DEFAULT_HOME_BLOCKS.every((b) => b.visible)).toBe(true);
  });

  it('featured products and testimonials sit on the muted band', () => {
    const products = DEFAULT_HOME_BLOCKS.find((b) => b.data.type === 'products')?.data;
    const testimonials = DEFAULT_HOME_BLOCKS.find((b) => b.data.type === 'testimonials')?.data;
    expect(products?.type === 'products' && products.tone).toBe('muted');
    expect(testimonials?.type === 'testimonials' && testimonials.tone).toBe('muted');
  });
});

describe('block schemas', () => {
  const types = Object.keys(BLOCK_LABELS) as BlockType[];

  it.each(types)('emptyBlock(%s) satisfies its schema', (t) => {
    expect(blockSchema.safeParse(emptyBlock(t)).success).toBe(true);
  });

  it('a legacy products block (no source/tone) defaults to featured + default tone', () => {
    const parsed = blockSchema.parse({ type: 'products', title: 'x', limit: 4 });
    if (parsed.type !== 'products') throw new Error('wrong branch');
    expect(parsed.source).toBe('featured');
    expect(parsed.tone).toBe('default');
  });

  it('drops an unknown source rather than accepting it', () => {
    const r = blockSchema.safeParse({ type: 'products', source: 'bogus' });
    expect(r.success).toBe(false);
  });
});
