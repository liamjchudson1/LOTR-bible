import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  Modal,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { useAuth } from '../_layout';
import { getUserProgress } from '../../lib/supabase';
import { MiddleEarthMap } from '../../components/MiddleEarthMap';
import { LocationData, QuestData, DBUserProgress } from '../../lib/types';
import { getCampaignRoute, getRouteProgress, getNextLocation } from '../../lib/mapMovement';
import { colors, typography, spacing, radius } from '../../constants/theme';
import locationsData from '../../data/locations.json';
import fellowshipQuests from '../../data/quests/fellowship.json';
import longDefeatQuests from '../../data/quests/the-long-defeat.json';

const ALL_LOCATIONS = locationsData as LocationData[];
const QUEST_MAP: Record<string, QuestData[]> = {
  'the-fellowship': fellowshipQuests as unknown as QuestData[],
  'the-long-defeat': longDefeatQuests as unknown as QuestData[],
};

export default function MapScreen() {
  const { user } = useAuth();
  const [progress, setProgress] = useState<DBUserProgress | null>(null);
  const [completedDays, setCompletedDays] = useState<number[]>([]);
  const [selectedLocation, setSelectedLocation] = useState<LocationData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const campaignId = user?.campaign_id ?? 'the-fellowship';
  const quests: QuestData[] = QUEST_MAP[campaignId] ?? [];
  const campaignLocations = ALL_LOCATIONS.filter((l) => l.campaign_id === campaignId);

  useEffect(() => {
    async function load() {
      if (!user?.campaign_id) {
        setIsLoading(false);
        return;
      }
      try {
        const prog = await getUserProgress(user.id, user.campaign_id);
        setProgress(prog);
        // For now, derive completed days from current_day
        if (prog) {
          const days = Array.from({ length: prog.current_day - 1 }, (_, i) => i + 1);
          setCompletedDays(days);
        }
      } catch (e) {
        console.warn('Failed to load map progress:', e);
      } finally {
        setIsLoading(false);
      }
    }
    load();
  }, [user]);

  const currentDay = progress?.current_day ?? 1;

  const route = getCampaignRoute(quests, campaignLocations);
  const routeProgress = getRouteProgress(
    campaignLocations.find((l) => l.unlock_day <= currentDay)?.id ?? null,
    route
  );

  const nextLocation = getNextLocation(
    campaignLocations.find((l) => l.unlock_day <= currentDay && l.unlock_day === Math.max(...campaignLocations.filter(loc => loc.unlock_day <= currentDay).map(l => l.unlock_day)))?.id ?? null,
    route,
    campaignLocations
  );

  return (
    <SafeAreaView style={styles.root}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Middle-earth</Text>
          <Text style={styles.subtitle}>
            {campaignId === 'the-fellowship'
              ? 'The Fellowship Campaign'
              : campaignId === 'the-long-defeat'
              ? 'The Long Defeat'
              : 'Your Journey'}
          </Text>
        </View>

        {/* Progress summary */}
        <View style={styles.progressSummary}>
          <View style={styles.progressStat}>
            <Text style={styles.progressStatValue}>{currentDay}</Text>
            <Text style={styles.progressStatLabel}>Day</Text>
          </View>
          <View style={styles.progressDivider} />
          <View style={styles.progressStat}>
            <Text style={styles.progressStatValue}>{completedDays.length}</Text>
            <Text style={styles.progressStatLabel}>Completed</Text>
          </View>
          <View style={styles.progressDivider} />
          <View style={styles.progressStat}>
            <Text style={styles.progressStatValue}>{route.length}</Text>
            <Text style={styles.progressStatLabel}>Locations</Text>
          </View>
        </View>

        {/* Map */}
        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator color={colors.gold} size="large" />
            <Text style={styles.loadingText}>Reading the stars...</Text>
          </View>
        ) : (
          <View style={styles.mapContainer}>
            <MiddleEarthMap
              quests={quests}
              locations={campaignLocations}
              completedDays={completedDays}
              currentDay={currentDay}
              userXP={user?.xp ?? 0}
              onLocationPress={(loc) => setSelectedLocation(loc)}
            />
          </View>
        )}

        {/* Next destination */}
        {nextLocation && (
          <View style={styles.nextDestination}>
            <Text style={styles.nextDestinationLabel}>Next destination</Text>
            <View style={styles.nextDestinationCard}>
              <Text style={styles.nextDestinationEmoji}>{nextLocation.emoji}</Text>
              <View style={styles.nextDestinationInfo}>
                <Text style={styles.nextDestinationName}>{nextLocation.name}</Text>
                <Text style={styles.nextDestinationDesc} numberOfLines={2}>
                  {nextLocation.description}
                </Text>
                <Text style={styles.nextDestinationUnlock}>
                  Unlocks day {nextLocation.unlock_day}
                </Text>
              </View>
            </View>
          </View>
        )}

        {/* All locations list */}
        <View style={styles.locationsList}>
          <Text style={styles.locationsListTitle}>All Locations</Text>
          {campaignLocations
            .sort((a, b) => a.unlock_day - b.unlock_day)
            .map((loc) => {
              const isUnlocked = loc.unlock_day <= currentDay;
              const isCurrent =
                loc.unlock_day === Math.max(
                  ...campaignLocations
                    .filter((l) => l.unlock_day <= currentDay)
                    .map((l) => l.unlock_day),
                  0
                );

              return (
                <TouchableOpacity
                  key={loc.id}
                  style={[
                    styles.locationRow,
                    isCurrent && styles.locationRowCurrent,
                    !isUnlocked && styles.locationRowLocked,
                  ]}
                  onPress={() => isUnlocked && setSelectedLocation(loc)}
                  activeOpacity={isUnlocked ? 0.7 : 1}
                >
                  <Text style={[styles.locationRowEmoji, !isUnlocked && styles.dimmed]}>
                    {isUnlocked ? loc.emoji : '🔒'}
                  </Text>
                  <View style={styles.locationRowInfo}>
                    <Text
                      style={[
                        styles.locationRowName,
                        isCurrent && styles.locationRowNameCurrent,
                        !isUnlocked && styles.dimmedText,
                      ]}
                    >
                      {loc.name}
                    </Text>
                    <Text style={styles.locationRowDay}>Day {loc.unlock_day}</Text>
                  </View>
                  {isCurrent && (
                    <View style={styles.currentBadge}>
                      <Text style={styles.currentBadgeText}>Here</Text>
                    </View>
                  )}
                </TouchableOpacity>
              );
            })}
        </View>

        <View style={styles.bottomSpacer} />
      </ScrollView>

      {/* Location detail modal */}
      <Modal
        visible={!!selectedLocation}
        transparent
        animationType="slide"
        onRequestClose={() => setSelectedLocation(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHandle} />
            {selectedLocation && (
              <>
                <Text style={styles.modalEmoji}>{selectedLocation.emoji}</Text>
                <Text style={styles.modalLocationName}>{selectedLocation.name}</Text>
                <Text style={styles.modalDescription}>{selectedLocation.description}</Text>
                <View style={styles.modalMeta}>
                  <Text style={styles.modalMetaText}>
                    Unlocks on Day {selectedLocation.unlock_day}
                  </Text>
                </View>
                <TouchableOpacity
                  style={styles.modalDismiss}
                  onPress={() => setSelectedLocation(null)}
                >
                  <Text style={styles.modalDismissText}>Close</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </View>
      </Modal>
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
    paddingBottom: spacing['3xl'],
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
    fontWeight: typography.medium,
    marginTop: 2,
  },
  progressSummary: {
    flexDirection: 'row',
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.base,
    overflow: 'hidden',
  },
  progressStat: {
    flex: 1,
    alignItems: 'center',
    padding: spacing.md,
  },
  progressStatValue: {
    fontSize: typography.xl,
    fontWeight: typography.bold,
    color: colors.gold,
  },
  progressStatLabel: {
    fontSize: typography.xs,
    color: colors.parchmentMuted,
    marginTop: 2,
  },
  progressDivider: {
    width: 1,
    backgroundColor: colors.border,
    marginVertical: spacing.sm,
  },
  loadingContainer: {
    height: 240,
    justifyContent: 'center',
    alignItems: 'center',
    gap: spacing.base,
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.base,
  },
  loadingText: {
    color: colors.parchmentMuted,
    fontSize: typography.sm,
    fontStyle: 'italic',
  },
  mapContainer: {
    marginBottom: spacing.base,
  },
  nextDestination: {
    marginBottom: spacing.base,
  },
  nextDestinationLabel: {
    fontSize: typography.xs,
    color: colors.parchmentMuted,
    fontWeight: typography.semibold,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: spacing.sm,
  },
  nextDestinationCard: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.elvish + '60',
    padding: spacing.base,
    flexDirection: 'row',
    gap: spacing.md,
    alignItems: 'flex-start',
  },
  nextDestinationEmoji: {
    fontSize: 28,
    marginTop: 2,
  },
  nextDestinationInfo: {
    flex: 1,
  },
  nextDestinationName: {
    fontSize: typography.base,
    fontWeight: typography.bold,
    color: colors.elvish,
    marginBottom: 4,
  },
  nextDestinationDesc: {
    fontSize: typography.sm,
    color: colors.parchmentMuted,
    lineHeight: 20,
    marginBottom: 4,
  },
  nextDestinationUnlock: {
    fontSize: typography.xs,
    color: colors.parchmentMuted,
    opacity: 0.7,
  },
  locationsList: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  locationsListTitle: {
    fontSize: typography.sm,
    fontWeight: typography.semibold,
    color: colors.parchmentMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    padding: spacing.base,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    paddingHorizontal: spacing.base,
    borderBottomWidth: 1,
    borderBottomColor: colors.border + '50',
    gap: spacing.md,
  },
  locationRowCurrent: {
    backgroundColor: colors.elvish + '10',
  },
  locationRowLocked: {
    opacity: 0.5,
  },
  locationRowEmoji: {
    fontSize: 20,
    width: 28,
    textAlign: 'center',
  },
  locationRowInfo: {
    flex: 1,
  },
  locationRowName: {
    fontSize: typography.base,
    fontWeight: typography.medium,
    color: colors.parchment,
  },
  locationRowNameCurrent: {
    color: colors.elvish,
    fontWeight: typography.bold,
  },
  locationRowDay: {
    fontSize: typography.xs,
    color: colors.parchmentMuted,
    marginTop: 2,
  },
  currentBadge: {
    backgroundColor: colors.elvish + '30',
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: colors.elvish + '60',
  },
  currentBadgeText: {
    fontSize: typography.xs,
    color: colors.elvish,
    fontWeight: typography.semibold,
  },
  dimmed: {
    opacity: 0.4,
  },
  dimmedText: {
    color: colors.parchmentMuted,
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
    borderColor: colors.border,
  },
  modalHandle: {
    width: 40,
    height: 4,
    backgroundColor: colors.border,
    borderRadius: radius.full,
    marginBottom: spacing.lg,
  },
  modalEmoji: {
    fontSize: 48,
    marginBottom: spacing.md,
  },
  modalLocationName: {
    fontSize: typography.xl,
    fontWeight: typography.bold,
    color: colors.parchment,
    textAlign: 'center',
    marginBottom: spacing.base,
  },
  modalDescription: {
    fontSize: typography.base,
    color: colors.parchmentMuted,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: spacing.base,
  },
  modalMeta: {
    backgroundColor: colors.card,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.full,
    marginBottom: spacing.xl,
    borderWidth: 1,
    borderColor: colors.border,
  },
  modalMetaText: {
    fontSize: typography.sm,
    color: colors.parchmentMuted,
  },
  modalDismiss: {
    backgroundColor: colors.card,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: colors.border,
  },
  modalDismissText: {
    fontSize: typography.base,
    color: colors.parchmentMuted,
    fontWeight: typography.medium,
  },
});
