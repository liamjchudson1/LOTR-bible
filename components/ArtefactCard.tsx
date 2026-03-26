import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { ArtefactData } from '../lib/types';
import { colors, typography, spacing, radius, shadows } from '../constants/theme';

interface ArtefactCardProps {
  artefact: ArtefactData;
  earned: boolean;
  earnedAt?: string;
  onPress?: (artefact: ArtefactData) => void;
}

export function ArtefactCard({ artefact, earned, earnedAt, onPress }: ArtefactCardProps) {
  const earnedDate = earnedAt
    ? new Date(earnedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
    : null;

  return (
    <TouchableOpacity
      style={[styles.card, !earned && styles.cardLocked]}
      onPress={() => onPress?.(artefact)}
      activeOpacity={0.7}
      disabled={!onPress}
    >
      <View style={[styles.emojiContainer, earned && styles.emojiContainerEarned]}>
        <Text style={[styles.emoji, !earned && styles.emojiLocked]}>
          {earned ? artefact.emoji : '🔒'}
        </Text>
      </View>
      <Text
        style={[styles.name, !earned && styles.nameLocked]}
        numberOfLines={2}
      >
        {artefact.name}
      </Text>
      {earned && earnedDate && (
        <Text style={styles.earnedDate}>{earnedDate}</Text>
      )}
      {!earned && (
        <Text style={styles.lockedText} numberOfLines={2}>
          {getUnlockHint(artefact)}
        </Text>
      )}
    </TouchableOpacity>
  );
}

function getUnlockHint(artefact: ArtefactData): string {
  switch (artefact.unlock_condition) {
    case 'streak':
      return `${artefact.unlock_value}-day streak`;
    case 'level':
      return `Reach level ${artefact.unlock_value}`;
    case 'complete_campaign':
    case 'complete_any_campaign':
      return 'Complete a campaign';
    case 'fellowship_week':
      return 'Fellowship all active';
    case 'total_habits':
      return `${artefact.unlock_value} habits done`;
    case 'all_campaigns':
      return 'All campaigns complete';
    default:
      return 'Secret unlock';
  }
}

interface ArtefactGridProps {
  artefacts: ArtefactData[];
  earnedIds: string[];
  earnedDates: Record<string, string>;
  onPress?: (artefact: ArtefactData) => void;
}

export function ArtefactGrid({ artefacts, earnedIds, earnedDates, onPress }: ArtefactGridProps) {
  // Show earned first, then locked
  const sorted = [...artefacts].sort((a, b) => {
    const aEarned = earnedIds.includes(a.id);
    const bEarned = earnedIds.includes(b.id);
    if (aEarned && !bEarned) return -1;
    if (!aEarned && bEarned) return 1;
    return 0;
  });

  return (
    <View style={styles.grid}>
      {sorted.map((artefact) => (
        <ArtefactCard
          key={artefact.id}
          artefact={artefact}
          earned={earnedIds.includes(artefact.id)}
          earnedAt={earnedDates[artefact.id]}
          onPress={onPress}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  card: {
    width: '30%',
    backgroundColor: colors.card,
    borderRadius: radius.md,
    padding: spacing.sm,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.gold + '50',
    ...shadows.sm,
    minHeight: 100,
    justifyContent: 'center',
  },
  cardLocked: {
    borderColor: colors.border,
    opacity: 0.6,
  },
  emojiContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.xs,
    borderWidth: 1,
    borderColor: colors.border,
  },
  emojiContainerEarned: {
    backgroundColor: colors.gold + '20',
    borderColor: colors.gold + '60',
  },
  emoji: {
    fontSize: 22,
  },
  emojiLocked: {
    opacity: 0.5,
  },
  name: {
    fontSize: typography.xs,
    fontWeight: typography.semibold,
    color: colors.parchment,
    textAlign: 'center',
    lineHeight: 16,
  },
  nameLocked: {
    color: colors.parchmentMuted,
  },
  earnedDate: {
    fontSize: 9,
    color: colors.gold,
    marginTop: 2,
    textAlign: 'center',
  },
  lockedText: {
    fontSize: 9,
    color: colors.parchmentMuted,
    marginTop: 2,
    textAlign: 'center',
    lineHeight: 13,
  },
});
