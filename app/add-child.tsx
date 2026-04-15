import { useState } from 'react';
import { ActivityIndicator, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { BounceIn, FadeInUp } from 'react-native-reanimated';
import { Text } from '@/components/Text';
import { BgGradient, Colors, Fonts, Radii, Shadows, Spacing } from '@/constants/theme';
import { useAuth } from '@/hooks/use-auth';
import { AVATAR_OPTIONS, useChildren, type Child } from '@/hooks/use-children';
import { DIFF_AGE_RANGE, DIFF_COLORS } from '@/data/subjects';

const AGE_GROUPS: Array<{ key: Child['age_group']; label: string; difficulty: 'easy' | 'medium' | 'hard' }> = [
  { key: 'explorer', label: 'Explorer', difficulty: 'easy' },
  { key: 'challenger', label: 'Challenger', difficulty: 'medium' },
  { key: 'master', label: 'Master', difficulty: 'hard' },
];

export default function AddChildScreen() {
  const params = useLocalSearchParams<{ from?: string }>();
  const { session } = useAuth();
  const { addChild, children } = useChildren(session?.user.id);

  const [name, setName] = useState('');
  const [ageGroup, setAgeGroup] = useState<Child['age_group']>('explorer');
  const [avatar, setAvatar] = useState(AVATAR_OPTIONS[0]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isFirstChild = children.length === 0;

  const submit = async () => {
    if (!name.trim()) return;
    setBusy(true);
    setError(null);
    const res = await addChild({ display_name: name.trim(), age_group: ageGroup, avatar });
    setBusy(false);
    if ('error' in res) {
      setError(res.error ?? 'Could not create profile');
      return;
    }
    if (isFirstChild || params.from === 'auth') {
      router.replace('/subjects');
    } else {
      router.back();
    }
  };

  const cancel = () => {
    if (router.canGoBack()) router.back();
    else router.replace('/menu');
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <LinearGradient colors={BgGradient.warm} locations={BgGradient.warmStops} style={styles.container}>
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          {!isFirstChild && (
            <View style={styles.headerBar}>
              <Pressable onPress={cancel} style={[styles.backBtn, Shadows.sm]} hitSlop={10}>
                <Text style={{ fontSize: 18, color: Colors.textPrimary, fontFamily: Fonts.bold }}>←</Text>
              </Pressable>
              <View style={{ width: 40 }} />
              <View style={{ width: 40 }} />
            </View>
          )}

          <Animated.View entering={BounceIn.delay(100)} style={[styles.heroAvatar, Shadows.md]}>
            <Text style={styles.heroAvatarEmoji}>{avatar}</Text>
          </Animated.View>

          <Animated.Text entering={FadeInUp.delay(200)} style={styles.title}>
            {isFirstChild ? 'Meet your explorer' : 'Add another child'}
          </Animated.Text>
          <Animated.Text entering={FadeInUp.delay(280)} style={styles.subtitle}>
            We'll customize the experience for them
          </Animated.Text>

          <Animated.View entering={FadeInUp.delay(360)} style={[styles.card, Shadows.md]}>
            <Text variant="label" style={styles.label}>PICK AN AVATAR</Text>
            <View style={styles.avatarGrid}>
              {AVATAR_OPTIONS.map((a) => (
                <Pressable
                  key={a}
                  onPress={() => setAvatar(a)}
                  style={[styles.avatarBtn, avatar === a && styles.avatarBtnActive]}
                >
                  <Text style={styles.avatarEmoji}>{a}</Text>
                </Pressable>
              ))}
            </View>

            <Text variant="label" style={styles.label}>FIRST NAME</Text>
            <TextInput
              value={name}
              onChangeText={setName}
              placeholder="e.g., Maya"
              placeholderTextColor={Colors.textMuted}
              autoCapitalize="words"
              maxLength={20}
              style={styles.input}
            />

            <Text variant="label" style={styles.label}>SKILL LEVEL</Text>
            <View style={styles.ageRow}>
              {AGE_GROUPS.map((g) => {
                const selected = ageGroup === g.key;
                return (
                  <Pressable
                    key={g.key}
                    onPress={() => setAgeGroup(g.key)}
                    style={[
                      styles.ageBtn,
                      selected && {
                        backgroundColor: DIFF_COLORS[g.difficulty],
                        ...Shadows.sm,
                      },
                    ]}
                  >
                    <Text style={{ color: selected ? Colors.white : Colors.textPrimary, fontFamily: Fonts.semibold, fontSize: 14 }}>
                      {g.label}
                    </Text>
                    <Text style={{ color: selected ? 'rgba(255,255,255,0.85)' : Colors.textMuted, fontFamily: Fonts.medium, fontSize: 11, marginTop: 2 }}>
                      {DIFF_AGE_RANGE[g.difficulty]}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </Animated.View>

          {error && (
            <View style={styles.errorBox}>
              <Text style={{ fontSize: 14 }}>⚠️</Text>
              <Text style={{ color: Colors.dangerDark, fontFamily: Fonts.medium, fontSize: 13, flex: 1 }}>
                {error}
              </Text>
            </View>
          )}

          <Animated.View entering={FadeInUp.delay(500)} style={{ width: '100%', maxWidth: 420, marginTop: Spacing.lg }}>
            <Pressable
              onPress={submit}
              disabled={busy || !name.trim()}
              style={({ pressed }) => [
                styles.cta,
                (busy || !name.trim()) && styles.ctaDisabled,
                pressed && !busy ? { transform: [{ scale: 0.98 }] } : null,
              ]}
            >
              {busy ? (
                <ActivityIndicator color={Colors.white} />
              ) : (
                <Text style={styles.ctaText}>
                  {isFirstChild ? 'Start playing' : 'Add child'}
                </Text>
              )}
            </Pressable>
          </Animated.View>
        </ScrollView>
      </LinearGradient>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { padding: Spacing.lg, paddingTop: 60, alignItems: 'center', paddingBottom: Spacing.xxl },
  headerBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    maxWidth: 420,
    marginBottom: Spacing.md,
  },
  backBtn: {
    width: 40, height: 40, borderRadius: Radii.md,
    backgroundColor: Colors.surface,
    alignItems: 'center', justifyContent: 'center',
  },

  heroAvatar: {
    width: 96, height: 96, borderRadius: 48,
    backgroundColor: Colors.surface,
    alignItems: 'center', justifyContent: 'center',
    marginBottom: Spacing.md,
  },
  heroAvatarEmoji: { fontSize: 56 },

  title: { fontFamily: Fonts.bold, fontSize: 26, color: Colors.textPrimary, letterSpacing: -0.3 },
  subtitle: { fontFamily: Fonts.regular, fontSize: 14, color: Colors.textSecondary, marginTop: 4, marginBottom: Spacing.lg },

  card: {
    width: '100%',
    maxWidth: 420,
    backgroundColor: Colors.surface,
    borderRadius: Radii.xxl,
    padding: Spacing.xl,
  },
  label: { marginBottom: Spacing.sm, marginTop: Spacing.md },

  avatarGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  avatarBtn: {
    width: 56, height: 56, borderRadius: Radii.md,
    backgroundColor: Colors.surfaceMuted,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 2.5, borderColor: 'transparent',
  },
  avatarBtnActive: { borderColor: Colors.primary, backgroundColor: Colors.primaryLight },
  avatarEmoji: { fontSize: 28 },

  input: {
    paddingVertical: 14, paddingHorizontal: 16, borderRadius: Radii.md,
    borderWidth: 2, borderColor: Colors.border,
    backgroundColor: Colors.surfaceMuted,
    fontSize: 15, fontFamily: Fonts.medium, color: Colors.textPrimary,
  },

  ageRow: { flexDirection: 'row', gap: 8 },
  ageBtn: {
    flex: 1, paddingVertical: 14, borderRadius: Radii.md,
    backgroundColor: Colors.surfaceMuted, alignItems: 'center',
  },

  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: Colors.dangerLight,
    padding: 12,
    borderRadius: Radii.md,
    marginTop: Spacing.md,
    width: '100%',
    maxWidth: 420,
  },

  cta: {
    paddingVertical: 16, borderRadius: Radii.lg,
    backgroundColor: Colors.primary, alignItems: 'center',
  },
  ctaDisabled: { backgroundColor: Colors.slate300, opacity: 0.6 },
  ctaText: { color: Colors.white, fontFamily: Fonts.semibold, fontSize: 16 },
});
