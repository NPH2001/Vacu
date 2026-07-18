import { drizzle } from 'drizzle-orm/node-postgres';
import { migrate } from 'drizzle-orm/node-postgres/migrator';
import pg from 'pg';
import { ensureAboutPage } from './ensure-about-page.mjs';
import { ensureHomePage } from './ensure-home-page.mjs';

const url = process.env.DATABASE_URL;
if (!url) {
  console.error('DATABASE_URL is required');
  process.exit(1);
}

const pool = new pg.Pool({ connectionString: url });
const db = drizzle(pool);

console.log('Running migrations…');
await migrate(db, { migrationsFolder: './drizzle' });

// /about is served from the pages table now, so the container has to be able to
// create it without a manual step — this is the only automatic hook it has.
await ensureAboutPage(pool);
// The homepage is likewise a pages row (id `home`), served at `/`.
await ensureHomePage(pool);

console.log('Done.');
await pool.end();
