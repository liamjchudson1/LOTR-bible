/**
 * levelGate.ts
 *
 * Level-gate logic: certain quests are locked behind a minimum level requirement.
 * The gate is not arbitrary — it reflects genuine narrative readiness.
 *
 * Design principle: gates are sparse, and each one has a story reason.
 * The user is told WHY they can't proceed yet, not just "level up first."
 *
 * Gates in The Fellowship campaign:
 *   Day 5  — Moria, the cave troll     → Level 2 (Traveller)
 *   Day 7  — Rauros, the breaking      → Level 3 (Ranger of the North)
 *   Day 28 — Helm's Deep               → Level 4 (Knight of Gondor)
 *   Day 49 — Minas Tirith              → Level 5 (Rider of Rohan)
 *   Day 77 — Mount Doom                → Level 7 (Loremaster)
 */

import { QuestData, LevelGateInfo } from './types';
import { LEVELS } from '../constants/levels';

// ─── Gate Check ───────────────────────────────────────────────────────────────

/**
 * Returns true if the user's current level is below the quest's requirement.
 */
export function isQuestGated(quest: QuestData, userLevel: number): boolean {
  if (quest.min_level == null) return false;
  return userLevel < quest.min_level;
}

/**
 * Returns full gate information for display, or null if the quest is open.
 */
export function getGateInfo(
  quest: QuestData,
  userLevel: number,
  userXP: number,
): LevelGateInfo | null {
  if (!isQuestGated(quest, userLevel)) return null;

  const minLevel = quest.min_level!;
  const requiredLevelData = LEVELS.find((l) => l.level === minLevel);
  if (!requiredLevelData) return null;

  return {
    minLevel,
    gateTitle: quest.level_gate_title ?? 'Not Yet',
    gateDescription:
      quest.level_gate_description ??
      'This moment requires more than you currently carry. Keep walking.',
    unlockHint: `Reach level ${minLevel}: ${requiredLevelData.title}`,
    xpRequired: requiredLevelData.minXP,
    xpCurrent: userXP,
  };
}

/**
 * Returns the XP still needed to pass a gate, clamped to 0 minimum.
 */
export function xpToUnlock(gate: LevelGateInfo): number {
  return Math.max(0, gate.xpRequired - gate.xpCurrent);
}

/**
 * Returns a 0–1 progress fraction toward unlocking a gate.
 */
export function gateUnlockProgress(gate: LevelGateInfo): number {
  const currentLevelData = LEVELS.slice()
    .reverse()
    .find((l) => gate.xpCurrent >= l.minXP);

  if (!currentLevelData) return 0;

  const xpIntoCurrentLevel = gate.xpCurrent - currentLevelData.minXP;
  const xpNeededForGate = gate.xpRequired - currentLevelData.minXP;

  if (xpNeededForGate <= 0) return 1;
  return Math.min(xpIntoCurrentLevel / xpNeededForGate, 1);
}

// ─── Campaign Gate Summary ────────────────────────────────────────────────────

export interface CampaignGate {
  dayNumber: number;
  questTitle: string;
  locationId: string;
  minLevel: number;
  levelTitle: string;
  gateTitle: string;
  isUnlocked: boolean;
}

/**
 * Returns all gates in a campaign with their unlock status for a given user.
 * Used in the map screen to show locked/unlocked milestones.
 */
export function getCampaignGates(
  quests: QuestData[],
  userLevel: number,
): CampaignGate[] {
  return quests
    .filter((q) => q.min_level != null)
    .sort((a, b) => a.day_number - b.day_number)
    .map((q) => {
      const levelData = LEVELS.find((l) => l.level === q.min_level);
      return {
        dayNumber: q.day_number,
        questTitle: q.title,
        locationId: q.lotr_location_id,
        minLevel: q.min_level!,
        levelTitle: levelData?.title ?? `Level ${q.min_level}`,
        gateTitle: q.level_gate_title ?? 'Locked',
        isUnlocked: userLevel >= q.min_level!,
      };
    });
}

// ─── Gate Narrative Map ───────────────────────────────────────────────────────

/**
 * The canonical gate definitions for The Fellowship campaign.
 * These are applied to quests at seed time, but also referenced at runtime
 * to re-validate gates if quest data is loaded from local JSON.
 */
export const FELLOWSHIP_GATES: Record<
  number,
  { min_level: number; level_gate_title: string; level_gate_description: string }
> = {
  5: {
    min_level: 2,
    level_gate_title: 'The Mines Demand More',
    level_gate_description:
      'Moria is not merely dark — it is old, and it remembers. The cave troll does not yield to ' +
      'those still finding their footing. Before you descend, you must be a Traveller: someone who ' +
      'has shown they can carry the road. Keep walking until you are.',
  },
  7: {
    min_level: 3,
    level_gate_title: 'The Breaking Cannot Be Rushed',
    level_gate_description:
      'At Rauros, the Fellowship does not simply scatter — it chooses. Boromir falls. Frodo goes ' +
      'alone. This is not a moment for the new. Only a Ranger of the North has learned enough about ' +
      'faithfulness under pressure to understand what is actually happening here — and why it had to.',
  },
  28: {
    min_level: 4,
    level_gate_title: 'The Wall Holds Only the Sworn',
    level_gate_description:
      "Helm's Deep is fought by people who have no reason for hope except duty. You cannot stand at " +
      'that wall unless you have sworn something — unless your faithfulness has been tested and held. ' +
      'A Knight of Gondor does not fight because they expect to win. They fight because they were made ' +
      'to stand.',
  },
  49: {
    min_level: 5,
    level_gate_title: 'The Beacons Are Not For Everyone',
    level_gate_description:
      'The beacons of Gondor call for riders — not wanderers. The Siege of Minas Tirith is a chapter ' +
      "that rewards those who have answered smaller calls faithfully. A Rider of Rohan doesn't wait " +
      'to feel ready. But they have already learned to ride.',
  },
  77: {
    min_level: 7,
    level_gate_title: 'Only the Loremaster Carries This',
    level_gate_description:
      'Mount Doom is not a place of triumph. It is a place of exhaustion, temptation, and a mercy ' +
      "that neither Frodo nor Gollum understood. You cannot walk into Orodruin's fire unless you " +
      'have sat long enough in the Word to know what it costs to carry something all the way to the ' +
      "end. The Loremaster's road leads here. Not the hero's.",
  },
};
