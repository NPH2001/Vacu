// One-shot: ensure an admin user exists. Reads ADMIN_EMAIL + ADMIN_PASSWORD from env.
// Safe to run repeatedly — does nothing if the email already exists.
import { drizzle } from 'drizzle-orm/node-postgres';
import { eq } from 'drizzle-orm';
import { pgTable, text, uuid, timestamp } from 'drizzle-orm/pg-core';
import { hash } from '@node-rs/argon2';
import pg from 'pg';

const email = process.env.ADMIN_EMAIL;
const password = process.env.ADMIN_PASSWORD;
const url = process.env.DATABASE_URL;

if (!url) { console.error('DATABASE_URL is required'); process.exit(1); }
if (!email || !password) {
  console.log('ADMIN_EMAIL / ADMIN_PASSWORD not set — skipping admin seed.');
  process.exit(0);
}

const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  email: text('email').notNull().unique(),
  passwordHash: text('password_hash').notNull(),
  name: text('name').notNull(),
  role: text('role').notNull().default('staff'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

const pool = new pg.Pool({ connectionString: url });
const db = drizzle(pool);

const existing = await db.select({ id: users.id }).from(users).where(eq(users.email, email)).limit(1);
if (existing.length > 0) {
  console.log(`Admin ${email} already exists — skipping.`);
} else {
  const passwordHash = await hash(password);
  await db.insert(users).values({ email, passwordHash, name: 'Admin', role: 'admin' });
  console.log(`Created admin ${email}`);
}
await pool.end();
