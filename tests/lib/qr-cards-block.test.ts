import { describe, expect, it } from 'vitest';
import { BLOCK_LABELS, blockSchema, emptyBlock } from '@/lib/blocks';

describe('khối “Thẻ và mã QR”', () => {
  it('có mặt trong danh sách khối của trình dựng trang', () => {
    expect(BLOCK_LABELS.qrCards?.name).toBe('Thẻ và mã QR');
  });

  it('khối mới có tiêu đề và cách bày phù hợp', () => {
    const block = emptyBlock('qrCards');
    expect(blockSchema.safeParse(block).success).toBe(true);
    expect(block).toMatchObject({
      type: 'qrCards',
      title: 'Thẻ Và Mã QR',
      eyebrow: '',
      linkLabel: '',
      linkHref: '',
      layout: 'slider',
      images: [],
    });
  });

  it('chặn liên kết javascript: ở nút phần đầu', () => {
    const parsed = blockSchema.parse({ type: 'qrCards', linkHref: 'javascript:alert(1)' });
    if (parsed.type !== 'qrCards') throw new Error('sai nhánh');
    expect(parsed.linkHref).toBe('');
  });

  it('đọc được slider và lưới, nhưng từ chối cách bày lạ', () => {
    for (const layout of ['slider', 'grid'] as const) {
      const parsed = blockSchema.parse({ type: 'qrCards', layout });
      if (parsed.type !== 'qrCards') throw new Error('sai nhánh');
      expect(parsed.layout).toBe(layout);
    }
    expect(blockSchema.safeParse({ type: 'qrCards', layout: 'carousel-3d' }).success).toBe(false);
  });

  it('giữ đúng thứ tự ảnh và giới hạn tối đa 24 ảnh', () => {
    const images = ['/uploads/b.webp', '/uploads/a.webp'];
    const parsed = blockSchema.parse({ type: 'qrCards', images });
    if (parsed.type !== 'qrCards') throw new Error('sai nhánh');
    expect(parsed.images).toEqual(images);

    const tooMany = Array.from({ length: 25 }, (_, i) => `/uploads/${i}.webp`);
    expect(blockSchema.safeParse({ type: 'qrCards', images: tooMany }).success).toBe(false);
  });
});
