/**
 * Creates the /about page from the legacy site_info.about_* columns.
 *
 * The About page used to be hand-built markup at app/(public)/about/page.tsx.
 * That file is gone and /about is now served from the `pages` table, so without
 * this the route 404s on a deploy while the header still links to it.
 *
 * Runs from *migrate* (both scripts/migrate.mjs and db/migrate.ts) rather than
 * as a drizzle migration on purpose: a migration is recorded as applied the
 * first time it runs, so on a fresh database — where migrate runs before
 * site_info exists — it would be marked done having created nothing, and the
 * page would never appear. Running on every migrate is idempotent and repairs
 * itself once site_info is seeded. The seed scripts call it too, so a fresh
 * install gets the page without waiting for a restart.
 *
 * Plain SQL in .mjs because it has to work in the standalone container, which
 * has no TypeScript and no application code — only these scripts and pg.
 */
const SQL = `
DO $$
DECLARE
  si site_info%ROWTYPE;
  story_html text;
BEGIN
  -- Never touch a page the admin already has: re-running must not revert edits.
  IF EXISTS (SELECT 1 FROM pages WHERE id = 'about') THEN
    RETURN;
  END IF;

  SELECT * INTO si FROM site_info WHERE id = 1;
  IF NOT FOUND THEN
    -- Fresh database, not seeded yet. A later run (or the seed) picks this up.
    RETURN;
  END IF;

  -- about_story is a jsonb array of plain-text paragraphs; the richtext block
  -- stores HTML, so escape before wrapping in <p>. & must be replaced first or
  -- it would double-escape the entities introduced after it.
  SELECT COALESCE(
    string_agg(
      '<p>' ||
      replace(replace(replace(p, '&', '&amp;'), '<', '&lt;'), '>', '&gt;') ||
      '</p>', '' ORDER BY ord),
    '')
  INTO story_html
  FROM jsonb_array_elements_text(si.about_story) WITH ORDINALITY AS t(p, ord);

  INSERT INTO pages (id, title, status, meta_title, meta_description)
  VALUES (
    'about',
    'Câu chuyện',
    'published',
    si.about_hero_title,
    left(COALESCE(si.about_story->>0, ''), 300)
  );

  -- Shapes must match the block union in lib/blocks.ts, or lib/pages.ts drops
  -- them on read and the page renders empty.
  INSERT INTO page_blocks (page_id, type, sort_order, visible, data) VALUES
    ('about', 'hero', 0, true, jsonb_build_object(
      'badge', si.about_hero_badge,
      'title', si.about_hero_title,
      'subtitle', '',
      'image', si.about_hero_image
    )),
    ('about', 'richtext', 10, true, jsonb_build_object(
      'html', story_html
    )),
    ('about', 'cards', 20, true, jsonb_build_object(
      'title', si.about_commitments_title,
      'items', si.about_commitments
    )),
    ('about', 'stats', 30, true, jsonb_build_object(
      'title', si.about_stats_title,
      'items', jsonb_build_array(
        jsonb_build_object('value', si.stat_farmers,   'label', 'Hộ nông dân'),
        jsonb_build_object('value', si.stat_products,  'label', 'Sản phẩm'),
        jsonb_build_object('value', si.stat_customers, 'label', 'Gia đình tin dùng'),
        jsonb_build_object('value', si.stat_years || ' năm', 'label', 'Cùng đồng hành')
      )
    )),
    ('about', 'cta', 40, true, jsonb_build_object(
      'title', si.about_cta_title,
      'subtitle', si.about_cta_subtitle,
      'label', si.about_cta_label,
      'href', '/farmers'
    ));

  RAISE NOTICE 'Created /about page from site_info.';
END $$;
`;

/**
 * The container boots with `migrate && node server.js`, so anything thrown here
 * stops the site from starting at all. The tables are checked first rather than
 * trusted: `site_info%ROWTYPE` fails at parse time when the table is absent,
 * which is reachable whenever migrations have not (or could not) run — a state
 * that must degrade to "no about page yet", never to a container that won't
 * start.
 *
 * @param {{ query: (sql: string) => Promise<{ rows: Array<Record<string, unknown>> }> }} client pg Pool or Client
 */
export async function ensureAboutPage(client) {
  const { rows } = await client.query(`
    SELECT to_regclass('public.site_info') IS NOT NULL AS has_site_info,
           to_regclass('public.pages')     IS NOT NULL AS has_pages,
           to_regclass('public.page_blocks') IS NOT NULL AS has_blocks
  `);
  const ready = rows[0]?.has_site_info && rows[0]?.has_pages && rows[0]?.has_blocks;
  if (!ready) {
    console.log('Skipping /about bootstrap — tables not migrated yet.');
    return;
  }
  await client.query(SQL);
}
