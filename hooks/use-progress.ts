import { useCallback, useEffect, useRef, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { ProgressStats } from '@/data/badges';
import type { SubjectKey } from '@/data/subjects';
import { supabase } from '@/lib/supabase';

const STORAGE_KEY_PREFIX = 'bqa:progress:v2:';

const DEFAULT: ProgressStats = {
  totalStars: 0,
  quizzesCompleted: 0,
  subjectsTried: [],
  hasPerfect: false,
};

function localKey(childId: string | null) {
  return `${STORAGE_KEY_PREFIX}${childId ?? 'guest'}`;
}

/**
 * Progress for a given child (or local-only "guest" if no child).
 *
 * Source of truth is Supabase `progress` table when configured + child selected.
 * AsyncStorage is a write-through cache for offline rendering.
 */
export function useProgress(childId?: string | null) {
  const [stats, setStats] = useState<ProgressStats>(DEFAULT);
  const [ready, setReady] = useState(false);
  const statsRef = useRef(stats);
  statsRef.current = stats;

  // Load: try cloud first (if child selected), fall back to local cache
  useEffect(() => {
    let cancelled = false;
    (async () => {
      // Always read local first for instant render
      try {
        const raw = await AsyncStorage.getItem(localKey(childId ?? null));
        if (!cancelled && raw) setStats(JSON.parse(raw));
      } catch {}

      // Then refresh from cloud if available
      if (supabase && childId) {
        const { data } = await supabase
          .from('progress')
          .select('total_stars, quizzes_completed, subjects_tried, has_perfect')
          .eq('child_id', childId)
          .maybeSingle();
        if (!cancelled && data) {
          const cloud: ProgressStats = {
            totalStars: data.total_stars ?? 0,
            quizzesCompleted: data.quizzes_completed ?? 0,
            subjectsTried: data.subjects_tried ?? [],
            hasPerfect: data.has_perfect ?? false,
          };
          setStats(cloud);
          await AsyncStorage.setItem(localKey(childId), JSON.stringify(cloud));
        }
      }
      if (!cancelled) setReady(true);
    })();
    return () => {
      cancelled = true;
    };
  }, [childId]);

  const recordQuiz = useCallback(
    async (opts: { subject: SubjectKey; score: number; maxPossible: number }) => {
      // Optimistic local update — Supabase progress is updated by a DB trigger
      // when quiz_sessions is inserted (see migration).
      const cur = statsRef.current;
      const next: ProgressStats = {
        totalStars: cur.totalStars + opts.score,
        quizzesCompleted: cur.quizzesCompleted + 1,
        subjectsTried: cur.subjectsTried.includes(opts.subject)
          ? cur.subjectsTried
          : [...cur.subjectsTried, opts.subject],
        hasPerfect: cur.hasPerfect || opts.score === opts.maxPossible,
      };
      setStats(next);
      await AsyncStorage.setItem(localKey(childId ?? null), JSON.stringify(next));
      return next;
    },
    [childId]
  );

  return { stats, ready, recordQuiz };
}
