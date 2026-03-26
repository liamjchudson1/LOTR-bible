/**
 * mapMovement.ts
 *
 * Derives the character's current position on the Middle-earth map from
 * quest completion history, and provides helpers for the animated journey.
 *
 * Position logic:
 *   - Character stands at the location tied to the highest completed day.
 *   - When a new day is completed, the character animates from the previous
 *     location to the new one (if they differ).
 *   - Missed days pause the journey but do not reset position — the character
 *     waits where they stopped.
 */

import { QuestData, LocationData, MapPosition } from './types';

// ─── Route Derivation ─────────────────────────────────────────────────────────

/**
 * Returns the ordered sequence of location IDs for a campaign, deduped so that
 * consecutive days at the same location only appear once.
 */
export function getCampaignRoute(
  quests: QuestData[],
  _locations: LocationData[],
): string[] {
  const sorted = [...quests].sort((a, b) => a.day_number - b.day_number);
  const seen = new Set<string>();
  const route: string[] = [];

  for (const quest of sorted) {
    if (quest.lotr_location_id && !seen.has(quest.lotr_location_id)) {
      seen.add(quest.lotr_location_id);
      route.push(quest.lotr_location_id);
    }
  }

  return route;
}

/**
 * Given the set of completed day numbers and quest list, returns the location ID
 * the character currently occupies (the location of the furthest completed day).
 */
export function getCurrentLocationId(
  completedDays: number[],
  quests: QuestData[],
): string | null {
  if (completedDays.length === 0) return null;

  const maxDay = Math.max(...completedDays);
  // Walk backwards from maxDay to find the nearest quest with a location
  const sorted = [...quests].sort((a, b) => b.day_number - a.day_number);
  for (const quest of sorted) {
    if (quest.day_number <= maxDay && quest.lotr_location_id) {
      return quest.lotr_location_id;
    }
  }
  return null;
}

/**
 * Returns the location ID the character was at before their most recent move.
 * Used to determine the FROM point for the entry animation.
 */
export function getPreviousLocationId(
  completedDays: number[],
  quests: QuestData[],
): string | null {
  if (completedDays.length <= 1) return null;

  const sorted = [...completedDays].sort((a, b) => a - b);
  // The second-to-last distinct location
  const currentLocationId = getCurrentLocationId(completedDays, quests);

  for (let i = sorted.length - 2; i >= 0; i--) {
    const day = sorted[i];
    const quest = quests.find((q) => q.day_number === day);
    if (quest?.lotr_location_id && quest.lotr_location_id !== currentLocationId) {
      return quest.lotr_location_id;
    }
  }

  return null;
}

/**
 * Resolves a location ID to its {x, y} map coordinates.
 */
export function resolvePosition(
  locationId: string,
  locations: LocationData[],
): MapPosition | null {
  const loc = locations.find((l) => l.id === locationId);
  if (!loc) return null;
  return { locationId, x: loc.map_x, y: loc.map_y };
}

// ─── Progress Helpers ─────────────────────────────────────────────────────────

/**
 * Returns the index of the current location in the campaign route (0-based).
 * Used to drive progress bars and "X of Y locations reached" labels.
 */
export function getRouteProgress(
  currentLocationId: string | null,
  route: string[],
): { index: number; total: number; fraction: number } {
  const total = route.length;
  if (!currentLocationId || total === 0) {
    return { index: 0, total, fraction: 0 };
  }

  const index = route.indexOf(currentLocationId);
  const i = index === -1 ? 0 : index;
  return { index: i, total, fraction: i / Math.max(total - 1, 1) };
}

/**
 * Given the campaign's route and a location ID, returns how many locations are
 * still ahead — useful for "X locations until the end" copy.
 */
export function locationsRemaining(
  currentLocationId: string | null,
  route: string[],
): number {
  if (!currentLocationId) return route.length;
  const index = route.indexOf(currentLocationId);
  if (index === -1) return route.length;
  return route.length - index - 1;
}

/**
 * Returns the next location the character will reach, or null if at the end.
 */
export function getNextLocation(
  currentLocationId: string | null,
  route: string[],
  locations: LocationData[],
): LocationData | null {
  if (!currentLocationId) {
    return locations.find((l) => l.id === route[0]) ?? null;
  }

  const index = route.indexOf(currentLocationId);
  if (index === -1 || index >= route.length - 1) return null;

  const nextId = route[index + 1];
  return locations.find((l) => l.id === nextId) ?? null;
}

/**
 * Returns the day number on which the user will next change location
 * (i.e. the first upcoming quest whose location differs from current).
 */
export function getDayOfNextLocationChange(
  currentDay: number,
  currentLocationId: string | null,
  quests: QuestData[],
): number | null {
  const upcoming = quests
    .filter((q) => q.day_number > currentDay)
    .sort((a, b) => a.day_number - b.day_number);

  for (const quest of upcoming) {
    if (quest.lotr_location_id && quest.lotr_location_id !== currentLocationId) {
      return quest.day_number;
    }
  }

  return null;
}

// ─── SVG Path Helpers ─────────────────────────────────────────────────────────

/**
 * Builds an SVG polyline points string connecting all locations in route order.
 * Used to draw the journey trail on the map.
 */
export function buildRoutePath(
  route: string[],
  locations: LocationData[],
): string {
  return route
    .map((id) => {
      const loc = locations.find((l) => l.id === id);
      return loc ? `${loc.map_x},${loc.map_y}` : null;
    })
    .filter(Boolean)
    .join(' ');
}

/**
 * Builds an SVG cubic-bezier path string connecting all route locations with
 * smooth curves. Gives the trail a hand-drawn map feel.
 */
export function buildSmoothRoutePath(
  route: string[],
  locations: LocationData[],
): string {
  const points = route
    .map((id) => locations.find((l) => l.id === id))
    .filter((l): l is LocationData => l != null);

  if (points.length === 0) return '';
  if (points.length === 1) return `M ${points[0].map_x} ${points[0].map_y}`;

  let d = `M ${points[0].map_x} ${points[0].map_y}`;

  for (let i = 1; i < points.length; i++) {
    const prev = points[i - 1];
    const curr = points[i];
    // Control points: pull slightly toward mid-point for gentle curves
    const cpX = (prev.map_x + curr.map_x) / 2;
    const cpY = (prev.map_y + curr.map_y) / 2;
    d += ` Q ${cpX} ${cpY} ${curr.map_x} ${curr.map_y}`;
  }

  return d;
}
