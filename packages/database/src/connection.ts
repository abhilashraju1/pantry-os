import { drizzle as drizzlePglite } from 'drizzle-orm/pglite';
import { drizzle as drizzlePg } from 'drizzle-orm/node-postgres';
import { PGlite } from '@electric-sql/pglite';
import pg from 'pg';
import * as schema from './schema/index.js';

export type PantryDatabase = ReturnType<typeof drizzlePglite<typeof schema>>;

let activeDbInstance: any = null;
let activeCloser: (() => Promise<void>) | null = null;

export async function createDatabase(connectionString?: string): Promise<{ db: any; close: () => Promise<void> }> {
  const url = connectionString || process.env.DATABASE_URL;
  if (url && (url.startsWith('postgres://') || url.startsWith('postgresql://'))) {
    const pool = new pg.Pool({ connectionString: url });
    const db = drizzlePg(pool, { schema });
    return {
      db,
      close: async () => {
        await pool.end();
      }
    };
  }

  // Standalone PGlite fallback for containerless / local development and tests
  const dataDir = process.env.PG_DATA_DIR;
  const pglite = dataDir ? new PGlite(dataDir) : new PGlite();
  await pglite.waitReady;
  const db = drizzlePglite(pglite, { schema });
  return {
    db,
    close: async () => {
      await pglite.close();
    }
  };
}

export async function getDatabase(): Promise<any> {
  if (!activeDbInstance) {
    const { db, close } = await createDatabase();
    activeDbInstance = db;
    activeCloser = close;
  }
  return activeDbInstance;
}

export async function closeDatabase(): Promise<void> {
  if (activeCloser) {
    await activeCloser();
    activeDbInstance = null;
    activeCloser = null;
  }
}
