import { HabitType, Race, DailyHabits, HABIT_XP } from './types';
import { getLevelForXP } from '../constants/levels';

// ─── XP Calculation ───────────────────────────────────────────────────────────

export function calculateHabitXP(habit: HabitType, race: Race): number {
  const base = HABIT_XP[habit];

  // Race bonuses
  if (race === 'elf' && habit === 'reflect') {
    return base + 15;
  }

  return base;
}

export function calculateDayXP(habits: DailyHabits, race: Race): number {
  let total = 0;
  const habitTypes: HabitType[] = ['read', 'pray', 'memorise', 'reflect'];

  for (const habit of habitTypes) {
    if (habits[habit]) {
      total += calculateHabitXP(habit, race);
    }
  }

  // Hobbit bonus: +10 XP for completing all 4 habits
  if (race === 'hobbit') {
    const allDone = habitTypes.every((h) => habits[h]);
    if (allDone) total += 10;
  }

  return total;
}

export function calculateStreakBonus(streakCount: number, race: Race): number {
  let bonus = 0;

  // Dwarf bonus: +10 XP for maintaining streak
  if (race === 'dwarf' && streakCount > 1) {
    bonus += 10;
  }

  return bonus;
}

export function calculateFellowshipBonus(race: Race): number {
  // Man bonus: +10 XP for fellowship milestones
  if (race === 'man') {
    return 10;
  }
  return 0;
}

export function didLevelUp(oldXP: number, newXP: number): boolean {
  const oldLevel = getLevelForXP(oldXP);
  const newLevel = getLevelForXP(newXP);
  return newLevel.level > oldLevel.level;
}

export function habitsDoneCount(habits: DailyHabits): number {
  return Object.values(habits).filter(Boolean).length;
}

export function habitsToXPBreakdown(
  habits: DailyHabits,
  race: Race
): Array<{ habit: HabitType; xp: number }> {
  const habitTypes: HabitType[] = ['read', 'pray', 'memorise', 'reflect'];
  return habitTypes
    .filter((h) => habits[h])
    .map((h) => ({ habit: h, xp: calculateHabitXP(h, race) }));
}
