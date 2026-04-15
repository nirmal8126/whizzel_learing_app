import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { BounceIn, FadeInUp } from 'react-native-reanimated';
import { StarBurst } from '@/components/StarBurst';
import { Text } from '@/components/Text';
import { Colors, Fonts, Radii, Shadows, Spacing } from '@/constants/theme';
import { DIFF_LABELS, SUBJECTS, type Difficulty, type SubjectKey } from '@/data/subjects';
import { playSound } from '@/lib/sounds';

export default function ResultsScreen() {
  const params = useLocalSearchParams<{
    subject: SubjectKey;
    difficulty: Difficulty;
    score: string;
    max: string;
  }>();

  const subject = (params.subject ?? 'math') as SubjectKey;
  const difficulty = (params.difficulty ?? 'easy') as Difficulty;
  const score = Number(params.score ?? '0');
  const maxPossible = Number(params.max ?? '5');
  const subj = SUBJECTS[subject];

  const percentage = Math.round((score / maxPossible) * 100);
  const stars = Math.ceil((score / maxPossible) * 5);
  const isPerfect = percentage === 100;
  const [burstSeed, setBurstSeed] = useState(0);

  useEffect(() => {
    if (!isPerfect) return;
    playSound('perfect');
    const a = setTimeout(() => setBurstSeed((s) => s + 1), 200);
    const b = setTimeout(() => setBurstSeed((s) => s + 1), 700);
    const c = setTimeout(() => setBurstSeed((s) => s + 1), 1300);
    return () => {
      clearTimeout(a);
      clearTimeout(b);
      clearTimeout(c);
    };
  }, [isPerfect]);

  const message =
    percentage === 100 ? 'PERFECT!' :
    percentage >= 80 ? 'Amazing!' :
    percentage >= 60 ? 'Great job!' :
    percentage >= 40 ? 'Good try!' :
    'Keep practicing!';

  const subMessage =
    percentage === 100 ? 'You answered every question right!' :
    percentage >= 60 ? 'Nice work — keep that streak going.' :
    'Practice makes perfect. Try again!';

  const emoji = percentage === 100 ? '🏆' : percentage >= 60 ? '🎉' : '💪';

  return (
    <LinearGradient colors={[subj.bg, Colors.surface]} style={styles.container}>
      {isPerfect && burstSeed > 0 && <StarBurst trigger={burstSeed} count={20} size={360} />}

      <View style={styles.inner}>
        <Animated.Text entering={BounceIn.delay(150).duration(700)} style={styles.emoji}>
          {emoji}
        </Animated.Text>
        <Animated.Text entering={FadeInUp.delay(350).duration(500)} style={styles.message}>
          {message}
        </Animated.Text>
        <Animated.Text entering={FadeInUp.delay(450).duration(500)} style={styles.subMessage}>
          {subMessage}
        </Animated.Text>
        <Animated.Text entering={FadeInUp.delay(500).duration(500)} style={styles.context}>
          {subj.icon} {subj.name} · {DIFF_LABELS[difficulty]}
        </Animated.Text>

        {/* Score circle */}
        <Animated.View
          entering={BounceIn.delay(650).duration(700)}
          style={[styles.circle, Shadows.lg, { borderColor: subj.color }]}
        >
          <Text style={[styles.circleScore, { color: subj.color }]}>{score}</Text>
          <Text style={styles.circleSub}>of {maxPossible} stars</Text>
        </Animated.View>

        {/* Star row */}
        <Animated.View entering={FadeInUp.delay(950).duration(500)} style={styles.starsRow}>
          {Array.from({ length: 5 }, (_, i) => (
            <Text
              key={i}
              style={[styles.bigStar, { opacity: i < stars ? 1 : 0.18 }]}
            >
              ⭐
            </Text>
          ))}
        </Animated.View>

        {/* Actions */}
        <Animated.View entering={FadeInUp.delay(1150).duration(500)} style={styles.actions}>
          <Pressable
            onPress={() => router.replace({ pathname: '/quiz', params: { subject, difficulty } })}
            style={({ pressed }) => [
              styles.primaryBtn,
              { backgroundColor: subj.color },
              Shadows.md,
              pressed ? { transform: [{ scale: 0.98 }] } : null,
            ]}
          >
            <Text style={styles.primaryBtnText}>Play again</Text>
          </Pressable>
          <Pressable
            onPress={() => router.replace('/subjects')}
            style={({ pressed }) => [
              styles.secondaryBtn,
              pressed ? { transform: [{ scale: 0.98 }], backgroundColor: Colors.surfaceMuted } : null,
            ]}
          >
            <Text style={styles.secondaryBtnText}>Choose another subject</Text>
          </Pressable>
        </Animated.View>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  inner: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.xl,
  },
  emoji: { fontSize: 76, marginBottom: 8 },
  message: { fontFamily: Fonts.bold, fontSize: 32, color: Colors.textPrimary, letterSpacing: -0.5, textAlign: 'center' },
  subMessage: { fontFamily: Fonts.regular, fontSize: 15, color: Colors.textSecondary, marginTop: 6, textAlign: 'center' },
  context: { fontFamily: Fonts.medium, fontSize: 13, color: Colors.textMuted, marginTop: 12, marginBottom: Spacing.lg },

  circle: {
    width: 156, height: 156, borderRadius: 78,
    backgroundColor: Colors.surface,
    alignItems: 'center', justifyContent: 'center',
    marginBottom: Spacing.lg,
    borderWidth: 4,
  },
  circleScore: { fontFamily: Fonts.bold, fontSize: 48, lineHeight: 56 },
  circleSub: { fontFamily: Fonts.medium, fontSize: 12, color: Colors.textMuted, marginTop: -2 },

  starsRow: { flexDirection: 'row', gap: 8, marginBottom: Spacing.xl },
  bigStar: { fontSize: 30 },

  actions: { width: '100%', maxWidth: 400, gap: 10 },
  primaryBtn: {
    paddingVertical: 16, borderRadius: Radii.lg, alignItems: 'center',
  },
  primaryBtnText: { fontFamily: Fonts.semibold, fontSize: 16, color: Colors.white },
  secondaryBtn: {
    paddingVertical: 16, borderRadius: Radii.lg,
    backgroundColor: Colors.surface,
    alignItems: 'center',
  },
  secondaryBtnText: { fontFamily: Fonts.semibold, fontSize: 16, color: Colors.textSecondary },
});
