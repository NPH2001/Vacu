import { describe, it, expect } from 'vitest';
import { normalizeVi, searchEmojis, EMOJI_GROUPS, ALL_EMOJIS } from '@/lib/emojis';

describe('normalizeVi', () => {
  it('lowercases', () => {
    expect(normalizeVi('ABC')).toBe('abc');
  });
  it('strips Vietnamese diacritics', () => {
    expect(normalizeVi('cà rốt')).toBe('ca rot');
    expect(normalizeVi('Đầu Bếp')).toBe('dau bep');
  });
  it('converts đ/Đ to d', () => {
    expect(normalizeVi('đậu')).toBe('dau');
    expect(normalizeVi('Đà Lạt')).toBe('da lat');
  });
  it('preserves non-vietnamese letters', () => {
    expect(normalizeVi('hello world')).toBe('hello world');
  });
});

describe('searchEmojis', () => {
  it('returns all when query is empty', () => {
    expect(searchEmojis('').length).toBe(ALL_EMOJIS.length);
  });

  it('finds 🥕 for "ca rot"', () => {
    const found = searchEmojis('ca rot').map((e) => e.e);
    expect(found).toContain('🥕');
  });

  it('finds 🥕 for "cà rốt" (with diacritics)', () => {
    expect(searchEmojis('cà rốt').map((e) => e.e)).toContain('🥕');
  });

  it('finds 👨‍🌾 for "nong dan"', () => {
    expect(searchEmojis('nong dan').map((e) => e.e)).toContain('👨‍🌾');
  });

  it('finds 💚 for "tim xanh"', () => {
    expect(searchEmojis('tim xanh').map((e) => e.e)).toContain('💚');
  });

  it('finds 🌱 for "mam"', () => {
    expect(searchEmojis('mam').map((e) => e.e)).toContain('🌱');
  });

  it('can match by raw emoji char', () => {
    const found = searchEmojis('🥬').map((e) => e.e);
    expect(found).toContain('🥬');
  });

  it('returns empty for gibberish', () => {
    expect(searchEmojis('zzzxxxqqq')).toHaveLength(0);
  });
});

describe('EMOJI_GROUPS', () => {
  it('has at least 4 groups', () => {
    expect(EMOJI_GROUPS.length).toBeGreaterThanOrEqual(4);
  });
  it('each group has unique emoji entries', () => {
    for (const g of EMOJI_GROUPS) {
      const set = new Set(g.items.map((x) => x.e));
      expect(set.size).toBe(g.items.length);
    }
  });
  it('no duplicate emoji across groups', () => {
    const all = ALL_EMOJIS.map((e) => e.e);
    expect(new Set(all).size).toBe(all.length);
  });
});
