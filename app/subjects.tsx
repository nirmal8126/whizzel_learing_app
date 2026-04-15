import { useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import { Text } from '@/components/Text';
import { BgGradient, Colors, Fonts, Radii, Shadows, Spacing } from '@/constants/theme';
import { earnedBadges } from '@/data/badges';
import {
  DIFF_AGE_RANGE,
  DIFF_COLORS,
  DIFF_LABELS,
  DIFFICULTIES,
  SUBJECT_LIST,
  type Difficulty,
} from '@/data/subjects';
import { useAuth } from '@/hooks/use-auth';
import { AGE_GROUP_TO_DIFFICULTY, useChildren } from '@/hooks/use-children';
import { useProgress } from '@/hooks/use-progress';

export default function SubjectsScreen() {
  const { session } = useAuth();
  const { selected: selectedChild, children } = useChildren(session?.user.id);
  const { stats } = useProgress(selectedChild?.id ?? null);

  const childDifficulty = selectedChild ? AGE_GROUP_TO_DIFFICULTY[selectedChild.age_group] : 'easy';
  const [difficulty, setDifficulty] = useState<Difficulty>(childDifficulty);

  useEffect(() => {
    setDifficulty(childDifficulty);
  }, [childDifficulty]);

  const badgeCount = earnedBadges(stats).length;
  const playerName = selectedChild?.display_name ?? 'Explorer';
  const playerAvatar = selectedChild?.avatar ?? '🧒';

  const startQuiz = (subject: string) => {
    router.push({ pathname: '/quiz', params: { subject, difficulty } });
  };

  return (
    <LinearGradient colors={BgGradient.warm} locations={BgGradient.warmStops} style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Header — modern, generous */}
        <Animated.View entering={FadeIn.duration(400)} style={styles.header}>
          <Pressable
            onPress={() => children.length > 1 && router.push('/select-child')}
            style={styles.profileChip}
            hitSlop={10}
          >
            <View style={styles.avatarBubble}>
              <Text style={styles.avatarEmoji}>{playerAvatar}</Text>
            </View>
            <View>
              <Text variant="caption">Hi there,</Text>
              <View style={styles.nameRow}>
                <Text variant="h4" style={{ marginRight: 4 }}>{playerName}</Text>
                {children.length > 1 && <Text style={styles.chevDown}>⌄</Text>}
              </View>
            </View>
          </Pressable>

          <Pressable onPress={() => router.push('/menu')} style={styles.menuBtn} hitSlop={10}>
            <View style={styles.menuLine} />
            <View style={styles.menuLine} />
            <View style={styles.menuLine} />
          </Pressable>
        </Animated.View>

        {/* Hero stat strip */}
        <Animated.View entering={FadeInDown.delay(80).duration(500)} style={styles.heroRow}>
          <View style={[styles.heroPill, { backgroundColor: '#FEF3C7' }]}>
            <Text style={styles.heroEmoji}>⭐</Text>
            <Text variant="bodyBold" style={{ color: Colors.warningDark }}>{stats.totalStars}</Text>
          </View>
          <Pressable
            onPress={() => router.push('/badges')}
            style={({ pressed }) => [styles.heroPill, { backgroundColor: Colors.primaryLight }, pressed && { opacity: 0.7 }]}
          >
            <Text style={styles.heroEmoji}>🏆</Text>
            <Text variant="bodyBold" style={{ color: Colors.primaryDark }}>{badgeCount}/5</Text>
          </Pressable>
          <View style={[styles.heroPill, { backgroundColor: '#E1F5EE' }]}>
            <Text style={styles.heroEmoji}>🎯</Text>
            <Text variant="bodyBold" style={{ color: '#065F46' }}>{stats.quizzesCompleted}</Text>
          </View>
        </Animated.View>

        {/* Difficulty selector — segmented */}
        <Animated.View entering={FadeInDown.delay(150).duration(500)} style={styles.diffCard}>
          <Text variant="label" style={{ marginBottom: Spacing.sm }}>DIFFICULTY</Text>
          <View style={styles.segmented}>
            {DIFFICULTIES.map((d) => {
              const selected = difficulty === d;
              return (
                <Pressable
                  key={d}
                  onPress={() => setDifficulty(d)}
                  style={[
                    styles.segment,
                    selected && {
                      backgroundColor: DIFF_COLORS[d],
                      ...Shadows.sm,
                    },
                  ]}
                >
                  <Text
                    variant="smallBold"
                    style={{ color: selected ? Colors.white : Colors.textSecondary }}
                  >
                    {DIFF_LABELS[d]}
                  </Text>
                  <Text
                    variant="caption"
                    style={{ color: selected ? 'rgba(255,255,255,0.85)' : Colors.textMuted, marginTop: 2 }}
                  >
                    {DIFF_AGE_RANGE[d]}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </Animated.View>

        {/* Subject grid */}
        <View style={styles.sectionHead}>
          <Text variant="h3">Pick an adventure</Text>
          <Text variant="small">{SUBJECT_LIST.length} subjects ready</Text>
        </View>

        <View style={styles.grid}>
          {SUBJECT_LIST.map((sub, i) => (
            <Animated.View
              key={sub.key}
              entering={FadeInDown.delay(220 + i * 70).duration(500)}
              style={styles.cardWrap}
            >
              <Pressable
                onPress={() => startQuiz(sub.key)}
                style={({ pressed }) => [
                  styles.subjectCard,
                  pressed && { transform: [{ scale: 0.97 }] },
                ]}
              >
                <View style={[styles.iconCircle, { backgroundColor: sub.bg }]}>
                  <Text style={styles.subjectIcon}>{sub.icon}</Text>
                </View>
                <Text variant="h4" style={{ marginTop: Spacing.md, textAlign: 'center' }}>
                  {sub.name}
                </Text>
                <View style={[styles.cardBadge, { backgroundColor: `${DIFF_COLORS[difficulty]}20` }]}>
                  <Text style={{ color: DIFF_COLORS[difficulty], fontFamily: Fonts.semibold, fontSize: 11 }}>
                    {DIFF_LABELS[difficulty]}
                  </Text>
                </View>
              </Pressable>
            </Animated.View>
          ))}
        </View>
      </ScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { paddingHorizontal: Spacing.lg, paddingTop: 60, paddingBottom: Spacing.xxl },

  // Header
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  profileChip: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  avatarBubble: {
    width: 50, height: 50, borderRadius: Radii.lg,
    backgroundColor: Colors.surface,
    alignItems: 'center', justifyContent: 'center',
    ...Shadows.sm,
  },
  avatarEmoji: { fontSize: 28 },
  nameRow: { flexDirection: 'row', alignItems: 'center' },
  chevDown: { fontSize: 16, color: Colors.textMuted, fontFamily: Fonts.bold, marginTop: -4 },
  menuBtn: {
    width: 44, height: 44, borderRadius: Radii.md,
    backgroundColor: Colors.surface,
    alignItems: 'center', justifyContent: 'center',
    gap: 4,
    ...Shadows.sm,
  },
  menuLine: { width: 18, height: 2, borderRadius: 1, backgroundColor: Colors.textPrimary },

  // Hero row
  heroRow: { flexDirection: 'row', gap: Spacing.sm, marginBottom: Spacing.lg },
  heroPill: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
    borderRadius: Radii.lg,
  },
  heroEmoji: { fontSize: 18 },

  // Difficulty card
  diffCard: {
    backgroundColor: Colors.surface,
    borderRadius: Radii.xl,
    padding: Spacing.base,
    marginBottom: Spacing.xl,
    ...Shadows.sm,
  },
  segmented: {
    flexDirection: 'row',
    backgroundColor: Colors.slate100,
    borderRadius: Radii.md,
    padding: 4,
    gap: 4,
  },
  segment: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: Radii.sm,
    alignItems: 'center',
  },

  // Section header
  sectionHead: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    marginBottom: Spacing.md,
    paddingHorizontal: 4,
  },

  // Subject grid
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.md },
  cardWrap: { width: '48%' },
  subjectCard: {
    backgroundColor: Colors.surface,
    borderRadius: Radii.xl,
    paddingVertical: Spacing.lg,
    paddingHorizontal: Spacing.md,
    alignItems: 'center',
    ...Shadows.md,
  },
  iconCircle: {
    width: 64, height: 64, borderRadius: 32,
    alignItems: 'center', justifyContent: 'center',
  },
  subjectIcon: { fontSize: 32 },
  cardBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: Radii.pill,
    marginTop: Spacing.sm,
  },
});
