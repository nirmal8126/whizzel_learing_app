import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Difficulty, SubjectKey } from '@/data/subjects';
import { QUESTIONS as BUNDLED } from '@/data/questions';
import { supabase, isSupabaseConfigured } from './supabase';

export type RemoteQuestion = {
  id: string;
  subject: SubjectKey;
  difficulty: Difficulty;
  topic: string | null;
  q_text: string;
  options: string[];
  answer_index: number;
  explanation: string | null;
};

export type Question = {
  q: string;
  options: string[];
  answer: number;
  id?: string;
  topic?: string | null;
  explanation?: string | null;
};

const CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours
const CACHE_PREFIX = 'bqa:questions:v1:';

type CacheEnvelope = { fetchedAt: number; questions: Question[] };

function cacheKey(subject: SubjectKey, difficulty: Difficulty) {
  return `${CACHE_PREFIX}${subject}:${difficulty}`;
}

function mapRow(r: RemoteQuestion): Question {
  return {
    id: r.id,
    q: r.q_text,
    options: r.options,
    answer: r.answer_index,
    topic: r.topic,
    explanation: r.explanation,
  };
}

async function readCache(subject: SubjectKey, difficulty: Difficulty): Promise<Question[] | null> {
  try {
    const raw = await AsyncStorage.getItem(cacheKey(subject, difficulty));
    if (!raw) return null;
    const env = JSON.parse(raw) as CacheEnvelope;
    if (Date.now() - env.fetchedAt > CACHE_TTL_MS) return null;
    return env.questions;
  } catch {
    return null;
  }
}

async function writeCache(subject: SubjectKey, difficulty: Difficulty, questions: Question[]) {
  const env: CacheEnvelope = { fetchedAt: Date.now(), questions };
  await AsyncStorage.setItem(cacheKey(subject, difficulty), JSON.stringify(env));
}

async function readStaleCache(subject: SubjectKey, difficulty: Difficulty): Promise<Question[] | null> {
  try {
    const raw = await AsyncStorage.getItem(cacheKey(subject, difficulty));
    if (!raw) return null;
    const env = JSON.parse(raw) as CacheEnvelope;
    return env.questions;
  } catch {
    return null;
  }
}

async function fetchRemote(subject: SubjectKey, difficulty: Difficulty): Promise<Question[] | null> {
  if (!isSupabaseConfigured || !supabase) return null;

  const { data, error } = await supabase
    .from('questions')
    .select('id, subject, difficulty, topic, q_text, options, answer_index, explanation')
    .eq('subject', subject)
    .eq('difficulty', difficulty)
    .eq('status', 'published')
    .limit(100);

  if (error || !data) return null;
  return (data as RemoteQuestion[]).map(mapRow);
}

/**
 * Fetch questions for (subject, difficulty).
 *
 * Resolution order:
 *   1. Fresh cache (<24h old)
 *   2. Supabase (writes to cache on success)
 *   3. Stale cache (better than nothing)
 *   4. Bundled JSON (always available, ships with app)
 */
export async function getQuestions(subject: SubjectKey, difficulty: Difficulty): Promise<Question[]> {
  const fresh = await readCache(subject, difficulty);
  if (fresh && fresh.length > 0) return fresh;

  const remote = await fetchRemote(subject, difficulty);
  if (remote && remote.length > 0) {
    await writeCache(subject, difficulty, remote);
    return remote;
  }

  const stale = await readStaleCache(subject, difficulty);
  if (stale && stale.length > 0) return stale;

  return BUNDLED[subject][difficulty];
}
