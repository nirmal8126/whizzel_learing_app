import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import { ConfirmModal } from '@/components/ConfirmModal';
import { Text } from '@/components/Text';
import { BgGradient, Colors, Fonts, Radii, Shadows, Spacing } from '@/constants/theme';
import { useAuth } from '@/hooks/use-auth';
import { useChildren } from '@/hooks/use-children';

type Item = {
  icon: string;
  title: string;
  subtitle?: string;
  onPress: () => void;
  destructive?: boolean;
};

export default function MenuScreen() {
  const { session, signOut } = useAuth();
  const { children, selected } = useChildren(session?.user.id);
  const [signOutOpen, setSignOutOpen] = useState(false);

  const performSignOut = async () => {
    setSignOutOpen(false);
    await signOut();
    router.replace('/');
  };

  const handleSignOut = () => setSignOutOpen(true);

  const profileSection: Item[] = [
    ...(children.length > 1
      ? [{
          icon: '🔄',
          title: 'Switch profile',
          subtitle: `Currently: ${selected?.display_name ?? '—'}`,
          onPress: () => router.push('/select-child'),
        }]
      : []),
    {
      icon: '➕',
      title: 'Add a child',
      subtitle: `${children.length}/3 profiles used`,
      onPress: () => router.push('/add-child'),
    },
    {
      icon: '👨‍👩‍👧',
      title: 'Manage profiles',
      subtitle: 'Rename, change avatar, remove',
      onPress: () => router.push('/children'),
    },
  ];

  const insightsSection: Item[] = [
    {
      icon: '📊',
      title: 'Parent dashboard',
      subtitle: 'Progress, accuracy, time spent',
      onPress: () => router.push('/dashboard'),
    },
    {
      icon: '🏆',
      title: 'Leaderboard',
      subtitle: children.length > 1 ? 'See sibling rankings' : 'Add siblings to compete',
      onPress: () => router.push('/leaderboard'),
    },
  ];

  const accountSection: Item[] = [
    {
      icon: '⏻',
      title: 'Sign out',
      destructive: true,
      onPress: handleSignOut,
    },
  ];

  return (
    <LinearGradient colors={BgGradient.warm} locations={BgGradient.warmStops} style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} style={[styles.backBtn, Shadows.sm]} hitSlop={10}>
            <Text style={{ fontSize: 18, color: Colors.textPrimary, fontFamily: Fonts.bold }}>←</Text>
          </Pressable>
          <Text variant="h3">Settings</Text>
          <View style={{ width: 40 }} />
        </View>

        <Animated.View entering={FadeInUp.duration(400)} style={[styles.parentCard, Shadows.md]}>
          <View style={styles.parentAvatar}>
            <Text style={{ fontSize: 32 }}>👤</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text variant="caption">Parent account</Text>
            <Text variant="bodyBold" numberOfLines={1} style={{ marginTop: 2 }}>
              {session?.user.email ?? '—'}
            </Text>
          </View>
        </Animated.View>

        <Section title="PROFILES" items={profileSection} delay={100} />
        <Section title="INSIGHTS" items={insightsSection} delay={200} />
        <Section title="ACCOUNT" items={accountSection} delay={300} />

        <Animated.Text entering={FadeInUp.delay(400)} style={styles.foot}>
          Whizzel · v1.0{'\n'}🔒 No personal data collected from children
        </Animated.Text>
      </ScrollView>

      <ConfirmModal
        visible={signOutOpen}
        tone="warning"
        emoji="👋"
        title="Sign out?"
        message="Your child profiles and progress are saved in the cloud — you can sign back in anytime."
        confirmText="Sign out"
        cancelText="Stay signed in"
        onConfirm={performSignOut}
        onCancel={() => setSignOutOpen(false)}
      />
    </LinearGradient>
  );
}

function Section({ title, items, delay }: { title: string; items: Item[]; delay: number }) {
  return (
    <Animated.View entering={FadeInDown.delay(delay).duration(400)} style={styles.section}>
      <Text variant="label" style={styles.sectionLabel}>{title}</Text>
      <View style={[styles.card, Shadows.sm]}>
        {items.map((it, i) => (
          <Pressable
            key={it.title}
            onPress={it.onPress}
            style={({ pressed }) => [
              styles.row,
              i < items.length - 1 && styles.rowDivider,
              pressed && { backgroundColor: Colors.slate100 },
            ]}
          >
            <View style={[styles.rowIconWrap, it.destructive && { backgroundColor: Colors.dangerLight }]}>
              <Text style={styles.rowIcon}>{it.icon}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text variant="bodyBold" style={it.destructive ? { color: Colors.danger } : undefined}>
                {it.title}
              </Text>
              {it.subtitle && <Text variant="caption" style={{ marginTop: 2 }}>{it.subtitle}</Text>}
            </View>
            <Text style={styles.chevron}>›</Text>
          </Pressable>
        ))}
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
    marginBottom: Spacing.xl,
  },
  backBtn: {
    width: 40, height: 40, borderRadius: Radii.md,
    backgroundColor: Colors.surface,
    alignItems: 'center', justifyContent: 'center',
  },

  parentCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    backgroundColor: Colors.surface,
    padding: Spacing.base,
    borderRadius: Radii.xl,
    marginBottom: Spacing.xl,
  },
  parentAvatar: {
    width: 52, height: 52, borderRadius: Radii.lg,
    backgroundColor: Colors.primaryLight,
    alignItems: 'center', justifyContent: 'center',
  },

  section: { marginBottom: Spacing.lg },
  sectionLabel: { marginBottom: Spacing.sm, paddingHorizontal: 4 },
  card: {
    backgroundColor: Colors.surface,
    borderRadius: Radii.xl,
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.base,
  },
  rowDivider: { borderBottomWidth: 1, borderBottomColor: Colors.divider },
  rowIconWrap: {
    width: 38, height: 38, borderRadius: Radii.md,
    backgroundColor: Colors.surfaceMuted,
    alignItems: 'center', justifyContent: 'center',
  },
  rowIcon: { fontSize: 20 },
  chevron: { fontSize: 24, color: Colors.textMuted, fontFamily: Fonts.regular, lineHeight: 24 },

  foot: {
    fontSize: 11,
    fontFamily: Fonts.medium,
    color: Colors.textMuted,
    textAlign: 'center',
    marginTop: Spacing.lg,
    lineHeight: 18,
  },
});
