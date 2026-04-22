import type { Difficulty } from './subjects';

export type GradeKey = 'prek' | 'k' | '1' | '2' | '3' | '4' | '5' | '6';

export type Grade = {
  key: GradeKey;
  label: string;     // big letter/number on the tile
  name: string;      // long label above tile (e.g., "PRE-KINDERGARTEN")
  color: string;     // tile text + accent color
  bg: string;        // soft bg behind the tile (subtle)
  difficulty: Difficulty;
};

/**
 * Grade is a familiar entry point for parents (matches school grade level).
 * Internally each grade maps to one of our 3 difficulty tiers — the question
 * bank itself is unchanged.
 *
 *   Pre-K, K  → easy   (Explorer)
 *   1, 2, 3   → medium (Challenger)
 *   4, 5, 6   → hard   (Master)
 */
export const GRADES: Grade[] = [
  { key: 'prek', label: 'P', name: 'PRE-KINDERGARTEN', color: '#5BAA47', bg: '#EBF6E7', difficulty: 'easy' },
  { key: 'k',    label: 'K', name: 'KINDERGARTEN',     color: '#E89B3C', bg: '#FCEFDB', difficulty: 'easy' },
  { key: '1',    label: '1', name: 'GRADE',            color: '#3B8ED9', bg: '#E5F0FB', difficulty: 'medium' },
  { key: '2',    label: '2', name: 'GRADE',            color: '#E26A2C', bg: '#FCE6D8', difficulty: 'medium' },
  { key: '3',    label: '3', name: 'GRADE',            color: '#5BAA47', bg: '#EBF6E7', difficulty: 'medium' },
  { key: '4',    label: '4', name: 'GRADE',            color: '#9B5BBF', bg: '#F1E6F8', difficulty: 'hard' },
  { key: '5',    label: '5', name: 'GRADE',            color: '#2BA39A', bg: '#DDF3F1', difficulty: 'hard' },
  { key: '6',    label: '6', name: 'GRADE',            color: '#D14C4C', bg: '#F9DEDE', difficulty: 'hard' },
];
