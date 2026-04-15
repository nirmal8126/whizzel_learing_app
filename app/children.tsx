import { useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import { ConfirmModal } from '@/components/ConfirmModal';
import { Text } from '@/components/Text';
import { BgGradient, Colors, Fonts, Radii, Shadows, Spacing } from '@/constants/theme';
import { useAuth } from '@/hooks/use-auth';
import { AGE_GROUP_TO_DIFFICULTY, AVATAR_OPTIONS, useChildren, type Child } from '@/hooks/use-children';
import { DIFF_AGE_RANGE, DIFF_COLORS, DIFF_LABELS } from '@/data/subjects';

export default function ChildrenScreen() {
  const { session } = useAuth();
  const { children, updateChild, deleteChild } = useChildren(session?.user.id);
  const [editing, setEditing] = useState<Child | null>(null);
  const [pendingRemove, setPendingRemove] = useState<Child | null>(null);
  const [removing, setRemoving] = useState(false);

  const confirmDelete = (child: Child) => {
    setPendingRemove(child);
  };

  const performDelete = async () => {
    if (!pendingRemove) return;
    setRemoving(true);
    const res = await deleteChild(pendingRemove.id);
    setRemoving(false);
    setPendingRemove(null);
    if ('error' in res) {
      Alert.alert('Could not remove', res.error);
    }
  };

  return (
    <LinearGradient colors={BgGradient.warm} locations={BgGradient.warmStops} style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.header}>
          {children.length > 0 ? (
            <Pressable
              onPress={() => router.replace('/subjects')}
              style={[styles.backBtn, Shadows.sm]}
              hitSlop={10}
            >
              <Text style={{ fontSize: 18, color: Colors.textPrimary, fontFamily: Fonts.bold }}>←</Text>
            </Pressable>
          ) : (
            <View style={{ width: 40 }} />
          )}
          <Text variant="h3">Profiles</Text>
          <View style={{ width: 40 }} />
        </View>

        <Animated.View entering={FadeInUp.duration(400)} style={styles.summary}>
          <Text variant="caption">{children.length} of 3 profiles</Text>
        </Animated.View>

        {children.map((c, i) => {
          const diff = AGE_GROUP_TO_DIFFICULTY[c.age_group];
          return (
            <Animated.View key={c.id} entering={FadeInDown.delay(i * 80)} style={[styles.card, Shadows.md]}>
              <View style={styles.cardHeader}>
                <View style={[styles.avatarBubble, { backgroundColor: `${DIFF_COLORS[diff]}20` }]}>
                  <Text style={styles.avatar}>{c.avatar}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text variant="h4">{c.display_name}</Text>
                  <View style={[styles.levelChip, { backgroundColor: `${DIFF_COLORS[diff]}15` }]}>
                    <Text style={{ color: DIFF_COLORS[diff], fontFamily: Fonts.semibold, fontSize: 11 }}>
                      {DIFF_LABELS[diff]} · {DIFF_AGE_RANGE[diff]}
                    </Text>
                  </View>
                </View>
              </View>
              <View style={styles.actions}>
                <Pressable
                  onPress={() => setEditing(c)}
                  style={({ pressed }) => [styles.actionBtn, styles.editBtn, pressed && { opacity: 0.6 }]}
                >
                  <Text style={{ fontFamily: Fonts.semibold, fontSize: 14, color: Colors.textPrimary }}>
                    Edit
                  </Text>
                </Pressable>
                <Pressable
                  onPress={() => confirmDelete(c)}
                  style={({ pressed }) => [styles.actionBtn, styles.removeBtn, pressed && { opacity: 0.7 }]}
                >
                  <Text style={{ fontSize: 14 }}>🗑</Text>
                  <Text style={{ fontFamily: Fonts.semibold, fontSize: 14, color: Colors.danger }}>
                    Remove
                  </Text>
                </Pressable>
              </View>
            </Animated.View>
          );
        })}

        {children.length === 0 && (
          <View style={[styles.empty, Shadows.sm]}>
            <Text style={{ fontSize: 48, marginBottom: 12 }}>👋</Text>
            <Text variant="h4" style={{ marginBottom: 4 }}>No profiles yet</Text>
            <Text variant="small" style={{ textAlign: 'center', marginBottom: Spacing.lg }}>
              Add a child profile to get started
            </Text>
          </View>
        )}

        {children.length < 3 && (
          <Pressable
            onPress={() => router.push('/add-child')}
            style={({ pressed }) => [styles.addBtn, pressed && { transform: [{ scale: 0.98 }] }]}
          >
            <Text style={{ fontSize: 18 }}>＋</Text>
            <Text style={{ fontFamily: Fonts.semibold, fontSize: 15, color: Colors.textSecondary }}>
              Add another child
            </Text>
          </Pressable>
        )}
      </ScrollView>

      {editing && (
        <EditOverlay
          child={editing}
          onClose={() => setEditing(null)}
          onSave={async (changes) => {
            const res = await updateChild(editing.id, changes);
            setEditing(null);
            if ('error' in res) {
              Alert.alert('Could not save', res.error);
            }
          }}
        />
      )}

      <ConfirmModal
        visible={!!pendingRemove}
        tone="destructive"
        emoji="🗑"
        title={pendingRemove ? `Remove ${pendingRemove.display_name}?` : ''}
        message="This permanently deletes their progress, badges, and quiz history. This action cannot be undone."
        confirmText={removing ? 'Removing…' : 'Yes, remove'}
        cancelText="Keep profile"
        onConfirm={performDelete}
        onCancel={() => !removing && setPendingRemove(null)}
      />
    </LinearGradient>
  );
}

function EditOverlay({
  child,
  onClose,
  onSave,
}: {
  child: Child;
  onClose: () => void;
  onSave: (changes: Partial<Pick<Child, 'display_name' | 'age_group' | 'avatar'>>) => void;
}) {
  const [name, setName] = useState(child.display_name);
  const [avatar, setAvatar] = useState(child.avatar);
  const [ageGroup, setAgeGroup] = useState<Child['age_group']>(child.age_group);

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={overlay.backdrop}>
      <Pressable onPress={onClose} style={overlay.dismissArea} />
      <Animated.View entering={FadeInDown.duration(300)} style={[overlay.sheet, Shadows.xl]}>
        <View style={overlay.handle} />
        <Text variant="h3" style={{ marginBottom: Spacing.md }}>
          Edit {child.display_name}
        </Text>

        <Text variant="label" style={{ marginBottom: Spacing.sm, marginTop: Spacing.sm }}>AVATAR</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {AVATAR_OPTIONS.map((a) => (
            <Pressable
              key={a}
              onPress={() => setAvatar(a)}
              style={[overlay.avatarBtn, avatar === a && overlay.avatarBtnActive]}
            >
              <Text style={overlay.avatarEmoji}>{a}</Text>
            </Pressable>
          ))}
        </ScrollView>

        <Text variant="label" style={{ marginBottom: Spacing.sm, marginTop: Spacing.lg }}>NAME</Text>
        <TextInput
          value={name}
          onChangeText={setName}
          autoCapitalize="words"
          maxLength={20}
          style={overlay.input}
        />

        <Text variant="label" style={{ marginBottom: Spacing.sm, marginTop: Spacing.lg }}>SKILL LEVEL</Text>
        <View style={overlay.ageRow}>
          {(['explorer', 'challenger', 'master'] as const).map((g) => {
            const diff = AGE_GROUP_TO_DIFFICULTY[g];
            const selected = ageGroup === g;
            return (
              <Pressable
                key={g}
                onPress={() => setAgeGroup(g)}
                style={[
                  overlay.ageBtn,
                  selected && {
                    backgroundColor: DIFF_COLORS[diff],
                  },
                ]}
              >
                <Text style={{ color: selected ? Colors.white : Colors.textSecondary, fontFamily: Fonts.semibold, fontSize: 13 }}>
                  {DIFF_LABELS[diff]}
                </Text>
              </Pressable>
            );
          })}
        </View>

        <View style={overlay.actionsRow}>
          <Pressable onPress={onClose} style={overlay.cancelBtn}>
            <Text style={{ fontFamily: Fonts.semibold, fontSize: 15, color: Colors.textSecondary }}>
              Cancel
            </Text>
          </Pressable>
          <Pressable
            onPress={() => onSave({ display_name: name.trim() || child.display_name, avatar, age_group: ageGroup })}
            style={overlay.saveBtn}
          >
            <Text style={{ fontFamily: Fonts.semibold, fontSize: 15, color: Colors.white }}>
              Save changes
            </Text>
          </Pressable>
        </View>
      </Animated.View>
    </KeyboardAvoidingView>
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

  summary: { marginBottom: Spacing.md, paddingHorizontal: 4 },

  card: {
    backgroundColor: Colors.surface,
    borderRadius: Radii.xl,
    padding: Spacing.base,
    marginBottom: Spacing.md,
  },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, marginBottom: Spacing.md },
  avatarBubble: {
    width: 56, height: 56, borderRadius: Radii.lg,
    alignItems: 'center', justifyContent: 'center',
  },
  avatar: { fontSize: 32 },
  levelChip: {
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: Radii.pill,
    marginTop: 6,
  },
  actions: { flexDirection: 'row', gap: Spacing.sm },
  actionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
    borderRadius: Radii.md,
  },
  editBtn: { backgroundColor: Colors.slate100 },
  removeBtn: { backgroundColor: Colors.dangerLight },

  empty: {
    backgroundColor: Colors.surface,
    borderRadius: Radii.xl,
    padding: Spacing.xl,
    alignItems: 'center',
    marginBottom: Spacing.md,
  },

  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: Spacing.sm,
    paddingVertical: 16,
    borderRadius: Radii.lg,
    borderWidth: 2,
    borderColor: Colors.border,
    borderStyle: 'dashed',
    backgroundColor: 'transparent',
  },
});

const overlay = StyleSheet.create({
  backdrop: {
    position: 'absolute', top: 0, bottom: 0, left: 0, right: 0,
    backgroundColor: 'rgba(15,10,42,0.5)',
    justifyContent: 'flex-end',
  },
  dismissArea: { flex: 1 },
  sheet: {
    backgroundColor: Colors.surface,
    paddingTop: Spacing.sm,
    paddingHorizontal: Spacing.xl,
    paddingBottom: Spacing.xl,
    borderTopLeftRadius: Radii.xxl,
    borderTopRightRadius: Radii.xxl,
  },
  handle: {
    width: 36, height: 4, borderRadius: 2,
    backgroundColor: Colors.slate200,
    alignSelf: 'center',
    marginBottom: Spacing.lg,
  },
  avatarBtn: {
    width: 56, height: 56, borderRadius: Radii.md, marginRight: 8,
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
    backgroundColor: Colors.slate100, alignItems: 'center',
  },
  actionsRow: { flexDirection: 'row', gap: 10, marginTop: Spacing.xl },
  cancelBtn: { flex: 1, paddingVertical: 14, borderRadius: Radii.md, backgroundColor: Colors.slate100, alignItems: 'center' },
  saveBtn: { flex: 1, paddingVertical: 14, borderRadius: Radii.md, backgroundColor: Colors.primary, alignItems: 'center' },
});
