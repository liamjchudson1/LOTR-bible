/**
 * LevelGateCard.tsx
 *
 * Shown in place of the quest content when the user's level is below the
 * minimum required for that day's story moment.
 *
 * Design principle: the gate is not punitive. It explains WHY the user isn't
 * ready yet in story terms, shows how close they are, and tells them exactly
 * what to do. No frustration — just honest narrative pacing.
 *
 * Layout:
 *   - Location icon + gate title (the story reason)
 *   - Narrative gate description (why this moment needs readiness)
 *   - XP progress bar toward the required level
 *   - Current level → required level display
 *   - Unlock hint (what to do)
 *   - Habits today CTA (because that's how you close the gap)
 */

import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';

import { LevelGateInfo } from '../lib/types';
import { xpToUnlock, gateUnlockProgress } from '../lib/levelGate';
import { LEVELS, getLevelForXP } from '../constants/levels';
import { colors, typography, spacing } from '../constants/theme';

// ─── Types ────────────────────────────────────────────────────────────────────

interface Props {
  gate: LevelGateInfo;
  /** The location emoji + name of the blocked place */
  locationEmoji: string;
  locationName: string;
  /** Called when user taps "Track habits today" */
  onGoToHabits?: () => void;
}

// ─── Component ────────────────────────────────────────────────────────────────

export function LevelGateCard({ gate, locationEmoji, locationName, onGoToHabits }: Props) {
  const progress = gateUnlockProgress(gate);
  const xpRemaining = xpToUnlock(gate);
  const currentLevel = getLevelForXP(gate.xpCurrent);
  const requiredLevel = LEVELS.find((l) => l.level === gate.minLevel);

  const daysAtFullHabits = Math.ceil(xpRemaining / 155); // 155 = max XP per day

  return (
    <View style={styles.container}>
      {/* ── Location header ───────────────────────────────────────── */}
      <View style={styles.locationRow}>
        <Text style={styles.locationEmoji}>{locationEmoji}</Text>
        <View>
          <Text style={styles.locationName}>{locationName}</Text>
          <Text style={styles.lockedLabel}>Not yet</Text>
        </View>
      </View>

      {/* ── Gate title ────────────────────────────────────────────── */}
      <Text style={styles.gateTitle}>{gate.gateTitle}</Text>

      {/* ── Narrative description ─────────────────────────────────── */}
      <Text style={styles.gateDescription}>{gate.gateDescription}</Text>

      {/* ── Level progress ────────────────────────────────────────── */}
      <View style={styles.levelSection}>
        <View style={styles.levelRow}>
          <View style={styles.levelBox}>
            <Text style={styles.levelNumber}>{currentLevel.level}</Text>
            <Text style={styles.levelTitle}>{currentLevel.title}</Text>
            <Text style={styles.levelSub}>Current</Text>
          </View>
          <View style={styles.arrow}>
            <Text style={styles.arrowText}>→</Text>
          </View>
          <View style={[styles.levelBox, styles.levelBoxRequired]}>
            <Text style={[styles.levelNumber, styles.levelNumberRequired]}>
              {gate.minLevel}
            </Text>
            <Text style={[styles.levelTitle, styles.levelTitleRequired]}>
              {requiredLevel?.title ?? `Level ${gate.minLevel}`}
            </Text>
            <Text style={styles.levelSub}>Required</Text>
          </View>
        </View>

        {/* XP progress bar */}
        <View style={styles.progressTrack}>
          <View style={[styles.progressFill, { width: `${Math.round(progress * 100)}%` }]} />
        </View>
        <View style={styles.progressLabels}>
          <Text style={styles.progressXP}>{gate.xpCurrent.toLocaleString()} XP</Text>
          <Text style={styles.progressXP}>{gate.xpRequired.toLocaleString()} XP needed</Text>
        </View>
      </View>

      {/* ── Unlock hint ───────────────────────────────────────────── */}
      <View style={styles.hintBox}>
        <Text style={styles.hintIcon}>🗝</Text>
        <Text style={styles.hintText}>
          {xpRemaining <= 0
            ? 'You are ready. Return to your quest.'
            : `${xpRemaining.toLocaleString()} XP to go.${
                daysAtFullHabits <= 7
                  ? ` About ${daysAtFullHabits} day${daysAtFullHabits === 1 ? '' : 's'} of faithful practice.`
                  : ''
              }`}
        </Text>
      </View>

      {/* ── CTA ───────────────────────────────────────────────────── */}
      {onGoToHabits && (
        <Pressable style={styles.ctaButton} onPress={onGoToHabits}>
          <Text style={styles.ctaText}>Track today's habits</Text>
        </Pressable>
      )}
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: spacing.base + 4,
    borderWidth: 1,
    borderColor: colors.border,
    gap: spacing.base,
  },

  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  locationEmoji: {
    fontSize: 28,
  },
  locationName: {
    color: colors.parchment,
    fontSize: typography.base,
    fontWeight: typography.bold,
  },
  lockedLabel: {
    color: colors.red + 'CC',
    fontSize: typography.xs,
    fontWeight: typography.semibold,
    marginTop: 2,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },

  gateTitle: {
    color: colors.parchment,
    fontSize: typography.lg,
    fontWeight: typography.bold,
    lineHeight: 26,
  },

  gateDescription: {
    color: colors.parchmentMuted,
    fontSize: typography.sm,
    lineHeight: 21,
  },

  // Level comparison block
  levelSection: {
    gap: spacing.sm,
    paddingTop: spacing.xs,
  },
  levelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.base,
  },
  levelBox: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: 8,
    padding: spacing.sm + 2,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  levelBoxRequired: {
    borderColor: colors.gold + '55',
    backgroundColor: '#1C1A0E',
  },
  levelNumber: {
    color: colors.parchmentMuted,
    fontSize: typography.xl,
    fontWeight: typography.heavy,
    lineHeight: 30,
  },
  levelNumberRequired: {
    color: colors.gold,
  },
  levelTitle: {
    color: colors.parchmentMuted,
    fontSize: typography.xs,
    fontWeight: typography.semibold,
    textAlign: 'center',
    marginTop: 2,
  },
  levelTitleRequired: {
    color: colors.goldLight,
  },
  levelSub: {
    color: colors.parchmentMuted + '80',
    fontSize: 10,
    marginTop: 2,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  arrow: {
    paddingHorizontal: 4,
  },
  arrowText: {
    color: colors.parchmentMuted,
    fontSize: typography.lg,
  },

  // Progress bar
  progressTrack: {
    height: 5,
    backgroundColor: colors.border,
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: colors.gold,
    borderRadius: 3,
  },
  progressLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  progressXP: {
    color: colors.parchmentMuted,
    fontSize: 10,
  },

  // Hint
  hintBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
    backgroundColor: colors.surface,
    borderRadius: 8,
    padding: spacing.sm + 2,
    borderLeftWidth: 3,
    borderLeftColor: colors.gold + '88',
  },
  hintIcon: {
    fontSize: 16,
    marginTop: 1,
  },
  hintText: {
    flex: 1,
    color: colors.parchmentMuted,
    fontSize: typography.sm,
    lineHeight: 20,
  },

  // CTA
  ctaButton: {
    backgroundColor: colors.gold + '18',
    borderWidth: 1,
    borderColor: colors.gold + '55',
    borderRadius: 8,
    paddingVertical: spacing.sm + 2,
    alignItems: 'center',
  },
  ctaText: {
    color: colors.gold,
    fontSize: typography.sm,
    fontWeight: typography.semibold,
    letterSpacing: 0.3,
  },
});
