-- ═══════════════════════════════════════════════════════════════════
-- Whizzel — initial schema
-- COPPA model: parents own auth accounts, children are subrecords
-- ═══════════════════════════════════════════════════════════════════

-- ─── Extensions ─────────────────────────────────────────────────────
create extension if not exists "uuid-ossp";

-- ═══════════════════════════════════════════════════════════════════
-- Tables
-- ═══════════════════════════════════════════════════════════════════

-- ─── profiles ───────────────────────────────────────────────────────
-- 1:1 with auth.users. Parent account only. Never store child data here.
create table public.profiles (
  id           uuid primary key references auth.users(id) on delete cascade,
  email        text,
  display_name text,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

-- Auto-create a profile row whenever a new auth user signs up
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, email)
  values (new.id, new.email);
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ─── children ───────────────────────────────────────────────────────
-- A parent can have many child profiles (plan: 3 on Family Plan)
create table public.children (
  id           uuid primary key default uuid_generate_v4(),
  parent_id    uuid not null references public.profiles(id) on delete cascade,
  display_name text not null check (char_length(display_name) between 1 and 30),
  age_group    text not null check (age_group in ('explorer', 'challenger', 'master')),
  avatar       text default '🧒',
  created_at   timestamptz not null default now()
);

create index idx_children_parent on public.children(parent_id);

-- ─── questions ──────────────────────────────────────────────────────
-- The question bank. Readable by all authenticated users; writes via service_role only.
create table public.questions (
  id           uuid primary key default uuid_generate_v4(),
  subject      text not null check (subject in ('math', 'science', 'language', 'gk')),
  difficulty   text not null check (difficulty in ('easy', 'medium', 'hard')),
  topic        text,                      -- e.g., "fractions", "photosynthesis"
  q_text       text not null,
  options      jsonb not null,            -- array of exactly 4 strings
  answer_index smallint not null check (answer_index between 0 and 3),
  explanation  text,                      -- why this answer is correct (for AI tutor)
  age_min      smallint,
  age_max      smallint,
  source       text not null default 'ai' check (source in ('ai', 'human', 'curated')),
  status       text not null default 'published' check (status in ('draft', 'reviewed', 'published', 'retired')),
  metadata     jsonb default '{}'::jsonb,  -- model, prompt version, flags, etc.
  created_at   timestamptz not null default now(),

  constraint options_is_array_of_4 check (jsonb_typeof(options) = 'array' and jsonb_array_length(options) = 4)
);

create index idx_questions_lookup on public.questions(subject, difficulty, status);
create index idx_questions_topic on public.questions(topic);

-- ─── quiz_sessions ──────────────────────────────────────────────────
-- One row per completed quiz attempt. Used for analytics + adaptive difficulty.
create table public.quiz_sessions (
  id              uuid primary key default uuid_generate_v4(),
  child_id        uuid not null references public.children(id) on delete cascade,
  subject         text not null,
  difficulty      text not null,
  score           int not null default 0,
  max_possible    int not null,
  streak_best     int not null default 0,
  duration_sec    int,
  completed_at    timestamptz not null default now()
);

create index idx_sessions_child on public.quiz_sessions(child_id, completed_at desc);

-- ─── quiz_answers ───────────────────────────────────────────────────
-- Per-question record within a session. Powers adaptive difficulty + topic weakness tracking.
create table public.quiz_answers (
  id             uuid primary key default uuid_generate_v4(),
  session_id     uuid not null references public.quiz_sessions(id) on delete cascade,
  question_id    uuid not null references public.questions(id),
  selected_index smallint,               -- -1 or null if timeout
  is_correct     boolean not null,
  time_taken_ms  int,
  answered_at    timestamptz not null default now()
);

create index idx_answers_session on public.quiz_answers(session_id);
create index idx_answers_question on public.quiz_answers(question_id);

-- ─── progress ───────────────────────────────────────────────────────
-- Aggregated per-child stats. Maintained via triggers on quiz_sessions.
create table public.progress (
  child_id           uuid primary key references public.children(id) on delete cascade,
  total_stars        int not null default 0,
  quizzes_completed  int not null default 0,
  subjects_tried     text[] not null default '{}',
  has_perfect        boolean not null default false,
  badges_earned      text[] not null default '{}',
  updated_at         timestamptz not null default now()
);

-- Trigger: recompute progress when a session is inserted
create or replace function public.on_session_insert()
returns trigger
language plpgsql
security definer set search_path = public
as $$
declare
  v_subjects text[];
  v_is_perfect boolean;
begin
  v_is_perfect := new.score = new.max_possible;

  insert into public.progress (child_id, total_stars, quizzes_completed, subjects_tried, has_perfect)
  values (new.child_id, new.score, 1, array[new.subject], v_is_perfect)
  on conflict (child_id) do update set
    total_stars       = progress.total_stars + new.score,
    quizzes_completed = progress.quizzes_completed + 1,
    subjects_tried    = (select array_agg(distinct s) from unnest(progress.subjects_tried || array[new.subject]) as s),
    has_perfect       = progress.has_perfect or v_is_perfect,
    updated_at        = now();

  return new;
end;
$$;

create trigger trg_session_insert
  after insert on public.quiz_sessions
  for each row execute function public.on_session_insert();

-- ═══════════════════════════════════════════════════════════════════
-- Row-Level Security
-- ═══════════════════════════════════════════════════════════════════

alter table public.profiles       enable row level security;
alter table public.children       enable row level security;
alter table public.questions      enable row level security;
alter table public.quiz_sessions  enable row level security;
alter table public.quiz_answers   enable row level security;
alter table public.progress       enable row level security;

-- profiles: parent sees + edits only their own profile
create policy "profile_self_read" on public.profiles
  for select using (auth.uid() = id);
create policy "profile_self_update" on public.profiles
  for update using (auth.uid() = id);

-- children: parent sees + manages only their own kids
create policy "children_parent_read" on public.children
  for select using (auth.uid() = parent_id);
create policy "children_parent_insert" on public.children
  for insert with check (auth.uid() = parent_id);
create policy "children_parent_update" on public.children
  for update using (auth.uid() = parent_id);
create policy "children_parent_delete" on public.children
  for delete using (auth.uid() = parent_id);

-- questions: any authenticated user can read published questions
create policy "questions_read_published" on public.questions
  for select using (status = 'published');

-- quiz_sessions: parent reads sessions for their children; child device writes via parent's session
create policy "sessions_parent_read" on public.quiz_sessions
  for select using (
    exists (select 1 from public.children c where c.id = child_id and c.parent_id = auth.uid())
  );
create policy "sessions_parent_insert" on public.quiz_sessions
  for insert with check (
    exists (select 1 from public.children c where c.id = child_id and c.parent_id = auth.uid())
  );

-- quiz_answers: scoped via session ownership
create policy "answers_parent_read" on public.quiz_answers
  for select using (
    exists (
      select 1 from public.quiz_sessions s
      join public.children c on c.id = s.child_id
      where s.id = session_id and c.parent_id = auth.uid()
    )
  );
create policy "answers_parent_insert" on public.quiz_answers
  for insert with check (
    exists (
      select 1 from public.quiz_sessions s
      join public.children c on c.id = s.child_id
      where s.id = session_id and c.parent_id = auth.uid()
    )
  );

-- progress: parent reads for their children
create policy "progress_parent_read" on public.progress
  for select using (
    exists (select 1 from public.children c where c.id = child_id and c.parent_id = auth.uid())
  );
