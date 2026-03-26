import { StreakData } from './types';

// ─── Date Utilities ───────────────────────────────────────────────────────────

export function getTodayDateString(): string {
  return new Date().toISOString().split('T')[0]; // YYYY-MM-DD
}

export function getYesterdayDateString(): string {
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  return yesterday.toISOString().split('T')[0];
}

export function isSameDay(date1: string, date2: string): boolean {
  return date1 === date2;
}

// ─── Streak Logic ─────────────────────────────────────────────────────────────

/**
 * Calculate the new streak count based on the last active date.
 * - If last_active_date is today: maintain current streak (already counted)
 * - If last_active_date is yesterday: increment streak
 * - Otherwise: reset to 1 (new streak begins today)
 */
export function calculateNewStreak(currentStreak: number, lastActiveDate: string | null): number {
  if (!lastActiveDate) {
    return 1;
  }

  const today = getTodayDateString();
  const yesterday = getYesterdayDateString();

  if (isSameDay(lastActiveDate, today)) {
    // Already updated today — don't increment
    return currentStreak;
  }

  if (isSameDay(lastActiveDate, yesterday)) {
    // Active yesterday — increment
    return currentStreak + 1;
  }

  // Missed a day — reset
  return 1;
}

export function isStreakAlive(lastActiveDate: string | null): boolean {
  if (!lastActiveDate) return false;
  const today = getTodayDateString();
  const yesterday = getYesterdayDateString();
  return isSameDay(lastActiveDate, today) || isSameDay(lastActiveDate, yesterday);
}

export function streakStatusMessage(streak: number, lastActiveDate: string | null): string {
  if (!lastActiveDate) return 'Begin your journey today.';

  const today = getTodayDateString();
  const yesterday = getYesterdayDateString();

  if (isSameDay(lastActiveDate, today)) {
    return `${streak} day${streak === 1 ? '' : 's'} faithful. Keep going.`;
  }

  if (isSameDay(lastActiveDate, yesterday)) {
    return `${streak} day${streak === 1 ? '' : 's'} — don't break the chain.`;
  }

  return 'Your streak has broken. Begin again.';
}

export function getStreakFromData(data: StreakData): {
  count: number;
  isAlive: boolean;
  message: string;
} {
  const newCount = calculateNewStreak(data.count, data.lastActiveDate);
  const isAlive = isStreakAlive(data.lastActiveDate);
  const message = streakStatusMessage(data.count, data.lastActiveDate);
  return { count: newCount, isAlive, message };
}
