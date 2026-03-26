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
import { useAuth } from '../../_layout';
import { upsertUserProfile } from '../../../lib/supabase';
import { colors, typography, spacing, radius, shadows } from '../../../constants/theme';
import { RACE_METADATA } from '../../../lib/types';

// Avatars are represented by emoji combos — each race has options
const AVATAR_OPTIONS: Record<string, { id: string; emoji: string; name: string }[]> = {
  hobbit: [
    { id: 'hobbit-1', emoji: '🧑‍🌾', name: 'Farmer' },
    { id: 'hobbit-2', emoji: '🧝‍♀️', name: 'Wanderer' },
    { id: 'hobbit-3', emoji: '👴', name: 'Elder' },
    { id: 'hobbit-4', emoji: '👧', name: 'Youngster' },
  ],
  elf: [
    { id: 'elf-1', emoji: '🧝', name: 'Scout' },
    { id: 'elf-2', emoji: '🧝‍♀️', name: 'Lorekeeper' },
    { id: 'elf-3', emoji: '🌟', name: 'Star-gazer' },
    { id: 'elf-4', emoji: '🎶', name: 'Song-maker' },
  ],
  dwarf: [
    { id: 'dwarf-1', emoji: '⛏️', name: 'Miner' },
    { id: 'dwarf-2', emoji: '🪨', name: 'Stone-wright' },
    { id: 'dwarf-3', emoji: '🛡️', name: 'Ironguard' },
    { id: 'dwarf-4', emoji: '🔥', name: 'Forge-master' },
  ],
  man: [
    { id: 'man-1', emoji: '👑', name: 'Ranger' },
    { id: 'man-2', emoji: '⚔️', name: 'Swordsman' },
    { id: 'man-3', emoji: '📜', name: 'Scholar' },
    { id: 'man-4', emoji: '🏹', name: 'Archer' },
  ],
};

// Fallback for any race
const DEFAULT_AVATARS = AVATAR_OPTIONS.man;

export default function AvatarScreen() {
  const { session, user, refreshUser } = useAuth();
  const [selectedAvatar, setSelectedAvatar] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const race = user?.race ?? 'hobbit';
  const avatarOptions = AVATAR_OPTIONS[race] ?? DEFAULT_AVATARS;
  const raceMeta = RACE_METADATA[race];

  async function handleContinue() {
    if (!selectedAvatar || !session?.user) return;
    setIsLoading(true);
    try {
      await upsertUserProfile({
        id: session.user.id,
        email: session.user.email ?? '',
        avatar_id: selectedAvatar,
      });
      await refreshUser();
      router.push('/(auth)/onboarding/name');
    } catch (e) {
      console.error('Failed to save avatar:', e);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <SafeAreaView style={styles.root}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.step}>Step 2 of 3</Text>
          <Text style={styles.title}>Choose Your Likeness</Text>
          <Text style={styles.subtitle}>
            You are a {raceMeta.label}. {raceMeta.tagline} Pick the face that fits.
          </Text>
        </View>

        {/* Race reminder */}
        <View style={styles.raceReminder}>
          <Text style={styles.raceReminderEmoji}>{raceMeta.emoji}</Text>
          <Text style={styles.raceReminderText}>{raceMeta.label}</Text>
        </View>

        {/* Avatar grid */}
        <View style={styles.avatarGrid}>
          {avatarOptions.map((avatar) => (
            <TouchableOpacity
              key={avatar.id}
              style={[
                styles.avatarCard,
                selectedAvatar === avatar.id && styles.avatarCardSelected,
              ]}
              onPress={() => setSelectedAvatar(avatar.id)}
              activeOpacity={0.75}
            >
              <Text style={styles.avatarEmoji}>{avatar.emoji}</Text>
              <Text style={[
                styles.avatarName,
                selectedAvatar === avatar.id && styles.avatarNameSelected,
              ]}>
                {avatar.name}
              </Text>
              {selectedAvatar === avatar.id && (
                <View style={styles.selectedBadge}>
                  <Text style={styles.selectedCheck}>✓</Text>
                </View>
              )}
            </TouchableOpacity>
          ))}
        </View>

        {/* Selected preview */}
        {selectedAvatar && (
          <View style={styles.preview}>
            <Text style={styles.previewEmoji}>
              {avatarOptions.find((a) => a.id === selectedAvatar)?.emoji}
            </Text>
            <Text style={styles.previewName}>
              {avatarOptions.find((a) => a.id === selectedAvatar)?.name}
            </Text>
          </View>
        )}

        {/* Continue */}
        <TouchableOpacity
          style={[styles.continueButton, (!selectedAvatar || isLoading) && styles.continueButtonDisabled]}
          onPress={handleContinue}
          disabled={!selectedAvatar || isLoading}
        >
          <Text style={styles.continueText}>
            {isLoading ? 'Saving...' : 'Continue →'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>
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
    marginBottom: spacing.xl,
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
  raceReminder: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.card,
    padding: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.xl,
    alignSelf: 'flex-start',
  },
  raceReminderEmoji: {
    fontSize: 20,
  },
  raceReminderText: {
    fontSize: typography.sm,
    color: colors.parchmentMuted,
    fontWeight: typography.medium,
  },
  avatarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginBottom: spacing.xl,
  },
  avatarCard: {
    width: '47%',
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.base,
    alignItems: 'center',
    position: 'relative',
    ...shadows.sm,
  },
  avatarCardSelected: {
    borderColor: colors.gold,
    backgroundColor: colors.gold + '10',
  },
  avatarEmoji: {
    fontSize: 42,
    marginBottom: spacing.sm,
  },
  avatarName: {
    fontSize: typography.sm,
    fontWeight: typography.medium,
    color: colors.parchmentMuted,
  },
  avatarNameSelected: {
    color: colors.gold,
    fontWeight: typography.semibold,
  },
  selectedBadge: {
    position: 'absolute',
    top: spacing.sm,
    right: spacing.sm,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: colors.gold,
    justifyContent: 'center',
    alignItems: 'center',
  },
  selectedCheck: {
    fontSize: 10,
    color: colors.background,
    fontWeight: typography.bold,
  },
  preview: {
    alignItems: 'center',
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    padding: spacing.xl,
    marginBottom: spacing.xl,
    borderWidth: 1,
    borderColor: colors.gold + '40',
    gap: spacing.sm,
  },
  previewEmoji: {
    fontSize: 64,
  },
  previewName: {
    fontSize: typography.lg,
    fontWeight: typography.bold,
    color: colors.gold,
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
  backButton: {
    alignItems: 'center',
    padding: spacing.sm,
  },
  backText: {
    fontSize: typography.sm,
    color: colors.parchmentMuted,
  },
});
