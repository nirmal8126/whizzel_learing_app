/**
 * Run SQL migration files against the Supabase Postgres instance.
 *
 * Usage:
 *   npm run migrate                     # runs all .sql files in supabase/migrations
 *   npm run migrate -- <file.sql>       # runs a specific file
 *
 * Uses SUPABASE_DB_URL — direct Postgres connection (not REST API).
 */

import 'dotenv/config';
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { Client } from 'pg';

const DB_URL = process.env.SUPABASE_DB_URL;
if (!DB_URL) {
  console.error('✗ Missing SUPABASE_DB_URL in .env');
  process.exit(1);
}

async function runFile(client: Client, path: string) {
  const sql = readFileSync(path, 'utf8');
  console.log(`→ Running ${path}`);
  await client.query(sql);
  console.log(`  ✓ applied`);
}

async function main() {
  const arg = process.argv[2];
  const migrationsDir = join(process.cwd(), 'supabase', 'migrations');

  const files = arg
    ? [arg]
    : readdirSync(migrationsDir)
        .filter((f) => f.endsWith('.sql'))
        .sort()
        .map((f) => join(migrationsDir, f));

  if (files.length === 0) {
    console.log('No migration files found.');
    return;
  }

  const client = new Client({
    connectionString: DB_URL,
    ssl: { rejectUnauthorized: false },
  });

  await client.connect();
  try {
    for (const f of files) {
      await runFile(client, f);
    }
    console.log(`\n✓ ${files.length} migration(s) applied`);
  } finally {
    await client.end();
  }
}

main().catch((e) => {
  console.error('✗ Migration failed:', e.message);
  process.exit(1);
});
