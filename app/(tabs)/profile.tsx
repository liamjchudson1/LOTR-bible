import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  TouchableOpacity,
  Alert,
  Modal,
} from 'react-native';
import { router } from 'expo-router';
import { useAuth } from '../_layout';
import { signOut, getUserArtefacts, getUserProgress } from '../../lib/supabase';
import { clearAllStorage } from '../../lib/storage';
import { XPBar } from '../../components/XPBar';
import { ArtefactGrid } from '../../components/ArtefactCard';
import { getProgressToNextLevel } from '../../constants/levels';
import { RACE_METADATA, ArtefactData, DBUserArtefact, DBUserProgress } from '../../lib/types';
import { isStreakAlive, streakStatusMessage } from '../../lib/streaks';
import { colors, typography, spacing, radius, shadows } from '../../constants/theme';
import artefactsData from '../../data/artefacts.json';
import campaignsData from '../../data/campaigns.json';

const ALL_ARTEFACTS = artefactsData as ArtefactData[];
const ALL_CAMPAIGNS = campaignsData as any[];

const AVATAR_EMOJI_MAP: Record<string, string> = {
  'hobbit-1': '🧑‍🌾',
  'hobbit-2': '🧝‍♀️',
  'hobbit-3': '👴',
  'hobbit-4': '👧',
  'elf-1': '🧝',
  'elf-2': '🧝‍♀️',
  'elf-3': '🌟',
  'elf-4': '🎶',
  'dwarf-1': '⛏️',
  'dwarf-2': '🪨',
  'dwarf-3': '🛡️',
  'dwarf-4': '🔥',
  'man-1': '👑',
  'man-2': '⚔️',
  'man-3': '📜',
  'man-4': '🏹',
  'avatar-1': '🧙',
};

export default function ProfileScreen() {
  const { user, refreshUser } = useAuth();
  const [earnedArtefacts, setEarnedArtefacts] = useState<DBUserArtefact[]>([]);
  const [progress, setProgress] = useState<DBUserProgress | null>(null);
  const [selectedArtefact, setSelectedArtefact] = useState<ArtefactData | null>(null);
  const [isSigningOut, setIsSigningOut] = useState(false);

  useEffect(() => {
    async function load() {
      if (!user) return;
      try {
        const arts = await getUserArtefacts(user.id);
        setEarnedArtefacts((arts ?? []) as DBUserArtefact[]);
      } catch (e) {
        console.warn('Failed to load artefacts:', e);
      }

      if (user.campaign_id) {
        try {
          const prog = await getUserProgress(user.id, user.campaign_id);
          setProgress(prog);
        } catch (e) {
          console.warn('Failed to load progress:', e);
        }
      }
    }
    load();
  }, [user]);

  async function handleSignOut() {
    Alert.alert(
      'Sign out',
      'Are you sure you want to sign out? Your progress is saved to the cloud.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Sign out',
          style: 'destructive',
          onPress: async () => {
            setIsSigningOut(true);
            try {
              await clearAllStorage();
              await signOut();
              router.replace('/(auth)/login');
            } catch (e: any) {
              Alert.alert('Error', e?.message ?? 'Failed to sign out.');
            } finally {
              setIsSigningOut(false);
            }
          },
        },
      ]
    );
  }

  if (!user) return null;

  const race = user.race ?? 'hobbit';
  const raceMeta = RACE_METADATA[race];
  const avatarEmoji = AVATAR_EMOJI_MAP[user.avatar_id ?? 'avatar-1'] ?? raceMeta.emoji;
  const { current: levelData, next: nextLevel } = getProgressToNextLevel(user.xp ?? 0);
  const streakAlive = isStreakAlive(user.last_active_date);
  const streakMsg = streakStatusMessage(user.streak_count, user.last_active_date);

  const earnedIds = earnedArtefacts.map((a) => a.artefact_id);
  const earnedDates: Record<string, string> = {};
  for (const ua of earnedArtefacts) {
    earnedDates[ua.artefact_id] = ua.earned_at;
  }

  const campaign = ALL_CAMPAIGNS.find((c) => c.id === user.campaign_id);
  const currentDay = progress?.current_day ?? 1;
  const campaignProgress = campaign
    ? Math.min((currentDay / campaign.duration_days) * 100, 100)
    : 0;

  // Stats
  const totalXP = user.xp ?? 0;
  const level = levelData.level;

  return (
    <SafeAreaView style={styles.root}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        {/* Character card */}
        <View style={styles.characterCard}>
          {/* Avatar */}
          <View style={styles.avatarContainer}>
            <Text style={styles.avatarEmoji}>{avatarEmoji}</Text>
          </View>

          <Text style={styles.characterName}>{user.name || 'Unnamed'}</Text>

          <View style={styles.raceRow}>
            <Text style={styles.raceEmoji}>{raceMeta.emoji}</Text>
            <Text style={styles.raceName}>{raceMeta.label}</Text>
          </View>

          <View style={styles.levelBadge}>
            <Text style={styles.levelBadgeText}>
              Lvl {level} · {levelData.title}
            </Text>
          </View>

          <Text style={styles.levelDescription}>{levelData.description}</Text>

          {/* XP bar */}
          <View style={styles.xpBarContainer}>
            <XPBar xp={totalXP} />
          </View>
        </View>

        {/* Stats row */}
        <View style={styles.statsRow}>
          <View style={styles.stat}>
            <Text style={styles.statValue}>{totalXP.toLocaleString()}</Text>
            <Text style={styles.statLabel}>Total XP</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.stat}>
            <Text style={[styles.statValue, streakAlive ? styles.streakActive : {}]}>
              {user.streak_count}{streakAlive ? '🔥' : ''}
            </Text>
            <Text style={styles.statLabel}>Day Streak</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.stat}>
            <Text style={styles.statValue}>{currentDay}</Text>
            <Text style={styles.statLabel}>Journey Day</Text>
          </View>
        </View>

        {/* Streak message */}
        <View style={styles.streakCard}>
          <Text style={styles.streakMsg}>{streakMsg}</Text>
        </View>

        {/* Campaign progress */}
        {campaign && (
          <View style={styles.campaignCard}>
            <View style={styles.campaignHeader}>
              <Text style={styles.campaignTitle}>{campaign.title}</Text>
              <Text style={styles.campaignPercent}>{Math.round(campaignProgress)}%</Text>
            </View>
            <Text style={styles.campaignArc} numberOfLines={2}>
              {campaign.lotr_arc}
            </Text>
            <View style={styles.campaignTrack}>
              <View
                style={[styles.campaignFill, { width: `${campaignProgress}%` }]}
              />
            </View>
            <Text style={styles.campaignDay}>
              Day {currentDay} of {campaign.duration_days} · {campaign.biblical_content}
            </Text>
          </View>
        )}

        {/* Race bonus */}
        <View style={styles.bonusCard}>
          <Text style={styles.bonusTitle}>Your Race Bonus</Text>
          <Text style={styles.bonusText}>{raceMeta.bonus}</Text>
        </View>

        {/* Artefacts */}
        <View style={styles.artefactsSection}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Artefacts</Text>
            <Text style={styles.sectionMeta}>
              {earnedIds.length}/{ALL_ARTEFACTS.length} earned
            </Text>
          </View>
          <ArtefactGrid
            artefacts={ALL_ARTEFACTS}
            earnedIds={earnedIds}
            earnedDates={earnedDates}
            onPress={(a) => setSelectedArtefact(a)}
          />
        </View>

        {/* Sign out */}
        <TouchableOpacity
          style={styles.signOutButton}
          onPress={handleSignOut}
          disabled={isSigningOut}
        >
          <Text style={styles.signOutText}>
            {isSigningOut ? 'Signing out...' : 'Sign Out'}
          </Text>
        </TouchableOpacity>

        <View style={styles.bottomSpacer} />
      </ScrollView>

      {/* Artefact detail modal */}
      <Modal
        visible={!!selectedArtefact}
        transparent
        animationType="slide"
        onRequestClose={() => setSelectedArtefact(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHandle} />
            {selectedArtefact && (
              <>
                <Text style={styles.modalEmoji}>
                  {earnedIds.includes(selectedArtefact.id) ? selectedArtefact.emoji : '🔒'}
                </Text>
                <Text style={styles.modalArtefactName}>{selectedArtefact.name}</Text>
                <Text style={styles.modalArtefactDesc}>{selectedArtefact.description}</Text>
                {!earnedIds.includes(selectedArtefact.id) && (
                  <View style={styles.unlockHintBox}>
                    <Text style={styles.unlockHintLabel}>How to unlock</Text>
                    <Text style={styles.unlockHintText}>
                      {getUnlockText(selectedArtefact)}
                    </Text>
                  </View>
                )}
                {earnedIds.includes(selectedArtefact.id) && earnedDates[selectedArtefact.id] && (
                  <Text style={styles.earnedDateText}>
                    Earned on{' '}
                    {new Date(earnedDates[selectedArtefact.id]).toLocaleDateString('en-US', {
                      month: 'long',
                      day: 'numeric',
                      year: 'numeric',
                    })}
                  </Text>
                )}
                <TouchableOpacity
                  style={styles.modalClose}
                  onPress={() => setSelectedArtefact(null)}
                >
                  <Text style={styles.modalCloseText}>Close</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

function getUnlockText(artefact: ArtefactData): string {
  switch (artefact.unlock_condition) {
    case 'streak': return `Maintain a ${artefact.unlock_value}-day reading streak`;
    case 'level': return `Reach level ${artefact.unlock_value}`;
    case 'complete_campaign': return `Complete The Long Defeat campaign`;
    case 'complete_any_campaign': return `Complete any campaign`;
    case 'fellowship_week': return `All fellowship members active in the same week`;
    case 'total_habits': return `Complete ${artefact.unlock_value} daily habits total`;
    case 'all_campaigns': return `Complete all ${artefact.unlock_value} campaigns`;
    default: return 'Keep walking the road';
  }
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scroll: {
    padding: spacing.base,
  },
  characterCard: {
    backgroundColor: colors.card,
    borderRadius: radius.xl,
    padding: spacing.xl,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.gold + '40',
    marginBottom: spacing.base,
    ...shadows.gold,
  },
  avatarContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.base,
    borderWidth: 2,
    borderColor: colors.gold + '60',
  },
  avatarEmoji: {
    fontSize: 40,
  },
  characterName: {
    fontSize: typography['2xl'],
    fontWeight: typography.bold,
    color: colors.parchment,
    marginBottom: spacing.xs,
  },
  raceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginBottom: spacing.sm,
  },
  raceEmoji: {
    fontSize: 16,
  },
  raceName: {
    fontSize: typography.sm,
    color: colors.parchmentMuted,
    fontWeight: typography.medium,
  },
  levelBadge: {
    backgroundColor: colors.gold + '20',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: colors.gold + '60',
    marginBottom: spacing.sm,
  },
  levelBadgeText: {
    fontSize: typography.sm,
    color: colors.gold,
    fontWeight: typography.semibold,
  },
  levelDescription: {
    fontSize: typography.sm,
    color: colors.parchmentMuted,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: spacing.base,
    fontStyle: 'italic',
  },
  xpBarContainer: {
    width: '100%',
  },
  statsRow: {
    flexDirection: 'row',
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.base,
    overflow: 'hidden',
  },
  stat: {
    flex: 1,
    alignItems: 'center',
    padding: spacing.md,
  },
  statValue: {
    fontSize: typography.xl,
    fontWeight: typography.bold,
    color: colors.parchment,
  },
  streakActive: {
    color: colors.gold,
  },
  statLabel: {
    fontSize: typography.xs,
    color: colors.parchmentMuted,
    marginTop: 2,
  },
  statDivider: {
    width: 1,
    backgroundColor: colors.border,
    marginVertical: spacing.sm,
  },
  streakCard: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.base,
    alignItems: 'center',
  },
  streakMsg: {
    fontSize: typography.sm,
    color: colors.parchmentMuted,
    fontStyle: 'italic',
  },
  campaignCard: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    padding: spacing.base,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.base,
    ...shadows.sm,
  },
  campaignHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  campaignTitle: {
    fontSize: typography.base,
    fontWeight: typography.bold,
    color: colors.parchment,
  },
  campaignPercent: {
    fontSize: typography.sm,
    color: colors.gold,
    fontWeight: typography.semibold,
  },
  campaignArc: {
    fontSize: typography.sm,
    color: colors.parchmentMuted,
    fontStyle: 'italic',
    lineHeight: 20,
    marginBottom: spacing.sm,
  },
  campaignTrack: {
    height: 6,
    backgroundColor: colors.border,
    borderRadius: radius.full,
    overflow: 'hidden',
    marginBottom: spacing.xs,
  },
  campaignFill: {
    height: 6,
    backgroundColor: colors.gold,
    borderRadius: radius.full,
  },
  campaignDay: {
    fontSize: typography.xs,
    color: colors.parchmentMuted,
    marginTop: spacing.xs,
  },
  bonusCard: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    padding: spacing.base,
    borderWidth: 1,
    borderColor: colors.elvish + '40',
    marginBottom: spacing.base,
  },
  bonusTitle: {
    fontSize: typography.xs,
    color: colors.elvish,
    fontWeight: typography.semibold,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: spacing.xs,
  },
  bonusText: {
    fontSize: typography.sm,
    color: colors.parchmentMuted,
    lineHeight: 20,
  },
  artefactsSection: {
    marginBottom: spacing.base,
  },
  sectionHeader: {
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
  sectionMeta: {
    fontSize: typography.xs,
    color: colors.parchmentMuted,
  },
  signOutButton: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    paddingVertical: spacing.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.base,
  },
  signOutText: {
    fontSize: typography.base,
    color: colors.parchmentMuted,
    fontWeight: typography.medium,
  },
  bottomSpacer: {
    height: spacing.xl,
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
    alignItems: 'center',
    borderTopWidth: 1,
    borderColor: colors.gold + '40',
  },
  modalHandle: {
    width: 40,
    height: 4,
    backgroundColor: colors.border,
    borderRadius: radius.full,
    marginBottom: spacing.lg,
  },
  modalEmoji: {
    fontSize: 52,
    marginBottom: spacing.md,
  },
  modalArtefactName: {
    fontSize: typography.xl,
    fontWeight: typography.bold,
    color: colors.parchment,
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  modalArtefactDesc: {
    fontSize: typography.base,
    color: colors.parchmentMuted,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: spacing.base,
  },
  unlockHintBox: {
    backgroundColor: colors.card,
    borderRadius: radius.md,
    padding: spacing.md,
    width: '100%',
    marginBottom: spacing.base,
    borderWidth: 1,
    borderColor: colors.border,
  },
  unlockHintLabel: {
    fontSize: typography.xs,
    color: colors.gold,
    fontWeight: typography.semibold,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: spacing.xs,
  },
  unlockHintText: {
    fontSize: typography.sm,
    color: colors.parchmentMuted,
    lineHeight: 20,
  },
  earnedDateText: {
    fontSize: typography.sm,
    color: colors.gold,
    marginBottom: spacing.base,
  },
  modalClose: {
    backgroundColor: colors.card,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: colors.border,
  },
  modalCloseText: {
    fontSize: typography.base,
    color: colors.parchmentMuted,
    fontWeight: typography.medium,
  },
});
