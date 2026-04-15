# Brain Quest Adventure

E-learning quiz app for kids aged 4-12+. Four subjects (Math, Science, Language, General Knowledge), three difficulty tiers, gamified scoring and badges.

Built with Expo (React Native) + Supabase + Gemini AI.

## Getting started

```bash
npm install
cp .env.example .env   # then fill in real keys
npx expo start
```

Install **Expo Go** on your phone (App Store / Play Store), scan the QR code, app runs in seconds.

## Stack

- **App:** React Native + Expo Router + Reanimated + Lottie + Haptics
- **Backend:** Supabase (Postgres + Auth + RLS)
- **AI:** Google Gemini 2.5 Flash (question generation + safety review)
- **Storage:** AsyncStorage (local progress cache + offline support)

## Project structure

```
app/                    Expo Router screens (home, subjects, quiz, results, badges)
components/             (reserved for shared UI when needed)
constants/theme.ts      Color + font tokens
data/                   Typed game constants (subjects, difficulties, bundled fallback questions)
hooks/
  use-progress.ts       Player state + AsyncStorage
  use-quiz.ts           Quiz engine (timer, scoring, advance)
lib/
  supabase.ts           Supabase client (opt-in via .env)
  questions-repo.ts     Questions: cache → Supabase → bundled fallback
  shuffle.ts
scripts/
  generate-questions.ts Gemini generation + safety pass
  generate-all.ts       Generate across all 12 subject × difficulty slots
  import-questions.ts   Import generated JSON into Supabase
  output/               Generated JSON files land here
supabase/
  migrations/           SQL schema (run once in Supabase SQL editor)
```

## First-time setup (one-time)

### 1. Fill `.env`

```
EXPO_PUBLIC_SUPABASE_URL=https://<project>.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=<anon key>
GEMINI_API_KEY=<from https://aistudio.google.com/apikey>
SUPABASE_SERVICE_ROLE_KEY=<service_role key — never commit>
```

### 2. Create tables in Supabase

Open Supabase dashboard → SQL Editor → paste contents of `supabase/migrations/20260415000000_init.sql` → Run.

This creates: `profiles`, `children`, `questions`, `quiz_sessions`, `quiz_answers`, `progress`, plus triggers and Row-Level Security policies.

### 3. Seed question bank with AI

Generate questions for a single slot:

```bash
npm run generate -- --subject=math --difficulty=easy --count=30
# optional: --topic=fractions
```

Generate all 12 slots at once:

```bash
npm run gen:all -- --count=40
# → 480 questions total, ~3-5 min
```

Output lands in `scripts/output/*.json`. Review a few before importing.

### 4. Import into Supabase

```bash
npm run import -- scripts/output/math-easy-*.json
# or all at once:
npm run import -- scripts/output/*.json
```

Uses `SUPABASE_SERVICE_ROLE_KEY` (server-only, bypasses RLS).

### 5. Run the app

```bash
npx expo start
```

The app will now fetch questions from Supabase on first load per (subject, difficulty), cache them for 24h, and fall back to the bundled `data/questions.ts` if offline.

## Development

- **Type check:** `npx tsc --noEmit`
- **Lint:** `npm run lint`
- **Reset app state on device:** delete the app or clear storage from iOS / Android settings

## Launch roadmap

- [x] Week 1: Scaffold, screens, gameplay
- [x] Week 2 (partial): Supabase schema, AI generator, cloud content
- [ ] Week 2 (rest): Parent auth, child profiles, cloud progress sync
- [ ] Week 3: Polish (Lottie celebrations, sounds), offline mode
- [ ] Week 4: Parent dashboard, RevenueCat paywall
- [ ] Week 5: Content expansion (2000+ questions)
- [ ] Week 6: Privacy policy, COPPA review, app store assets
- [ ] Week 7-8: TestFlight/internal beta, bug fixes, submit
