# Whizzel — Product & Technical Spec

## 1. What it is

Whizzel is a gamified quiz app for kids ages 4–12+. A parent creates one account,
adds one or more child profiles under it, and each child plays timed multiple-choice
quizzes across five subjects at a difficulty tied to their age group. Progress,
streaks, and badges are tracked per child, with an optional sibling leaderboard
and a parent-facing dashboard.

COPPA-oriented design: **only parents authenticate.** Children never sign in —
they're subrecords selected from a picker inside the parent's session.

## 2. Stack

| Layer | Choice |
|---|---|
| App shell | Expo SDK 54, Expo Router 6 (file-based, typed routes), React 19 / RN 0.81, New Architecture enabled |
| State/data | React hooks + AsyncStorage (offline cache) + Supabase (Postgres, Auth, RLS) |
| Content generation | Google Gemini 2.5 Flash (offline script, not called from the app at runtime) |
| UI | Reanimated 4, Lottie, expo-haptics, expo-linear-gradient, Fredoka font family |
| Build | EAS (`eas.json`), bundle id `com.whizzel.app`, EAS project `1efccb50-5c96-4c13-8502-e4da40540226` |

## 3. Navigation map (`app/_layout.tsx`)

```
index → auth (if no parent session)
      → select-child / add-child (choose or create a child profile)
      → subjects → grades → quiz → results → badges
      → menu → children / dashboard / leaderboard
```

All screens are a flat `Stack` (no nested navigators). `menu`, `children`,
`dashboard`, `leaderboard`, `grades` slide in from the right; the rest fade.

## 4. Core domain concepts

### Subjects (`data/subjects.ts`)
`math`, `science`, `language`, `gk`, `puzzles` — each with its own icon, color,
and gradient. `puzzles` was added in a later migration (`20260416000000`).

### Difficulty tiers
Three tiers drive both timer length and score multiplier:

| Difficulty | Label | Ages | Timer | Multiplier |
|---|---|---|---|---|
| easy | Explorer | 4–7 | 20s | ×1 |
| medium | Challenger | 8–10 | 15s | ×2 |
| hard | Master | 11+ | 10s | ×3 |

### Grades (`data/grades.ts`)
A parent-friendly entry point (Pre-K…Grade 6) that maps onto the same three
difficulty tiers (Pre-K/K → easy, 1–3 → medium, 4–6 → hard). The underlying
question bank is unaffected — grade is just a friendlier label over difficulty.

### Child profile age groups
Children are tagged `explorer | challenger | master` (`hooks/use-children.ts`),
mapped 1:1 to `easy | medium | hard` via `AGE_GROUP_TO_DIFFICULTY`.

### Quiz engine (`hooks/use-quiz.ts`)
- Fixed length: 5 questions per quiz (`QUIZ_LENGTH`).
- Per-question countdown timer (`DIFF_TIMER`); hitting 0 auto-submits as answer
  index `-1` (counted wrong, logged with `selected_index: null`).
- 1200ms feedback delay (`FEEDBACK_DELAY_MS`) between answering and advancing.
- Score = correct answers × difficulty multiplier; `maxPossible = 5 × multiplier`.
- Tracks current streak and best streak within the session.
- Answers are buffered in-memory as `AnswerLog[]` and only persisted to Supabase
  once the quiz finishes (`lib/sessions.ts`).

### Badges (`data/badges.ts`)
Client-computed (not stored per-badge server-side) from `ProgressStats`:
- **First Steps** — complete 1 quiz
- **Curious Cat** — try all 4(now 5) subjects
- **Perfect Score** — 100% on any quiz
- **Brain Power** — 50 total stars
- **Superstar** — 100 total stars

## 5. Data flow

### Questions: cache → Supabase → bundled fallback (`lib/questions-repo.ts`)
1. Read AsyncStorage cache for `(subject, difficulty)`, TTL 24h — return if fresh.
2. Else query Supabase `questions` where `status = 'published'`, limit 100 — cache
   and return on success.
3. Else fall back to the same AsyncStorage cache even if stale.
4. Else fall back to bundled `data/questions.ts` (ships in the app, works fully offline).

### Progress (`hooks/use-progress.ts`)
Write-through: AsyncStorage is read first for instant render, then Supabase
`progress` (keyed by `child_id`) refreshes it if configured. `recordQuiz()`
updates AsyncStorage optimistically; the authoritative aggregate update on the
server happens via a **Postgres trigger** (`on_session_insert`) firing when a
row lands in `quiz_sessions` — the client never writes `progress` directly.

### Session recording (`lib/sessions.ts`)
On quiz completion: insert one `quiz_sessions` row, then bulk-insert
`quiz_answers` rows — but only for answers whose `question_id` is a real UUID
(bundled fallback questions have no id and are skipped). Session insert failure
aborts; answer-insert failure is logged and swallowed (session is still saved).

### Dashboard (`hooks/use-dashboard.ts`)
Per child: last 20 sessions, total quizzes/stars/minutes, and per-subject
accuracy computed by joining `quiz_answers` back to `quiz_sessions`.

### Leaderboard (`hooks/use-leaderboard.ts`)
Ranks all of the current parent's children by `progress.total_stars` (desc),
tiebreak on `quizzes_completed`. Falls back to all-zero rows if Supabase isn't
configured, so the UI still renders offline.

## 6. Supabase schema (`supabase/migrations/`)

| Table | Purpose | Key constraint |
|---|---|---|
| `profiles` | 1:1 with `auth.users`; auto-created via `handle_new_user()` trigger on signup | parent-only, never holds child data |
| `children` | Child subrecords under a parent | `display_name` 1–30 chars; `age_group ∈ {explorer,challenger,master}` |
| `questions` | Question bank | `options` must be a 4-element JSON array; `status ∈ {draft,reviewed,published,retired}`; `subject` check widened to include `puzzles` |
| `quiz_sessions` | One row per completed quiz | FK → `children` |
| `quiz_answers` | Per-question answer detail | FK → `quiz_sessions`, `questions` |
| `progress` | Aggregated per-child stats | PK `child_id`; maintained only by the `trg_session_insert` trigger |

RLS is enabled on every table. Pattern: a parent can only read/write rows whose
`children.parent_id = auth.uid()`, checked directly or via an `exists(...)` join
through `children`/`quiz_sessions`. `questions` is the one public-read table
(`status = 'published'`); all writes to it are expected to go through the
service-role key from the offline import script, never from the app.

## 7. Content pipeline (offline, not part of the running app)

```
npm run generate -- --subject=math --difficulty=easy --count=30   # Gemini → scripts/output/*.json
npm run gen:all -- --count=40                                      # all 12 (now 15) subject×difficulty slots
npm run import -- scripts/output/*.json                            # service-role insert into Supabase
```

`SUPABASE_SERVICE_ROLE_KEY` and `GEMINI_API_KEY` are used only by these Node/tsx
scripts (`scripts/`), never bundled into the client app.

## 8. Privacy / COPPA posture (`PRIVACY.md`)

- Only parent email/password is collected for auth; children get a display name
  + broad age group only (no DOB, no location, no device fingerprinting).
- No ads, no third-party analytics/trackers, no child data sent to Gemini.
- Supabase is the only processor that sees child data (as directed processor).
- Account/child deletion is manual via email request today (no in-app self-serve
  delete flow for the parent account itself, though child profiles can be
  deleted in-app per `deleteChild` in `hooks/use-children.ts`).

## 9. Known project state / gaps (from `README.md` roadmap)

- [x] Week 1: scaffold, screens, gameplay
- [x] Week 2 (partial): Supabase schema, AI generator, cloud content
- [ ] Parent auth + child profiles + cloud progress sync — **appears largely built** (`use-auth`, `use-children`, triggers) beyond what README states; README is stale relative to code.
- [ ] Offline mode polish, Lottie celebrations/sounds — partially present (`components/StarBurst.tsx`, `lib/sounds.ts`) but not verified end-to-end.
- [ ] Parent dashboard — built (`app/dashboard.tsx`, `hooks/use-dashboard.ts`).
- [ ] RevenueCat paywall — not present in dependencies.
- [ ] Content expansion (2000+ questions) — depends on how many `npm run gen:all` batches have actually been imported; not verifiable from code alone.
- [ ] COPPA/App Store review, TestFlight/beta — outside repo scope.

## 10. Dev/runtime notes

- Package versions are slightly behind Expo SDK 54's recommended set (`expo`,
  `expo-font`, `expo-linking`, `expo-router`, `expo-web-browser` all have newer
  patch versions available) — `npx expo install --check` will show these.
- New Architecture is on (`newArchEnabled: true`); Expo Go (SDK 54) supports it,
  so no custom dev client is required to run this app.
- `.env` holds `EXPO_PUBLIC_SUPABASE_URL`, `EXPO_PUBLIC_SUPABASE_ANON_KEY`,
  `GEMINI_API_KEY`, `SUPABASE_SERVICE_ROLE_KEY` — the last two must never ship
  in the client bundle (they're consumed only by `scripts/`, not `app/`/`lib/`).
