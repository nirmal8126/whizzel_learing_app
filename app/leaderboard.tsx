import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import { Text } from '@/components/Text';
import { BgGradient, Colors, Fonts, Radii, Shadows, Spacing } from '@/constants/theme';
import { useAuth } from '@/hooks/use-auth';
import { useChildren, AGE_GROUP_TO_DIFFICULTY } from '@/hooks/use-children';
import { useLeaderboard, type LeaderboardEntry } from '@/hooks/use-leaderboard';
import { DIFF_COLORS, DIFF_LABELS } from '@/data/subjects';

const RANK_STYLE: Record<number, { medal: string; ring: string; chip: string }> = {
  1: { medal: '🥇', ring: '#F5C518', chip: '#FFF8E1' },
  2: { medal: '🥈', ring: '#A8B3C5', chip: '#F1F4F8' },
  3: { medal: '🥉', ring: '#C58B5C', chip: '#FBEFE3' },
};

export default function LeaderboardScreen() {
  const { session } = useAuth();
  const { children, loading: kidsLoading } = useChildren(session?.user.id);
  const { entries, loading: entriesLoading } = useLeaderboard(children);

  const loading = kidsLoading || entriesLoading;
  const empty = !loading && entries.length === 0;
  const onlyOne = !loading && entries.length === 1;

  return (
    <LinearGradient colors={BgGradient.warm} locations={BgGradient.warmStops} style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} style={[styles.backBtn, Shadows.sm]} hitSlop={10}>
            <Text style={{ fontSize: 18, color: Colors.textPrimary, fontFamily: Fonts.bold }}>←</Text>
          </Pressable>
          <Text variant="h3">Leaderboard</Text>
          <View style={{ width: 40 }} />
        </View>

        <Animated.View entering={FadeInUp.duration(400)} style={styles.subtitleWrap}>
          <Text variant="caption" style={styles.subtitle}>
            🏆 Sibling rankings · all-time stars
          </Text>
        </Animated.View>

        {empty && (
          <Animated.View entering={FadeInUp.delay(100)} style={[styles.empty, Shadows.sm]}>
            <Text style={{ fontSize: 48 }}>👥</Text>
            <Text variant="h4" style={{ marginTop: Spacing.md }}>No profiles yet</Text>
            <Text variant="body" style={styles.emptySub}>
              Add children to see them compete on the leaderboard.
            </Text>
            <Pressable
              onPress={() => router.push('/add-child')}
              style={({ pressed }) => [
                styles.cta,
                pressed ? { transform: [{ scale: 0.98 }] } : null,
              ]}
            >
              <Text style={styles.ctaText}>Add a child</Text>
            </Pressable>
          </Animated.View>
        )}

        {onlyOne && (
          <Animated.View entering={FadeInUp.delay(150)} style={[styles.lonelyHint, Shadows.sm]}>
            <Text style={{ fontSize: 24 }}>✨</Text>
            <Text variant="body" style={{ flex: 1, color: Colors.textSecondary }}>
              Add a sibling to make it a real competition!
            </Text>
            <Pressable
              onPress={() => router.push('/add-child')}
              style={({ pressed }) => [
                styles.smallCta,
                pressed ? { transform: [{ scale: 0.97 }] } : null,
              ]}
            >
              <Text style={styles.smallCtaText}>Add</Text>
            </Pressable>
          </Animated.View>
        )}

        {entries.map((entry, i) => (
          <Row key={entry.child.id} entry={entry} delay={200 + i * 80} />
        ))}
      </ScrollView>
    </LinearGradient>
  );
}

function Row({ entry, delay }: { entry: LeaderboardEntry; delay: number }) {
  const diff = AGE_GROUP_TO_DIFFICULTY[entry.child.age_group];
  const podium = RANK_STYLE[entry.rank];
  const isLeader = entry.rank === 1 && entry.totalStars > 0;

  return (
    <Animated.View
      entering={FadeInDown.delay(delay).duration(400)}
      style={[
        styles.card,
        Shadows.md,
        podium ? { borderWidth: 2, borderColor: podium.ring } : null,
        isLeader ? styles.leaderCard : null,
      ]}
    >
      {/* Rank badge */}
      <View style={[
        styles.rankBubble,
        podium ? { backgroundColor: podium.chip } : { backgroundColor: Colors.surfaceMuted },
      ]}>
        {podium ? (
          <Text style={styles.medal}>{podium.medal}</Text>
        ) : (
          <Text style={styles.rankNum}>#{entry.rank}</Text>
        )}
      </View>

      {/* Avatar + name */}
      <View style={[styles.avatarBubble, { backgroundColor: `${DIFF_COLORS[diff]}20` }]}>
        <Text style={styles.avatar}>{entry.child.avatar}</Text>
      </View>

      <View style={{ flex: 1 }}>
        <Text variant="bodyBold" numberOfLines={1}>{entry.child.display_name}</Text>
        <View style={[styles.levelChip, { backgroundColor: `${DIFF_COLORS[diff]}15` }]}>
          <Text style={[styles.levelText, { color: DIFF_COLORS[diff] }]}>
            {DIFF_LABELS[diff]}
          </Text>
        </View>
      </View>

      {/* Stats column */}
      <View style={styles.stats}>
        <View style={styles.starRow}>
          <Text style={styles.starIcon}>⭐</Text>
          <Text style={styles.starCount}>{entry.totalStars}</Text>
        </View>
        <Text variant="caption" style={styles.statSub}>
          {entry.quizzesCompleted} quiz{entry.quizzesCompleted === 1 ? '' : 'zes'}
        </Text>
        {entry.hasPerfect && (
          <View style={styles.perfectBadge}>
            <Text style={styles.perfectText}>💯 perfect</Text>
          </View>
        )}
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { paddingHorizontal: Spacing.lg, paddingTop: 60, paddingBottom: Spacing.xxl },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.lg,
  },
  backBtn: {
    width: 40, height: 40, borderRadius: Radii.md,
    backgroundColor: Colors.surface,
    alignItems: 'center', justifyContent: 'center',
  },

  subtitleWrap: { marginBottom: Spacing.lg, alignItems: 'center' },
  subtitle: { color: Colors.textSecondary },

  empty: {
    backgroundColor: Colors.surface,
    borderRadius: Radii.xl,
    padding: Spacing.xl,
    alignItems: 'center',
    marginTop: Spacing.lg,
  },
  emptySub: {
    color: Colors.textSecondary,
    textAlign: 'center',
    marginTop: Spacing.sm,
    marginBottom: Spacing.lg,
  },
  cta: {
    paddingVertical: 14,
    paddingHorizontal: Spacing.xl,
    borderRadius: Radii.lg,
    backgroundColor: Colors.primary,
  },
  ctaText: { color: Colors.white, fontFamily: Fonts.semibold, fontSize: 15 },

  lonelyHint: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    backgroundColor: Colors.surface,
    padding: Spacing.base,
    borderRadius: Radii.lg,
    marginBottom: Spacing.md,
  },
  smallCta: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: Radii.pill,
    backgroundColor: Colors.primary,
  },
  smallCtaText: { color: Colors.white, fontFamily: Fonts.semibold, fontSize: 13 },

  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    backgroundColor: Colors.surface,
    padding: Spacing.base,
    borderRadius: Radii.xl,
    marginBottom: Spacing.md,
  },
  leaderCard: {
    backgroundColor: '#FFFCF0',
  },

  rankBubble: {
    width: 44, height: 44, borderRadius: 22,
    alignItems: 'center', justifyContent: 'center',
  },
  medal: { fontSize: 22 },
  rankNum: { fontFamily: Fonts.bold, fontSize: 15, color: Colors.textSecondary },

  avatarBubble: {
    width: 44, height: 44, borderRadius: 22,
    alignItems: 'center', justifyContent: 'center',
  },
  avatar: { fontSize: 24 },

  levelChip: {
    alignSelf: 'flex-start',
    paddingVertical: 2,
    paddingHorizontal: 8,
    borderRadius: Radii.pill,
    marginTop: 2,
  },
  levelText: { fontFamily: Fonts.semibold, fontSize: 11 },

  stats: { alignItems: 'flex-end', gap: 2 },
  starRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  starIcon: { fontSize: 14 },
  starCount: { fontFamily: Fonts.bold, fontSize: 18, color: Colors.warningDark },
  statSub: { color: Colors.textMuted },
  perfectBadge: {
    backgroundColor: Colors.successLight,
    paddingVertical: 2,
    paddingHorizontal: 6,
    borderRadius: Radii.pill,
    marginTop: 2,
  },
  perfectText: { fontFamily: Fonts.semibold, fontSize: 10, color: Colors.successDark },
});
