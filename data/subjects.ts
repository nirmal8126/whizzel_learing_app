export type Difficulty = 'easy' | 'medium' | 'hard';
export type SubjectKey = 'math' | 'science' | 'language' | 'gk';

export type Subject = {
  key: SubjectKey;
  name: string;
  icon: string;
  color: string;
  bg: string;
  gradient: [string, string];
};

export const SUBJECTS: Record<SubjectKey, Subject> = {
  math: {
    key: 'math',
    name: 'Math & Logic',
    icon: '🧮',
    color: '#E24B4A',
    bg: '#FCEBEB',
    gradient: ['#FCEBEB', '#FFFFFF'],
  },
  science: {
    key: 'science',
    name: 'Science Lab',
    icon: '🔬',
    color: '#1D9E75',
    bg: '#E1F5EE',
    gradient: ['#E1F5EE', '#FFFFFF'],
  },
  language: {
    key: 'language',
    name: 'Word World',
    icon: '📚',
    color: '#378ADD',
    bg: '#E6F1FB',
    gradient: ['#E6F1FB', '#FFFFFF'],
  },
  gk: {
    key: 'gk',
    name: 'Quiz Quest',
    icon: '🏆',
    color: '#BA7517',
    bg: '#FAEEDA',
    gradient: ['#FAEEDA', '#FFFFFF'],
  },
};

export const SUBJECT_LIST: Subject[] = Object.values(SUBJECTS);

export const DIFFICULTIES: Difficulty[] = ['easy', 'medium', 'hard'];

export const DIFF_LABELS: Record<Difficulty, string> = {
  easy: 'Explorer',
  medium: 'Challenger',
  hard: 'Master',
};

export const DIFF_AGE_RANGE: Record<Difficulty, string> = {
  easy: 'Ages 4-7',
  medium: 'Ages 8-10',
  hard: 'Ages 11+',
};

export const DIFF_COLORS: Record<Difficulty, string> = {
  easy: '#1D9E75',
  medium: '#BA7517',
  hard: '#E24B4A',
};

export const DIFF_TIMER: Record<Difficulty, number> = {
  easy: 20,
  medium: 15,
  hard: 10,
};

export const DIFF_MULTIPLIER: Record<Difficulty, number> = {
  easy: 1,
  medium: 2,
  hard: 3,
};
