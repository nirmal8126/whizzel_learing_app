import AsyncStorage from '@react-native-async-storage/async-storage';
import { useCallback, useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import type { Difficulty } from '@/data/subjects';

const SELECTED_KEY = 'bqa:selected-child:v1';

export type Child = {
  id: string;
  parent_id: string;
  display_name: string;
  age_group: 'explorer' | 'challenger' | 'master';
  avatar: string;
  created_at: string;
};

export const AGE_GROUP_TO_DIFFICULTY: Record<Child['age_group'], Difficulty> = {
  explorer: 'easy',
  challenger: 'medium',
  master: 'hard',
};

export function useChildren(parentId: string | undefined) {
  const [children, setChildren] = useState<Child[]>([]);
  const [selectedId, setSelectedIdState] = useState<string | null>(null);
  const [loadedFor, setLoadedFor] = useState<string | undefined>(undefined);

  // Derive loading so it flips to true synchronously when parentId changes,
  // instead of lagging a render behind while a useEffect runs.
  const loading = parentId !== undefined && loadedFor !== parentId;

  const refresh = useCallback(async () => {
    if (!supabase || !parentId) {
      setChildren([]);
      setLoadedFor(parentId);
      return;
    }
    const { data, error } = await supabase
      .from('children')
      .select('*')
      .eq('parent_id', parentId)
      .order('created_at', { ascending: true });
    if (!error && data) setChildren(data as Child[]);
    setLoadedFor(parentId);
  }, [parentId]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  // Restore selected child from local storage
  useEffect(() => {
    AsyncStorage.getItem(SELECTED_KEY).then((id) => {
      if (id) setSelectedIdState(id);
    });
  }, []);

  const selectChild = useCallback(async (id: string) => {
    setSelectedIdState(id);
    await AsyncStorage.setItem(SELECTED_KEY, id);
  }, []);

  const addChild = useCallback(
    async (input: { display_name: string; age_group: Child['age_group']; avatar?: string }) => {
      if (!supabase || !parentId) return { error: 'Not signed in' };
      const { data, error } = await supabase
        .from('children')
        .insert({
          parent_id: parentId,
          display_name: input.display_name,
          age_group: input.age_group,
          avatar: input.avatar ?? '🧒',
        })
        .select()
        .single();
      if (error || !data) return { error: error?.message ?? 'Failed to create' };
      setChildren((prev) => [...prev, data as Child]);
      // auto-select first child
      if (children.length === 0) selectChild((data as Child).id);
      return { child: data as Child };
    },
    [parentId, children.length, selectChild]
  );

  const updateChild = useCallback(
    async (
      id: string,
      input: Partial<Pick<Child, 'display_name' | 'age_group' | 'avatar'>>
    ) => {
      if (!supabase) return { error: 'Not configured' };
      const { data, error } = await supabase
        .from('children')
        .update(input)
        .eq('id', id)
        .select()
        .single();
      if (error || !data) return { error: error?.message ?? 'Failed to update' };
      setChildren((prev) => prev.map((c) => (c.id === id ? (data as Child) : c)));
      return { child: data as Child };
    },
    []
  );

  const deleteChild = useCallback(
    async (id: string) => {
      if (!supabase) return { error: 'Not configured' };
      const { error } = await supabase.from('children').delete().eq('id', id);
      if (error) return { error: error.message };
      setChildren((prev) => prev.filter((c) => c.id !== id));
      // If we deleted the selected child, clear selection
      if (selectedId === id) {
        setSelectedIdState(null);
        await AsyncStorage.removeItem(SELECTED_KEY);
      }
      return { ok: true as const };
    },
    [selectedId]
  );

  const selected = children.find((c) => c.id === selectedId) ?? null;

  return { children, selected, loading, refresh, addChild, updateChild, deleteChild, selectChild };
}

export const AVATAR_OPTIONS = ['🧒', '👧', '👦', '🦄', '🐶', '🐱', '🦁', '🐼', '🦊', '🐻'];
