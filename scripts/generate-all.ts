/**
 * Generate a full batch across every (subject × difficulty) slot.
 *
 * Usage:
 *   npm run gen:all -- --count=40
 *
 * Spawns the single-slot generator 12 times, serially (respects Gemini rate limits).
 */

import { spawnSync } from 'node:child_process';

const SUBJECTS = ['math', 'science', 'language', 'gk', 'puzzles'];
const DIFFICULTIES = ['easy', 'medium', 'hard'];

const countArg = process.argv.find((a) => a.startsWith('--count='));
const count = countArg ? countArg.split('=')[1] : '30';

console.log(`→ Generating ${count} questions per slot × ${SUBJECTS.length * DIFFICULTIES.length} slots`);
console.log(`→ Total target: ${Number(count) * SUBJECTS.length * DIFFICULTIES.length} questions\n`);

for (const subject of SUBJECTS) {
  for (const difficulty of DIFFICULTIES) {
    const r = spawnSync(
      'npx',
      ['tsx', 'scripts/generate-questions.ts', `--subject=${subject}`, `--difficulty=${difficulty}`, `--count=${count}`],
      { stdio: 'inherit' }
    );
    if (r.status !== 0) {
      console.error(`✗ Failed for ${subject}/${difficulty}, continuing...`);
    }
  }
}

console.log('\n✓ Done. Import with:');
console.log('  npm run import -- scripts/output/*.json');
