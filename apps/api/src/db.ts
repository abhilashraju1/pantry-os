import { sql } from 'drizzle-orm';
import { getDatabase, runMigrations, bootstrapSystem, seedDemoData } from '@pantryos/database';

export { getDatabase };

export async function initApiDatabase() {
  const db = await getDatabase();
  await runMigrations(db);
  // If no branch/admin exists, run bootstrap
  await bootstrapSystem(db);
  // In development/test mode, seed demo data if dishes table is empty
  const res = await db.execute(sql`SELECT count(*)::int as count FROM dishes`);
  const count = (res as any).rows?.[0]?.count ?? 0;
  if (count === 0 && process.env.NODE_ENV !== 'production') {
    await seedDemoData(db);
  }
  return db;
}
