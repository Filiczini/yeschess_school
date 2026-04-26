import { newDb } from 'pg-mem'
import { drizzle } from 'drizzle-orm/node-postgres'
import { Pool } from 'pg'
import * as schema from '../../db/schema.js'

/**
 * Create a fresh in-memory PostgreSQL database for testing.
 * Returns a Drizzle client connected to it.
 */
export function createTestDb() {
  const db = newDb()

  // Register pg module so pg.Pool works against pg-mem
  db.registerExtension('uuid-ossp', (schema) => {
    schema.registerFunction({
      name: 'uuid_generate_v4',
      returns: DataType.uuid,
      implementation: () => crypto.randomUUID(),
      impure: true,
    })
  })

  const pg = db.adapters.createPg()
  const pool = new Pool({ connectionString: 'postgresql://localhost/test' })

  // Monkey-patch pool.query to route to pg-mem
  const originalQuery = pool.query.bind(pool)
  pool.query = ((text: string, values?: any[]) => {
    return pg.query(text, values)
  }) as any

  const drizzleDb = drizzle(pool, { schema })

  return { db, pool, drizzleDb }
}

// Helper to run migrations against pg-mem
export async function migrateTestDb(drizzleDb: any) {
  // For simplicity, create tables manually or run drizzle migrations
  // This is a placeholder - pg-mem doesn't support all Drizzle migration features
  // In practice, we'd either:
  // 1. Use drizzle-kit push with pg-mem adapter
  // 2. Or create tables manually in tests
}
