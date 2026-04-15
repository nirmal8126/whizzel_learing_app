/**
 * Generate kid-safe quiz questions with Gemini.
 *
 * Usage:
 *   npm run generate -- --subject=math --difficulty=easy --count=30
 *   npm run generate -- --subject=science --difficulty=hard --count=50 --topic=biology
 *
 * Output: scripts/output/<subject>-<difficulty>-<timestamp>.json
 *
 * The script runs two passes:
 *   1) Generate N questions via structured JSON output
 *   2) Safety review each question; drop any flagged as inappropriate
 */

import 'dotenv/config';
import { GoogleGenAI, Type } from '@google/genai';
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const API_KEY = process.env.GEMINI_API_KEY;
if (!API_KEY) {
  console.error('✗ Missing GEMINI_API_KEY in .env');
  process.exit(1);
}

const ai = new GoogleGenAI({ apiKey: API_KEY });
const MODEL = 'gemini-2.5-flash';

// ─── CLI args ───────────────────────────────────────────────────────
type Args = { subject: string; difficulty: string; count: number; topic?: string };
function parseArgs(): Args {
  const out: Record<string, string> = {};
  for (const arg of process.argv.slice(2)) {
    const m = arg.match(/^--([^=]+)=(.*)$/);
    if (m) out[m[1]] = m[2];
  }
  const subject = out.subject;
  const difficulty = out.difficulty;
  const count = Number(out.count ?? 20);
  if (!['math', 'science', 'language', 'gk'].includes(subject)) {
    throw new Error('--subject must be one of: math, science, language, gk');
  }
  if (!['easy', 'medium', 'hard'].includes(difficulty)) {
    throw new Error('--difficulty must be one of: easy, medium, hard');
  }
  return { subject, difficulty, count, topic: out.topic };
}

// ─── Subject / difficulty descriptors ───────────────────────────────
const SUBJECT_DESC: Record<string, string> = {
  math: 'mathematics and logical reasoning (arithmetic, geometry, patterns, word problems)',
  science: 'natural sciences (biology, physics, chemistry, astronomy, earth science)',
  language: 'English language and vocabulary (grammar, spelling, synonyms, literary devices)',
  gk: 'general knowledge (geography, history, world cultures, arts, sports)',
};

const DIFFICULTY_PROFILE: Record<string, { age: string; style: string }> = {
  easy: {
    age: 'ages 4-7',
    style: 'very simple language, short sentences, familiar concepts, no abstract reasoning',
  },
  medium: {
    age: 'ages 8-10',
    style: 'moderate vocabulary, some multi-step thinking, age-appropriate challenge',
  },
  hard: {
    age: 'ages 11+',
    style: 'richer vocabulary, critical thinking, multi-step reasoning, can reference common real-world facts',
  },
};

// ─── JSON schema for structured output ──────────────────────────────
const QUESTION_SCHEMA = {
  type: Type.ARRAY,
  items: {
    type: Type.OBJECT,
    required: ['topic', 'q', 'options', 'answer', 'explanation'],
    properties: {
      topic: { type: Type.STRING, description: 'A short lowercase topic tag like "fractions" or "solar_system"' },
      q: { type: Type.STRING, description: 'The question text' },
      options: {
        type: Type.ARRAY,
        items: { type: Type.STRING },
        minItems: 4,
        maxItems: 4,
      },
      answer: { type: Type.INTEGER, description: 'Index of the correct option (0-3)' },
      explanation: { type: Type.STRING, description: 'One short sentence explaining why the answer is correct' },
    },
  },
};

type GeneratedQuestion = {
  topic: string;
  q: string;
  options: string[];
  answer: number;
  explanation: string;
};

// ─── Prompts ────────────────────────────────────────────────────────
function buildGenerationPrompt(args: Args): string {
  const { subject, difficulty, count, topic } = args;
  const profile = DIFFICULTY_PROFILE[difficulty];
  const subjectDesc = SUBJECT_DESC[subject];
  const topicLine = topic ? `\nFocus on the topic: ${topic}.` : '';

  return `You are an expert children's educator writing a quiz for an app.

Generate ${count} unique multiple-choice questions for ${subjectDesc}.
Target audience: ${profile.age}.
Writing style: ${profile.style}.${topicLine}

REQUIREMENTS:
- Each question has exactly 4 options.
- Exactly one option is correct; "answer" is its 0-based index.
- Distractors must be plausible, not obviously wrong.
- Use variety: spread across different sub-topics, question shapes, and answer positions.
- NO violence, frightening content, religion, politics, personal identity, or cultural stereotypes.
- NO trick questions or ambiguous wording. A fair grown-up with the child's knowledge should agree on the answer.
- Each "topic" field should be a short snake_case tag (like "fractions", "solar_system", "verbs").
- Each "explanation" is ONE short sentence a child can understand.
- AVOID these common clichés: "What is 2+2", "What is the capital of France", "Who wrote Romeo and Juliet".

Return a JSON array of ${count} question objects.`;
}

const SAFETY_SCHEMA = {
  type: Type.OBJECT,
  required: ['verdicts'],
  properties: {
    verdicts: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        required: ['index', 'safe', 'reason'],
        properties: {
          index: { type: Type.INTEGER },
          safe: { type: Type.BOOLEAN },
          reason: { type: Type.STRING },
        },
      },
    },
  },
};

function buildSafetyPrompt(questions: GeneratedQuestion[], ageLabel: string): string {
  const list = questions
    .map((q, i) => `[${i}] ${q.q} — options: ${q.options.join(' / ')} — correct: ${q.options[q.answer]}`)
    .join('\n');

  return `You are reviewing quiz content for a children's app (${ageLabel}).

For each question below, decide if it is SAFE for children. Flag UNSAFE if any of:
- Scary, violent, or disturbing themes
- Religious, political, or ideological content
- Cultural stereotypes or insensitive language
- Adult themes (romance, substances, gambling, etc.)
- Factually wrong answer marked correct
- Ambiguous: more than one option could be argued correct
- Offensive or mocking language

Questions:
${list}

Return a verdict for every question by its [index].`;
}

// ─── Main ───────────────────────────────────────────────────────────
async function main() {
  const args = parseArgs();
  console.log(`→ Generating ${args.count} ${args.subject} / ${args.difficulty} questions${args.topic ? ` on "${args.topic}"` : ''}...`);

  // Pass 1: Generate
  const genResp = await ai.models.generateContent({
    model: MODEL,
    contents: buildGenerationPrompt(args),
    config: {
      responseMimeType: 'application/json',
      responseSchema: QUESTION_SCHEMA,
      temperature: 0.9, // variety
    },
  });

  const rawText = genResp.text ?? '';
  let questions: GeneratedQuestion[];
  try {
    questions = JSON.parse(rawText);
  } catch (e) {
    console.error('✗ Gemini returned invalid JSON:', rawText.slice(0, 500));
    process.exit(1);
  }

  // Structural validation
  questions = questions.filter(
    (q) =>
      q &&
      typeof q.q === 'string' &&
      Array.isArray(q.options) &&
      q.options.length === 4 &&
      q.options.every((o) => typeof o === 'string' && o.length > 0) &&
      Number.isInteger(q.answer) &&
      q.answer >= 0 &&
      q.answer <= 3 &&
      typeof q.explanation === 'string' &&
      typeof q.topic === 'string'
  );
  console.log(`  ✓ ${questions.length} structurally valid`);

  // Pass 2: Safety review
  console.log('→ Running safety review...');
  const safetyResp = await ai.models.generateContent({
    model: MODEL,
    contents: buildSafetyPrompt(questions, DIFFICULTY_PROFILE[args.difficulty].age),
    config: {
      responseMimeType: 'application/json',
      responseSchema: SAFETY_SCHEMA,
      temperature: 0.1,
    },
  });

  const safetyJson = JSON.parse(safetyResp.text ?? '{"verdicts":[]}') as {
    verdicts: Array<{ index: number; safe: boolean; reason: string }>;
  };

  const flagged = safetyJson.verdicts.filter((v) => !v.safe);
  if (flagged.length > 0) {
    console.log(`  ⚠ ${flagged.length} flagged and dropped:`);
    for (const f of flagged) {
      console.log(`    [${f.index}] ${questions[f.index]?.q?.slice(0, 60)}… — ${f.reason}`);
    }
  }
  const safeIndices = new Set(safetyJson.verdicts.filter((v) => v.safe).map((v) => v.index));
  questions = questions.filter((_, i) => safeIndices.has(i));

  console.log(`  ✓ ${questions.length} passed safety review`);

  // Write output
  const outDir = join(process.cwd(), 'scripts', 'output');
  mkdirSync(outDir, { recursive: true });
  const filename = `${args.subject}-${args.difficulty}-${Date.now()}.json`;
  const outPath = join(outDir, filename);

  const payload = questions.map((q) => ({
    subject: args.subject,
    difficulty: args.difficulty,
    topic: q.topic,
    q_text: q.q,
    options: q.options,
    answer_index: q.answer,
    explanation: q.explanation,
    source: 'ai',
    status: 'published',
    metadata: { model: MODEL, prompt_version: 'v1' },
  }));

  writeFileSync(outPath, JSON.stringify(payload, null, 2));
  console.log(`✓ Wrote ${payload.length} questions → ${outPath}`);
  console.log(`\nNext: npm run import -- ${outPath}`);
}

main().catch((e) => {
  console.error('✗ Error:', e);
  process.exit(1);
});
