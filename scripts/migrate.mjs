import { drizzle } from 'drizzle-orm/node-postgres';
import { migrate } from 'drizzle-orm/node-postgres/migrator';
import pg from 'pg';

const url = process.env.DATABASE_URL;
if (!url) {
  console.error('DATABASE_URL is required');
  process.exit(1);
}

const pool = new pg.Pool({ connectionString: url });
const db = drizzle(pool);

console.log('Running migrations…');
await migrate(db, { migrationsFolder: './drizzle' });
console.log('Done.');
await pool.end();
