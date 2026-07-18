/**
 * The homepage sections the admin can order and hide. Each key maps to a
 * hand-built section in app/(public)/page.tsx — they read different data and
 * have bespoke layouts, so unlike page blocks they cannot be added or removed,
 * only arranged.
 *
 * Deliberately free of 'server-only' and of any database import: the admin's
 * client form and db/seed.ts both read these constants. The query that needs
 * the database lives in lib/data.ts (getHomeSectionOrder).
 *
 * DEFAULT_ORDER is the source of truth for which sections exist. Adding one
 * here plus a matching entry in the page's section map is all it takes —
 * getHomeSectionOrder backfills rows the database has never seen.
 */
export const HOME_SECTIONS = {
  hero: { name: 'Ảnh bìa lớn (Hero)', hint: 'Ảnh nền, tiêu đề, 2 nút và dải số liệu trên cùng.' },
  valueProps: { name: 'Điểm giá trị', hint: 'Dải thẻ lý do chọn bạn. Sửa nội dung ở mục Điểm giá trị.' },
  categories: { name: 'Danh mục', hint: 'Lưới danh mục sản phẩm.' },
  featured: { name: 'Sản phẩm nổi bật', hint: 'Các sản phẩm đã tick "Nổi bật".' },
  subBox: { name: 'Hộp rau tuần', hint: 'Ô quảng cáo lớn với ảnh. Sửa nội dung ở Cài đặt → Trang chủ.' },
  farmers: { name: 'Nông dân', hint: '3 nông dân đầu tiên.' },
  testimonials: { name: 'Cảm nhận khách hàng', hint: 'Sửa nội dung ở mục Cảm nhận.' },
  faq: { name: 'Câu hỏi thường gặp', hint: 'Sửa nội dung ở mục Câu hỏi.' },
} as const;

export type HomeSectionKey = keyof typeof HOME_SECTIONS;

export const DEFAULT_ORDER: HomeSectionKey[] = [
  'hero', 'valueProps', 'categories', 'featured', 'subBox', 'farmers', 'testimonials', 'faq',
];

export type HomeSectionState = { key: HomeSectionKey; visible: boolean };
