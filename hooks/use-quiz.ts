import { useCallback, useEffect, useRef, useState } from 'react';
import { DIFF_MULTIPLIER, DIFF_TIMER, type Difficulty, type SubjectKey } from '@/data/subjects';
import { getQuestions, type Question } from '@/lib/questions-repo';
import { shuffle } from '@/lib/shuffle';
import type { AnswerLog } from '@/lib/sessions';

const QUIZ_LENGTH = 5;
const FEEDBACK_DELAY_MS = 1200;

export type QuizStatus = 'loading' | 'playing' | 'finished';

export type QuizState = {
  status: QuizStatus;
  questions: Question[];
  currentIndex: number;
  selected: number | null;
  score: number;
  streak: number;
  streakBest: number;
  timeLeft: number;
  finalScore: number;
  maxPossible: number;
  answers: AnswerLog[];
  durationSec: number;
};

export function useQuiz(subject: SubjectKey, difficulty: Difficulty) {
  const duration = DIFF_TIMER[difficulty];
  const multiplier = DIFF_MULTIPLIER[difficulty];
  const maxPossible = QUIZ_LENGTH * multiplier;

  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [streakBest, setStreakBest] = useState(0);
  const [timeLeft, setTimeLeft] = useState(duration);
  const [status, setStatus] = useState<QuizStatus>('loading');
  const [finalScore, setFinalScore] = useState(0);
  const [answers, setAnswers] = useState<AnswerLog[]>([]);
  const [durationSec, setDurationSec] = useState(0);

  const tickRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const advanceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lockedRef = useRef(false);
  const startTsRef = useRef<number>(Date.now());
  const questionStartRef = useRef<number>(Date.now());

  const clearTimers = useCallback(() => {
    if (tickRef.current) clearInterval(tickRef.current);
    if (advanceRef.current) clearTimeout(advanceRef.current);
    tickRef.current = null;
    advanceRef.current = null;
  }, []);

  const startTimer = useCallback(() => {
    clearTimers();
    setTimeLeft(duration);
    questionStartRef.current = Date.now();
    tickRef.current = setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) {
          if (tickRef.current) clearInterval(tickRef.current);
          tickRef.current = null;
        }
        return Math.max(0, t - 1);
      });
    }, 1000);
  }, [duration, clearTimers]);

  // Load questions once
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const pool = await getQuestions(subject, difficulty);
      if (cancelled) return;
      const picked = shuffle(pool).slice(0, QUIZ_LENGTH);
      setQuestions(picked);
      setStatus('playing');
      startTsRef.current = Date.now();
      startTimer();
    })();
    return () => {
      cancelled = true;
      clearTimers();
    };
  }, [subject, difficulty, startTimer, clearTimers]);

  const answer = useCallback(
    (idx: number) => {
      if (lockedRef.current || status !== 'playing') return { correct: false, locked: true };
      lockedRef.current = true;

      if (tickRef.current) clearInterval(tickRef.current);

      const q = questions[currentIndex];
      const correct = idx === q.answer;
      setSelected(idx);

      let nextScore = score;
      let nextStreak = streak;
      if (correct) {
        nextScore = score + multiplier;
        nextStreak = streak + 1;
        setScore(nextScore);
        setStreak(nextStreak);
        setStreakBest((b) => Math.max(b, nextStreak));
      } else {
        nextStreak = 0;
        setStreak(0);
      }

      const answerLog: AnswerLog = {
        question_id: q.id,
        selected_index: idx === -1 ? null : idx,
        is_correct: correct,
        time_taken_ms: Date.now() - questionStartRef.current,
      };
      setAnswers((prev) => [...prev, answerLog]);

      advanceRef.current = setTimeout(() => {
        lockedRef.current = false;
        if (currentIndex < questions.length - 1) {
          setCurrentIndex((i) => i + 1);
          setSelected(null);
          startTimer();
        } else {
          setFinalScore(nextScore);
          setDurationSec(Math.round((Date.now() - startTsRef.current) / 1000));
          setStatus('finished');
          clearTimers();
        }
      }, FEEDBACK_DELAY_MS);

      return { correct, locked: false };
    },
    [questions, currentIndex, score, streak, multiplier, startTimer, clearTimers, status]
  );

  // Auto-answer with -1 on timeout
  useEffect(() => {
    if (timeLeft === 0 && !lockedRef.current && status === 'playing') {
      answer(-1);
    }
  }, [timeLeft, status, answer]);

  const state: QuizState = {
    status,
    questions,
    currentIndex,
    selected,
    score,
    streak,
    streakBest,
    timeLeft,
    finalScore,
    maxPossible,
    answers,
    durationSec,
  };

  return { state, answer };
}
