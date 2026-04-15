import { supabase } from './supabase';
import type { Difficulty, SubjectKey } from '@/data/subjects';

export type AnswerLog = {
  question_id?: string;
  selected_index: number | null;  // null on timeout
  is_correct: boolean;
  time_taken_ms: number;
};

export async function recordQuizSession(opts: {
  child_id: string;
  subject: SubjectKey;
  difficulty: Difficulty;
  score: number;
  max_possible: number;
  streak_best: number;
  duration_sec: number;
  answers: AnswerLog[];
}): Promise<{ session_id?: string; error?: string }> {
  if (!supabase) return { error: 'Supabase not configured' };

  const { data: session, error: sessErr } = await supabase
    .from('quiz_sessions')
    .insert({
      child_id: opts.child_id,
      subject: opts.subject,
      difficulty: opts.difficulty,
      score: opts.score,
      max_possible: opts.max_possible,
      streak_best: opts.streak_best,
      duration_sec: opts.duration_sec,
    })
    .select('id')
    .single();

  if (sessErr || !session) return { error: sessErr?.message ?? 'Failed to create session' };

  // Only insert answers that have a question_id (skip bundled-fallback questions which have no UUID)
  const validAnswers = opts.answers.filter((a) => Boolean(a.question_id));
  if (validAnswers.length > 0) {
    const { error: ansErr } = await supabase.from('quiz_answers').insert(
      validAnswers.map((a) => ({
        session_id: session.id,
        question_id: a.question_id,
        selected_index: a.selected_index,
        is_correct: a.is_correct,
        time_taken_ms: a.time_taken_ms,
      }))
    );
    if (ansErr) {
      // Session was already saved; just log the answer-insert failure
      console.warn('Failed to record per-answer rows:', ansErr.message);
    }
  }

  return { session_id: session.id };
}
