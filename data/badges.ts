export type BadgeRequirement =
  | { type: 'quizzes'; count: number }
  | { type: 'subjects'; count: number }
  | { type: 'perfect' }
  | { type: 'stars'; count: number };

export type Badge = {
  id: string;
  name: string;
  desc: string;
  requirement: BadgeRequirement;
};

export const BADGES: Badge[] = [
  { id: 'first_steps', name: 'First Steps', desc: 'Complete your first quiz', requirement: { type: 'quizzes', count: 1 } },
  { id: 'curious_cat', name: 'Curious Cat', desc: 'Try all 4 subjects', requirement: { type: 'subjects', count: 4 } },
  { id: 'perfect_score', name: 'Perfect Score', desc: 'Get 100% on any quiz', requirement: { type: 'perfect' } },
  { id: 'brain_power', name: 'Brain Power', desc: 'Score 50 total stars', requirement: { type: 'stars', count: 50 } },
  { id: 'superstar', name: 'Superstar', desc: 'Score 100 total stars', requirement: { type: 'stars', count: 100 } },
];

export type ProgressStats = {
  totalStars: number;
  quizzesCompleted: number;
  subjectsTried: string[];
  hasPerfect: boolean;
};

export function earnedBadges(stats: ProgressStats): Badge[] {
  return BADGES.filter((b) => {
    const r = b.requirement;
    if (r.type === 'quizzes') return stats.quizzesCompleted >= r.count;
    if (r.type === 'subjects') return stats.subjectsTried.length >= r.count;
    if (r.type === 'perfect') return stats.hasPerfect;
    if (r.type === 'stars') return stats.totalStars >= r.count;
    return false;
  });
}
