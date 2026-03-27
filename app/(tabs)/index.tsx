import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  RefreshControl,
  TouchableOpacity,
  Alert,
  Modal,
  TextInput,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useAuth } from '../_layout';
import {
  getTodayCompletion,
  upsertDailyCompletion,
  updateUserXPAndStreak,
  getCampaignQuest,
  getUserProgress,
  saveJournalEntry,
  getJournalEntry,
  checkAndAwardArtefacts,
  getTotalCompletedHabits,
  getCompletedCampaignIds,
} from '../../lib/supabase';
import {
  cacheTodayQuest,
  getCachedTodayQuest,
  saveTodayHabits,
  getTodayHabits,
} from '../../lib/storage';
import { calculateDayXP, calculateStreakBonus } from '../../lib/xp';
import { calculateNewStreak, getTodayDateString, isStreakAlive } from '../../lib/streaks';
import { QuestData, DailyHabits, HabitType, LocationData, DBUserProgress, ArtefactData } from '../../lib/types';
import { getLevelForXP } from '../../constants/levels';
import { isQuestGated, getGateInfo } from '../../lib/levelGate';
import { QuestCard } from '../../components/QuestCard';
import { HabitsTracker } from '../../components/HabitsTracker';
import { XPBar } from '../../components/XPBar';
import { LevelGateCard } from '../../components/LevelGateCard';
import { LoreUnlockModal, ArtefactUnlockModal } from '../../components/LoreUnlockModal';
import { colors, typography, spacing, radius, shadows } from '../../constants/theme';
import locationsData from '../../data/locations.json';
import artefactsData from '../../data/artefacts.json';

const DEFAULT_HABITS: DailyHabits = {
  read: false,
  pray: false,
  memorise: false,
  reflect: false,
};

const ALL_ARTEFACTS = artefactsData as ArtefactData[];

export default function HomeScreen() {
  const { user, refreshUser } = useAuth();

  const [quest, setQuest] = useState<QuestData | null>(null);
  const [location, setLocation] = useState<LocationData | null>(null);
  const [habits, setHabits] = useState<DailyHabits>(DEFAULT_HABITS);
  const [progress, setProgress] = useState<DBUserProgress | null>(null);
  const [xpEarnedToday, setXpEarnedToday] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Journal modal
  const [journalOpen, setJournalOpen] = useState(false);
  const [journalDraft, setJournalDraft] = useState('');
  const [journalSaved, setJournalSaved] = useState(false);

  // Modals
  const [locationUnlock, setLocationUnlock] = useState<LocationData | null>(null);
  const [artefactUnlock, setArtefactUnlock] = useState<{ name: string; emoji: string; description: string } | null>(null);

  const today = getTodayDateString();
  const race = user?.race ?? 'hobbit';

  // ── Load data ──────────────────────────────────────────────────────────────

  const loadData = useCallback(async () => {
    if (!user?.campaign_id) return;

    try {
      let prog: DBUserProgress | null = null;
      try {
        prog = await getUserProgress(user.id, user.campaign_id);
        setProgress(prog);
      } catch {
        // offline — continue with what we have
      }

      const currentDay = prog?.current_day ?? 1;

      // Try cache first
      let todayQuest = await getCachedTodayQuest();
      if (!todayQuest) {
        try {
          const fetched = await getCampaignQuest(user.campaign_id, currentDay);
          if (fetched) {
            todayQuest = fetched as unknown as QuestData;
            await cacheTodayQuest(todayQuest);
          }
        } catch {
          // offline — no quest
        }
      }

      if (todayQuest) {
        setQuest(todayQuest);
        const allLocations = locationsData as LocationData[];
        const loc = allLocations.find((l) => l.id === todayQuest!.lotr_location_id) ?? null;
        setLocation(loc);
      }

      // Load habits
      const cachedHabits = await getTodayHabits();
      if (cachedHabits) {
        setHabits(cachedHabits);
        setXpEarnedToday(calculateDayXP(cachedHabits, race));
      } else if (todayQuest && user) {
        try {
          const completion = await getTodayCompletion(user.id, todayQuest.id, today);
          if (completion) {
            const loaded: DailyHabits = {
              read: completion.read_done,
              pray: completion.pray_done,
              memorise: completion.memorise_done,
              reflect: completion.reflect_done,
            };
            setHabits(loaded);
            setXpEarnedToday(completion.xp_earned);
            await saveTodayHabits(loaded);
          }
        } catch {
          // offline
        }
      }

      // Pre-load journal entry for today
      if (todayQuest && user) {
        try {
          const existing = await getJournalEntry(user.id, todayQuest.id, today);
          if (existing) {
            setJournalDraft(existing);
            setJournalSaved(true);
          }
        } catch {
          // offline — skip
        }
      }
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [user, race, today]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // ── Artefact check ────────────────────────────────────────────────────────

  const checkArtefacts = useCallback(
    async (updatedHabits: DailyHabits, newXP: number, newStreak: number) => {
      if (!user) return;
      try {
        const [totalHabits, completedCampaignIds] = await Promise.all([
          getTotalCompletedHabits(user.id),
          getCompletedCampaignIds(user.id),
        ]);

        const habitsDoneThisCompletion = Object.values(updatedHabits).filter(Boolean).length;
        const totalWithToday = totalHabits + habitsDoneThisCompletion;

        const newlyUnlocked = await checkAndAwardArtefacts(user.id, {
          streakCount: newStreak,
          xp: newXP,
          level: getLevelForXP(newXP).level,
          totalHabits: totalWithToday,
          completedCampaignIds,
          fellowshipWeekActive: false, // TODO: check fellowship activity
        });

        if (newlyUnlocked.length > 0) {
          const art = ALL_ARTEFACTS.find((a) => a.id === newlyUnlocked[0]);
          if (art) {
            setArtefactUnlock({ name: art.name, emoji: art.emoji, description: art.description });
          }
        }
      } catch {
        // non-critical — silently skip
      }
    },
    [user],
  );

  // ── Toggle habit ──────────────────────────────────────────────────────────

  const handleHabitToggle = useCallback(
    async (habit: HabitType) => {
      if (!user || !quest) return;

      // Reflect habit: open journal modal instead of toggling immediately
      if (habit === 'reflect' && !habits.reflect) {
        setJournalOpen(true);
        return;
      }

      const newHabits = { ...habits, [habit]: !habits[habit] };
      setHabits(newHabits);
      const newXP = calculateDayXP(newHabits, race);
      setXpEarnedToday(newXP);
      await saveTodayHabits(newHabits);

      try {
        await upsertDailyCompletion({
          user_id: user.id,
          quest_id: quest.id,
          date: today,
          read_done: newHabits.read,
          pray_done: newHabits.pray,
          memorise_done: newHabits.memorise,
          reflect_done: newHabits.reflect,
          xp_earned: newXP,
        });

        const newStreak = calculateNewStreak(user.streak_count, user.last_active_date);
        const streakBonus = calculateStreakBonus(newStreak, race);
        const totalXP = (user.xp ?? 0) + newXP + streakBonus;
        const oldLevel = getLevelForXP(user.xp ?? 0).level;
        const newLevel = getLevelForXP(totalXP).level;

        await updateUserXPAndStreak(user.id, totalXP, newStreak, today);
        await refreshUser();

        if (newLevel > oldLevel) {
          const levelData = getLevelForXP(totalXP);
          Alert.alert(
            '✦ Level Up! ✦',
            `You have become: ${levelData.title}\n\n"${levelData.description}"`,
            [{ text: 'Excellent', style: 'default' }],
          );
        }

        await checkArtefacts(newHabits, totalXP, newStreak);
      } catch (e) {
        console.warn('Failed to sync habit:', e);
      }
    },
    [user, quest, habits, race, today, refreshUser, checkArtefacts],
  );

  // ── Journal actions ───────────────────────────────────────────────────────

  const handleJournalSave = useCallback(async () => {
    if (!user || !quest || !journalDraft.trim()) return;
    try {
      await saveJournalEntry({ user_id: user.id, quest_id: quest.id, date: today, body: journalDraft.trim() });
      setJournalSaved(true);
    } catch {
      // offline — entry saved to state anyway
    }
    // Mark reflect as done
    const newHabits = { ...habits, reflect: true };
    setHabits(newHabits);
    const newXP = calculateDayXP(newHabits, race);
    setXpEarnedToday(newXP);
    await saveTodayHabits(newHabits);
    setJournalOpen(false);
    try {
      await upsertDailyCompletion({
        user_id: user.id, quest_id: quest.id, date: today,
        read_done: newHabits.read, pray_done: newHabits.pray,
        memorise_done: newHabits.memorise, reflect_done: true, xp_earned: newXP,
      });
      const newStreak = calculateNewStreak(user.streak_count, user.last_active_date);
      const streakBonus = calculateStreakBonus(newStreak, race);
      const totalXP = (user.xp ?? 0) + newXP + streakBonus;
      await updateUserXPAndStreak(user.id, totalXP, newStreak, today);
      await refreshUser();
      await checkArtefacts(newHabits, totalXP, newStreak);
    } catch {
      // offline
    }
  }, [user, quest, today, journalDraft, habits, race, refreshUser, checkArtefacts]);

  const handleJournalSkip = useCallback(async () => {
    if (!user || !quest) return;
    setJournalOpen(false);
    // Mark reflect done without saving journal
    const newHabits = { ...habits, reflect: true };
    setHabits(newHabits);
    const newXP = calculateDayXP(newHabits, race);
    setXpEarnedToday(newXP);
    await saveTodayHabits(newHabits);
    try {
      await upsertDailyCompletion({
        user_id: user.id, quest_id: quest.id, date: today,
        read_done: newHabits.read, pray_done: newHabits.pray,
        memorise_done: newHabits.memorise, reflect_done: true, xp_earned: newXP,
      });
      const newStreak = calculateNewStreak(user.streak_count, user.last_active_date);
      const streakBonus = calculateStreakBonus(newStreak, race);
      const totalXP = (user.xp ?? 0) + newXP + streakBonus;
      await updateUserXPAndStreak(user.id, totalXP, newStreak, today);
      await refreshUser();
      await checkArtefacts(newHabits, totalXP, newStreak);
    } catch {
      // offline
    }
  }, [user, quest, today, habits, race, refreshUser, checkArtefacts]);

  // ── Render ────────────────────────────────────────────────────────────────

  if (!user) return null;

  const streakAlive = isStreakAlive(user.last_active_date);
  const currentDay = progress?.current_day ?? 1;
  const userLevel = getLevelForXP(user.xp ?? 0).level;

  // Level gate check
  const gateInfo = quest ? getGateInfo(quest, userLevel, user.xp ?? 0) : null;

  return (
    <SafeAreaView style={styles.root}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={() => { setIsRefreshing(true); loadData(); }}
            tintColor={colors.gold}
          />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>
              {getGreeting()}, {user.name || 'Wanderer'}
            </Text>
            <Text style={styles.date}>{formatDate(new Date())}</Text>
          </View>
          <View style={styles.streakBadge}>
            <Text style={styles.streakEmoji}>{streakAlive ? '🔥' : '💤'}</Text>
            <Text style={[styles.streakCount, !streakAlive && styles.streakCountInactive]}>
              {user.streak_count}
            </Text>
          </View>
        </View>

        {/* XP bar */}
        <View style={styles.xpSection}>
          <XPBar xp={user.xp ?? 0} />
        </View>

        {/* Quest card — or level gate — or loading/empty state */}
        {quest ? (
          <View style={styles.section}>
            {gateInfo ? (
              <LevelGateCard
                gate={gateInfo}
                locationEmoji={location?.emoji ?? '📍'}
                locationName={location?.name ?? ''}
                onGoToHabits={() => {/* habits are below — user can scroll */}}
              />
            ) : (
              <QuestCard quest={quest} location={location} dayNumber={currentDay} />
            )}
          </View>
        ) : isLoading ? (
          <View style={styles.loadingCard}>
            <Text style={styles.loadingText}>Loading your quest...</Text>
          </View>
        ) : (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyTitle}>No quest found</Text>
            <Text style={styles.emptyText}>
              Make sure you have selected a campaign and your Supabase data is seeded.
            </Text>
          </View>
        )}

        {/* Habits tracker — always shown when quest loaded, even if gated */}
        {quest && (
          <View style={styles.section}>
            <HabitsTracker
              habits={habits}
              onToggle={handleHabitToggle}
              race={race}
              xpEarnedToday={xpEarnedToday}
            />
          </View>
        )}

        {/* Location progress */}
        {location && progress && (
          <View style={styles.progressCard}>
            <View style={styles.progressCardHeader}>
              <Text style={styles.progressCardTitle}>Current Location</Text>
              <Text style={styles.progressCardLocation}>
                {location.emoji} {location.name}
              </Text>
            </View>
            <Text style={styles.progressCardDescription} numberOfLines={3}>
              {location.description}
            </Text>
            <View style={styles.progressDayRow}>
              <Text style={styles.progressDayText}>
                Day {currentDay} of {progress ? String(progress.campaign_id === 'the-fellowship' ? 90 : '?') : '?'}
              </Text>
            </View>
          </View>
        )}

        <View style={styles.bottomSpacer} />
      </ScrollView>

      {/* ── Journal Modal ─────────────────────────────────────────── */}
      <Modal visible={journalOpen} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setJournalOpen(false)}>
        <KeyboardAvoidingView
          style={styles.journalRoot}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <View style={styles.journalHeader}>
            <Text style={styles.journalTitle}>Reflect</Text>
            <TouchableOpacity onPress={() => setJournalOpen(false)} hitSlop={12}>
              <Text style={styles.journalClose}>✕</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.journalScroll} contentContainerStyle={styles.journalContent}>
            {quest?.reflection_prompt ? (
              <View style={styles.promptBox}>
                <Text style={styles.promptLabel}>Today's question</Text>
                <Text style={styles.promptText}>{quest.reflection_prompt}</Text>
              </View>
            ) : null}

            <TextInput
              style={styles.journalInput}
              multiline
              placeholder="Write your reflection here..."
              placeholderTextColor={colors.parchmentMuted + '60'}
              value={journalDraft}
              onChangeText={setJournalDraft}
              textAlignVertical="top"
              autoFocus={!journalSaved}
            />

            {journalSaved && (
              <Text style={styles.journalSavedNote}>Entry saved for today.</Text>
            )}
          </ScrollView>

          <View style={styles.journalActions}>
            <TouchableOpacity style={styles.journalSkip} onPress={handleJournalSkip}>
              <Text style={styles.journalSkipText}>Skip — mark done</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.journalSave, !journalDraft.trim() && styles.journalSaveDisabled]}
              onPress={handleJournalSave}
              disabled={!journalDraft.trim()}
            >
              <Text style={styles.journalSaveText}>Save & complete</Text>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* ── Other modals ──────────────────────────────────────────── */}
      <LoreUnlockModal
        visible={!!locationUnlock}
        location={locationUnlock}
        onDismiss={() => setLocationUnlock(null)}
      />
      {artefactUnlock && (
        <ArtefactUnlockModal
          visible={!!artefactUnlock}
          artefactName={artefactUnlock.name}
          artefactEmoji={artefactUnlock.emoji}
          artefactDescription={artefactUnlock.description}
          onDismiss={() => setArtefactUnlock(null)}
        />
      )}
    </SafeAreaView>
  );
}

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 5) return 'Still awake';
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  if (hour < 21) return 'Good evening';
  return 'Good night';
}

function formatDate(date: Date): string {
  return date.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scroll: {
    padding: spacing.base,
    paddingBottom: spacing['3xl'],
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.base,
  },
  greeting: {
    fontSize: typography.lg,
    fontWeight: typography.bold,
    color: colors.parchment,
  },
  date: {
    fontSize: typography.sm,
    color: colors.parchmentMuted,
    marginTop: 2,
  },
  streakBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: colors.card,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: colors.border,
  },
  streakEmoji: { fontSize: 18 },
  streakCount: {
    fontSize: typography.lg,
    fontWeight: typography.bold,
    color: colors.gold,
  },
  streakCountInactive: { color: colors.parchmentMuted },
  xpSection: {
    marginBottom: spacing.base,
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    padding: spacing.base,
    borderWidth: 1,
    borderColor: colors.border,
  },
  section: { marginBottom: spacing.base },
  loadingCard: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    padding: spacing.xl,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.base,
  },
  loadingText: { color: colors.parchmentMuted, fontSize: typography.base },
  emptyCard: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    padding: spacing.xl,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.base,
  },
  emptyTitle: {
    fontSize: typography.md,
    fontWeight: typography.bold,
    color: colors.parchment,
    marginBottom: spacing.sm,
  },
  emptyText: {
    fontSize: typography.sm,
    color: colors.parchmentMuted,
    textAlign: 'center',
    lineHeight: 22,
  },
  progressCard: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    padding: spacing.base,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.base,
    ...shadows.sm,
  },
  progressCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  progressCardTitle: {
    fontSize: typography.xs,
    color: colors.parchmentMuted,
    fontWeight: typography.semibold,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  progressCardLocation: {
    fontSize: typography.sm,
    color: colors.elvish,
    fontWeight: typography.semibold,
  },
  progressCardDescription: {
    fontSize: typography.sm,
    color: colors.parchmentMuted,
    lineHeight: 20,
    marginBottom: spacing.sm,
  },
  progressDayRow: { flexDirection: 'row', justifyContent: 'flex-end' },
  progressDayText: { fontSize: typography.xs, color: colors.parchmentMuted },
  bottomSpacer: { height: spacing['3xl'] },

  // ── Journal modal styles ───────────────────────────────────────────────────
  journalRoot: {
    flex: 1,
    backgroundColor: colors.background,
  },
  journalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.base,
    paddingTop: spacing.xl,
    paddingBottom: spacing.base,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  journalTitle: {
    fontSize: typography.xl,
    fontWeight: typography.bold,
    color: colors.parchment,
  },
  journalClose: {
    fontSize: typography.base,
    color: colors.parchmentMuted,
    padding: spacing.xs,
  },
  journalScroll: { flex: 1 },
  journalContent: {
    padding: spacing.base,
    gap: spacing.base,
  },
  promptBox: {
    backgroundColor: colors.card,
    borderRadius: radius.md,
    padding: spacing.base,
    borderLeftWidth: 3,
    borderLeftColor: colors.gold,
  },
  promptLabel: {
    fontSize: typography.xs,
    color: colors.gold,
    fontWeight: typography.semibold,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: spacing.xs,
  },
  promptText: {
    fontSize: typography.sm,
    color: colors.parchmentMuted,
    lineHeight: 21,
    fontStyle: 'italic',
  },
  journalInput: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: spacing.base,
    color: colors.parchment,
    fontSize: typography.base,
    lineHeight: 24,
    minHeight: 180,
    borderWidth: 1,
    borderColor: colors.border,
  },
  journalSavedNote: {
    fontSize: typography.xs,
    color: colors.parchmentMuted,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  journalActions: {
    flexDirection: 'row',
    gap: spacing.sm,
    padding: spacing.base,
    paddingBottom: spacing.xl,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  journalSkip: {
    flex: 1,
    paddingVertical: spacing.sm + 2,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
  },
  journalSkipText: {
    color: colors.parchmentMuted,
    fontSize: typography.sm,
  },
  journalSave: {
    flex: 2,
    paddingVertical: spacing.sm + 2,
    borderRadius: radius.md,
    backgroundColor: colors.gold + '20',
    borderWidth: 1,
    borderColor: colors.gold + '60',
    alignItems: 'center',
  },
  journalSaveDisabled: {
    opacity: 0.4,
  },
  journalSaveText: {
    color: colors.gold,
    fontSize: typography.sm,
    fontWeight: typography.semibold,
  },
});
