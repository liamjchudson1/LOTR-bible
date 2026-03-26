/**
 * MiddleEarthMap.tsx
 *
 * Interactive SVG map of Middle-earth. The character's position is driven
 * entirely by quest completion — completing a day's quest moves the character
 * to that quest's lotr_location, animated with Reanimated.
 *
 * Key behaviours:
 *  - completedDays prop drives position (not currentDay alone)
 *  - Character animates from previous location to new one on day completion
 *  - Level-gated locations show a lock icon and can't be entered yet
 *  - Tapping a location shows its name, description, and any gate reason
 *  - Completed trail rendered in gold; future path dimmed
 *
 * Rendering layers (bottom → top):
 *  1. Dark parchment background gradient
 *  2. Terrain hints (sea, mountain ridges, forest blobs, river)
 *  3. Full route (dashed, dimmed) — shows the whole path ahead
 *  4. Completed route (gold) — fills in as user progresses
 *  5. Location nodes (circle + emoji)
 *  6. Lock icons on level-gated locations
 *  7. Location labels
 *  8. Character marker (Reanimated, moves on completion)
 *  9. Pulse ring on current location
 */

import React, { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Dimensions,
} from 'react-native';
import Svg, {
  Path,
  Circle,
  Text as SvgText,
  Defs,
  LinearGradient,
  RadialGradient,
  Stop,
  Rect,
  G,
  Ellipse,
} from 'react-native-svg';
import Animated, {
  useSharedValue,
  useAnimatedProps,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
  withDelay,
  interpolate,
  runOnJS,
  Easing,
} from 'react-native-reanimated';

import { LocationData, QuestData } from '../lib/types';
import { colors, typography, spacing } from '../constants/theme';
import {
  getCampaignRoute,
  buildSmoothRoutePath,
  getCurrentLocationId,
  getPreviousLocationId,
  getRouteProgress,
} from '../lib/mapMovement';
import { getCampaignGates } from '../lib/levelGate';
import { getLevelForXP } from '../constants/levels';

// ─── Constants ────────────────────────────────────────────────────────────────

// The coordinate space used in locations.json — map_x / map_y live in this box.
const COORD_W = 660;
const COORD_H = 520;

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

// ─── Types ────────────────────────────────────────────────────────────────────

export interface MiddleEarthMapProps {
  /** All quests for the active campaign — used to derive route order */
  quests: QuestData[];
  /** All locations for the active campaign */
  locations: LocationData[];
  /** Day numbers the user has fully completed (any habit ticked counts) */
  completedDays: number[];
  /** The current day number being worked on (may not be completed yet) */
  currentDay: number;
  /** User's total XP — used to evaluate level gates */
  userXP: number;
  /** Callback when a location node is tapped */
  onLocationPress?: (location: LocationData) => void;
}

// ─── Component ────────────────────────────────────────────────────────────────

export function MiddleEarthMap({
  quests,
  locations,
  completedDays,
  currentDay,
  userXP,
  onLocationPress,
}: MiddleEarthMapProps) {
  const screenWidth = Dimensions.get('window').width;
  const mapDisplayW = screenWidth - spacing.base * 2;
  const mapDisplayH = mapDisplayW * (COORD_H / COORD_W);

  // Scale a raw coordinate to SVG display space
  const sx = (x: number) => (x / COORD_W) * mapDisplayW;
  const sy = (y: number) => (y / COORD_H) * mapDisplayH;

  const userLevel = getLevelForXP(userXP).level;

  // ── Route & map position ────────────────────────────────────────────────────

  const route = useMemo(
    () => getCampaignRoute(quests, locations),
    [quests, locations],
  );

  const currentLocationId = useMemo(
    () => getCurrentLocationId(completedDays, quests),
    [completedDays, quests],
  );

  const previousLocationId = useMemo(
    () => getPreviousLocationId(completedDays, quests),
    [completedDays, quests],
  );

  const routeProgress = getRouteProgress(currentLocationId, route);

  // Resolved LocationData objects
  const currentLoc = useMemo(
    () => locations.find((l) => l.id === currentLocationId) ?? null,
    [currentLocationId, locations],
  );
  const previousLoc = useMemo(
    () => locations.find((l) => l.id === previousLocationId) ?? null,
    [previousLocationId, locations],
  );

  // Completed portion of the route (for the gold trail)
  const completedRoute = useMemo(() => {
    if (!currentLocationId) return [];
    const idx = route.indexOf(currentLocationId);
    return idx === -1 ? [] : route.slice(0, idx + 1);
  }, [currentLocationId, route]);

  // ── Level gates ─────────────────────────────────────────────────────────────

  const gates = useMemo(
    () => getCampaignGates(quests, userLevel),
    [quests, userLevel],
  );

  const lockedIds = useMemo(
    () => new Set(gates.filter((g) => !g.isUnlocked).map((g) => g.locationId)),
    [gates],
  );

  // ── SVG paths ───────────────────────────────────────────────────────────────

  const fullRoutePath = useMemo(
    () => buildSmoothRoutePath(route, locations),
    [route, locations],
  );
  const completedRoutePath = useMemo(
    () => buildSmoothRoutePath(completedRoute, locations),
    [completedRoute, locations],
  );

  // ── Character position (animated) ───────────────────────────────────────────

  // Shared values for the character's live SVG position
  const charX = useSharedValue(currentLoc ? sx(currentLoc.map_x) : sx(120));
  const charY = useSharedValue(currentLoc ? sy(currentLoc.map_y) : sy(340));

  const prevLocIdRef = useRef<string | null>(null);

  useEffect(() => {
    if (!currentLoc) return;

    const targetX = sx(currentLoc.map_x);
    const targetY = sy(currentLoc.map_y);

    const hasMovedLocation = currentLocationId !== prevLocIdRef.current;

    if (hasMovedLocation && previousLoc && previousLoc.id !== currentLoc.id) {
      // Snap to previous location, then animate to new one
      charX.value = sx(previousLoc.map_x);
      charY.value = sy(previousLoc.map_y);

      charX.value = withDelay(
        200,
        withTiming(targetX, { duration: 1200, easing: Easing.inOut(Easing.quad) }),
      );
      charY.value = withDelay(
        200,
        withTiming(targetY, { duration: 1200, easing: Easing.inOut(Easing.quad) }),
      );
    } else if (!hasMovedLocation) {
      // No movement needed — just ensure position is current
      charX.value = targetX;
      charY.value = targetY;
    }

    prevLocIdRef.current = currentLocationId;
  }, [currentLocationId]);

  // Animated style for the character marker View overlay
  const characterStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: charX.value - 10 },
      { translateY: charY.value - 10 },
    ],
  }));

  // ── Pulse for current location ───────────────────────────────────────────────

  const pulseScale = useSharedValue(1);
  const pulseOpacity = useSharedValue(0.7);

  useEffect(() => {
    pulseScale.value = withRepeat(
      withSequence(
        withTiming(1.9, { duration: 1100, easing: Easing.inOut(Easing.sine) }),
        withTiming(1.0, { duration: 1100, easing: Easing.inOut(Easing.sine) }),
      ),
      -1,
      false,
    );
    pulseOpacity.value = withRepeat(
      withSequence(
        withTiming(0.0, { duration: 1100 }),
        withTiming(0.6, { duration: 1100 }),
      ),
      -1,
      false,
    );
  }, []);

  const pulseStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: charX.value - 14 },
      { translateY: charY.value - 14 },
      { scale: pulseScale.value },
    ],
    opacity: pulseOpacity.value,
  }));

  // ── Selected location tooltip ────────────────────────────────────────────────

  const [selectedLoc, setSelectedLoc] = useState<LocationData | null>(null);

  const handlePress = useCallback(
    (loc: LocationData) => {
      setSelectedLoc((prev) => (prev?.id === loc.id ? null : loc));
      onLocationPress?.(loc);
    },
    [onLocationPress],
  );

  // ─── Render ──────────────────────────────────────────────────────────────────

  const currentLocData = currentLoc;

  return (
    <View style={styles.wrapper}>
      {/* ── Header: current position ────────────────────────────────── */}
      <View style={styles.header}>
        <Text style={styles.headerLocation}>
          {currentLocData
            ? `${currentLocData.emoji}  ${currentLocData.name}`
            : 'The road is before you'}
        </Text>
        <Text style={styles.headerProgress}>
          {completedDays.length === 0
            ? 'Begin the journey'
            : `${routeProgress.index + 1} / ${routeProgress.total} locations`}
        </Text>
      </View>

      {/* ── Map ─────────────────────────────────────────────────────── */}
      <View style={[styles.mapContainer, { height: mapDisplayH }]}>
        <Svg
          width={mapDisplayW}
          height={mapDisplayH}
          viewBox={`0 0 ${mapDisplayW} ${mapDisplayH}`}
        >
          <Defs>
            <LinearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
              <Stop offset="0" stopColor="#1C1510" stopOpacity="1" />
              <Stop offset="0.6" stopColor="#13100C" stopOpacity="1" />
              <Stop offset="1" stopColor="#0D0B08" stopOpacity="1" />
            </LinearGradient>
            <LinearGradient id="sea" x1="0" y1="0" x2="1" y2="0">
              <Stop offset="0" stopColor="#0A1520" stopOpacity="1" />
              <Stop offset="1" stopColor="#0D1B28" stopOpacity="0" />
            </LinearGradient>
            <RadialGradient id="glow" cx="50%" cy="50%" r="50%">
              <Stop offset="0%" stopColor={colors.elvish} stopOpacity="0.3" />
              <Stop offset="100%" stopColor={colors.elvish} stopOpacity="0" />
            </RadialGradient>
          </Defs>

          {/* Background */}
          <Rect width={mapDisplayW} height={mapDisplayH} fill="url(#bg)" />

          {/* Sea (west) */}
          <Path
            d={`M 0 0 L ${sx(58)} 0 Q ${sx(50)} ${sy(130)} ${sx(55)} ${sy(260)}
                Q ${sx(48)} ${sy(380)} ${sx(58)} ${sy(COORD_H)} L 0 ${mapDisplayH} Z`}
            fill="url(#sea)"
            opacity={0.8}
          />

          {/* Rohan plains */}
          <Ellipse
            cx={sx(370)} cy={sy(445)} rx={sx(65)} ry={sy(28)}
            fill={colors.green + '0A'} stroke={colors.green + '18'} strokeWidth={1}
          />

          {/* River Anduin */}
          <Path
            d={`M ${sx(495)} ${sy(195)} Q ${sx(512)} ${sy(295)} ${sx(525)} ${sy(365)}
                Q ${sx(532)} ${sy(440)} ${sx(528)} ${sy(COORD_H)}`}
            stroke={colors.blue + '55'} strokeWidth={sx(3)} fill="none"
          />

          {/* Misty Mountains */}
          <Path
            d={`M ${sx(385)} ${sy(148)} L ${sx(400)} ${sy(202)} L ${sx(416)} ${sy(172)}
                L ${sx(432)} ${sy(222)} L ${sx(448)} ${sy(188)} L ${sx(462)} ${sy(248)}
                L ${sx(472)} ${sy(212)} L ${sx(490)} ${sy(298)}`}
            stroke={colors.parchmentMuted + '35'} strokeWidth={2}
            fill="none" strokeLinejoin="round"
          />

          {/* Gondor mountains */}
          <Path
            d={`M ${sx(465)} ${sy(398)} L ${sx(482)} ${sy(352)} L ${sx(502)} ${sy(380)}
                L ${sx(522)} ${sy(342)} L ${sx(542)} ${sy(370)} L ${sx(562)} ${sy(322)}
                L ${sx(580)} ${sy(358)}`}
            stroke={colors.parchmentMuted + '35'} strokeWidth={2}
            fill="none" strokeLinejoin="round"
          />

          {/* Blue Mountains */}
          <Path
            d={`M ${sx(62)} ${sy(238)} L ${sx(72)} ${sy(218)} L ${sx(84)} ${sy(240)}
                L ${sx(96)} ${sy(220)} L ${sx(108)} ${sy(242)}`}
            stroke={colors.parchmentMuted + '30'} strokeWidth={1.5}
            fill="none" strokeLinejoin="round"
          />

          {/* Forest blobs */}
          <Ellipse cx={sx(400)} cy={sy(375)} rx={sx(28)} ry={sy(16)}
            fill="#1A2C1A" opacity={0.45} />
          <Ellipse cx={sx(115)} cy={sy(332)} rx={sx(20)} ry={sy(12)}
            fill="#1A2C1A" opacity={0.35} />

          {/* Map border */}
          <Rect x={3} y={3} width={mapDisplayW - 6} height={mapDisplayH - 6}
            fill="none" stroke={colors.border} strokeWidth={1.2} rx={4} />

          {/* ── Full route (dashed, shows whole path) ─────────── */}
          {fullRoutePath ? (
            <Path
              d={fullRoutePath}
              stroke={colors.border}
              strokeWidth={1.5}
              fill="none"
              strokeDasharray="5,4"
              opacity={0.45}
            />
          ) : null}

          {/* ── Completed route (solid gold) ──────────────────── */}
          {completedRoutePath ? (
            <Path
              d={completedRoutePath}
              stroke={colors.gold}
              strokeWidth={2}
              fill="none"
              opacity={0.8}
              strokeLinecap="round"
            />
          ) : null}

          {/* ── Location nodes ────────────────────────────────── */}
          {locations.map((loc) => {
            const isVisited = completedRoute.includes(loc.id);
            const isCurrent = loc.id === currentLocationId;
            const isLocked = lockedIds.has(loc.id);
            const isAhead = !isVisited && !isCurrent && !isLocked;

            const dotColor = isCurrent
              ? colors.elvish
              : isVisited
              ? colors.gold
              : isLocked
              ? colors.border
              : colors.parchmentMuted + '55';

            const strokeColor = isCurrent
              ? colors.elvish
              : isVisited
              ? colors.goldLight
              : isLocked
              ? colors.border + '88'
              : colors.border;

            const labelColor = isCurrent
              ? colors.goldLight
              : isVisited
              ? colors.parchmentMuted
              : isLocked
              ? colors.border
              : colors.parchmentMuted + '50';

            return (
              <G key={loc.id} onPress={() => handlePress(loc)}>
                {/* Outer ring — completed & current */}
                {(isVisited || isCurrent) && (
                  <Circle
                    cx={sx(loc.map_x)} cy={sy(loc.map_y)} r={13}
                    fill="none"
                    stroke={isCurrent ? colors.elvish : colors.gold}
                    strokeWidth={isCurrent ? 1.5 : 1}
                    opacity={isCurrent ? 0.9 : 0.4}
                  />
                )}

                {/* Main dot */}
                <Circle
                  cx={sx(loc.map_x)} cy={sy(loc.map_y)} r={8}
                  fill={colors.surface}
                  stroke={strokeColor}
                  strokeWidth={1.5}
                  opacity={isLocked ? 0.45 : 1}
                />

                {/* Emoji / lock icon */}
                <SvgText
                  x={sx(loc.map_x)} y={sy(loc.map_y) + 4}
                  textAnchor="middle"
                  fontSize={isLocked ? 6 : 8}
                  opacity={isLocked ? 0.35 : 1}
                >
                  {isLocked ? '🔒' : loc.emoji}
                </SvgText>

                {/* Label */}
                <SvgText
                  x={sx(loc.map_x)} y={sy(loc.map_y) + 20}
                  textAnchor="middle"
                  fontSize={6.5}
                  fill={labelColor}
                  fontWeight={isCurrent ? 'bold' : 'normal'}
                >
                  {loc.name}
                </SvgText>
              </G>
            );
          })}

          {/* Map title */}
          <SvgText
            x={mapDisplayW - 8} y={mapDisplayH - 8}
            textAnchor="end" fontSize={7}
            fill={colors.parchmentMuted + '40'} fontStyle="italic"
          >
            Middle-earth
          </SvgText>
        </Svg>

        {/* ── Pulse ring overlay (Reanimated — outside SVG) ─────── */}
        {currentLoc && (
          <Animated.View style={[styles.pulseRing, pulseStyle]} />
        )}

        {/* ── Character marker (Reanimated — outside SVG) ─────────── */}
        {currentLoc && (
          <Animated.View style={[styles.characterMarker, characterStyle]}>
            <Text style={styles.characterEmoji}>⚔️</Text>
          </Animated.View>
        )}
      </View>

      {/* ── Location tooltip ────────────────────────────────────────── */}
      {selectedLoc && (
        <LocationTooltip
          location={selectedLoc}
          isVisited={completedRoute.includes(selectedLoc.id)}
          isCurrent={selectedLoc.id === currentLocationId}
          isLocked={lockedIds.has(selectedLoc.id)}
          gateData={gates.find((g) => g.locationId === selectedLoc.id)}
          onClose={() => setSelectedLoc(null)}
        />
      )}

      {/* ── Legend ──────────────────────────────────────────────────── */}
      <View style={styles.legend}>
        <LegendItem color={colors.gold} label="Visited" />
        <LegendItem color={colors.elvish} label="You are here" />
        <LegendItem color={colors.border} label="Ahead" />
        <Text style={styles.legendLock}>🔒 Level locked</Text>
      </View>
    </View>
  );
}

// ─── Location Tooltip ─────────────────────────────────────────────────────────

interface TooltipProps {
  location: LocationData;
  isVisited: boolean;
  isCurrent: boolean;
  isLocked: boolean;
  gateData?: { gateTitle: string; levelTitle: string; minLevel: number; isUnlocked: boolean };
  onClose: () => void;
}

function LocationTooltip({
  location,
  isVisited,
  isCurrent,
  isLocked,
  gateData,
  onClose,
}: TooltipProps) {
  return (
    <Pressable style={styles.tooltipTap} onPress={onClose}>
      <View style={styles.tooltip}>
        <View style={styles.tooltipRow}>
          <Text style={styles.tooltipEmoji}>{isLocked ? '🔒' : location.emoji}</Text>
          <View style={{ flex: 1 }}>
            <Text style={styles.tooltipName}>{location.name}</Text>
            {isCurrent && <Text style={styles.badgeCurrent}>You are here</Text>}
            {isVisited && !isCurrent && <Text style={styles.badgeVisited}>Visited</Text>}
          </View>
          <Pressable onPress={onClose} hitSlop={12}>
            <Text style={styles.closeBtn}>✕</Text>
          </Pressable>
        </View>

        {isLocked && gateData ? (
          <View style={styles.gateBox}>
            <Text style={styles.gateTitle}>{gateData.gateTitle}</Text>
            <Text style={styles.gateRequirement}>
              Requires level {gateData.minLevel}: {gateData.levelTitle}
            </Text>
          </View>
        ) : (
          <Text style={styles.tooltipDesc}>{location.description}</Text>
        )}
      </View>
    </Pressable>
  );
}

// ─── Legend Item ──────────────────────────────────────────────────────────────

function LegendItem({ color, label }: { color: string; label: string }) {
  return (
    <View style={styles.legendItem}>
      <View style={[styles.legendDot, { backgroundColor: color }]} />
      <Text style={styles.legendLabel}>{label}</Text>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  wrapper: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.border,
  },

  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.sm + 2,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerLocation: {
    color: colors.goldLight,
    fontSize: typography.base,
    fontWeight: typography.semibold,
    letterSpacing: 0.3,
  },
  headerProgress: {
    color: colors.parchmentMuted,
    fontSize: typography.xs,
  },

  mapContainer: {
    position: 'relative',
    overflow: 'hidden',
  },

  // Reanimated overlays — positioned absolutely within mapContainer
  pulseRing: {
    position: 'absolute',
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: colors.elvish,
  },
  characterMarker: {
    position: 'absolute',
    width: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  characterEmoji: {
    fontSize: 13,
  },

  // Tooltip
  tooltipTap: {
    padding: spacing.sm,
  },
  tooltip: {
    backgroundColor: colors.card,
    borderRadius: 10,
    padding: spacing.base,
    borderWidth: 1,
    borderColor: colors.border,
  },
  tooltipRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  tooltipEmoji: {
    fontSize: 24,
  },
  tooltipName: {
    color: colors.parchment,
    fontSize: typography.md,
    fontWeight: typography.bold,
  },
  badgeCurrent: {
    color: colors.gold,
    fontSize: typography.xs,
    fontWeight: typography.semibold,
    marginTop: 2,
  },
  badgeVisited: {
    color: colors.parchmentMuted,
    fontSize: typography.xs,
    marginTop: 2,
  },
  closeBtn: {
    color: colors.parchmentMuted,
    fontSize: typography.sm,
    padding: 2,
  },
  tooltipDesc: {
    color: colors.parchmentMuted,
    fontSize: typography.sm,
    lineHeight: 20,
  },

  gateBox: {
    backgroundColor: '#1A0A0A',
    borderRadius: 6,
    padding: spacing.sm + 2,
    borderLeftWidth: 3,
    borderLeftColor: colors.red,
  },
  gateTitle: {
    color: '#C07070',
    fontSize: typography.sm,
    fontWeight: typography.semibold,
    marginBottom: 4,
  },
  gateRequirement: {
    color: '#8A5555',
    fontSize: typography.xs,
  },

  // Legend
  legend: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: spacing.base,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.base,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.background + 'AA',
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  legendLabel: {
    color: colors.parchmentMuted,
    fontSize: typography.xs,
  },
  legendLock: {
    color: colors.parchmentMuted,
    fontSize: typography.xs,
  },
});
