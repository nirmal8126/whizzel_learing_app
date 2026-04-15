-- Add 'puzzles' as a 5th supported subject.
-- Run in Supabase SQL editor (or via `npm run migrate`) once.

alter table public.questions
  drop constraint if exists questions_subject_check;

alter table public.questions
  add constraint questions_subject_check
  check (subject in ('math', 'science', 'language', 'gk', 'puzzles'));
