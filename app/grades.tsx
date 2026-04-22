import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import { Text } from '@/components/Text';
import { BgGradient, Colors, Fonts, Radii, Shadows, Spacing } from '@/constants/theme';
import { GRADES, type Grade } from '@/data/grades';
import { DIFF_LABELS } from '@/data/subjects';

export default function GradesScreen() {
  const pickGrade = (g: Grade) => {
    router.replace({ pathname: '/subjects', params: { difficulty: g.difficulty, grade: g.key } });
  };

  return (
    <LinearGradient colors={BgGradient.warm} locations={BgGradient.warmStops} style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} style={[styles.backBtn, Shadows.sm]} hitSlop={10}>
            <Text style={{ fontSize: 18, color: Colors.textPrimary, fontFamily: Fonts.bold }}>←</Text>
          </Pressable>
          <Text variant="h3">By grade</Text>
          <View style={{ width: 40 }} />
        </View>

        <Animated.Text entering={FadeInUp.duration(400)} style={styles.intro}>
          Pick your child's grade level — we'll match the right challenge.
        </Animated.Text>

        <View style={styles.grid}>
          {GRADES.map((g, i) => (
            <Animated.View
              key={g.key}
              entering={FadeInDown.delay(80 + i * 50).duration(400)}
              style={styles.cellWrap}
            >
              <Pressable
                onPress={() => pickGrade(g)}
                style={({ pressed }) => [
                  styles.tile,
                  pressed ? { transform: [{ scale: 0.95 }] } : null,
                ]}
              >
                <Text style={[styles.tileSubLabel, { color: g.color }]} numberOfLines={1}>
                  {g.name}
                </Text>
                <Text style={[styles.tileLabel, { color: g.color }]}>{g.label}</Text>
                <Text style={styles.tileFooter}>
                  {DIFF_LABELS[g.difficulty]}
                </Text>
              </Pressable>
            </Animated.View>
          ))}
        </View>

        <Animated.View entering={FadeInUp.delay(600)} style={styles.note}>
          <Text variant="caption" style={{ textAlign: 'center', color: Colors.textMuted }}>
            Grades 1–3 share the Challenger level · Grades 4–6 share Master.{'\n'}
            Each grade lets you pick any subject afterwards.
          </Text>
        </Animated.View>
      </ScrollView>
    </LinearGradient>
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

  intro: {
    fontFamily: Fonts.medium,
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginBottom: Spacing.xl,
    paddingHorizontal: Spacing.md,
  },

  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    rowGap: Spacing.md,
  },
  cellWrap: { width: '23%' },
  tile: {
    backgroundColor: Colors.surface,
    borderRadius: Radii.lg,
    paddingVertical: Spacing.md,
    paddingHorizontal: 4,
    alignItems: 'center',
    minHeight: 100,
    ...Shadows.sm,
  },
  tileSubLabel: {
    fontFamily: Fonts.bold,
    fontSize: 8,
    letterSpacing: 0.5,
    textAlign: 'center',
  },
  tileLabel: {
    fontFamily: Fonts.bold,
    fontSize: 38,
    lineHeight: 44,
    marginTop: 2,
  },
  tileFooter: {
    fontFamily: Fonts.medium,
    fontSize: 9,
    color: Colors.textMuted,
    marginTop: 2,
  },

  note: { marginTop: Spacing.xl, paddingHorizontal: Spacing.md },
});
