import { describe, it, expect } from 'vitest';
import { blockSchema, emptyBlock, BLOCK_LABELS } from '@/lib/blocks';
import { certificateSchema } from '@/lib/validators';
// Script .mjs chỉ chứa dữ liệu thuần — đọc trực tiếp để test đúng thứ được seed.
import { CERTIFICATES_PAGE_BLOCKS } from '@/scripts/ensure-certificates-page.mjs';

describe('khối “Dải chứng nhận”', () => {
  it('có mặt trong danh sách khối của trình dựng trang', () => {
    expect(BLOCK_LABELS.certificates?.name).toBe('Chứng nhận');
  });

  it('khối rỗng hợp lệ theo schema', () => {
    expect(blockSchema.safeParse(emptyBlock('certificates')).success).toBe(true);
  });

  it('khối thiếu layout/limit vẫn đọc được với giá trị mặc định', () => {
    const parsed = blockSchema.parse({ type: 'certificates', title: 'x' });
    if (parsed.type !== 'certificates') throw new Error('sai nhánh');
    expect(parsed.layout).toBe('slider');
    expect(parsed.limit).toBe(0);
    expect(parsed.tone).toBe('default');
  });

  it('đọc được cả hai cách bày', () => {
    for (const layout of ['slider', 'grid'] as const) {
      const parsed = blockSchema.parse({ type: 'certificates', layout });
      if (parsed.type !== 'certificates') throw new Error('sai nhánh');
      expect(parsed.layout).toBe(layout);
    }
  });

  it('từ chối cách bày lạ thay vì âm thầm nhận', () => {
    expect(blockSchema.safeParse({ type: 'certificates', layout: 'carousel-3d' }).success).toBe(false);
  });

  it('chặn liên kết javascript: ở nút “xem tất cả”', () => {
    const parsed = blockSchema.parse({ type: 'certificates', linkHref: 'javascript:alert(1)' });
    if (parsed.type !== 'certificates') throw new Error('sai nhánh');
    expect(parsed.linkHref).toBe('');
  });
});

// Trang /chung-nhan được seed bằng SQL thô, không đi qua Zod. Sai một chữ trong
// hình dạng khối là lib/pages.ts loại bỏ khi đọc và trang hiện ra trống trơn —
// không lỗi, không cảnh báo, chỉ là một trang trắng.
describe('các khối seed cho trang /chung-nhan', () => {
  it('khớp union khối trong lib/blocks.ts', () => {
    for (const b of CERTIFICATES_PAGE_BLOCKS) {
      const r = blockSchema.safeParse(b);
      expect(r.success, `${b.type}: ${JSON.stringify(r.error?.issues ?? [])}`).toBe(true);
    }
  });

  it('gồm đúng ảnh bìa rồi tới khối chứng nhận', () => {
    expect(CERTIFICATES_PAGE_BLOCKS.map((b: { type: string }) => b.type)).toEqual(['hero', 'certificates']);
  });

  // Trang riêng về chứng nhận thì khách vào đúng để xem cho đủ — bắt bấm nút
  // mới xem tiếp là vô lý, nên trang này phải là lưới chứ không phải slider.
  it('trang /chung-nhan bày dạng lưới', () => {
    const cert = CERTIFICATES_PAGE_BLOCKS.find((b: { type: string }) => b.type === 'certificates');
    expect(cert?.layout).toBe('grid');
  });
});

describe('certificateSchema', () => {
  const valid = { name: 'OCOP 4 sao', image: '/uploads/a.webp', issuer: 'UBND tỉnh', description: 'mô tả', sortOrder: '10' };

  it('nhận dữ liệu hợp lệ và ép thứ tự về số', () => {
    const r = certificateSchema.parse(valid);
    expect(r.sortOrder).toBe(10);
  });

  it('bắt buộc có tên và ảnh', () => {
    expect(certificateSchema.safeParse({ ...valid, name: '' }).success).toBe(false);
    expect(certificateSchema.safeParse({ ...valid, image: '' }).success).toBe(false);
  });

  it('nơi cấp và mô tả được phép bỏ trống', () => {
    const r = certificateSchema.parse({ name: 'A', image: '/uploads/a.webp' });
    expect(r.issuer).toBe('');
    expect(r.description).toBe('');
  });
});
