import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  RefreshControl,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { useAuth } from '../_layout';
import {
  getTodayCompletion,
  upsertDailyCompletion,
  updateUserXPAndStreak,
  getCampaignQuest,
  getUserProgress,
} from '../../lib/supabase';
import {
  cacheTodayQuest,
  getCachedTodayQuest,
  saveTodayHabits,
  getTodayHabits,
  cacheUserProfile,
} from '../../lib/storage';
import { calculateDayXP, calculateStreakBonus, didLevelUp } from '../../lib/xp';
import { calculateNewStreak, getTodayDateString, isStreakAlive } from '../../lib/streaks';
import { QuestData, DailyHabits, HabitType, LocationData, DBUserProgress } from '../../lib/types';
import { getLevelForXP } from '../../constants/levels';
import { QuestCard } from '../../components/QuestCard';
import { HabitsTracker } from '../../components/HabitsTracker';
import { XPBar } from '../../components/XPBar';
import { LoreUnlockModal, ArtefactUnlockModal } from '../../components/LoreUnlockModal';
import { colors, typography, spacing, radius, shadows } from '../../constants/theme';
import locationsData from '../../data/locations.json';

const DEFAULT_HABITS: DailyHabits = {
  read: false,
  pray: false,
  memorise: false,
  reflect: false,
};

export default function HomeScreen() {
  const { user, refreshUser } = useAuth();

  const [quest, setQuest] = useState<QuestData | null>(null);
  const [location, setLocation] = useState<LocationData | null>(null);
  const [habits, setHabits] = useState<DailyHabits>(DEFAULT_HABITS);
  const [progress, setProgress] = useState<DBUserProgress | null>(null);
  const [xpEarnedToday, setXpEarnedToday] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Modals
  const [locationUnlock, setLocationUnlock] = useState<LocationData | null>(null);
  const [artefactUnlock, setArtefactUnlock] = useState<{ name: string; emoji: string; description: string } | null>(null);

  const today = getTodayDateString();
  const race = user?.race ?? 'hobbit';

  // ── Load data ─────────────────────────────────────────────────────────────

  const loadData = useCallback(async () => {
    if (!user?.campaign_id) return;

    try {
      // Load progress
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
        // Find location
        const allLocations = locationsData as LocationData[];
        const loc = allLocations.find((l) => l.id === todayQuest!.lotr_location_id) ?? null;
        setLocation(loc);
      }

      // Load today's habits from cache or server
      const cachedHabits = await getTodayHabits();
      if (cachedHabits) {
        setHabits(cachedHabits);
        const xp = calculateDayXP(cachedHabits, race);
        setXpEarnedToday(xp);
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
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [user, race, today]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // ── Toggle habit ──────────────────────────────────────────────────────────

  const handleHabitToggle = useCallback(
    async (habit: HabitType) => {
      if (!user || !quest) return;

      const newHabits = { ...habits, [habit]: !habits[habit] };
      setHabits(newHabits);

      const newXP = calculateDayXP(newHabits, race);
      setXpEarnedToday(newXP);

      // Save locally
      await saveTodayHabits(newHabits);

      // Persist to server
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

        // Update user XP and streak
        const newStreak = calculateNewStreak(user.streak_count, user.last_active_date);
        const streakBonus = calculateStreakBonus(newStreak, race);
        const totalXP = (user.xp ?? 0) + newXP + streakBonus;

        const oldLevel = getLevelForXP(user.xp ?? 0).level;
        const newLevel = getLevelForXP(totalXP).level;

        await updateUserXPAndStreak(user.id, totalXP, newStreak, today);
        await refreshUser();

        // Level up notification
        if (newLevel > oldLevel) {
          const levelData = getLevelForXP(totalXP);
          Alert.alert(
            '✦ Level Up! ✦',
            `You have become: ${levelData.title}\n\n"${levelData.description}"`,
            [{ text: 'Excellent', style: 'default' }]
          );
        }
      } catch (e) {
        console.warn('Failed to sync habit:', e);
      }
    },
    [user, quest, habits, race, today, refreshUser]
  );

  // ── Render ────────────────────────────────────────────────────────────────

  if (!user) return null;

  const streakAlive = isStreakAlive(user.last_active_date);
  const currentDay = progress?.current_day ?? 1;

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
              loadData();
            }}
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

        {/* Quest card */}
        {quest ? (
          <View style={styles.section}>
            <QuestCard
              quest={quest}
              location={location}
              dayNumber={currentDay}
            />
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

        {/* Habits tracker */}
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
                Day {currentDay} of {quest ? '90' : '?'}
              </Text>
            </View>
          </View>
        )}

        <View style={styles.bottomSpacer} />
      </ScrollView>

      {/* Modals */}
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
  return date.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });
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
  streakEmoji: {
    fontSize: 18,
  },
  streakCount: {
    fontSize: typography.lg,
    fontWeight: typography.bold,
    color: colors.gold,
  },
  streakCountInactive: {
    color: colors.parchmentMuted,
  },
  xpSection: {
    marginBottom: spacing.base,
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    padding: spacing.base,
    borderWidth: 1,
    borderColor: colors.border,
  },
  section: {
    marginBottom: spacing.base,
  },
  loadingCard: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    padding: spacing.xl,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.base,
  },
  loadingText: {
    color: colors.parchmentMuted,
    fontSize: typography.base,
  },
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
    fontStyle: 'italic',
  },
  progressDayRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  progressDayText: {
    fontSize: typography.xs,
    color: colors.parchmentMuted,
  },
  bottomSpacer: {
    height: spacing.xl,
  },
});
