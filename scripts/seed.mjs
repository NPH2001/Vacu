// Idempotent content seed. Safe to run on every container start.
// - Uses ON CONFLICT DO NOTHING for tables with a natural primary key.
// - For tables with auto-increment ids (testimonials, faq_items) skips the whole
//   table if it already has at least one row, to avoid duplication on reboot.
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import pg from 'pg';

const url = process.env.DATABASE_URL;
if (!url) { console.error('DATABASE_URL is required'); process.exit(1); }

const dataDir = process.env.SEED_DATA_DIR
  ?? path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../data');

const read = async (file) =>
  JSON.parse(await readFile(path.join(dataDir, file), 'utf8'));

const [categoriesJson, farmersJson, productsJson, testimonialsJson, faqJson, infoJson] =
  await Promise.all([
    read('categories.json'), read('farmers.json'), read('products.json'),
    read('testimonials.json'), read('faq.json'), read('info.json'),
  ]);

const pool = new pg.Pool({ connectionString: url });
const client = await pool.connect();

const tableCount = async (table) => {
  const { rows } = await client.query(`SELECT COUNT(*)::int AS n FROM ${table}`);
  return rows[0].n;
};

try {
  await client.query('BEGIN');

  console.log('Seeding categories…');
  for (const c of categoriesJson) {
    await client.query(
      `INSERT INTO categories (id, name, icon, description)
       VALUES ($1,$2,$3,$4) ON CONFLICT (id) DO NOTHING`,
      [c.id, c.name, c.icon, c.description],
    );
  }

  console.log('Seeding farmers…');
  for (const f of farmersJson) {
    await client.query(
      `INSERT INTO farmers (id, name, farm, location, years, specialty, avatar, cover, story, certifications)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) ON CONFLICT (id) DO NOTHING`,
      [f.id, f.name, f.farm, f.location, f.years, f.specialty, f.avatar, f.cover, f.story, JSON.stringify(f.certifications ?? [])],
    );
  }

  console.log('Seeding products…');
  for (const p of productsJson) {
    await client.query(
      `INSERT INTO products (id, name, category_id, unit, price, old_price, image, farmer_id, description, tags, featured, in_stock)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12) ON CONFLICT (id) DO NOTHING`,
      [p.id, p.name, p.category, p.unit, p.price, p.oldPrice ?? null, p.image, p.farmerId ?? null, p.description, JSON.stringify(p.tags ?? []), !!p.featured, !!p.inStock],
    );
  }

  if (await tableCount('testimonials') === 0) {
    console.log('Seeding testimonials…');
    for (const [i, t] of testimonialsJson.entries()) {
      await client.query(
        `INSERT INTO testimonials (name, role, avatar, content, sort_order)
         VALUES ($1,$2,$3,$4,$5)`,
        [t.name, t.role, t.avatar, t.content, i * 10],
      );
    }
  } else {
    console.log('Testimonials already present — skipping.');
  }

  if (await tableCount('faq_items') === 0) {
    console.log('Seeding FAQ…');
    for (const [i, q] of faqJson.entries()) {
      await client.query(
        `INSERT INTO faq_items (question, answer, sort_order)
         VALUES ($1,$2,$3)`,
        [q.q, q.a, i * 10],
      );
    }
  } else {
    console.log('FAQ already present — skipping.');
  }

  console.log('Seeding site_info…');
  const i = infoJson;
  await client.query(
    `INSERT INTO site_info
       (id, name, short_name, tagline, description, address, phone, email, hours,
        stat_farmers, stat_products, stat_customers, stat_years, logo_url)
     VALUES (1,$1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)
     ON CONFLICT (id) DO NOTHING`,
    [i.name, i.shortName, i.tagline, i.description, i.address, i.phone, i.email, i.hours,
     i.stats.farmers, i.stats.products, i.stats.customers, i.stats.years, i.logoUrl ?? null],
  );

  // Backfill the logo for existing installs where admin never set one.
  if (i.logoUrl) {
    await client.query(
      `UPDATE site_info SET logo_url = $1
         WHERE id = 1 AND (logo_url IS NULL OR logo_url = '')`,
      [i.logoUrl],
    );
  }

  await client.query('COMMIT');
  console.log('Done.');
} catch (err) {
  await client.query('ROLLBACK');
  throw err;
} finally {
  client.release();
  await pool.end();
}
