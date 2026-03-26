import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
} from 'react-native';
import { router } from 'expo-router';
import { Race, RACE_METADATA } from '../../../lib/types';
import { colors, typography, spacing, radius, shadows } from '../../../constants/theme';
import { useAuth } from '../../_layout';
import { upsertUserProfile } from '../../../lib/supabase';

const RACES: Race[] = ['hobbit', 'elf', 'dwarf', 'man'];

interface RaceCardProps {
  race: Race;
  selected: boolean;
  onSelect: () => void;
}

function RaceCard({ race, selected, onSelect }: RaceCardProps) {
  const meta = RACE_METADATA[race];
  return (
    <TouchableOpacity
      style={[styles.raceCard, selected && styles.raceCardSelected]}
      onPress={onSelect}
      activeOpacity={0.75}
    >
      <View style={styles.raceCardInner}>
        <Text style={styles.raceEmoji}>{meta.emoji}</Text>
        <View style={styles.raceTextBlock}>
          <Text style={[styles.raceLabel, selected && styles.raceLabelSelected]}>
            {meta.label}
          </Text>
          <Text style={styles.raceTagline}>{meta.tagline}</Text>
          <Text style={styles.raceBonus}>{meta.bonus}</Text>
        </View>
        <View style={[styles.radioOuter, selected && styles.radioOuterSelected]}>
          {selected && <View style={styles.radioInner} />}
        </View>
      </View>
    </TouchableOpacity>
  );
}

export default function RaceScreen() {
  const { session, refreshUser } = useAuth();
  const [selectedRace, setSelectedRace] = useState<Race | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  async function handleContinue() {
    if (!selectedRace || !session?.user) return;
    setIsLoading(true);
    try {
      await upsertUserProfile({
        id: session.user.id,
        email: session.user.email ?? '',
        race: selectedRace,
      });
      await refreshUser();
      router.push('/(auth)/onboarding/avatar');
    } catch (e) {
      console.error('Failed to save race:', e);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <SafeAreaView style={styles.root}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.step}>Step 1 of 3</Text>
          <Text style={styles.title}>Choose Your Race</Text>
          <Text style={styles.subtitle}>
            Your race shapes how you receive XP and how you walk the road. Choose honestly.
          </Text>
        </View>

        {/* Race cards */}
        <View style={styles.raceList}>
          {RACES.map((race) => (
            <RaceCard
              key={race}
              race={race}
              selected={selectedRace === race}
              onSelect={() => setSelectedRace(race)}
            />
          ))}
        </View>

        {/* Continue button */}
        <TouchableOpacity
          style={[styles.continueButton, (!selectedRace || isLoading) && styles.continueButtonDisabled]}
          onPress={handleContinue}
          disabled={!selectedRace || isLoading}
        >
          <Text style={styles.continueText}>
            {isLoading ? 'Saving...' : 'Continue →'}
          </Text>
        </TouchableOpacity>

        <Text style={styles.disclaimer}>
          Your race cannot be changed after onboarding.
        </Text>
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
    padding: spacing.xl,
    paddingBottom: spacing['4xl'],
  },
  header: {
    marginBottom: spacing['2xl'],
  },
  step: {
    fontSize: typography.xs,
    color: colors.gold,
    fontWeight: typography.semibold,
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginBottom: spacing.sm,
  },
  title: {
    fontSize: typography['2xl'],
    fontWeight: typography.bold,
    color: colors.parchment,
    marginBottom: spacing.sm,
  },
  subtitle: {
    fontSize: typography.base,
    color: colors.parchmentMuted,
    lineHeight: 24,
  },
  raceList: {
    gap: spacing.sm,
    marginBottom: spacing.xl,
  },
  raceCard: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
    ...shadows.sm,
  },
  raceCardSelected: {
    borderColor: colors.gold,
    backgroundColor: colors.card,
  },
  raceCardInner: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.base,
    gap: spacing.base,
  },
  raceEmoji: {
    fontSize: 32,
    width: 44,
    textAlign: 'center',
  },
  raceTextBlock: {
    flex: 1,
    gap: 4,
  },
  raceLabel: {
    fontSize: typography.md,
    fontWeight: typography.bold,
    color: colors.parchmentMuted,
  },
  raceLabelSelected: {
    color: colors.gold,
  },
  raceTagline: {
    fontSize: typography.sm,
    color: colors.parchment,
    lineHeight: 20,
  },
  raceBonus: {
    fontSize: typography.xs,
    color: colors.elvish,
    fontWeight: typography.medium,
  },
  radioOuter: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: colors.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  radioOuterSelected: {
    borderColor: colors.gold,
  },
  radioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.gold,
  },
  continueButton: {
    backgroundColor: colors.gold,
    borderRadius: radius.md,
    paddingVertical: spacing.md,
    alignItems: 'center',
    marginBottom: spacing.md,
    ...shadows.gold,
  },
  continueButtonDisabled: {
    opacity: 0.4,
  },
  continueText: {
    fontSize: typography.base,
    fontWeight: typography.bold,
    color: colors.background,
    letterSpacing: 0.5,
  },
  disclaimer: {
    fontSize: typography.xs,
    color: colors.parchmentMuted,
    textAlign: 'center',
    opacity: 0.6,
  },
});
