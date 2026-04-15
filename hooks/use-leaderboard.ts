import { useCallback, useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import type { Child } from '@/hooks/use-children';

export type LeaderboardEntry = {
  child: Child;
  totalStars: number;
  quizzesCompleted: number;
  subjectsTried: number;
  hasPerfect: boolean;
  rank: number;
};

/**
 * Sibling leaderboard: ranks all children on the current parent's account by
 * total stars (desc), then quizzes completed (desc) as a tiebreaker.
 *
 * Reads `progress` rows for the parent's children. RLS already restricts to
 * the parent's own children, so no extra filtering needed.
 */
export function useLeaderboard(children: Child[]) {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    if (children.length === 0) {
      setEntries([]);
      setLoading(false);
      return;
    }
    if (!supabase) {
      // Offline / not configured: render zero-progress rows so siblings still show.
      const zero = children.map((c, i) => ({
        child: c,
        totalStars: 0,
        quizzesCompleted: 0,
        subjectsTried: 0,
        hasPerfect: false,
        rank: i + 1,
      }));
      setEntries(zero);
      setLoading(false);
      return;
    }

    const ids = children.map((c) => c.id);
    const { data, error } = await supabase
      .from('progress')
      .select('child_id, total_stars, quizzes_completed, subjects_tried, has_perfect')
      .in('child_id', ids);

    if (error) {
      setEntries([]);
      setLoading(false);
      return;
    }

    const byChild = new Map<string, NonNullable<typeof data>[number]>();
    for (const row of data ?? []) byChild.set(row.child_id, row);

    const ranked: LeaderboardEntry[] = children
      .map((c) => {
        const p = byChild.get(c.id);
        return {
          child: c,
          totalStars: p?.total_stars ?? 0,
          quizzesCompleted: p?.quizzes_completed ?? 0,
          subjectsTried: (p?.subjects_tried ?? []).length,
          hasPerfect: p?.has_perfect ?? false,
          rank: 0,
        };
      })
      .sort((a, b) => {
        if (b.totalStars !== a.totalStars) return b.totalStars - a.totalStars;
        return b.quizzesCompleted - a.quizzesCompleted;
      })
      .map((e, i) => ({ ...e, rank: i + 1 }));

    setEntries(ranked);
    setLoading(false);
  }, [children]);

  useEffect(() => {
    setLoading(true);
    refresh();
  }, [refresh]);

  return { entries, loading, refresh };
}
