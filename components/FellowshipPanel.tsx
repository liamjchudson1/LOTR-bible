import React from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import { FellowshipMemberDisplay, RACE_METADATA } from '../lib/types';
import { colors, typography, spacing, radius, shadows } from '../constants/theme';

interface MemberRowProps {
  member: FellowshipMemberDisplay;
  isCurrentUser: boolean;
}

function HabitDot({ done }: { done: boolean }) {
  return (
    <View style={[styles.habitDot, done && styles.habitDotDone]} />
  );
}

function MemberRow({ member, isCurrentUser }: MemberRowProps) {
  const race = RACE_METADATA[member.race];
  const habitsCompleted = [
    member.today_read,
    member.today_pray,
    member.today_memorise,
    member.today_reflect,
  ].filter(Boolean).length;

  return (
    <View style={[styles.memberRow, isCurrentUser && styles.memberRowSelf]}>
      <View style={styles.memberLeft}>
        <View style={styles.raceEmoji}>
          <Text style={styles.raceEmojiText}>{race.emoji}</Text>
        </View>
        <View style={styles.memberInfo}>
          <View style={styles.memberNameRow}>
            <Text style={styles.memberName} numberOfLines={1}>
              {member.name}
            </Text>
            {isCurrentUser && (
              <Text style={styles.youLabel}> (you)</Text>
            )}
          </View>
          <Text style={styles.memberMeta}>
            Lvl {member.level} · {member.streak_count}🔥
          </Text>
        </View>
      </View>

      <View style={styles.memberRight}>
        <View style={styles.habitDots}>
          <HabitDot done={member.today_read} />
          <HabitDot done={member.today_pray} />
          <HabitDot done={member.today_memorise} />
          <HabitDot done={member.today_reflect} />
        </View>
        <Text style={styles.habitCount}>{habitsCompleted}/4</Text>
      </View>
    </View>
  );
}

interface FellowshipPanelProps {
  members: FellowshipMemberDisplay[];
  currentUserId: string;
  fellowshipName: string;
  inviteCode: string;
  onInvitePress?: () => void;
}

export function FellowshipPanel({
  members,
  currentUserId,
  fellowshipName,
  inviteCode,
  onInvitePress,
}: FellowshipPanelProps) {
  // Calculate group milestone
  const totalHabitsToday = members.reduce((sum, m) => {
    return (
      sum +
      (m.today_read ? 1 : 0) +
      (m.today_pray ? 1 : 0) +
      (m.today_memorise ? 1 : 0) +
      (m.today_reflect ? 1 : 0)
    );
  }, 0);
  const maxHabitsToday = members.length * 4;
  const groupProgress = maxHabitsToday > 0 ? totalHabitsToday / maxHabitsToday : 0;

  const activeToday = members.filter(
    (m) => m.today_read || m.today_pray || m.today_memorise || m.today_reflect
  ).length;

  return (
    <View style={styles.container}>
      {/* Fellowship header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.fellowshipName}>{fellowshipName}</Text>
          <Text style={styles.fellowshipMeta}>
            {members.length} member{members.length !== 1 ? 's' : ''} · {activeToday} active today
          </Text>
        </View>
        {onInvitePress && (
          <TouchableOpacity style={styles.inviteButton} onPress={onInvitePress}>
            <Text style={styles.inviteButtonText}>Invite</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Group progress bar */}
      <View style={styles.groupProgressSection}>
        <View style={styles.groupProgressHeader}>
          <Text style={styles.groupProgressLabel}>Group today</Text>
          <Text style={styles.groupProgressCount}>
            {totalHabitsToday}/{maxHabitsToday} habits
          </Text>
        </View>
        <View style={styles.groupProgressTrack}>
          <View
            style={[styles.groupProgressFill, { width: `${groupProgress * 100}%` }]}
          />
        </View>
        {groupProgress >= 1 && (
          <Text style={styles.groupMilestoneText}>
            🛡️ Full fellowship active — Mithril bonus unlocked!
          </Text>
        )}
      </View>

      {/* Invite code */}
      <View style={styles.codeRow}>
        <Text style={styles.codeLabel}>Invite Code</Text>
        <TouchableOpacity onPress={onInvitePress} style={styles.codeBox}>
          <Text style={styles.codeText}>{inviteCode}</Text>
        </TouchableOpacity>
      </View>

      {/* Member list */}
      <View style={styles.membersSection}>
        <Text style={styles.sectionLabel}>Members</Text>
        {members.map((member) => (
          <MemberRow
            key={member.id}
            member={member}
            isCurrentUser={member.id === currentUserId}
          />
        ))}
      </View>

      {/* Habit legend */}
      <View style={styles.legend}>
        <Text style={styles.legendText}>Dots: </Text>
        <View style={styles.legendItem}>
          <View style={[styles.habitDot, styles.habitDotDone]} />
          <Text style={styles.legendText}>Read</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.habitDot, styles.habitDotDone]} />
          <Text style={styles.legendText}>Pray</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.habitDot, styles.habitDotDone]} />
          <Text style={styles.legendText}>Memorise</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.habitDot, styles.habitDotDone]} />
          <Text style={styles.legendText}>Reflect</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
    ...shadows.sm,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.base,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  fellowshipName: {
    fontSize: typography.md,
    fontWeight: typography.bold,
    color: colors.parchment,
    marginBottom: 2,
  },
  fellowshipMeta: {
    fontSize: typography.xs,
    color: colors.parchmentMuted,
  },
  inviteButton: {
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.gold + '60',
  },
  inviteButtonText: {
    fontSize: typography.sm,
    color: colors.gold,
    fontWeight: typography.semibold,
  },
  groupProgressSection: {
    padding: spacing.base,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  groupProgressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  groupProgressLabel: {
    fontSize: typography.sm,
    color: colors.parchmentMuted,
    fontWeight: typography.medium,
  },
  groupProgressCount: {
    fontSize: typography.sm,
    color: colors.parchmentMuted,
  },
  groupProgressTrack: {
    height: 8,
    backgroundColor: colors.border,
    borderRadius: radius.full,
    overflow: 'hidden',
  },
  groupProgressFill: {
    height: 8,
    backgroundColor: colors.elvish,
    borderRadius: radius.full,
  },
  groupMilestoneText: {
    fontSize: typography.xs,
    color: colors.elvish,
    marginTop: spacing.sm,
    fontWeight: typography.medium,
    textAlign: 'center',
  },
  codeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.base,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    gap: spacing.sm,
  },
  codeLabel: {
    fontSize: typography.sm,
    color: colors.parchmentMuted,
  },
  codeBox: {
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  codeText: {
    fontSize: typography.base,
    color: colors.gold,
    fontWeight: typography.bold,
    letterSpacing: 2,
    fontVariant: ['tabular-nums'],
  },
  membersSection: {
    padding: spacing.base,
  },
  sectionLabel: {
    fontSize: typography.xs,
    color: colors.parchmentMuted,
    fontWeight: typography.semibold,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    marginBottom: spacing.sm,
  },
  memberRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border + '60',
  },
  memberRowSelf: {
    backgroundColor: colors.surface + '60',
    marginHorizontal: -spacing.sm,
    paddingHorizontal: spacing.sm,
    borderRadius: radius.sm,
  },
  memberLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: spacing.sm,
  },
  raceEmoji: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  raceEmojiText: {
    fontSize: 18,
  },
  memberInfo: {
    flex: 1,
  },
  memberNameRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  memberName: {
    fontSize: typography.base,
    fontWeight: typography.semibold,
    color: colors.parchment,
  },
  youLabel: {
    fontSize: typography.xs,
    color: colors.parchmentMuted,
    fontStyle: 'italic',
  },
  memberMeta: {
    fontSize: typography.xs,
    color: colors.parchmentMuted,
    marginTop: 2,
  },
  memberRight: {
    alignItems: 'flex-end',
    gap: 4,
  },
  habitDots: {
    flexDirection: 'row',
    gap: 4,
  },
  habitDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.border,
  },
  habitDotDone: {
    backgroundColor: colors.green,
  },
  habitCount: {
    fontSize: typography.xs,
    color: colors.parchmentMuted,
  },
  legend: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.base,
    paddingBottom: spacing.base,
    gap: spacing.sm,
    flexWrap: 'wrap',
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  legendText: {
    fontSize: typography.xs,
    color: colors.parchmentMuted,
  },
});
