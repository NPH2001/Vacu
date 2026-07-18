import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

/**
 * Seeds the homepage as a page-builder page (row id `home`, served at `/`).
 *
 * Like ensureAboutPage, this runs from *migrate* and from the seed so a fresh
 * database gets an editable homepage without waiting for a restart. It is
 * idempotent — skipped once the homepage has blocks — so it never reverts admin
 * edits. The block layout lives in data/home-blocks.json, the same file the `/`
 * route falls back to, so code and seed can never drift.
 *
 * The guard checks page_blocks, not the pages row: if a prior run inserted the
 * pages row but died before the blocks (or an admin deleted every block leaving
 * a bare row), guarding on the row alone would skip forever and leave `/` empty.
 * Guarding on blocks makes the seed self-heal — the block INSERT is one atomic
 * statement, so "any block exists" reliably means the seed already completed.
 */
export async function ensureHomePage(db) {
  const existing = await db.query("SELECT 1 FROM page_blocks WHERE page_id = 'home' LIMIT 1");
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
