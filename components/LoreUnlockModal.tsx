import React, { useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  withDelay,
  withSequence,
  Easing,
} from 'react-native-reanimated';
import { LocationData } from '../lib/types';
import { colors, typography, spacing, radius, shadows } from '../constants/theme';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface LoreUnlockModalProps {
  visible: boolean;
  location: LocationData | null;
  onDismiss: () => void;
}

export function LoreUnlockModal({ visible, location, onDismiss }: LoreUnlockModalProps) {
  const scale = useSharedValue(0.7);
  const opacity = useSharedValue(0);
  const emojiScale = useSharedValue(0);

  useEffect(() => {
    if (visible) {
      opacity.value = withTiming(1, { duration: 250 });
      scale.value = withSpring(1, { damping: 14, stiffness: 200 });
      emojiScale.value = withDelay(
        200,
        withSequence(
          withSpring(1.3, { damping: 6, stiffness: 300 }),
          withSpring(1, { damping: 10, stiffness: 200 })
        )
      );
    } else {
      opacity.value = withTiming(0, { duration: 200 });
      scale.value = withTiming(0.85, { duration: 200 });
      emojiScale.value = 0;
    }
  }, [visible, opacity, scale, emojiScale]);

  const containerStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ scale: scale.value }],
  }));

  const emojiStyle = useAnimatedStyle(() => ({
    transform: [{ scale: emojiScale.value }],
  }));

  if (!location) return null;

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={onDismiss}>
      <View style={styles.overlay}>
        <Animated.View style={[styles.modal, containerStyle]}>
          {/* Top ornament */}
          <View style={styles.ornamentRow}>
            <View style={styles.ornamentLine} />
            <Text style={styles.ornamentText}>✦</Text>
            <View style={styles.ornamentLine} />
          </View>

          {/* Location unlocked banner */}
          <Text style={styles.unlockLabel}>Location Discovered</Text>

          {/* Emoji */}
          <Animated.View style={[styles.emojiContainer, emojiStyle]}>
            <Text style={styles.emoji}>{location.emoji}</Text>
          </Animated.View>

          {/* Location name */}
          <Text style={styles.locationName}>{location.name}</Text>

          {/* Description */}
          <Text style={styles.description}>{location.description}</Text>

          {/* Bottom ornament */}
          <View style={styles.ornamentRow}>
            <View style={styles.ornamentLine} />
            <Text style={styles.ornamentText}>✦</Text>
            <View style={styles.ornamentLine} />
          </View>

          {/* Dismiss button */}
          <TouchableOpacity style={styles.dismissButton} onPress={onDismiss}>
            <Text style={styles.dismissText}>Continue the Journey</Text>
          </TouchableOpacity>
        </Animated.View>
      </View>
    </Modal>
  );
}

interface ArtefactUnlockModalProps {
  visible: boolean;
  artefactName: string;
  artefactEmoji: string;
  artefactDescription: string;
  onDismiss: () => void;
}

export function ArtefactUnlockModal({
  visible,
  artefactName,
  artefactEmoji,
  artefactDescription,
  onDismiss,
}: ArtefactUnlockModalProps) {
  const scale = useSharedValue(0.7);
  const opacity = useSharedValue(0);
  const goldGlow = useSharedValue(0);

  useEffect(() => {
    if (visible) {
      opacity.value = withTiming(1, { duration: 250 });
      scale.value = withSpring(1, { damping: 14, stiffness: 200 });
      goldGlow.value = withDelay(300, withTiming(1, { duration: 600, easing: Easing.out(Easing.cubic) }));
    } else {
      opacity.value = withTiming(0, { duration: 200 });
      scale.value = withTiming(0.85, { duration: 200 });
      goldGlow.value = 0;
    }
  }, [visible, opacity, scale, goldGlow]);

  const containerStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ scale: scale.value }],
  }));

  const glowStyle = useAnimatedStyle(() => ({
    shadowOpacity: goldGlow.value * 0.8,
    shadowRadius: goldGlow.value * 20,
  }));

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={onDismiss}>
      <View style={styles.overlay}>
        <Animated.View style={[styles.modal, styles.artefactModal, containerStyle]}>
          <Text style={styles.artefactLabel}>Artefact Earned</Text>

          <Animated.View style={[styles.artefactEmojiContainer, glowStyle]}>
            <Text style={styles.artefactEmoji}>{artefactEmoji}</Text>
          </Animated.View>

          <Text style={styles.artefactName}>{artefactName}</Text>
          <Text style={styles.description}>{artefactDescription}</Text>

          <TouchableOpacity style={styles.dismissButton} onPress={onDismiss}>
            <Text style={styles.dismissText}>Received</Text>
          </TouchableOpacity>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.75)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
  },
  modal: {
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    padding: spacing.xl,
    width: SCREEN_WIDTH - spacing.xl * 2,
    borderWidth: 1,
    borderColor: colors.gold + '80',
    alignItems: 'center',
    ...shadows.gold,
  },
  artefactModal: {
    borderColor: colors.gold,
  },
  ornamentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    width: '100%',
    marginVertical: spacing.sm,
  },
  ornamentLine: {
    flex: 1,
    height: 1,
    backgroundColor: colors.gold + '40',
  },
  ornamentText: {
    color: colors.gold,
    fontSize: typography.sm,
  },
  unlockLabel: {
    fontSize: typography.xs,
    color: colors.gold,
    fontWeight: typography.semibold,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
    marginBottom: spacing.md,
  },
  emojiContainer: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: colors.card,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.base,
    borderWidth: 2,
    borderColor: colors.gold + '60',
  },
  emoji: {
    fontSize: 34,
  },
  locationName: {
    fontSize: typography['2xl'],
    fontWeight: typography.bold,
    color: colors.parchment,
    textAlign: 'center',
    marginBottom: spacing.base,
  },
  description: {
    fontSize: typography.base,
    color: colors.parchmentMuted,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: spacing.lg,
  },
  dismissButton: {
    backgroundColor: colors.gold,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    borderRadius: radius.full,
    marginTop: spacing.sm,
  },
  dismissText: {
    fontSize: typography.base,
    fontWeight: typography.bold,
    color: colors.background,
    letterSpacing: 0.5,
  },
  artefactLabel: {
    fontSize: typography.xs,
    color: colors.goldLight,
    fontWeight: typography.semibold,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
    marginBottom: spacing.base,
  },
  artefactEmojiContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.card,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.base,
    borderWidth: 2,
    borderColor: colors.gold,
    shadowColor: colors.gold,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0,
    shadowRadius: 0,
    elevation: 0,
  },
  artefactEmoji: {
    fontSize: 38,
  },
  artefactName: {
    fontSize: typography.xl,
    fontWeight: typography.bold,
    color: colors.goldLight,
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
});
