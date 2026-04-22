import 'dotenv/config';
import { db, pool } from './client';
import { users } from './schema';
import { eq } from 'drizzle-orm';
import { hashPassword } from '@/lib/auth';

async function main() {
  const email = process.env.ADMIN_EMAIL;
  const password = process.env.ADMIN_PASSWORD;
  if (!email || !password) throw new Error('ADMIN_EMAIL and ADMIN_PASSWORD must be set');

  const existing = await db.select().from(users).where(eq(users.email, email)).limit(1);
  if (existing.length) {
    console.log(`Admin ${email} already exists — skipping.`);
  } else {
    const passwordHash = await hashPassword(password);
    await db.insert(users).values({ email, passwordHash, name: 'Admin', role: 'admin' });
    console.log(`Created admin ${email}.`);
  }
  await pool.end();
}

main().catch((err) => { console.error(err); process.exit(1); });
