import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { getProgressToNextLevel } from '../constants/levels';
import { colors, typography, spacing, radius } from '../constants/theme';

interface XPBarProps {
  xp: number;
  showLabels?: boolean;
  compact?: boolean;
}

export function XPBar({ xp, showLabels = true, compact = false }: XPBarProps) {
  const { current, next, progress, xpIntoLevel, xpNeeded } = getProgressToNextLevel(xp);
  const animatedWidth = useSharedValue(0);

  useEffect(() => {
    animatedWidth.value = withTiming(progress, {
      duration: 800,
      easing: Easing.out(Easing.cubic),
    });
  }, [progress, animatedWidth]);

  const barStyle = useAnimatedStyle(() => ({
    width: `${animatedWidth.value * 100}%`,
  }));

  const barHeight = compact ? 6 : 10;

  return (
    <View style={styles.container}>
      {showLabels && (
        <View style={styles.labels}>
          <Text style={[styles.levelTitle, compact && styles.compact]}>
            {current.title}
          </Text>
          {next && (
            <Text style={styles.xpText}>
              {xpIntoLevel.toLocaleString()} / {xpNeeded.toLocaleString()} XP
            </Text>
          )}
        </View>
      )}

      <View style={[styles.track, { height: barHeight }]}>
        <Animated.View
          style={[
            styles.fill,
            { height: barHeight, borderRadius: barHeight / 2 },
            barStyle,
          ]}
        />
        {!next && (
          <View style={[styles.fill, styles.fillMax, { height: barHeight }]} />
        )}
      </View>

      {showLabels && next && (
        <Text style={styles.nextLevel}>Next: {next.title}</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  labels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    marginBottom: spacing.xs,
  },
  levelTitle: {
    fontSize: typography.sm,
    fontWeight: typography.semibold,
    color: colors.gold,
    letterSpacing: 0.3,
  },
  compact: {
    fontSize: typography.xs,
  },
  xpText: {
    fontSize: typography.xs,
    color: colors.parchmentMuted,
    fontWeight: typography.regular,
  },
  track: {
    backgroundColor: colors.border,
    borderRadius: radius.full,
    overflow: 'hidden',
    position: 'relative',
  },
  fill: {
    position: 'absolute',
    left: 0,
    top: 0,
    backgroundColor: colors.gold,
    borderRadius: radius.full,
  },
  fillMax: {
    width: '100%',
    backgroundColor: colors.goldLight,
  },
  nextLevel: {
    fontSize: typography.xs,
    color: colors.parchmentMuted,
    marginTop: spacing.xs,
  },
});
