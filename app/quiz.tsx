import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import Animated, { BounceIn, FadeIn, FadeInDown, FadeInUp } from 'react-native-reanimated';
import { StarBurst } from '@/components/StarBurst';
import { Text } from '@/components/Text';
import { Colors, Fonts, Radii, Shadows, Spacing } from '@/constants/theme';
import { playSound, preloadSounds } from '@/lib/sounds';
import { DIFF_TIMER, SUBJECTS, type Difficulty, type SubjectKey } from '@/data/subjects';
import { useAuth } from '@/hooks/use-auth';
import { useChildren } from '@/hooks/use-children';
import { useProgress } from '@/hooks/use-progress';
import { useQuiz } from '@/hooks/use-quiz';
import { recordQuizSession } from '@/lib/sessions';

export default function QuizScreen() {
  const params = useLocalSearchParams<{ subject: SubjectKey; difficulty: Difficulty }>();
  const subject = (params.subject ?? 'math') as SubjectKey;
  const difficulty = (params.difficulty ?? 'easy') as Difficulty;
  const subj = SUBJECTS[subject];

  const { state, answer } = useQuiz(subject, difficulty);
  const { recordQuiz } = useProgress();
  const { session } = useAuth();
  const { selected: selectedChild } = useChildren(session?.user.id);
  const [burstSeed, setBurstSeed] = useState(0);

  useEffect(() => {
    preloadSounds();
  }, []);

  // When finished: persist locally, push to Supabase, then navigate
  useEffect(() => {
    if (state.status !== 'finished') return;
    (async () => {
      await recordQuiz({
        subject,
        score: state.finalScore,
        maxPossible: state.maxPossible,
      });
      if (selectedChild) {
        await recordQuizSession({
          child_id: selectedChild.id,
          subject,
          difficulty,
          score: state.finalScore,
          max_possible: state.maxPossible,
          streak_best: state.streakBest,
          duration_sec: state.durationSec,
          answers: state.answers,
        });
      }
      router.replace({
        pathname: '/results',
        params: {
          subject,
          difficulty,
          score: String(state.finalScore),
          max: String(state.maxPossible),
        },
      });
    })();
  }, [state.status, state.finalScore, state.maxPossible, state.streakBest, state.durationSec, state.answers, subject, difficulty, recordQuiz, selectedChild]);

  if (state.status === 'loading' || state.questions.length === 0) {
    return (
      <View style={[styles.container, styles.center, { backgroundColor: subj.bg }]}>
        <Text variant="h4" style={{ color: subj.color }}>Loading questions…</Text>
      </View>
    );
  }

  if (state.status === 'finished') {
    return <View style={[styles.container, { backgroundColor: subj.bg }]} />;
  }

  const q = state.questions[state.currentIndex];
  const progress = ((state.currentIndex + 1) / state.questions.length) * 100;
  const totalTime = DIFF_TIMER[difficulty];
  const timerPct = (state.timeLeft / totalTime) * 100;
  const timerColor =
    state.timeLeft <= 3 ? Colors.danger : state.timeLeft <= 7 ? Colors.warning : Colors.success;

  const handleOption = (idx: number) => {
    if (state.selected !== null) return;
    const correct = idx === q.answer;
    Haptics.impactAsync(
      correct ? Haptics.ImpactFeedbackStyle.Heavy : Haptics.ImpactFeedbackStyle.Light
    );
    playSound(correct ? 'correct' : 'wrong');
    if (correct) setBurstSeed((s) => s + 1);
    answer(idx);
  };

  const exit = () => router.replace('/subjects');

  return (
    <LinearGradient colors={[subj.bg, Colors.surface]} style={styles.container}>
      {burstSeed > 0 && <StarBurst trigger={burstSeed} />}

      <View style={styles.content}>
        {/* Top bar: subject pill, exit, score */}
        <Animated.View entering={FadeIn.duration(300)} style={styles.topBar}>
          <Pressable onPress={exit} hitSlop={10} style={[styles.exitBtn, Shadows.sm]}>
            <Text style={{ fontSize: 18, color: Colors.textPrimary, fontFamily: Fonts.bold }}>×</Text>
          </Pressable>

          <View style={[styles.subjectPill, { backgroundColor: `${subj.color}15` }]}>
            <Text style={{ fontSize: 18 }}>{subj.icon}</Text>
            <Text style={{ color: subj.color, fontFamily: Fonts.semibold, fontSize: 13 }}>
              {subj.name}
            </Text>
          </View>

          <View style={styles.scorePill}>
            <Text style={{ fontSize: 14 }}>⭐</Text>
            <Text style={{ color: Colors.warningDark, fontFamily: Fonts.bold, fontSize: 14 }}>
              {state.score}
            </Text>
          </View>
        </Animated.View>

        {/* Progress + question count */}
        <View style={styles.progressBlock}>
          <View style={styles.progressTrack}>
            <View style={[styles.progressFill, { width: `${progress}%`, backgroundColor: subj.color }]} />
          </View>
          <View style={styles.progressMeta}>
            <Text variant="caption">
              Question {state.currentIndex + 1} of {state.questions.length}
            </Text>
            {state.streak >= 2 && (
              <Animated.Text
                key={`streak-${state.streak}`}
                entering={BounceIn.duration(400)}
                style={styles.streakBadge}
              >
                🔥 {state.streak} streak
              </Animated.Text>
            )}
          </View>
        </View>

        {/* Timer ring/bar */}
        <View style={styles.timerRow}>
          <View style={styles.timerTrack}>
            <View style={[styles.timerFill, { width: `${timerPct}%`, backgroundColor: timerColor }]} />
          </View>
          <View style={[styles.timerNumWrap, { borderColor: timerColor }]}>
            <Text style={{ color: timerColor, fontFamily: Fonts.bold, fontSize: 14 }}>
              {state.timeLeft}
            </Text>
          </View>
        </View>

        {/* Question card */}
        <Animated.View
          key={state.currentIndex}
          entering={FadeInUp.duration(400)}
          style={[styles.questionCard, Shadows.lg]}
        >
          <Text variant="h3" style={styles.questionText}>{q.q}</Text>
        </Animated.View>

        {/* Options */}
        <View style={styles.options}>
          {q.options.map((opt, i) => (
            <Animated.View
              key={`${state.currentIndex}-${i}`}
              entering={FadeInDown.delay(100 + i * 60).duration(400)}
            >
              <OptionButton
                label={opt}
                index={i}
                subjColor={subj.color}
                state={
                  state.selected === null
                    ? 'default'
                    : i === q.answer
                      ? 'correct'
                      : i === state.selected
                        ? 'wrong'
                        : 'dim'
                }
                onPress={() => handleOption(i)}
              />
            </Animated.View>
          ))}
        </View>
      </View>
    </LinearGradient>
  );
}

type OptState = 'default' | 'correct' | 'wrong' | 'dim';

function OptionButton({
  label,
  index,
  subjColor,
  state,
  onPress,
}: {
  label: string;
  index: number;
  subjColor: string;
  state: OptState;
  onPress: () => void;
}) {
  const bgMap = {
    default: Colors.surface,
    correct: Colors.successLight,
    wrong: Colors.dangerLight,
    dim: Colors.surface,
  };
  const borderMap = {
    default: Colors.border,
    correct: Colors.success,
    wrong: Colors.danger,
    dim: Colors.border,
  };
  const textMap = {
    default: Colors.textPrimary,
    correct: Colors.successDark,
    wrong: Colors.dangerDark,
    dim: Colors.textMuted,
  };

  const letter =
    state === 'correct' ? '✓' : state === 'wrong' ? '✗' : String.fromCharCode(65 + index);

  const letterBg =
    state === 'correct' ? Colors.success : state === 'wrong' ? Colors.danger : `${subjColor}20`;
  const letterColor =
    state === 'correct' || state === 'wrong' ? Colors.white : subjColor;

  return (
    <Pressable
      onPress={onPress}
      disabled={state !== 'default'}
      style={({ pressed }) => [
        opt.button,
        { backgroundColor: bgMap[state], borderColor: borderMap[state] },
        pressed && state === 'default' ? { transform: [{ scale: 0.98 }], backgroundColor: Colors.slate100 } : null,
        state === 'default' && Shadows.sm,
      ]}
    >
      <View style={[opt.letter, { backgroundColor: letterBg }]}>
        <Text style={{ color: letterColor, fontFamily: Fonts.bold, fontSize: 14 }}>{letter}</Text>
      </View>
      <Text style={[opt.label, { color: textMap[state] }]} numberOfLines={2}>
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: { alignItems: 'center', justifyContent: 'center' },
  content: { flex: 1, paddingHorizontal: Spacing.lg, paddingTop: 60, paddingBottom: Spacing.lg },

  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.lg,
  },
  exitBtn: {
    width: 40, height: 40, borderRadius: Radii.md,
    backgroundColor: Colors.surface,
    alignItems: 'center', justifyContent: 'center',
  },
  subjectPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: Radii.pill,
  },
  scorePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.warningLight,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: Radii.pill,
    minWidth: 56,
    justifyContent: 'center',
  },

  progressBlock: { marginBottom: Spacing.md },
  progressTrack: {
    backgroundColor: Colors.divider,
    borderRadius: Radii.pill,
    height: 6,
    overflow: 'hidden',
    marginBottom: Spacing.sm,
  },
  progressFill: { height: '100%' },
  progressMeta: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  streakBadge: {
    fontFamily: Fonts.semibold,
    fontSize: 12,
    color: Colors.danger,
    backgroundColor: Colors.dangerLight,
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: Radii.pill,
    overflow: 'hidden',
  },

  timerRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, marginBottom: Spacing.xl },
  timerTrack: {
    flex: 1,
    backgroundColor: Colors.divider,
    borderRadius: Radii.pill,
    height: 8,
    overflow: 'hidden',
  },
  timerFill: { height: '100%' },
  timerNumWrap: {
    width: 38, height: 38,
    borderRadius: 19,
    borderWidth: 2.5,
    backgroundColor: Colors.surface,
    alignItems: 'center', justifyContent: 'center',
  },

  questionCard: {
    backgroundColor: Colors.surface,
    borderRadius: Radii.xxl,
    paddingVertical: Spacing.xxl,
    paddingHorizontal: Spacing.xl,
    marginBottom: Spacing.lg,
    minHeight: 130,
    justifyContent: 'center',
  },
  questionText: { textAlign: 'center', fontFamily: Fonts.semibold },

  options: { gap: Spacing.sm },
});

const opt = StyleSheet.create({
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    paddingVertical: Spacing.base,
    paddingHorizontal: Spacing.base,
    borderRadius: Radii.lg,
    borderWidth: 2,
    backgroundColor: Colors.surface,
  },
  letter: {
    width: 36,
    height: 36,
    borderRadius: Radii.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: { flex: 1, fontFamily: Fonts.medium, fontSize: 16 },
});
