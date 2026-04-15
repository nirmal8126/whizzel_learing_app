import { useEffect } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors } from '@/constants/theme';
import { useAuth } from '@/hooks/use-auth';
import { useChildren } from '@/hooks/use-children';

/**
 * Auth gate. Decides where to send the user on launch:
 *   - Not signed in → /auth
 *   - Signed in, no children → /add-child
 *   - Signed in, one child → /subjects (auto-select)
 *   - Signed in, multiple children, no selection → /select-child
 *   - Signed in, has selection → /subjects
 */
export default function IndexGate() {
  const { session, loading: authLoading, configured } = useAuth();
  const { children, selected, loading: kidsLoading, selectChild } = useChildren(session?.user.id);

  useEffect(() => {
    if (authLoading) return;

    if (!configured) {
      // Supabase missing — fall back to local-only flow on /subjects with default
      router.replace('/subjects');
      return;
    }

    if (!session) {
      router.replace('/auth');
      return;
    }

    if (kidsLoading) return;

    if (children.length === 0) {
      router.replace('/add-child');
      return;
    }

    if (children.length === 1) {
      selectChild(children[0].id);
      router.replace('/subjects');
      return;
    }

    if (selected) {
      router.replace('/subjects');
      return;
    }

    router.replace('/select-child');
  }, [authLoading, kidsLoading, configured, session, children, selected, selectChild]);

  return (
    <LinearGradient colors={[Colors.bgPrimary, Colors.bgAccent3]} style={styles.container}>
      <ActivityIndicator color={Colors.primary} size="large" />
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center' },
});
