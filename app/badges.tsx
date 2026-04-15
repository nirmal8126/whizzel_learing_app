import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import { Text } from '@/components/Text';
import { BgGradient, Colors, Fonts, Radii, Shadows, Spacing } from '@/constants/theme';
import { BADGES, earnedBadges } from '@/data/badges';
import { useAuth } from '@/hooks/use-auth';
import { useChildren } from '@/hooks/use-children';
import { useProgress } from '@/hooks/use-progress';

export default function BadgesScreen() {
  const { session } = useAuth();
  const { selected } = useChildren(session?.user.id);
  const { stats } = useProgress(selected?.id ?? null);
  const earned = new Set(earnedBadges(stats).map((b) => b.id));

  const earnedCount = earned.size;

  return (
    <LinearGradient colors={BgGradient.warm} locations={BgGradient.warmStops} style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.headerBar}>
          <Pressable onPress={() => router.back()} style={[styles.backBtn, Shadows.sm]} hitSlop={10}>
            <Text style={{ fontSize: 18, color: Colors.textPrimary, fontFamily: Fonts.bold }}>←</Text>
          </Pressable>
          <Text variant="h3">Badges</Text>
          <View style={{ width: 40 }} />
        </View>

        <Animated.View entering={FadeInUp.duration(400)} style={[styles.heroCard, Shadows.md]}>
          <Text style={styles.heroEmoji}>🏆</Text>
          <Text variant="h2" style={{ marginTop: Spacing.sm }}>
            {earnedCount} of {BADGES.length}
          </Text>
          <Text variant="small" style={{ marginTop: 4 }}>
            {earnedCount === BADGES.length ? "You've collected them all!" : 'Keep playing to earn more'}
          </Text>
          <View style={styles.heroProgress}>
            <View style={[styles.heroFill, { width: `${(earnedCount / BADGES.length) * 100}%` }]} />
          </View>
        </Animated.View>

        <View style={styles.list}>
          {BADGES.map((badge, i) => {
            const isEarned = earned.has(badge.id);
            return (
              <Animated.View
                key={badge.id}
                entering={FadeInDown.delay(i * 80).duration(400)}
                style={[
                  styles.badge,
                  isEarned ? styles.badgeEarned : styles.badgeLocked,
                  isEarned && Shadows.sm,
                ]}
              >
                <View style={[styles.badgeIconWrap, isEarned ? styles.badgeIconEarned : styles.badgeIconLocked]}>
                  <Text style={styles.badgeIcon}>{isEarned ? '🏆' : '🔒'}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text variant="bodyBold" style={isEarned ? undefined : { color: Colors.textMuted }}>
                    {badge.name}
                  </Text>
                  <Text variant="caption" style={{ marginTop: 2 }}>
                    {badge.desc}
                  </Text>
                </View>
                {isEarned && (
                  <View style={styles.checkBubble}>
                    <Text style={{ color: Colors.white, fontFamily: Fonts.bold, fontSize: 12 }}>✓</Text>
                  </View>
                )}
              </Animated.View>
            );
          })}
        </View>
      </ScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { paddingHorizontal: Spacing.lg, paddingTop: 60, paddingBottom: Spacing.xxl },
  headerBar: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    marginBottom: Spacing.lg,
  },
  backBtn: {
    width: 40, height: 40, borderRadius: Radii.md,
    backgroundColor: Colors.surface,
    alignItems: 'center', justifyContent: 'center',
  },
  heroCard: {
    backgroundColor: Colors.surface,
    borderRadius: Radii.xxl,
    padding: Spacing.xl,
    alignItems: 'center',
    marginBottom: Spacing.xl,
  },
  heroEmoji: { fontSize: 56 },
  heroProgress: {
    width: '100%', height: 8, borderRadius: Radii.pill,
    backgroundColor: Colors.divider,
    marginTop: Spacing.md, overflow: 'hidden',
  },
  heroFill: { height: '100%', backgroundColor: Colors.warning, borderRadius: Radii.pill },

  list: { gap: Spacing.sm },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.base,
    borderRadius: Radii.xl,
  },
  badgeEarned: { backgroundColor: Colors.surface },
  badgeLocked: { backgroundColor: Colors.surfaceMuted, opacity: 0.7 },
  badgeIconWrap: {
    width: 48, height: 48, borderRadius: Radii.md,
    alignItems: 'center', justifyContent: 'center',
  },
  badgeIconEarned: { backgroundColor: Colors.warningLight },
  badgeIconLocked: { backgroundColor: Colors.slate100 },
  badgeIcon: { fontSize: 24 },
  checkBubble: {
    width: 24, height: 24, borderRadius: 12,
    backgroundColor: Colors.success,
    alignItems: 'center', justifyContent: 'center',
  },
});
