/**
 * Import generated questions into Supabase.
 *
 * Usage:
 *   npm run import -- scripts/output/math-easy-1760000000000.json
 *   npm run import -- scripts/output/*.json    (multiple files)
 *
 * Uses SUPABASE_SERVICE_ROLE_KEY (bypasses RLS) — never ship this key in the app.
 */

import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'node:fs';

const URL = process.env.EXPO_PUBLIC_SUPABASE_URL;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!URL || !SERVICE_KEY) {
  console.error('✗ Missing EXPO_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(URL, SERVICE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
});

type QuestionRow = {
  subject: string;
  difficulty: string;
  topic: string;
  q_text: string;
  options: string[];
  answer_index: number;
  explanation?: string;
  source?: string;
  status?: string;
  metadata?: Record<string, unknown>;
};

async function importFile(path: string): Promise<{ inserted: number; skipped: number }> {
  const rows = JSON.parse(readFileSync(path, 'utf8')) as QuestionRow[];
  if (!Array.isArray(rows) || rows.length === 0) {
    console.warn(`  (empty) ${path}`);
    return { inserted: 0, skipped: 0 };
  }

  // Chunk inserts so a single bad row doesn't sink the whole batch
  const CHUNK = 100;
  let inserted = 0;
  let skipped = 0;

  for (let i = 0; i < rows.length; i += CHUNK) {
    const chunk = rows.slice(i, i + CHUNK);
    const { error, count } = await supabase
      .from('questions')
      .insert(chunk, { count: 'exact' });

    if (error) {
      console.error(`  ✗ chunk ${i}-${i + chunk.length}: ${error.message}`);
      skipped += chunk.length;
    } else {
      inserted += count ?? chunk.length;
    }
  }

  return { inserted, skipped };
}

async function main() {
  const files = process.argv.slice(2);
  if (files.length === 0) {
    console.error('Usage: npm run import -- <file.json> [file2.json ...]');
    process.exit(1);
  }

  let totalIns = 0;
  let totalSkip = 0;

  for (const file of files) {
    console.log(`→ ${file}`);
    const { inserted, skipped } = await importFile(file);
    console.log(`  ✓ inserted ${inserted}, skipped ${skipped}`);
    totalIns += inserted;
    totalSkip += skipped;
  }

  console.log(`\nTotal: inserted ${totalIns}, skipped ${totalSkip}`);
}

main().catch((e) => {
  console.error('✗ Error:', e);
  process.exit(1);
});
