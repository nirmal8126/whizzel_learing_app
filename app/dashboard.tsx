import { useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import { Text } from '@/components/Text';
import { BgGradient, Colors, Fonts, Radii, Shadows, Spacing } from '@/constants/theme';
import { useAuth } from '@/hooks/use-auth';
import { useChildren } from '@/hooks/use-children';
import { useDashboard } from '@/hooks/use-dashboard';
import { DIFF_LABELS, SUBJECTS } from '@/data/subjects';

export default function DashboardScreen() {
  const { session } = useAuth();
  const { children, selected } = useChildren(session?.user.id);
  const [activeChildId, setActiveChildId] = useState<string | null>(selected?.id ?? null);
  const childId = activeChildId ?? selected?.id ?? null;
  const data = useDashboard(childId);
  const child = children.find((c) => c.id === childId) ?? selected;

  return (
    <LinearGradient colors={BgGradient.warm} locations={BgGradient.warmStops} style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.headerBar}>
          <Pressable onPress={() => router.back()} style={[styles.backBtn, Shadows.sm]} hitSlop={10}>
            <Text style={{ fontSize: 18, color: Colors.textPrimary, fontFamily: Fonts.bold }}>←</Text>
          </Pressable>
          <Text variant="h3">Dashboard</Text>
          <View style={{ width: 40 }} />
        </View>

        {/* Child picker */}
        {children.length > 1 && (
          <Animated.View entering={FadeInUp.duration(400)} style={styles.childTabs}>
            {children.map((c) => {
              const active = c.id === childId;
              return (
                <Pressable
                  key={c.id}
                  onPress={() => setActiveChildId(c.id)}
                  style={[
                    styles.childTab,
                    active && [styles.childTabActive, Shadows.sm],
                  ]}
                >
                  <Text style={styles.childTabEmoji}>{c.avatar}</Text>
                  <Text style={{
                    fontFamily: Fonts.semibold, fontSize: 13,
                    color: active ? Colors.primary : Colors.textMuted,
                  }}>
                    {c.display_name}
                  </Text>
                </Pressable>
              );
            })}
          </Animated.View>
        )}

        {!child ? (
          <Text variant="body" style={{ textAlign: 'center', marginTop: 40 }}>No child selected.</Text>
        ) : data.loading ? (
          <ActivityIndicator color={Colors.primary} style={{ marginTop: 40 }} />
        ) : (
          <>
            {/* Headline stats */}
            <Animated.View entering={FadeInDown.duration(400)} style={styles.statsRow}>
              <StatBlock label="Quizzes" value={data.totalQuizzes} accent={Colors.primary} />
              <StatBlock label="Stars" value={data.totalStars} accent="#BA7517" emoji="⭐" />
              <StatBlock label="Minutes" value={data.totalMinutes} accent="#1D9E75" />
            </Animated.View>

            {/* By subject */}
            <Text variant="label" style={styles.sectionLabel}>ACCURACY BY SUBJECT</Text>
            <Animated.View entering={FadeInDown.delay(100)} style={[styles.card, Shadows.sm]}>
              {data.bySubject.map((s, i) => {
                const subj = SUBJECTS[s.subject];
                const accPct = Math.round(s.accuracy * 100);
                return (
                  <View key={s.subject} style={[styles.subjectRow, i > 0 && styles.divider]}>
                    <View style={[styles.subjectIconBubble, { backgroundColor: subj.bg }]}>
                      <Text style={{ fontSize: 18 }}>{subj.icon}</Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text variant="bodyBold">{subj.name}</Text>
                      <Text variant="caption" style={{ marginTop: 2 }}>
                        {s.total_quizzes} {s.total_quizzes === 1 ? 'quiz' : 'quizzes'} · {s.total_answered} answers
                      </Text>
                      <View style={styles.barTrack}>
                        <View style={[styles.barFill, { width: `${accPct}%`, backgroundColor: subj.color }]} />
                      </View>
                    </View>
                    <Text style={[styles.barText, { color: subj.color }]}>
                      {s.total_answered === 0 ? '—' : `${accPct}%`}
                    </Text>
                  </View>
                );
              })}
            </Animated.View>

            {/* Recent sessions */}
            <Text variant="label" style={styles.sectionLabel}>RECENT QUIZZES</Text>
            <Animated.View entering={FadeInDown.delay(200)} style={[styles.card, Shadows.sm]}>
              {data.recentSessions.length === 0 ? (
                <View style={styles.emptyCard}>
                  <Text style={{ fontSize: 36, marginBottom: 8 }}>📚</Text>
                  <Text variant="body" style={{ textAlign: 'center' }}>
                    No quizzes yet.{'\n'}Hand the device to {child.display_name}!
                  </Text>
                </View>
              ) : (
                data.recentSessions.slice(0, 10).map((s, i) => {
                  const subj = SUBJECTS[s.subject];
                  const pct = Math.round((s.score / s.max_possible) * 100);
                  const isHigh = pct >= 80;
                  return (
                    <View key={s.id} style={[styles.sessionRow, i > 0 && styles.divider]}>
                      <View style={[styles.sessionIcon, { backgroundColor: subj.bg }]}>
                        <Text style={{ fontSize: 16 }}>{subj.icon}</Text>
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text variant="bodyBold" style={{ fontSize: 14 }}>{subj.name}</Text>
                        <Text variant="caption" style={{ marginTop: 1 }}>
                          {DIFF_LABELS[s.difficulty]} · {timeAgo(s.completed_at)}
                        </Text>
                      </View>
                      <View style={[styles.scorePill, isHigh ? styles.scorePillHigh : styles.scorePillLow]}>
                        <Text style={{ color: isHigh ? Colors.successDark : Colors.textSecondary, fontFamily: Fonts.bold, fontSize: 13 }}>
                          {s.score}/{s.max_possible}
                        </Text>
                      </View>
                    </View>
                  );
                })
              )}
            </Animated.View>
          </>
        )}
      </ScrollView>
    </LinearGradient>
  );
}

function StatBlock({ label, value, accent, emoji }: { label: string; value: number; accent: string; emoji?: string }) {
  return (
    <View style={[styles.statBlock, Shadows.sm]}>
      <Text style={[styles.statValue, { color: accent }]}>
        {emoji ? `${emoji} ` : ''}{value}
      </Text>
      <Text variant="caption" style={{ marginTop: 2 }}>{label}</Text>
    </View>
  );
}

function timeAgo(iso: string): string {
  const ms = Date.now() - new Date(iso).getTime();
  const min = Math.floor(ms / 60000);
  if (min < 1) return 'just now';
  if (min < 60) return `${min}m ago`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}h ago`;
  const day = Math.floor(hr / 24);
  if (day < 7) return `${day}d ago`;
  return new Date(iso).toLocaleDateString();
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

  childTabs: {
    flexDirection: 'row', gap: Spacing.sm, marginBottom: Spacing.lg, flexWrap: 'wrap',
  },
  childTab: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingVertical: 8, paddingHorizontal: 12,
    borderRadius: Radii.pill,
    backgroundColor: Colors.surfaceMuted,
  },
  childTabActive: { backgroundColor: Colors.primaryLight },
  childTabEmoji: { fontSize: 18 },

  statsRow: { flexDirection: 'row', gap: Spacing.sm, marginBottom: Spacing.xl },
  statBlock: {
    flex: 1, backgroundColor: Colors.surface,
    borderRadius: Radii.lg, padding: Spacing.base,
    alignItems: 'center',
  },
  statValue: { fontFamily: Fonts.bold, fontSize: 22 },

  sectionLabel: { marginBottom: Spacing.sm, paddingHorizontal: 4 },
  card: {
    backgroundColor: Colors.surface,
    borderRadius: Radii.xl,
    overflow: 'hidden',
    marginBottom: Spacing.lg,
  },

  subjectRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, padding: Spacing.base },
  subjectIconBubble: {
    width: 40, height: 40, borderRadius: Radii.md,
    alignItems: 'center', justifyContent: 'center',
  },
  divider: { borderTopWidth: 1, borderTopColor: Colors.divider },
  barTrack: {
    height: 6, borderRadius: 3,
    backgroundColor: Colors.divider,
    marginTop: 6, overflow: 'hidden',
  },
  barFill: { height: '100%', borderRadius: 3 },
  barText: { fontFamily: Fonts.bold, fontSize: 13, minWidth: 40, textAlign: 'right' },

  sessionRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, padding: Spacing.base },
  sessionIcon: {
    width: 36, height: 36, borderRadius: Radii.md,
    alignItems: 'center', justifyContent: 'center',
  },
  scorePill: {
    paddingHorizontal: 10, paddingVertical: 5,
    borderRadius: Radii.pill,
  },
  scorePillHigh: { backgroundColor: Colors.successLight },
  scorePillLow: { backgroundColor: Colors.surfaceMuted },

  emptyCard: { padding: Spacing.xl, alignItems: 'center' },
});
