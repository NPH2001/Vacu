import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

/**
 * Seeds the homepage as a page-builder page (row id `home`, served at `/`).
 *
 * Like ensureAboutPage, this runs from *migrate* and from the seed so a fresh
 * database gets an editable homepage without waiting for a restart. It is
 * idempotent — skipped once the row exists — so it never reverts admin edits.
 * The block layout lives in data/home-blocks.json, the same file the `/` route
 * falls back to, so code and seed can never drift.
 */
export async function ensureHomePage(db) {
  const existing = await db.query("SELECT 1 FROM pages WHERE id = 'home'");
  if (existing.rows.length > 0) return;

  const dir = path.dirname(fileURLToPath(import.meta.url));
  const blocks = JSON.parse(await readFile(path.resolve(dir, '../data/home-blocks.json'), 'utf8'));
  if (!Array.isArray(blocks) || blocks.length === 0) return;

  await db.query(
    "INSERT INTO pages (id, title, status) VALUES ('home', 'Trang chủ', 'published') ON CONFLICT (id) DO NOTHING",
  );

  const rows = [];
  const params = [];
  blocks.forEach((b, i) => {
    const o = i * 4;
    rows.push(`('home', $${o + 1}, $${o + 2}, $${o + 3}, $${o + 4})`);
    params.push(b.data.type, i * 10, b.visible !== false, JSON.stringify(b.data));
  });
  await db.query(
    `INSERT INTO page_blocks (page_id, type, sort_order, visible, data) VALUES ${rows.join(', ')}`,
    params,
  );
  console.log('Seeded home page.');
}
