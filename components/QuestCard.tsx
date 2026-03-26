import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Modal,
} from 'react-native';
import { QuestData, LocationData } from '../lib/types';
import { colors, typography, spacing, radius, shadows } from '../constants/theme';

interface QuestCardProps {
  quest: QuestData;
  location: LocationData | null;
  dayNumber: number;
}

export function QuestCard({ quest, location, dayNumber }: QuestCardProps) {
  const [expanded, setExpanded] = useState(false);
  const [showLore, setShowLore] = useState(false);

  return (
    <>
      <View style={styles.card}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.dayBadge}>
            <Text style={styles.dayText}>Day {dayNumber}</Text>
          </View>
          {location && (
            <View style={styles.locationBadge}>
              <Text style={styles.locationEmoji}>{location.emoji}</Text>
              <Text style={styles.locationName}>{location.name}</Text>
            </View>
          )}
        </View>

        {/* Quest title */}
        <Text style={styles.questTitle}>{quest.title}</Text>

        {/* Scripture reference */}
        <View style={styles.scriptureRef}>
          <Text style={styles.scriptureRefText}>{quest.scripture_ref}</Text>
        </View>

        {/* Scripture text */}
        <Text style={styles.scriptureText} numberOfLines={expanded ? undefined : 4}>
          {quest.scripture_text}
        </Text>

        {quest.scripture_text.length > 200 && (
          <TouchableOpacity onPress={() => setExpanded(!expanded)}>
            <Text style={styles.expandToggle}>
              {expanded ? 'Show less' : 'Show more'}
            </Text>
          </TouchableOpacity>
        )}

        {/* Divider */}
        <View style={styles.divider} />

        {/* Lore and Reflection buttons */}
        <View style={styles.actionRow}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => setShowLore(true)}
          >
            <Text style={styles.actionIcon}>📜</Text>
            <Text style={styles.actionLabel}>Lore Connection</Text>
          </TouchableOpacity>
        </View>

        {/* Memory verse */}
        {quest.memory_verse ? (
          <View style={styles.memoryVerseContainer}>
            <Text style={styles.memoryVerseLabel}>Memory Verse</Text>
            <Text style={styles.memoryVerseText}>{quest.memory_verse}</Text>
          </View>
        ) : null}
      </View>

      {/* Lore Modal */}
      <Modal
        visible={showLore}
        transparent
        animationType="fade"
        onRequestClose={() => setShowLore(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>📜 Lore Connection</Text>
              <TouchableOpacity onPress={() => setShowLore(false)}>
                <Text style={styles.modalClose}>✕</Text>
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              <Text style={styles.loreText}>{quest.lore_connection}</Text>

              <View style={styles.reflectionContainer}>
                <Text style={styles.reflectionLabel}>Reflection</Text>
                <Text style={styles.reflectionText}>{quest.reflection_prompt}</Text>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    padding: spacing.base,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.md,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  dayBadge: {
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  dayText: {
    fontSize: typography.xs,
    color: colors.parchmentMuted,
    fontWeight: typography.medium,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  locationBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  locationEmoji: {
    fontSize: 14,
  },
  locationName: {
    fontSize: typography.xs,
    color: colors.elvish,
    fontWeight: typography.medium,
  },
  questTitle: {
    fontSize: typography.lg,
    fontWeight: typography.bold,
    color: colors.parchment,
    marginBottom: spacing.sm,
    lineHeight: 26,
  },
  scriptureRef: {
    marginBottom: spacing.sm,
  },
  scriptureRefText: {
    fontSize: typography.sm,
    color: colors.gold,
    fontWeight: typography.semibold,
    letterSpacing: 0.3,
  },
  scriptureText: {
    fontSize: typography.base,
    color: colors.parchmentMuted,
    lineHeight: 24,
    fontStyle: 'italic',
  },
  expandToggle: {
    fontSize: typography.sm,
    color: colors.gold,
    marginTop: spacing.sm,
    fontWeight: typography.medium,
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: spacing.md,
  },
  actionRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  actionIcon: {
    fontSize: 14,
  },
  actionLabel: {
    fontSize: typography.sm,
    color: colors.parchmentMuted,
    fontWeight: typography.medium,
  },
  memoryVerseContainer: {
    marginTop: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: spacing.md,
    borderLeftWidth: 2,
    borderLeftColor: colors.gold,
  },
  memoryVerseLabel: {
    fontSize: typography.xs,
    color: colors.gold,
    fontWeight: typography.semibold,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    marginBottom: spacing.xs,
  },
  memoryVerseText: {
    fontSize: typography.sm,
    color: colors.parchment,
    lineHeight: 20,
    fontStyle: 'italic',
  },
  // Modal styles
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
    maxHeight: '75%',
    borderTopWidth: 1,
    borderColor: colors.border,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.base,
  },
  modalTitle: {
    fontSize: typography.md,
    fontWeight: typography.bold,
    color: colors.parchment,
  },
  modalClose: {
    fontSize: typography.lg,
    color: colors.parchmentMuted,
    padding: spacing.xs,
  },
  loreText: {
    fontSize: typography.base,
    color: colors.parchmentMuted,
    lineHeight: 26,
    marginBottom: spacing.base,
  },
  reflectionContainer: {
    backgroundColor: colors.card,
    borderRadius: radius.md,
    padding: spacing.base,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.xl,
  },
  reflectionLabel: {
    fontSize: typography.xs,
    color: colors.gold,
    fontWeight: typography.semibold,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    marginBottom: spacing.sm,
  },
  reflectionText: {
    fontSize: typography.base,
    color: colors.parchment,
    lineHeight: 24,
  },
});
