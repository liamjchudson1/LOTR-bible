// ─── Core Enums ──────────────────────────────────────────────────────────────

export type Race = 'hobbit' | 'elf' | 'dwarf' | 'man';

export type HabitType = 'read' | 'pray' | 'memorise' | 'reflect';

export type CampaignSlug =
  | 'there-and-back-again'
  | 'the-fellowship'
  | 'the-long-defeat'
  | 'return-of-the-king'
  | 'wisdom-of-rivendell'
  | 'the-rangers-road';

// ─── Database Row Types ───────────────────────────────────────────────────────

export interface DBUser {
  id: string;
  email: string;
  name: string;
  race: Race;
  avatar_id: string;
  level: number;
  xp: number;
  streak_count: number;
  last_active_date: string | null;
  fellowship_id: string | null;
  campaign_id: string | null;
  created_at: string;
}

export interface DBCampaign {
  id: string;
  title: string;
  slug: CampaignSlug;
  duration_days: number;
  biblical_content: string;
  lotr_arc: string;
  is_active: boolean;
}

export interface DBLotrLocation {
  id: string;
  name: string;
  map_x: number;
  map_y: number;
  campaign_id: string;
  unlock_day: number;
  description: string;
  emoji: string;
}

export interface DBQuest {
  id: string;
  campaign_id: string;
  day_number: number;
  title: string;
  lotr_location_id: string;
  scripture_ref: string;
  scripture_text: string;
  lore_connection: string;
  reflection_prompt: string;
  xp_reward: number;
  memory_verse: string;
  // Level gate — null means no requirement
  min_level: number | null;
  level_gate_title: string | null;
  level_gate_description: string | null;
}

export interface DBUserProgress {
  id: string;
  user_id: string;
  campaign_id: string;
  current_day: number;
  started_at: string;
  completed_at: string | null;
}

export interface DBDailyCompletion {
  id: string;
  user_id: string;
  quest_id: string;
  date: string;
  read_done: boolean;
  pray_done: boolean;
  memorise_done: boolean;
  reflect_done: boolean;
  xp_earned: number;
}

export interface DBJournalEntry {
  id: string;
  user_id: string;
  quest_id: string;
  date: string;
  body: string;
  created_at: string;
}

export interface DBArtefact {
  id: string;
  name: string;
  description: string;
  emoji: string;
  unlock_condition: string;
  unlock_value: number;
}

export interface DBUserArtefact {
  id: string;
  user_id: string;
  artefact_id: string;
  earned_at: string;
  artefact?: DBArtefact;
}

export interface DBFellowship {
  id: string;
  name: string;
  created_by: string;
  campaign_id: string;
  created_at: string;
  invite_code: string;
}

export interface DBFellowshipMember {
  id: string;
  fellowship_id: string;
  user_id: string;
  joined_at: string;
  user?: DBUser;
}

// ─── App-level Types ──────────────────────────────────────────────────────────

export interface DailyHabits {
  read: boolean;
  pray: boolean;
  memorise: boolean;
  reflect: boolean;
}

export interface QuestWithLocation extends DBQuest {
  location: DBLotrLocation | null;
}

export interface UserWithProgress extends DBUser {
  progress: DBUserProgress | null;
  todayCompletion: DBDailyCompletion | null;
}

export interface FellowshipMemberDisplay {
  id: string;
  name: string;
  race: Race;
  avatar_id: string;
  streak_count: number;
  today_read: boolean;
  today_pray: boolean;
  today_memorise: boolean;
  today_reflect: boolean;
  xp: number;
  level: number;
}

export interface CampaignData {
  id: string;
  title: string;
  duration_days: number;
  biblical_content: string;
  lotr_arc: string;
  slug: CampaignSlug;
}

export interface LocationData {
  id: string;
  name: string;
  map_x: number;
  map_y: number;
  campaign_id: string;
  unlock_day: number;
  description: string;
  emoji: string;
}

export interface ArtefactData {
  id: string;
  name: string;
  description: string;
  emoji: string;
  unlock_condition: string;
  unlock_value: number;
}

export interface QuestData {
  id: string;
  campaign_id: string;
  day_number: number;
  title: string;
  lotr_location_id: string;
  scripture_ref: string;
  scripture_text: string;
  lore_connection: string;
  reflection_prompt: string;
  xp_reward: number;
  memory_verse: string;
  min_level: number | null;
  level_gate_title: string | null;
  level_gate_description: string | null;
}

// ─── Map Movement ─────────────────────────────────────────────────────────────

export interface MapPosition {
  locationId: string;
  x: number;
  y: number;
}

export interface CharacterMovement {
  from: MapPosition | null;
  to: MapPosition;
  isAnimating: boolean;
}

// ─── Level Gate ───────────────────────────────────────────────────────────────

export interface LevelGateInfo {
  minLevel: number;
  gateTitle: string;
  gateDescription: string;
  /** Human-readable unlock hint e.g. "Reach level 4: Knight of Gondor" */
  unlockHint: string;
  xpRequired: number;
  xpCurrent: number;
}

export interface XPEvent {
  type: HabitType;
  amount: number;
  timestamp: string;
}

export interface StreakData {
  count: number;
  lastActiveDate: string | null;
}

// ─── Race Metadata ────────────────────────────────────────────────────────────

export const RACE_METADATA: Record<Race, { label: string; emoji: string; tagline: string; bonus: string }> = {
  hobbit: {
    label: 'Hobbit',
    emoji: '🧑‍🌾',
    tagline: 'Ordinary courage, hidden calling.',
    bonus: '+10 XP for completing all 4 daily habits',
  },
  elf: {
    label: 'Elf',
    emoji: '🧝',
    tagline: 'Long perspective, contemplative faith.',
    bonus: '+15 XP for reflect habit',
  },
  dwarf: {
    label: 'Dwarf',
    emoji: '⛏️',
    tagline: 'Steadfast labour, loyalty under pressure.',
    bonus: '+10 XP for streak maintenance',
  },
  man: {
    label: 'Man',
    emoji: '👑',
    tagline: 'Leadership, stewardship, fallen yet redeemable.',
    bonus: '+10 XP for fellowship milestones',
  },
};

export const HABIT_XP: Record<HabitType, number> = {
  read: 50,
  pray: 30,
  memorise: 40,
  reflect: 35,
};

export const HABIT_LABELS: Record<HabitType, string> = {
  read: 'Read',
  pray: 'Pray',
  memorise: 'Memorise',
  reflect: 'Reflect',
};

export const HABIT_ICONS: Record<HabitType, string> = {
  read: 'book-open',
  pray: 'hands-praying',
  memorise: 'brain',
  reflect: 'feather',
};
