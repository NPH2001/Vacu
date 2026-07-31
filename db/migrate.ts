import 'dotenv/config';
import { migrate } from 'drizzle-orm/node-postgres/migrator';
import { db, pool } from './client';
// Shared with scripts/migrate.mjs so dev and the container build /about the
// same way — see the note in that file for why it lives outside the migrations.
import { ensureAboutPage } from '../scripts/ensure-about-page.mjs';
import { ensureHomePage } from '../scripts/ensure-home-page.mjs';
import { ensureCertificatesPage } from '../scripts/ensure-certificates-page.mjs';
import { ensureCatalogsPage } from '../scripts/ensure-catalogs-page.mjs';

async function main() {
  console.log('Running migrations...');
  await migrate(db, { migrationsFolder: './drizzle' });
  await ensureAboutPage(pool);
  await ensureHomePage(pool);
  await ensureCertificatesPage(pool);
  await ensureCatalogsPage(pool);
  console.log('Done.');
  await pool.end();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
