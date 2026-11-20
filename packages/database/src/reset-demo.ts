import { sql } from 'drizzle-orm';
import { getDatabase, closeDatabase } from './connection.js';
import { runMigrations } from './migrate.js';
import { seedDemoData } from './seed.js';

export async function resetDemo(db?: any) {
  if (process.env.NODE_ENV === 'production') {
    throw new Error('resetDemo is strictly prohibited in production environment.');
  }

  const targetDb = db || (await getDatabase());
  console.log('Resetting PantryOS demo data (clearing operational transactions)...');

  // Reset schema and re-run migrations cleanly
  await targetDb.execute(sql.raw(`DROP SCHEMA IF EXISTS public CASCADE`));
  await targetDb.execute(sql.raw(`CREATE SCHEMA public`));
  await runMigrations(targetDb);

  // Re-seed demo records
  await seedDemoData(targetDb);
  return { success: true, message: 'PantryOS demo state successfully reset.' };
}

if (process.argv[1]?.endsWith('reset-demo.ts') || process.argv[1]?.endsWith('reset-demo.js')) {
  (async () => {
    const result = await resetDemo();
    console.log(`✓ ${result.message}`);
    await closeDatabase();
    process.exit(0);
  })().catch(async (err) => {
    console.error('Reset demo failed:', err);
    await closeDatabase();
    process.exit(1);
  });
}
