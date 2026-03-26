import AsyncStorage from '@react-native-async-storage/async-storage';
import { QuestData, DailyHabits, DBUser } from './types';

// ─── Storage Keys ─────────────────────────────────────────────────────────────

const KEYS = {
  TODAY_QUEST: 'today_quest',
  TODAY_HABITS: 'today_habits',
  TODAY_DATE: 'today_date',
  USER_PROFILE: 'user_profile',
  ONBOARDING_COMPLETE: 'onboarding_complete',
  PENDING_XP: 'pending_xp',
} as const;

// ─── Today's Quest (Offline Cache) ───────────────────────────────────────────

export async function cacheTodayQuest(quest: QuestData): Promise<void> {
  try {
    await AsyncStorage.setItem(KEYS.TODAY_QUEST, JSON.stringify(quest));
    await AsyncStorage.setItem(KEYS.TODAY_DATE, new Date().toISOString().split('T')[0]);
  } catch (e) {
    console.warn('Failed to cache today quest:', e);
  }
}

export async function getCachedTodayQuest(): Promise<QuestData | null> {
  try {
    const stored = await AsyncStorage.getItem(KEYS.TODAY_QUEST);
    const storedDate = await AsyncStorage.getItem(KEYS.TODAY_DATE);
    const today = new Date().toISOString().split('T')[0];

    // Cache is stale if it's from a different day
    if (storedDate !== today) {
      await clearTodayCache();
      return null;
    }

    if (!stored) return null;
    return JSON.parse(stored) as QuestData;
  } catch (e) {
    console.warn('Failed to get cached quest:', e);
    return null;
  }
}

export async function clearTodayCache(): Promise<void> {
  try {
    await AsyncStorage.multiRemove([KEYS.TODAY_QUEST, KEYS.TODAY_DATE]);
  } catch (e) {
    console.warn('Failed to clear today cache:', e);
  }
}

// ─── Today's Habits ───────────────────────────────────────────────────────────

export async function saveTodayHabits(habits: DailyHabits): Promise<void> {
  try {
    const data = {
      habits,
      date: new Date().toISOString().split('T')[0],
    };
    await AsyncStorage.setItem(KEYS.TODAY_HABITS, JSON.stringify(data));
  } catch (e) {
    console.warn('Failed to save habits:', e);
  }
}

export async function getTodayHabits(): Promise<DailyHabits | null> {
  try {
    const stored = await AsyncStorage.getItem(KEYS.TODAY_HABITS);
    if (!stored) return null;

    const { habits, date } = JSON.parse(stored) as { habits: DailyHabits; date: string };
    const today = new Date().toISOString().split('T')[0];

    if (date !== today) {
      await AsyncStorage.removeItem(KEYS.TODAY_HABITS);
      return null;
    }

    return habits;
  } catch (e) {
    console.warn('Failed to get habits:', e);
    return null;
  }
}

// ─── User Profile Cache ───────────────────────────────────────────────────────

export async function cacheUserProfile(user: DBUser): Promise<void> {
  try {
    await AsyncStorage.setItem(KEYS.USER_PROFILE, JSON.stringify(user));
  } catch (e) {
    console.warn('Failed to cache user profile:', e);
  }
}

export async function getCachedUserProfile(): Promise<DBUser | null> {
  try {
    const stored = await AsyncStorage.getItem(KEYS.USER_PROFILE);
    if (!stored) return null;
    return JSON.parse(stored) as DBUser;
  } catch (e) {
    console.warn('Failed to get cached user profile:', e);
    return null;
  }
}

// ─── Onboarding ───────────────────────────────────────────────────────────────

export async function setOnboardingComplete(): Promise<void> {
  await AsyncStorage.setItem(KEYS.ONBOARDING_COMPLETE, 'true');
}

export async function isOnboardingComplete(): Promise<boolean> {
  const val = await AsyncStorage.getItem(KEYS.ONBOARDING_COMPLETE);
  return val === 'true';
}

// ─── Pending XP (Offline) ────────────────────────────────────────────────────

export async function addPendingXP(xp: number): Promise<void> {
  try {
    const existing = await AsyncStorage.getItem(KEYS.PENDING_XP);
    const current = existing ? parseInt(existing, 10) : 0;
    await AsyncStorage.setItem(KEYS.PENDING_XP, String(current + xp));
  } catch (e) {
    console.warn('Failed to add pending XP:', e);
  }
}

export async function flushPendingXP(): Promise<number> {
  try {
    const stored = await AsyncStorage.getItem(KEYS.PENDING_XP);
    if (!stored) return 0;
    const xp = parseInt(stored, 10);
    await AsyncStorage.removeItem(KEYS.PENDING_XP);
    return xp;
  } catch (e) {
    console.warn('Failed to flush pending XP:', e);
    return 0;
  }
}

// ─── Clear All ────────────────────────────────────────────────────────────────

export async function clearAllStorage(): Promise<void> {
  try {
    await AsyncStorage.multiRemove(Object.values(KEYS));
  } catch (e) {
    console.warn('Failed to clear storage:', e);
  }
}
