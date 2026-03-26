export interface Level {
  level: number;
  title: string;
  minXP: number;
  maxXP: number;
  description: string;
}

export const LEVELS: Level[] = [
  {
    level: 0,
    title: 'Wanderer',
    minXP: 0,
    maxXP: 199,
    description: 'The road goes ever on. You have taken the first step.',
  },
  {
    level: 1,
    title: 'Hobbit of the Shire',
    minXP: 200,
    maxXP: 499,
    description: 'Comfortable, curious, and more capable than you know.',
  },
  {
    level: 2,
    title: 'Traveller',
    minXP: 500,
    maxXP: 999,
    description: 'The wide world is opening before you.',
  },
  {
    level: 3,
    title: 'Ranger of the North',
    minXP: 1000,
    maxXP: 1999,
    description: 'Patient, watchful, faithful in the unseen work.',
  },
  {
    level: 4,
    title: 'Knight of Gondor',
    minXP: 2000,
    maxXP: 3499,
    description: 'Sworn to service. The City holds because of your faithfulness.',
  },
  {
    level: 5,
    title: 'Rider of Rohan',
    minXP: 3500,
    maxXP: 5499,
    description: 'Swift and strong. You answer the call without hesitation.',
  },
  {
    level: 6,
    title: 'Elf-friend',
    minXP: 5500,
    maxXP: 7999,
    description: 'The ancient songs are known to you. You walk in two worlds.',
  },
  {
    level: 7,
    title: 'Loremaster',
    minXP: 8000,
    maxXP: 11999,
    description: 'Deep in the lore of the ages. Few know what you know.',
  },
  {
    level: 8,
    title: 'White Rider',
    minXP: 12000,
    maxXP: 17999,
    description: 'Returned from beyond. The light of Valinor is in you.',
  },
  {
    level: 9,
    title: 'Ring-bearer',
    minXP: 18000,
    maxXP: 24999,
    description: 'You have carried what no one else could. The weight was real.',
  },
  {
    level: 10,
    title: 'Friend of Ilúvatar',
    minXP: 25000,
    maxXP: Infinity,
    description: 'The music of creation was shaped with you in mind.',
  },
];

export function getLevelForXP(xp: number): Level {
  for (let i = LEVELS.length - 1; i >= 0; i--) {
    if (xp >= LEVELS[i].minXP) {
      return LEVELS[i];
    }
  }
  return LEVELS[0];
}

export function getProgressToNextLevel(xp: number): {
  current: Level;
  next: Level | null;
  progress: number;
  xpIntoLevel: number;
  xpNeeded: number;
} {
  const current = getLevelForXP(xp);
  const next = LEVELS[current.level + 1] ?? null;

  if (!next) {
    return { current, next: null, progress: 1, xpIntoLevel: xp - current.minXP, xpNeeded: 0 };
  }

  const xpIntoLevel = xp - current.minXP;
  const xpNeeded = next.minXP - current.minXP;
  const progress = Math.min(xpIntoLevel / xpNeeded, 1);

  return { current, next, progress, xpIntoLevel, xpNeeded };
}
