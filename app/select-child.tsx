import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import { Text } from '@/components/Text';
import { BgGradient, Colors, Fonts, Radii, Shadows, Spacing } from '@/constants/theme';
import { useAuth } from '@/hooks/use-auth';
import { AGE_GROUP_TO_DIFFICULTY, useChildren } from '@/hooks/use-children';
import { DIFF_COLORS, DIFF_LABELS } from '@/data/subjects';

export default function SelectChildScreen() {
  const { session } = useAuth();
  const { children, selectChild } = useChildren(session?.user.id);

  const choose = async (id: string) => {
    await selectChild(id);
    router.replace('/subjects');
  };

  return (
    <LinearGradient colors={BgGradient.warm} locations={BgGradient.warmStops} style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <Animated.Text entering={FadeInUp.delay(100)} style={styles.title}>
          Who's playing?
        </Animated.Text>
        <Animated.Text entering={FadeInUp.delay(200)} style={styles.subtitle}>
          Pick your profile
        </Animated.Text>

        <View style={styles.grid}>
          {children.map((c, i) => {
            const diff = AGE_GROUP_TO_DIFFICULTY[c.age_group];
            return (
              <Animated.View key={c.id} entering={FadeInDown.delay(280 + i * 80)} style={styles.cardWrap}>
                <Pressable
                  onPress={() => choose(c.id)}
                  style={({ pressed }) => [
                    styles.card,
                    Shadows.md,
                    pressed ? { transform: [{ scale: 0.96 }] } : null,
                  ]}
                >
                  <View style={styles.avatarBubble}>
                    <Text style={styles.avatar}>{c.avatar}</Text>
                  </View>
                  <Text variant="h4" style={{ marginTop: Spacing.md }}>{c.display_name}</Text>
                  <View style={[styles.levelBadge, { backgroundColor: `${DIFF_COLORS[diff]}20` }]}>
                    <Text style={{ color: DIFF_COLORS[diff], fontFamily: Fonts.semibold, fontSize: 11 }}>
                      {DIFF_LABELS[diff]}
                    </Text>
                  </View>
                </Pressable>
              </Animated.View>
            );
          })}

          {children.length < 3 && (
            <Animated.View
              entering={FadeInDown.delay(280 + children.length * 80)}
              style={styles.cardWrap}
            >
              <Pressable
                onPress={() => router.push('/add-child')}
                style={({ pressed }) => [
                  styles.card,
                  styles.cardAdd,
                  pressed ? { transform: [{ scale: 0.96 }] } : null,
                ]}
              >
                <View style={[styles.avatarBubble, styles.avatarBubbleAdd]}>
                  <Text style={[styles.avatar, { color: Colors.textMuted }]}>+</Text>
                </View>
                <Text variant="h4" style={{ marginTop: Spacing.md, color: Colors.textMuted }}>
                  Add child
                </Text>
              </Pressable>
            </Animated.View>
          )}
        </View>

        {/* Manage profiles link — discoverable path to delete/edit */}
        <Animated.View entering={FadeInUp.delay(500)} style={{ marginTop: Spacing.xxl }}>
          <Pressable
            onPress={() => router.push('/children')}
            style={({ pressed }) => [styles.manageBtn, pressed && { opacity: 0.6 }]}
          >
            <Text style={{ fontSize: 16 }}>⚙️</Text>
            <Text style={{ fontFamily: Fonts.semibold, fontSize: 14, color: Colors.textSecondary }}>
              Manage profiles
            </Text>
          </Pressable>
        </Animated.View>
      </ScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { padding: Spacing.lg, paddingTop: 80, alignItems: 'center', paddingBottom: Spacing.xxl },
  title: { fontFamily: Fonts.bold, fontSize: 30, color: Colors.textPrimary, letterSpacing: -0.3 },
  subtitle: { fontFamily: Fonts.regular, fontSize: 15, color: Colors.textSecondary, marginTop: 6, marginBottom: Spacing.xl },

  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.md,
    justifyContent: 'center',
    width: '100%',
    maxWidth: 480,
  },
  cardWrap: { width: '46%' },
  card: {
    backgroundColor: Colors.surface,
    borderRadius: Radii.xxl,
    paddingVertical: Spacing.xl,
    alignItems: 'center',
  },
  cardAdd: {
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: Colors.border,
    borderStyle: 'dashed',
  },
  avatarBubble: {
    width: 80, height: 80, borderRadius: 40,
    backgroundColor: Colors.primaryLight,
    alignItems: 'center', justifyContent: 'center',
  },
  avatarBubbleAdd: { backgroundColor: Colors.slate100 },
  avatar: { fontSize: 44, lineHeight: 50 },
  levelBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: Radii.pill,
    marginTop: 6,
  },

  manageBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 12,
    paddingHorizontal: 18,
    borderRadius: Radii.pill,
    backgroundColor: Colors.surface,
    ...Shadows.sm,
  },
});
