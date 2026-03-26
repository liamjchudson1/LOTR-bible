# Fellowship of the Word

A Bible study app where progress through Scripture drives a parallel journey through Middle-earth. Read, reflect, pray, memorise — and watch your character travel the map.

## Concept

Every chapter read, every prayer offered, every verse memorised moves your character through Middle-earth. The journey is not arbitrary — the lore maps to the Scripture. The Fellowship campaign walks the New Testament as the fellowship walks to Mordor. The Long Defeat walks Psalms as the Elves walk their long grief.

## Tech Stack

- Expo SDK 52 with Expo Router (file-based routing)
- TypeScript
- Supabase (auth + database)
- React Native SVG (map rendering)
- React Native Reanimated
- AsyncStorage (offline caching)

## Getting Started

### Prerequisites

- Node.js 18+
- Expo CLI
- Supabase account

### Setup

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```

3. Create a Supabase project and run the schema:
   ```bash
   # In your Supabase SQL editor, run:
   # supabase/schema.sql
   # supabase/seed.sql
   ```

4. Create a `.env` file:
   ```
   EXPO_PUBLIC_SUPABASE_URL=your_supabase_url
   EXPO_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

5. Start the app:
   ```bash
   npx expo start
   ```

## App Structure

```
app/
  _layout.tsx          — Root layout with auth provider
  (auth)/
    _layout.tsx
    login.tsx          — Email/password login
    onboarding/
      race.tsx         — Choose your race
      avatar.tsx       — Choose your avatar
      name.tsx         — Set name + campaign
  (tabs)/
    _layout.tsx        — Tab navigator
    index.tsx          — Daily Quest (Home)
    map.tsx            — Middle-earth map
    fellowship.tsx     — Fellowship panel
    profile.tsx        — Character profile

components/            — Reusable UI components
lib/                   — Utilities (supabase, xp, streaks, storage)
data/                  — Campaign, quest, location, artefact data
constants/             — Theme, level definitions
supabase/              — Schema and seed SQL
```

## Campaigns

| Campaign | Duration | Scripture |
|----------|----------|-----------|
| There & Back Again | 365 days | Full Bible |
| The Fellowship | 90 days | New Testament |
| The Long Defeat | 40 days | Psalms & Job |
| Return of the King | 30 days | Revelation |
| Wisdom of Rivendell | 31 days | Proverbs & Ecclesiastes |
| The Ranger's Road | 60 days | Epistles of Paul |

## Races

- **Hobbit** — ordinary courage, hidden calling
- **Elf** — long perspective, contemplative faith
- **Dwarf** — steadfast labour, loyalty under pressure
- **Man** — leadership, stewardship, fallen yet redeemable

## Daily Habits

| Habit | XP |
|-------|-----|
| Read | 50 XP |
| Pray | 30 XP |
| Memorise | 40 XP |
| Reflect/Journal | 35 XP |

## License

Private.
