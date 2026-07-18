import { z } from 'zod';

/**
 * The contract between the page builder and the public renderer. Block `data`
 * is jsonb, so nothing at the database level guarantees its shape — every write
 * is validated against this union, and the renderer re-parses on read so a row
 * hand-edited in SQL can never crash a public page.
 */

const optImage = z.string().trim().max(500).default('');

export const heroBlock = z.object({
  type: z.literal('hero'),
  badge: z.string().max(120).default(''),
  title: z.string().max(200).default(''),
  subtitle: z.string().max(500).default(''),
  image: optImage,
});

export const richtextBlock = z.object({
  type: z.literal('richtext'),
  html: z.string().max(200000).default(''),
});

export const cardsBlock = z.object({
  type: z.literal('cards'),
  title: z.string().max(200).default(''),
  items: z.array(z.object({
    num: z.string().max(10).default(''),
    title: z.string().max(120).default(''),
    desc: z.string().max(500).default(''),
  })).max(9).default([]),
});

export const statsBlock = z.object({
  type: z.literal('stats'),
  title: z.string().max(200).default(''),
  items: z.array(z.object({
    value: z.string().max(30).default(''),
    label: z.string().max(60).default(''),
  })).max(8).default([]),
});

export const ctaBlock = z.object({
  type: z.literal('cta'),
  title: z.string().max(200).default(''),
  subtitle: z.string().max(400).default(''),
  label: z.string().max(80).default(''),
  href: z.string().max(500).default(''),
});

export const galleryBlock = z.object({
  type: z.literal('gallery'),
  title: z.string().max(200).default(''),
  images: z.array(z.string().max(500)).max(24).default([]),
});

export const productsBlock = z.object({
  type: z.literal('products'),
  title: z.string().max(200).default(''),
  // Where the products come from. `featured` is the historical behaviour and
  // the default, so blocks saved before this field existed keep working.
  source: z.enum(['featured', 'category', 'manual', 'latest', 'sale']).default('featured'),
  categoryId: z.string().max(80).default(''),          // source === 'category'
  productIds: z.array(z.string().max(80)).max(12).default([]), // source === 'manual', in display order
  limit: z.coerce.number().int().min(1).max(12).default(4),
});

export const categoriesBlock = z.object({
  type: z.literal('categories'),
  title: z.string().max(200).default(''),
  source: z.enum(['all', 'manual']).default('all'),
  categoryIds: z.array(z.string().max(80)).max(24).default([]), // source === 'manual', in display order
  limit: z.coerce.number().int().min(0).max(24).default(0),     // 0 = no cap (source === 'all')
});

export const blockSchema = z.discriminatedUnion('type', [
  heroBlock, richtextBlock, cardsBlock, statsBlock, ctaBlock, galleryBlock, productsBlock, categoriesBlock,
]);

export type Block = z.infer<typeof blockSchema>;
export type BlockType = Block['type'];

/** What the builder submits: the full ordered list, replacing what was stored. */
export const blockListSchema = z.array(z.object({
  visible: z.boolean().default(true),
  data: blockSchema,
})).max(40);

export type BlockEntry = z.infer<typeof blockListSchema>[number];

export const BLOCK_LABELS: Record<BlockType, { name: string; hint: string; icon: string }> = {
  hero: { name: 'Ảnh bìa lớn', hint: 'Ảnh nền rộng với tiêu đề đè lên — thường đặt trên cùng.', icon: '▣' },
  richtext: { name: 'Đoạn văn bản', hint: 'Chữ tự do: tiêu đề, đoạn văn, danh sách, ảnh chèn giữa bài.', icon: '¶' },
  cards: { name: 'Lưới thẻ', hint: 'Các ô có số thứ tự — hợp để liệt kê cam kết, quy trình, lý do.', icon: '⊞' },
  stats: { name: 'Dải số liệu', hint: 'Các con số lớn kèm nhãn — ví dụ 120 hộ nông dân, 5 năm.', icon: '◑' },
  cta: { name: 'Kêu gọi hành động', hint: 'Ô màu đậm có nút bấm dẫn sang trang khác.', icon: '➤' },
  gallery: { name: 'Bộ ảnh', hint: 'Nhiều ảnh xếp lưới.', icon: '❏' },
  products: { name: 'Lưới sản phẩm', hint: 'Lấy sản phẩm theo nguồn bạn chọn: nổi bật, theo danh mục, chọn tay, mới nhất, đang giảm giá.', icon: '✿' },
  categories: { name: 'Lưới danh mục', hint: 'Hiện các danh mục — tất cả hoặc chọn tay từng cái.', icon: '❖' },
};

/** Sensible starting content so a newly added block is never a blank mystery. */
export function emptyBlock(type: BlockType): Block {
  switch (type) {
    case 'hero': return { type, badge: '', title: 'Tiêu đề trang', subtitle: '', image: '' };
    case 'richtext': return { type, html: '' };
    case 'cards': return { type, title: 'Tiêu đề mục', items: [{ num: '01', title: '', desc: '' }] };
    case 'stats': return { type, title: 'Những con số', items: [{ value: '', label: '' }] };
    case 'cta': return { type, title: '', subtitle: '', label: 'Tìm hiểu thêm →', href: '/' };
    case 'gallery': return { type, title: '', images: [] };
    case 'products': return { type, title: 'Sản phẩm nổi bật', source: 'featured', categoryId: '', productIds: [], limit: 4 };
    case 'categories': return { type, title: 'Danh mục', source: 'all', categoryIds: [], limit: 0 };
  }
}

/**
 * Slugs that a static route already answers. The catch-all never sees these, so
 * a page created under one of them would be saved but never appear.
 *
 * "about" is deliberately absent: its static route was removed and /about is
 * now served from the builder like any other page.
 */
export const RESERVED_SLUGS = new Set([
  'admin', 'api', 'products', 'farmers', 'checkout', 'orders', 'contact',
  'danh-muc', 'tin-tuc', 'uploads', '_next',
]);
