import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  TouchableOpacity,
  TextInput,
  Modal,
  Alert,
  ActivityIndicator,
  Share,
  RefreshControl,
} from 'react-native';
import { useAuth } from '../_layout';
import { supabase, getFellowshipMembers } from '../../lib/supabase';
import { FellowshipPanel } from '../../components/FellowshipPanel';
import {
  FellowshipMemberDisplay,
  DBFellowship,
  DBFellowshipMember,
  DBUser,
} from '../../lib/types';
import { getTodayDateString } from '../../lib/streaks';
import { colors, typography, spacing, radius, shadows } from '../../constants/theme';

export default function FellowshipScreen() {
  const { user, refreshUser } = useAuth();
  const [fellowship, setFellowship] = useState<DBFellowship | null>(null);
  const [members, setMembers] = useState<FellowshipMemberDisplay[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Create/join modals
  const [showCreate, setShowCreate] = useState(false);
  const [showJoin, setShowJoin] = useState(false);
  const [newFellowshipName, setNewFellowshipName] = useState('');
  const [joinCode, setJoinCode] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const today = getTodayDateString();

  const loadFellowship = useCallback(async () => {
    if (!user?.fellowship_id) {
      setIsLoading(false);
      setIsRefreshing(false);
      return;
    }

    try {
      // Get fellowship details
      const { data: fellowshipData, error: fErr } = await supabase
        .from('fellowships')
        .select('*')
        .eq('id', user.fellowship_id)
        .single();

      if (fErr || !fellowshipData) throw fErr ?? new Error('No fellowship');
      setFellowship(fellowshipData as DBFellowship);

      // Get members with their profiles
      const rawMembers = await getFellowshipMembers(user.fellowship_id);
      if (!rawMembers) {
        setMembers([]);
        return;
      }

      // Get today's completions for all members
      const memberIds = rawMembers.map((m: any) => m.user_id);
      const { data: completions } = await supabase
        .from('daily_completions')
        .select('*')
        .in('user_id', memberIds)
        .eq('date', today);

      const completionMap: Record<string, any> = {};
      for (const c of completions ?? []) {
        completionMap[c.user_id] = c;
      }

      const displayMembers: FellowshipMemberDisplay[] = rawMembers.map((m: any) => {
        const memberUser: DBUser = m.users ?? m.user;
        const comp = completionMap[memberUser?.id] ?? null;
        return {
          id: memberUser?.id ?? m.user_id,
          name: memberUser?.name ?? 'Unknown',
          race: memberUser?.race ?? 'hobbit',
          avatar_id: memberUser?.avatar_id ?? 'avatar-1',
          streak_count: memberUser?.streak_count ?? 0,
          today_read: comp?.read_done ?? false,
          today_pray: comp?.pray_done ?? false,
          today_memorise: comp?.memorise_done ?? false,
          today_reflect: comp?.reflect_done ?? false,
          xp: memberUser?.xp ?? 0,
          level: memberUser?.level ?? 0,
        };
      });

      // Sort: current user first, then by XP descending
      displayMembers.sort((a, b) => {
        if (a.id === user.id) return -1;
        if (b.id === user.id) return 1;
        return b.xp - a.xp;
      });

      setMembers(displayMembers);
    } catch (e) {
      console.warn('Failed to load fellowship:', e);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [user, today]);

  useEffect(() => {
    loadFellowship();
  }, [loadFellowship]);

  // ── Create fellowship ───────────────────────────────────────────────────────

  async function handleCreate() {
    if (!newFellowshipName.trim() || !user) return;
    setIsSubmitting(true);
    try {
      const { data: newFellowship, error } = await supabase
        .from('fellowships')
        .insert({
          name: newFellowshipName.trim(),
          created_by: user.id,
          campaign_id: user.campaign_id,
        })
        .select()
        .single();

      if (error || !newFellowship) throw error ?? new Error('Create failed');

      // Add self as member
      await supabase.from('fellowship_members').insert({
        fellowship_id: newFellowship.id,
        user_id: user.id,
      });

      // Update user profile
      await supabase
        .from('users')
        .update({ fellowship_id: newFellowship.id })
        .eq('id', user.id);

      await refreshUser();
      setShowCreate(false);
      setNewFellowshipName('');
      loadFellowship();
    } catch (e: any) {
      Alert.alert('Error', e?.message ?? 'Failed to create fellowship.');
    } finally {
      setIsSubmitting(false);
    }
  }

  // ── Join fellowship ─────────────────────────────────────────────────────────

  async function handleJoin() {
    if (!joinCode.trim() || !user) return;
    setIsSubmitting(true);
    try {
      const { data: found, error } = await supabase
        .from('fellowships')
        .select('*')
        .eq('invite_code', joinCode.trim().toUpperCase())
        .single();

      if (error || !found) {
        Alert.alert('Not found', 'No fellowship found with that invite code.');
        return;
      }

      // Add as member
      await supabase.from('fellowship_members').upsert(
        { fellowship_id: found.id, user_id: user.id },
        { onConflict: 'fellowship_id,user_id' }
      );

      // Update user profile
      await supabase
        .from('users')
        .update({ fellowship_id: found.id })
        .eq('id', user.id);

      await refreshUser();
      setShowJoin(false);
      setJoinCode('');
      loadFellowship();
    } catch (e: any) {
      Alert.alert('Error', e?.message ?? 'Failed to join fellowship.');
    } finally {
      setIsSubmitting(false);
    }
  }

  // ── Share invite ────────────────────────────────────────────────────────────

  async function handleShare() {
    if (!fellowship) return;
    try {
      await Share.share({
        message: `Join my fellowship "${fellowship.name}" in Fellowship of the Word! Use invite code: ${fellowship.invite_code}`,
        title: 'Fellowship of the Word — Invitation',
      });
    } catch (e) {
      console.warn('Share failed:', e);
    }
  }

  // ── Render ─────────────────────────────────────────────────────────────────

  if (isLoading) {
    return (
      <SafeAreaView style={styles.root}>
        <View style={styles.centered}>
          <ActivityIndicator color={colors.gold} size="large" />
          <Text style={styles.loadingText}>Gathering the fellowship...</Text>
        </View>
      </SafeAreaView>
    );
  }

  // No fellowship yet
  if (!user?.fellowship_id || !fellowship) {
    return (
      <SafeAreaView style={styles.root}>
        <ScrollView contentContainerStyle={styles.scroll}>
          <View style={styles.header}>
            <Text style={styles.title}>Fellowship</Text>
            <Text style={styles.subtitle}>Walk the road with others.</Text>
          </View>

          <View style={styles.noFellowshipCard}>
            <Text style={styles.noFellowshipEmoji}>⚔️</Text>
            <Text style={styles.noFellowshipTitle}>No fellowship yet</Text>
            <Text style={styles.noFellowshipText}>
              The road is harder alone. Create a fellowship with friends or join
              one with an invite code.
            </Text>

            <TouchableOpacity
              style={styles.createButton}
              onPress={() => setShowCreate(true)}
            >
              <Text style={styles.createButtonText}>Create a Fellowship</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.joinButton}
              onPress={() => setShowJoin(true)}
            >
              <Text style={styles.joinButtonText}>Join with Invite Code</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.quoteCard}>
            <Text style={styles.quote}>
              "I will take the Ring, though I do not know the way."
            </Text>
            <Text style={styles.quoteAttrib}>— Frodo Baggins</Text>
          </View>
        </ScrollView>

        {/* Create modal */}
        <Modal visible={showCreate} transparent animationType="slide">
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Create Fellowship</Text>
              <Text style={styles.modalSubtitle}>
                Give your fellowship a name worthy of the road.
              </Text>
              <TextInput
                style={styles.modalInput}
                value={newFellowshipName}
                onChangeText={setNewFellowshipName}
                placeholder="e.g. The Nine Walkers"
                placeholderTextColor={colors.parchmentMuted + '60'}
                maxLength={40}
                autoCapitalize="words"
              />
              <TouchableOpacity
                style={[styles.modalSubmit, isSubmitting && { opacity: 0.5 }]}
                onPress={handleCreate}
                disabled={isSubmitting || !newFellowshipName.trim()}
              >
                <Text style={styles.modalSubmitText}>
                  {isSubmitting ? 'Creating...' : 'Create'}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => setShowCreate(false)}>
                <Text style={styles.modalCancel}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>

        {/* Join modal */}
        <Modal visible={showJoin} transparent animationType="slide">
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Join a Fellowship</Text>
              <Text style={styles.modalSubtitle}>Enter the 6-letter invite code.</Text>
              <TextInput
                style={[styles.modalInput, styles.codeInput]}
                value={joinCode}
                onChangeText={setJoinCode}
                placeholder="ABC123"
                placeholderTextColor={colors.parchmentMuted + '60'}
                maxLength={6}
                autoCapitalize="characters"
                autoCorrect={false}
              />
              <TouchableOpacity
                style={[styles.modalSubmit, isSubmitting && { opacity: 0.5 }]}
                onPress={handleJoin}
                disabled={isSubmitting || joinCode.trim().length < 6}
              >
                <Text style={styles.modalSubmitText}>
                  {isSubmitting ? 'Joining...' : 'Join'}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => setShowJoin(false)}>
                <Text style={styles.modalCancel}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.root}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={() => {
              setIsRefreshing(true);
              loadFellowship();
            }}
            tintColor={colors.gold}
          />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Fellowship</Text>
          <Text style={styles.subtitle}>{fellowship.name}</Text>
        </View>

        {/* Fellowship panel */}
        {user && (
          <FellowshipPanel
            members={members}
            currentUserId={user.id}
            fellowshipName={fellowship.name}
            inviteCode={fellowship.invite_code}
            onInvitePress={handleShare}
          />
        )}

        {/* Inspirational quote */}
        <View style={[styles.quoteCard, { marginTop: spacing.base }]}>
          <Text style={styles.quote}>
            "Yet such is oft the course of deeds that move the wheels of the world:{'\n'}
            small hands do them because they must, while the eyes of the great are elsewhere."
          </Text>
          <Text style={styles.quoteAttrib}>— J.R.R. Tolkien, The Fellowship of the Ring</Text>
        </View>

        <View style={{ height: spacing.xl }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scroll: {
    padding: spacing.base,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: spacing.base,
  },
  loadingText: {
    color: colors.parchmentMuted,
    fontSize: typography.sm,
    fontStyle: 'italic',
  },
  header: {
    marginBottom: spacing.base,
  },
  title: {
    fontSize: typography['2xl'],
    fontWeight: typography.bold,
    color: colors.parchment,
  },
  subtitle: {
    fontSize: typography.sm,
    color: colors.gold,
    marginTop: 2,
  },
  noFellowshipCard: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    padding: spacing.xl,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.base,
    ...shadows.sm,
  },
  noFellowshipEmoji: {
    fontSize: 48,
    marginBottom: spacing.base,
  },
  noFellowshipTitle: {
    fontSize: typography.lg,
    fontWeight: typography.bold,
    color: colors.parchment,
    marginBottom: spacing.sm,
  },
  noFellowshipText: {
    fontSize: typography.base,
    color: colors.parchmentMuted,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: spacing.xl,
  },
  createButton: {
    backgroundColor: colors.gold,
    borderRadius: radius.md,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xl,
    width: '100%',
    alignItems: 'center',
    marginBottom: spacing.sm,
    ...shadows.gold,
  },
  createButtonText: {
    fontSize: typography.base,
    fontWeight: typography.bold,
    color: colors.background,
  },
  joinButton: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xl,
    width: '100%',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  joinButtonText: {
    fontSize: typography.base,
    fontWeight: typography.medium,
    color: colors.parchmentMuted,
  },
  quoteCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.base,
    borderWidth: 1,
    borderColor: colors.border,
    borderLeftWidth: 2,
    borderLeftColor: colors.gold + '60',
  },
  quote: {
    fontSize: typography.sm,
    color: colors.parchmentMuted,
    fontStyle: 'italic',
    lineHeight: 22,
    marginBottom: spacing.sm,
  },
  quoteAttrib: {
    fontSize: typography.xs,
    color: colors.parchmentMuted,
    opacity: 0.6,
  },
  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: colors.overlay,
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    padding: spacing.xl,
    paddingBottom: spacing['3xl'],
    borderTopWidth: 1,
    borderColor: colors.border,
  },
  modalTitle: {
    fontSize: typography.xl,
    fontWeight: typography.bold,
    color: colors.parchment,
    marginBottom: spacing.xs,
  },
  modalSubtitle: {
    fontSize: typography.sm,
    color: colors.parchmentMuted,
    marginBottom: spacing.lg,
  },
  modalInput: {
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: spacing.md,
    fontSize: typography.base,
    color: colors.parchment,
    marginBottom: spacing.base,
  },
  codeInput: {
    fontSize: typography.xl,
    fontWeight: typography.bold,
    letterSpacing: 4,
    textAlign: 'center',
  },
  modalSubmit: {
    backgroundColor: colors.gold,
    borderRadius: radius.md,
    paddingVertical: spacing.md,
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  modalSubmitText: {
    fontSize: typography.base,
    fontWeight: typography.bold,
    color: colors.background,
  },
  modalCancel: {
    fontSize: typography.sm,
    color: colors.parchmentMuted,
    textAlign: 'center',
    padding: spacing.sm,
  },
});
