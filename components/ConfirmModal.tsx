import { Modal, Pressable, StyleSheet, View } from 'react-native';
import Animated, { FadeIn, ZoomIn } from 'react-native-reanimated';
import { Text } from '@/components/Text';
import { Colors, Fonts, Radii, Shadows, Spacing } from '@/constants/theme';

type Tone = 'destructive' | 'warning' | 'info' | 'success';

const TONE: Record<Tone, { emoji: string; bg: string; ring: string; ctaBg: string }> = {
  destructive: { emoji: '⚠️', bg: Colors.dangerLight, ring: Colors.danger, ctaBg: Colors.danger },
  warning:     { emoji: '🤔', bg: Colors.warningLight, ring: Colors.warning, ctaBg: Colors.warning },
  info:        { emoji: 'ℹ️', bg: Colors.infoLight, ring: Colors.info, ctaBg: Colors.info },
  success:     { emoji: '✨', bg: Colors.successLight, ring: Colors.success, ctaBg: Colors.success },
};

export type ConfirmModalProps = {
  visible: boolean;
  title: string;
  message?: string;
  confirmText?: string;
  cancelText?: string;
  tone?: Tone;
  emoji?: string;
  onConfirm: () => void;
  onCancel: () => void;
};

export function ConfirmModal({
  visible,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  tone = 'warning',
  emoji,
  onConfirm,
  onCancel,
}: ConfirmModalProps) {
  const t = TONE[tone];
  const icon = emoji ?? t.emoji;

  return (
    <Modal
      transparent
      visible={visible}
      animationType="none"
      statusBarTranslucent
      onRequestClose={onCancel}
    >
      <Animated.View entering={FadeIn.duration(180)} style={styles.backdrop}>
        <Pressable onPress={onCancel} style={StyleSheet.absoluteFill} />

        <Animated.View
          entering={ZoomIn.duration(220).springify().damping(14)}
          style={[styles.card, Shadows.xl]}
        >
          {/* Icon halo */}
          <View style={[styles.haloOuter, { backgroundColor: t.bg }]}>
            <View style={[styles.haloInner, { backgroundColor: Colors.surface, borderColor: t.ring }]}>
              <Text style={styles.icon}>{icon}</Text>
            </View>
          </View>

          {/* Copy */}
          <Text variant="h3" style={styles.title}>{title}</Text>
          {message ? <Text variant="body" style={styles.message}>{message}</Text> : null}

          {/* Actions */}
          <View style={styles.actions}>
            <Pressable
              onPress={onCancel}
              style={({ pressed }) => [
                styles.btn,
                styles.cancelBtn,
                pressed && { backgroundColor: Colors.divider },
              ]}
            >
              <Text style={styles.cancelText}>{cancelText}</Text>
            </Pressable>
            <Pressable
              onPress={onConfirm}
              style={({ pressed }) => [
                styles.btn,
                { backgroundColor: t.ctaBg },
                pressed && { transform: [{ scale: 0.98 }], opacity: 0.92 },
              ]}
            >
              <Text style={styles.confirmText}>{confirmText}</Text>
            </Pressable>
          </View>
        </Animated.View>
      </Animated.View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(15,10,42,0.55)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.lg,
  },

  card: {
    width: '100%',
    maxWidth: 380,
    backgroundColor: Colors.surface,
    borderRadius: Radii.xxl,
    paddingTop: Spacing.xxl,
    paddingHorizontal: Spacing.xl,
    paddingBottom: Spacing.xl,
    alignItems: 'center',
  },

  haloOuter: {
    width: 96, height: 96, borderRadius: 48,
    alignItems: 'center', justifyContent: 'center',
    marginBottom: Spacing.md,
  },
  haloInner: {
    width: 72, height: 72, borderRadius: 36,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 3,
  },
  icon: { fontSize: 36 },

  title: { textAlign: 'center', marginBottom: Spacing.sm },
  message: {
    textAlign: 'center',
    color: Colors.textSecondary,
    marginBottom: Spacing.xl,
    fontFamily: Fonts.regular,
  },

  actions: { flexDirection: 'row', gap: Spacing.sm, width: '100%' },
  btn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: Radii.lg,
    alignItems: 'center',
  },
  cancelBtn: { backgroundColor: Colors.surfaceMuted },
  cancelText: { fontFamily: Fonts.semibold, fontSize: 15, color: Colors.textSecondary },
  confirmText: { fontFamily: Fonts.semibold, fontSize: 15, color: Colors.white },
});
