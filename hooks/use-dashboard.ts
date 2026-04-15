import { useCallback, useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import type { Difficulty, SubjectKey } from '@/data/subjects';

export type SessionRow = {
  id: string;
  subject: SubjectKey;
  difficulty: Difficulty;
  score: number;
  max_possible: number;
  completed_at: string;
  duration_sec: number | null;
};

export type SubjectStats = {
  subject: SubjectKey;
  total_quizzes: number;
  total_correct: number;
  total_answered: number;
  accuracy: number; // 0..1
};

export type DashboardData = {
  recentSessions: SessionRow[];
  bySubject: SubjectStats[];
  totalQuizzes: number;
  totalStars: number;
  totalMinutes: number;
  loading: boolean;
};

export function useDashboard(childId: string | null | undefined): DashboardData & { refresh: () => void } {
  const [recentSessions, setRecentSessions] = useState<SessionRow[]>([]);
  const [bySubject, setBySubject] = useState<SubjectStats[]>([]);
  const [totalQuizzes, setTotalQuizzes] = useState(0);
  const [totalStars, setTotalStars] = useState(0);
  const [totalMinutes, setTotalMinutes] = useState(0);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    if (!supabase || !childId) {
      setLoading(false);
      return;
    }
    setLoading(true);

    // Recent sessions (last 20)
    const { data: sessions } = await supabase
      .from('quiz_sessions')
      .select('id, subject, difficulty, score, max_possible, completed_at, duration_sec')
      .eq('child_id', childId)
      .order('completed_at', { ascending: false })
      .limit(20);

    const sessionRows = (sessions ?? []) as SessionRow[];
    setRecentSessions(sessionRows);

    // Aggregate totals
    const totalSec = sessionRows.reduce((acc, s) => acc + (s.duration_sec ?? 0), 0);
    setTotalMinutes(Math.round(totalSec / 60));

    // Per-subject stats: use full session list (not limited)
    const { data: allSessions } = await supabase
      .from('quiz_sessions')
      .select('id, subject, score, max_possible')
      .eq('child_id', childId);

    const allSessionRows = (allSessions ?? []) as { id: string; subject: SubjectKey; score: number; max_possible: number }[];

    setTotalQuizzes(allSessionRows.length);
    setTotalStars(allSessionRows.reduce((acc, s) => acc + s.score, 0));

    // For accuracy by subject, query quiz_answers for this child's sessions
    const sessionIds = allSessionRows.map((s) => s.id);
    const subjectMap = new Map<string, SubjectKey>(allSessionRows.map((s) => [s.id, s.subject]));

    const subjects: SubjectKey[] = ['math', 'science', 'language', 'gk', 'puzzles'];
    const acc: Record<SubjectKey, { quizzes: number; correct: number; answered: number }> = {
      math:     { quizzes: 0, correct: 0, answered: 0 },
      science:  { quizzes: 0, correct: 0, answered: 0 },
      language: { quizzes: 0, correct: 0, answered: 0 },
      gk:       { quizzes: 0, correct: 0, answered: 0 },
      puzzles:  { quizzes: 0, correct: 0, answered: 0 },
    };

    for (const s of allSessionRows) acc[s.subject].quizzes += 1;

    if (sessionIds.length > 0) {
      const { data: answers } = await supabase
        .from('quiz_answers')
        .select('session_id, is_correct')
        .in('session_id', sessionIds);

      for (const a of (answers ?? []) as { session_id: string; is_correct: boolean }[]) {
        const subj = subjectMap.get(a.session_id);
        if (!subj) continue;
        acc[subj].answered += 1;
        if (a.is_correct) acc[subj].correct += 1;
      }
    }

    setBySubject(
      subjects.map((s) => ({
        subject: s,
        total_quizzes: acc[s].quizzes,
        total_correct: acc[s].correct,
        total_answered: acc[s].answered,
        accuracy: acc[s].answered > 0 ? acc[s].correct / acc[s].answered : 0,
      }))
    );

    setLoading(false);
  }, [childId]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return {
    recentSessions,
    bySubject,
    totalQuizzes,
    totalStars,
    totalMinutes,
    loading,
    refresh,
  };
}
