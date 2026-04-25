// One-shot, idempotent setup for vacu.com.vn:
//   1. Adds the 4 storefront categories (Rau Sạch Hữu Cơ, Gà ăn thảo dược,
//      Cá Tầm Nga, Thực phẩm bổ sung) with kebab-case slugs.
//   2. Rewires the existing header menu items so each one points at the
//      matching new category URL.
//
// Safe to re-run — INSERT uses ON CONFLICT DO NOTHING and UPDATE only matches
// items whose href is a legacy (/products...) or empty placeholder.
//
// Run inside the running container:
//
//   docker compose -f docker-compose.prod.yml --env-file .env \
//     exec app node scripts/setup-vacu-categories.mjs
//
// Adjust icon/description/sortOrder via /admin/categories afterwards.
import pg from 'pg';

const url = process.env.DATABASE_URL;
if (!url) {
  console.error('DATABASE_URL is required');
  process.exit(1);
}

const CATEGORIES = [
  { id: 'rau-sach-huu-co',   name: 'Rau Sạch Hữu Cơ',    icon: '🥬', description: 'Rau hữu cơ tươi mỗi ngày, không thuốc trừ sâu hóa học.', sortOrder: 10 },
  { id: 'ga-an-thao-duoc',   name: 'Gà ăn thảo dược',    icon: '🐔', description: 'Gà nuôi tự nhiên, ăn thảo dược, thịt thơm ngọt.',       sortOrder: 20 },
  { id: 'ca-tam-nga',        name: 'Cá Tầm Nga',         icon: '🐟', description: 'Cá tầm Nga nuôi tại trang trại Việt Nam.',              sortOrder: 30 },
  { id: 'thuc-pham-bo-sung', name: 'Thực phẩm bổ sung',  icon: '🌿', description: 'Thực phẩm bổ sung dinh dưỡng từ thiên nhiên.',          sortOrder: 40 },
];

// label → href (slug-based). Header menu items already have these labels from
// the boot-time seed; we just point them at the new category URL.
const MENU_REWIRE = {
  'Rau Sạch Hữu Cơ':    '/danh-muc/rau-sach-huu-co',
  'Gà ăn thảo dược':    '/danh-muc/ga-an-thao-duoc',
  'Cá Tầm Nga':         '/danh-muc/ca-tam-nga',
  'Thực phẩm bổ sung':  '/danh-muc/thuc-pham-bo-sung',
};

const pool = new pg.Pool({ connectionString: url });
const client = await pool.connect();

try {
  await client.query('BEGIN');

  console.log('Inserting categories (skip if exists)…');
  for (const c of CATEGORIES) {
    const r = await client.query(
      `INSERT INTO categories (id, name, icon, description, sort_order)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (id) DO NOTHING`,
      [c.id, c.name, c.icon, c.description, c.sortOrder],
    );
    console.log(`  ${c.id}: ${r.rowCount === 1 ? 'created' : 'already exists'}`);
  }

  console.log('Rewiring header menu items…');
  for (const [label, href] of Object.entries(MENU_REWIRE)) {
    const r = await client.query(
      `UPDATE menu_items
         SET href = $1
       WHERE label = $2
         AND location = 'header'
         AND (href LIKE '/products%' OR href = '' OR href IS NULL OR href = $1)`,
      [href, label],
    );
    console.log(`  ${label}: ${r.rowCount} row(s) updated`);
  }

  await client.query('COMMIT');
  console.log('Done.');
} catch (e) {
  await client.query('ROLLBACK');
  console.error('Failed, rolled back:', e);
  process.exitCode = 1;
} finally {
  client.release();
  await pool.end();
}
