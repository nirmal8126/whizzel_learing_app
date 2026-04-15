import { useState } from 'react';
import { ActivityIndicator, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { BounceIn, FadeInUp } from 'react-native-reanimated';
import { Text } from '@/components/Text';
import { BgGradient, Colors, Fonts, Radii, Shadows, Spacing } from '@/constants/theme';
import { useAuth } from '@/hooks/use-auth';

type Mode = 'signin' | 'signup';

export default function AuthScreen() {
  const { signIn, signUp, configured } = useAuth();
  const [mode, setMode] = useState<Mode>('signup');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [emailFocus, setEmailFocus] = useState(false);
  const [pwFocus, setPwFocus] = useState(false);

  const submit = async () => {
    if (!email.trim() || !password) return;
    setBusy(true);
    setError(null);
    const fn = mode === 'signin' ? signIn : signUp;
    const { error } = await fn(email.trim(), password);
    setBusy(false);
    if (error) {
      setError(error);
      return;
    }
    router.replace('/');
  };

  if (!configured) {
    return (
      <View style={[styles.container, styles.center]}>
        <Text variant="body" style={{ color: Colors.danger, textAlign: 'center', padding: 24 }}>
          Supabase is not configured. Check your .env file.
        </Text>
      </View>
    );
  }

  const canSubmit = email.trim().length > 0 && password.length >= 6 && !busy;

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <LinearGradient colors={BgGradient.warm} locations={BgGradient.warmStops} style={styles.container}>
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          <Animated.View entering={BounceIn.delay(80)} style={styles.brandBubble}>
            <Text style={styles.brandEmoji}>🧠</Text>
          </Animated.View>
          <Animated.Text entering={FadeInUp.delay(180)} style={styles.brand}>
            Brain Quest
          </Animated.Text>
          <Animated.Text entering={FadeInUp.delay(240)} style={styles.brandSub}>
            Adventure
          </Animated.Text>

          <Animated.View entering={FadeInUp.delay(320)} style={[styles.card, Shadows.md]}>
            <Text variant="h3" style={{ marginBottom: 4 }}>
              {mode === 'signup' ? 'Create account' : 'Welcome back'}
            </Text>
            <Text variant="small" style={{ marginBottom: Spacing.lg }}>
              {mode === 'signup'
                ? 'Sign up to save your child\'s progress'
                : 'Sign in to continue the adventure'}
            </Text>

            {/* Tabs */}
            <View style={styles.tabs}>
              {(['signup', 'signin'] as Mode[]).map((m) => (
                <Pressable
                  key={m}
                  onPress={() => { setMode(m); setError(null); }}
                  style={[styles.tab, mode === m && [styles.tabActive, Shadows.sm]]}
                >
                  <Text
                    weight="semibold"
                    style={{ color: mode === m ? Colors.textPrimary : Colors.textMuted, fontSize: 14 }}
                  >
                    {m === 'signup' ? 'Sign up' : 'Sign in'}
                  </Text>
                </Pressable>
              ))}
            </View>

            <Text variant="label" style={styles.label}>EMAIL</Text>
            <TextInput
              value={email}
              onChangeText={setEmail}
              placeholder="parent@example.com"
              placeholderTextColor={Colors.textMuted}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              onFocus={() => setEmailFocus(true)}
              onBlur={() => setEmailFocus(false)}
              style={[styles.input, emailFocus && styles.inputFocus]}
            />

            <Text variant="label" style={styles.label}>PASSWORD</Text>
            <TextInput
              value={password}
              onChangeText={setPassword}
              placeholder={mode === 'signup' ? 'Min 6 characters' : 'Your password'}
              placeholderTextColor={Colors.textMuted}
              secureTextEntry
              onFocus={() => setPwFocus(true)}
              onBlur={() => setPwFocus(false)}
              style={[styles.input, pwFocus && styles.inputFocus]}
            />

            {error && (
              <View style={styles.errorBox}>
                <Text style={{ fontSize: 14 }}>⚠️</Text>
                <Text style={{ color: Colors.dangerDark, fontFamily: Fonts.medium, fontSize: 13, flex: 1 }}>
                  {error}
                </Text>
              </View>
            )}

            <Pressable
              onPress={submit}
              disabled={!canSubmit}
              style={({ pressed }) => [
                styles.cta,
                !canSubmit && styles.ctaDisabled,
                pressed && canSubmit ? { transform: [{ scale: 0.98 }] } : null,
              ]}
            >
              {busy ? (
                <ActivityIndicator color={Colors.white} />
              ) : (
                <Text style={styles.ctaText}>
                  {mode === 'signup' ? 'Create account' : 'Sign in'}
                </Text>
              )}
            </Pressable>
          </Animated.View>

          <Animated.Text entering={FadeInUp.delay(500)} style={styles.foot}>
            🔒 We never collect data from children. Parents only.
          </Animated.Text>
        </ScrollView>
      </LinearGradient>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: { alignItems: 'center', justifyContent: 'center' },
  scroll: { flexGrow: 1, padding: Spacing.lg, paddingTop: 80, alignItems: 'center' },

  brandBubble: {
    width: 80, height: 80, borderRadius: Radii.xxl,
    backgroundColor: Colors.surface,
    alignItems: 'center', justifyContent: 'center',
    marginBottom: Spacing.md,
    ...Shadows.md,
  },
  brandEmoji: { fontSize: 44 },
  brand: { fontFamily: Fonts.bold, fontSize: 32, color: Colors.textPrimary, letterSpacing: -0.5 },
  brandSub: { fontFamily: Fonts.medium, fontSize: 15, color: Colors.primary, marginBottom: Spacing.xl },

  card: {
    width: '100%',
    maxWidth: 420,
    backgroundColor: Colors.surface,
    borderRadius: Radii.xxl,
    padding: Spacing.xl,
  },

  tabs: {
    flexDirection: 'row',
    backgroundColor: Colors.slate100,
    borderRadius: Radii.md,
    padding: 4,
    marginBottom: Spacing.lg,
  },
  tab: { flex: 1, paddingVertical: 10, borderRadius: Radii.sm, alignItems: 'center' },
  tabActive: { backgroundColor: Colors.surface },

  label: { marginBottom: 6, marginTop: Spacing.md },
  input: {
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: Radii.md,
    borderWidth: 2,
    borderColor: Colors.border,
    backgroundColor: Colors.surfaceMuted,
    fontSize: 15,
    fontFamily: Fonts.medium,
    color: Colors.textPrimary,
  },
  inputFocus: { borderColor: Colors.primary, backgroundColor: Colors.surface },

  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: Colors.dangerLight,
    padding: 12,
    borderRadius: Radii.md,
    marginTop: Spacing.md,
  },

  cta: {
    marginTop: Spacing.lg,
    paddingVertical: 16,
    borderRadius: Radii.lg,
    backgroundColor: Colors.primary,
    alignItems: 'center',
  },
  ctaDisabled: { backgroundColor: Colors.slate300, opacity: 0.6 },
  ctaText: { color: Colors.white, fontFamily: Fonts.semibold, fontSize: 16 },

  foot: {
    fontSize: 12,
    fontFamily: Fonts.medium,
    color: Colors.textMuted,
    marginTop: Spacing.lg,
    textAlign: 'center',
  },
});
