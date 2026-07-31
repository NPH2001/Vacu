/**
 * Seeds the public "Catalog" page (`/catalogs`) as a page-builder page.
 *
 * Same contract as ensureAboutPage / ensureCertificatesPage: runs from *migrate*
 * and from the seed, guarded on the page row so a re-run never reverts admin
 * edits — and so an admin who deletes the page does not get it back on every
 * deploy.
 *
 * Created even while the catalogs table is empty: the block renders nothing
 * until a catalog has pages, and an empty page the admin can fill beats no page
 * at all.
 */

/**
 * Xuất ra ngoài để test kiểm được các khối này khớp union trong lib/blocks.ts
 * (tests/lib/catalogs-block.test.ts) — sai hình dạng thì lib/pages.ts loại bỏ
 * khi đọc và trang hiện ra trống trơn, không có lỗi nào báo.
 */
export const CATALOGS_PAGE_BLOCKS = [
  {
    type: 'hero',
    badge: 'Trọn bộ sản phẩm',
    title: 'Catalog sản phẩm',
    subtitle: 'Xem toàn bộ danh mục sản phẩm của chúng tôi theo từng trang.',
    image: '',
  },
  {
    type: 'catalogs',
    title: 'Các bộ catalog',
    eyebrow: '',
    linkLabel: '',
    linkHref: '',
    tone: 'default',
    limit: 0,
    // Trang riêng về catalog thì hiện hết, không bắt bấm nút mới xem tiếp.
    layout: 'grid',
  },
];

export async function ensureCatalogsPage(db) {
  const existing = await db.query("SELECT 1 FROM pages WHERE id = 'catalogs' LIMIT 1");
  if (existing.rows.length > 0) return;

  await db.query(`
    INSERT INTO pages (id, title, status, meta_title, meta_description)
    VALUES (
      'catalogs',
      'Catalog sản phẩm',
      'published',
      'Catalog sản phẩm',
      'Danh mục sản phẩm đầy đủ — xem trực tiếp từng trang catalog.'
    )
    ON CONFLICT (id) DO NOTHING
  `);

  await db.query(
    `INSERT INTO page_blocks (page_id, type, sort_order, visible, data) VALUES
      ('catalogs', $1, 0, true, $2::jsonb),
      ('catalogs', $3, 10, true, $4::jsonb)`,
    [
      CATALOGS_PAGE_BLOCKS[0].type, JSON.stringify(CATALOGS_PAGE_BLOCKS[0]),
      CATALOGS_PAGE_BLOCKS[1].type, JSON.stringify(CATALOGS_PAGE_BLOCKS[1]),
    ],
  );
}
