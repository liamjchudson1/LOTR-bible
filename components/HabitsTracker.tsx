import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Pressable } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSequence,
  withTiming,
  withSpring,
} from 'react-native-reanimated';
import { DailyHabits, HabitType, HABIT_XP, HABIT_LABELS, Race } from '../lib/types';
import { calculateHabitXP } from '../lib/xp';
import { colors, typography, spacing, radius, shadows } from '../constants/theme';

interface HabitButtonProps {
  habit: HabitType;
  done: boolean;
  onToggle: (habit: HabitType) => void;
  race: Race;
}

const HABIT_ICONS: Record<HabitType, string> = {
  read: '📖',
  pray: '🙏',
  memorise: '🧠',
  reflect: '✍️',
};

function HabitButton({ habit, done, onToggle, race }: HabitButtonProps) {
  const scale = useSharedValue(1);
  const xp = calculateHabitXP(habit, race);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePress = () => {
    scale.value = withSequence(
      withTiming(0.9, { duration: 80 }),
      withSpring(1.05, { damping: 8, stiffness: 400 }),
      withTiming(1, { duration: 100 })
    );
    onToggle(habit);
  };

  return (
    <Animated.View style={[styles.habitButtonWrapper, animatedStyle]}>
      <Pressable
        style={[styles.habitButton, done && styles.habitButtonDone]}
        onPress={handlePress}
        android_ripple={{ color: colors.gold + '40', radius: 50 }}
      >
        <View style={[styles.iconContainer, done && styles.iconContainerDone]}>
          <Text style={styles.habitIcon}>{HABIT_ICONS[habit]}</Text>
        </View>
        <Text style={[styles.habitLabel, done && styles.habitLabelDone]}>
          {HABIT_LABELS[habit]}
        </Text>
        <View style={[styles.xpBadge, done && styles.xpBadgeDone]}>
          <Text style={[styles.xpText, done && styles.xpTextDone]}>
            +{xp}
          </Text>
        </View>
        {done && (
          <View style={styles.checkmark}>
            <Text style={styles.checkmarkText}>✓</Text>
          </View>
        )}
      </Pressable>
    </Animated.View>
  );
}

interface HabitsTrackerProps {
  habits: DailyHabits;
  onToggle: (habit: HabitType) => void;
  race: Race;
  xpEarnedToday: number;
}

export function HabitsTracker({ habits, onToggle, race, xpEarnedToday }: HabitsTrackerProps) {
  const habitTypes: HabitType[] = ['read', 'pray', 'memorise', 'reflect'];
  const completedCount = habitTypes.filter((h) => habits[h]).length;
  const allDone = completedCount === 4;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.sectionTitle}>Today's Habits</Text>
        <View style={styles.xpSummary}>
          <Text style={styles.xpSummaryText}>
            {xpEarnedToday > 0 ? `+${xpEarnedToday} XP today` : '0 XP earned'}
          </Text>
        </View>
      </View>

      {/* Progress indicator */}
      <View style={styles.progressRow}>
        {habitTypes.map((h, i) => (
          <View
            key={h}
            style={[
              styles.progressDot,
              habits[h] && styles.progressDotDone,
              i < habitTypes.length - 1 && styles.progressDotMargin,
            ]}
          />
        ))}
        <Text style={styles.progressText}>
          {completedCount}/{habitTypes.length}
        </Text>
      </View>

      {/* Habit grid */}
      <View style={styles.grid}>
        {habitTypes.map((habit) => (
          <HabitButton
            key={habit}
            habit={habit}
            done={habits[habit]}
            onToggle={onToggle}
            race={race}
          />
        ))}
      </View>

      {/* Race bonus indicator */}
      {race === 'hobbit' && (
        <View style={[styles.bonusBanner, allDone && styles.bonusBannerActive]}>
          <Text style={[styles.bonusText, allDone && styles.bonusTextActive]}>
            {allDone
              ? '🧑‍🌾 Hobbit bonus unlocked! +10 XP'
              : '🧑‍🌾 Complete all 4 habits for your Hobbit bonus'}
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    padding: spacing.base,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.sm,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  sectionTitle: {
    fontSize: typography.md,
    fontWeight: typography.bold,
    color: colors.parchment,
  },
  xpSummary: {
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: colors.gold + '60',
  },
  xpSummaryText: {
    fontSize: typography.xs,
    color: colors.gold,
    fontWeight: typography.semibold,
  },
  progressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
    gap: spacing.xs,
  },
  progressDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.border,
  },
  progressDotDone: {
    backgroundColor: colors.gold,
  },
  progressDotMargin: {
    marginRight: spacing.xs,
  },
  progressText: {
    fontSize: typography.xs,
    color: colors.parchmentMuted,
    marginLeft: spacing.sm,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  habitButtonWrapper: {
    width: '47%',
  },
  habitButton: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    position: 'relative',
    minHeight: 90,
    justifyContent: 'center',
  },
  habitButtonDone: {
    backgroundColor: colors.green + '20',
    borderColor: colors.green,
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.card,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  iconContainerDone: {
    backgroundColor: colors.green + '30',
  },
  habitIcon: {
    fontSize: 18,
  },
  habitLabel: {
    fontSize: typography.sm,
    fontWeight: typography.semibold,
    color: colors.parchmentMuted,
    marginBottom: spacing.xs,
  },
  habitLabelDone: {
    color: colors.parchment,
  },
  xpBadge: {
    backgroundColor: colors.border,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: radius.full,
  },
  xpBadgeDone: {
    backgroundColor: colors.gold + '30',
  },
  xpText: {
    fontSize: typography.xs,
    color: colors.parchmentMuted,
    fontWeight: typography.medium,
  },
  xpTextDone: {
    color: colors.gold,
  },
  checkmark: {
    position: 'absolute',
    top: spacing.sm,
    right: spacing.sm,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: colors.green,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkmarkText: {
    fontSize: 10,
    color: colors.parchment,
    fontWeight: typography.bold,
  },
  bonusBanner: {
    marginTop: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: radius.sm,
    padding: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  bonusBannerActive: {
    borderColor: colors.gold,
    backgroundColor: colors.gold + '15',
  },
  bonusText: {
    fontSize: typography.xs,
    color: colors.parchmentMuted,
    textAlign: 'center',
  },
  bonusTextActive: {
    color: colors.goldLight,
    fontWeight: typography.semibold,
  },
});
