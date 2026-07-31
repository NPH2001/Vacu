import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { GUIDE_SECTIONS, guideSectionText, type GuideSection } from '@/lib/admin/guide';

const SHELL = path.resolve(__dirname, '../../app/admin/(shell)');

/**
 * Đi theo từng đoạn đường dẫn trong cây route của admin; đoạn nào không có thư
 * mục trùng tên thì thử thư mục động dạng [id]. Trả về true khi chạm được một
 * page.tsx — tức link trong hướng dẫn mở ra được màn hình thật.
 */
function routeExists(href: string): boolean {
  const pathname = href.split(/[?#]/)[0];
  if (!pathname.startsWith('/admin')) return false;
  const segments = pathname.slice('/admin'.length).split('/').filter(Boolean);

  let dir = SHELL;
  for (const seg of segments) {
    const exact = path.join(dir, seg);
    if (fs.existsSync(exact) && fs.statSync(exact).isDirectory()) {
      dir = exact;
      continue;
    }
    const dynamic = fs
      .readdirSync(dir, { withFileTypes: true })
      .find((e) => e.isDirectory() && /^\[.+\]$/.test(e.name));
    if (!dynamic) return false;
    dir = path.join(dir, dynamic.name);
  }
  return fs.existsSync(path.join(dir, 'page.tsx'));
}

function allText(s: GuideSection): string[] {
  const out: string[] = [s.title, s.summary];
  for (const b of s.blocks) {
    if (b.kind === 'p' || b.kind === 'note') out.push(b.text);
    else if (b.kind === 'list' || b.kind === 'steps') out.push(...b.items);
    else if (b.kind === 'table') out.push(...b.head, ...b.rows.flat());
  }
  return out;
}

describe('nội dung hướng dẫn admin', () => {
  it('mã mục không trùng nhau (mục lục dùng làm neo)', () => {
    const ids = GUIDE_SECTIONS.map((s) => s.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('mã mục hợp lệ để làm neo trong URL', () => {
    for (const s of GUIDE_SECTIONS) expect(s.id).toMatch(/^[a-z0-9-]+$/);
  });

  it('mọi mục đều có nội dung', () => {
    for (const s of GUIDE_SECTIONS) expect(s.blocks.length).toBeGreaterThan(0);
  });

  // Một link chết trong hướng dẫn còn tệ hơn không có hướng dẫn: người mới sẽ
  // tin là mình bấm sai chứ không nghĩ tài liệu đã cũ.
  it('mọi liên kết đều trỏ tới một màn hình admin có thật', () => {
    for (const s of GUIDE_SECTIONS) {
      for (const l of s.links ?? []) {
        expect(routeExists(l.href), `${s.id}: ${l.href}`).toBe(true);
      }
    }
  });

  // Chữ đậm dùng cặp dấu sao. Lẻ một dấu là phần còn lại của câu bị in đậm hết.
  it('dấu sao đánh dấu chữ đậm luôn đi theo cặp', () => {
    for (const s of GUIDE_SECTIONS) {
      for (const text of allText(s)) {
        const stars = (text.match(/\*/g) ?? []).length;
        expect(stars % 2, `${s.id}: ${text}`).toBe(0);
      }
    }
  });

  it('bảng nào cũng có số ô đúng bằng số cột', () => {
    for (const s of GUIDE_SECTIONS) {
      for (const b of s.blocks) {
        if (b.kind !== 'table') continue;
        for (const row of b.rows) expect(row.length, `${s.id}: ${row[0]}`).toBe(b.head.length);
      }
    }
  });

  it('chuỗi tìm kiếm gom được cả chữ trong bảng', () => {
    const orders = GUIDE_SECTIONS.find((s) => s.id === 'don-hang')!;
    const text = guideSectionText(orders);
    expect(text).toContain('chuyển khoản');
    expect(text).toBe(text.toLowerCase());
  });
});
