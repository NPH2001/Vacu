import { describe, it, expect } from 'vitest';
import { blockSchema, emptyBlock, BLOCK_LABELS } from '@/lib/blocks';
import { catalogSchema } from '@/lib/validators';
// Script .mjs chỉ chứa dữ liệu thuần — đọc trực tiếp để test đúng thứ được seed.
import { CATALOGS_PAGE_BLOCKS } from '@/scripts/ensure-catalogs-page.mjs';

describe('khối Catalog', () => {
  it('có mặt trong danh sách khối của trình dựng trang', () => {
    expect(BLOCK_LABELS.catalogs?.name).toBe('Catalog');
  });

  it('khối rỗng hợp lệ theo schema', () => {
    expect(blockSchema.safeParse(emptyBlock('catalogs')).success).toBe(true);
  });

  it('thiếu layout/limit vẫn đọc được với giá trị mặc định', () => {
    const parsed = blockSchema.parse({ type: 'catalogs', title: 'x' });
    if (parsed.type !== 'catalogs') throw new Error('sai nhánh');
    expect(parsed.layout).toBe('slider');
    expect(parsed.limit).toBe(0);
  });

  it('từ chối cách bày lạ', () => {
    expect(blockSchema.safeParse({ type: 'catalogs', layout: 'flipbook' }).success).toBe(false);
  });

  it('chặn liên kết javascript: ở nút “xem tất cả”', () => {
    const parsed = blockSchema.parse({ type: 'catalogs', linkHref: 'javascript:alert(1)' });
    if (parsed.type !== 'catalogs') throw new Error('sai nhánh');
    expect(parsed.linkHref).toBe('');
  });
});

describe('các khối seed cho trang /catalogs', () => {
  it('khớp union khối trong lib/blocks.ts', () => {
    for (const b of CATALOGS_PAGE_BLOCKS) {
      const r = blockSchema.safeParse(b);
      expect(r.success, `${b.type}: ${JSON.stringify(r.error?.issues ?? [])}`).toBe(true);
    }
  });

  it('trang /catalogs bày dạng lưới', () => {
    const block = CATALOGS_PAGE_BLOCKS.find((b: { type: string }) => b.type === 'catalogs');
    expect(block?.layout).toBe('grid');
  });
});

describe('catalogSchema', () => {
  const valid = {
    name: 'Catalog nông sản 2026',
    description: 'Trọn bộ sản phẩm',
    pages: ['/uploads/p1.webp', '/uploads/p2.webp'],
    sortOrder: '10',
  };

  it('nhận dữ liệu hợp lệ và ép thứ tự về số', () => {
    const r = catalogSchema.parse(valid);
    expect(r.sortOrder).toBe(10);
    expect(r.pages).toHaveLength(2);
  });

  it('giữ nguyên thứ tự trang đã gửi lên — trang 1 là bìa', () => {
    const r = catalogSchema.parse({ ...valid, pages: ['/b.webp', '/a.webp', '/c.webp'] });
    expect(r.pages).toEqual(['/b.webp', '/a.webp', '/c.webp']);
  });

  // Catalog không trang nào thì thẻ ngoài web sẽ là một ô ảnh vỡ.
  it('bắt buộc có ít nhất một trang', () => {
    const r = catalogSchema.safeParse({ ...valid, pages: [] });
    expect(r.success).toBe(false);
    expect(r.error?.issues[0]?.message).toMatch(/ít nhất một ảnh/i);
  });

  it('bắt buộc có tên', () => {
    expect(catalogSchema.safeParse({ ...valid, name: '' }).success).toBe(false);
  });

  it('mặc định là hiện trên web', () => {
    expect(catalogSchema.parse({ name: 'A', pages: ['/a.webp'] }).visible).toBe(true);
  });

  it('bỏ tick thì lưu là ẩn', () => {
    expect(catalogSchema.parse({ name: 'A', pages: ['/a.webp'], visible: false }).visible).toBe(false);
  });

  it('mô tả được phép bỏ trống', () => {
    const r = catalogSchema.parse({ name: 'A', pages: ['/a.webp'] });
    expect(r.description).toBe('');
  });

  it('chặn catalog quá 60 trang', () => {
    const many = Array.from({ length: 61 }, (_, i) => `/uploads/p${i}.webp`);
    expect(catalogSchema.safeParse({ ...valid, pages: many }).success).toBe(false);
  });
});
