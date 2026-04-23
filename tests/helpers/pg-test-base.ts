import { PostgreSqlContainer, type StartedPostgreSqlContainer } from '@testcontainers/postgresql';

export type TestDb = {
  container: StartedPostgreSqlContainer;
  url: string;
};

export async function bootPg(): Promise<TestDb> {
  const container = await new PostgreSqlContainer('postgres:17').start();
  const url = container.getConnectionUri();
  process.env.DATABASE_URL = url;
  const { migrate } = await import('drizzle-orm/node-postgres/migrator');
  const { db } = await import('@/db/client');
  await migrate(db, { migrationsFolder: './drizzle' });
  return { container, url };
}

export async function stopPg(ctx: TestDb): Promise<void> {
  const { pool } = await import('@/db/client');
  await pool.end();
  await ctx.container.stop();
}
