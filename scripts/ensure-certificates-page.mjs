/**
 * Seeds the public "Chứng nhận" page (`/chung-nhan`) as a page-builder page.
 *
 * Same contract as ensureAboutPage / ensureHomePage: runs from *migrate* and
 * from the seed, and is idempotent — guarded on the page row so a re-run never
 * reverts an admin's edits, and so an admin who deliberately deletes the page
 * does not get it back on every deploy.
 *
 * The page is created even when the certificates table is still empty: the
 * block renders nothing until rows exist, and an empty page the admin can fill
 * beats no page at all (they would otherwise have to build it by hand to match
 * whatever /chung-nhan link is already out there).
 *
 * Block shapes must match the union in lib/blocks.ts, or lib/pages.ts drops
 * them on read and the page renders empty.
 */
/**
 * Xuất ra ngoài để test kiểm được các khối này khớp union trong lib/blocks.ts
 * (tests/lib/certificates-page-blocks.test.ts) — sai hình dạng thì lib/pages.ts
 * loại bỏ khi đọc và trang hiện ra trống trơn, không có lỗi nào báo.
 */
export const CERTIFICATES_PAGE_BLOCKS = [
  {
    type: 'hero',
    badge: 'Minh bạch từ đồng ruộng',
    title: 'Chứng nhận & Chứng chỉ',
    subtitle: 'Những giấy tờ chứng minh tiêu chuẩn sản xuất và chất lượng nông sản của chúng tôi.',
    image: '',
  },
  {
    type: 'certificates',
    title: 'Chứng nhận của chúng tôi',
    eyebrow: '',
    linkLabel: '',
    linkHref: '',
    tone: 'default',
    limit: 0,
    layout: 'grid',
  },
];

export async function ensureCertificatesPage(db) {
  const existing = await db.query("SELECT 1 FROM pages WHERE id = 'chung-nhan' LIMIT 1");
  if (existing.rows.length > 0) return;

  await db.query(`
    INSERT INTO pages (id, title, status, meta_title, meta_description)
    VALUES (
      'chung-nhan',
      'Chứng nhận',
      'published',
      'Chứng nhận & Chứng chỉ',
      'Các giấy chứng nhận, chứng chỉ chất lượng và tiêu chuẩn sản xuất.'
    )
    ON CONFLICT (id) DO NOTHING
  `);

  await db.query(
    `INSERT INTO page_blocks (page_id, type, sort_order, visible, data) VALUES
      ('chung-nhan', $1, 0, true, $2::jsonb),
      ('chung-nhan', $3, 10, true, $4::jsonb)`,
    [
      CERTIFICATES_PAGE_BLOCKS[0].type, JSON.stringify(CERTIFICATES_PAGE_BLOCKS[0]),
      CERTIFICATES_PAGE_BLOCKS[1].type, JSON.stringify(CERTIFICATES_PAGE_BLOCKS[1]),
    ],
  );
}
