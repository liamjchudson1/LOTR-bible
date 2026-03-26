-- ─── Fellowship of the Word — Supabase Schema ────────────────────────────────
-- Run this in the Supabase SQL editor before seeding.

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- ─── Campaigns ───────────────────────────────────────────────────────────────

create table if not exists campaigns (
  id            text primary key,
  title         text not null,
  slug          text not null unique,
  duration_days integer not null,
  biblical_content text not null,
  lotr_arc      text not null,
  is_active     boolean not null default true,
  created_at    timestamptz not null default now()
);

-- ─── LOTR Locations ──────────────────────────────────────────────────────────

create table if not exists lotr_locations (
  id            text primary key,
  name          text not null,
  map_x         numeric not null,
  map_y         numeric not null,
  campaign_id   text not null references campaigns(id) on delete cascade,
  unlock_day    integer not null default 1,
  description   text not null,
  emoji         text not null default '📍',
  created_at    timestamptz not null default now()
);

create index if not exists idx_lotr_locations_campaign on lotr_locations(campaign_id);

-- ─── Quests ──────────────────────────────────────────────────────────────────

create table if not exists quests (
  id                text primary key,
  campaign_id       text not null references campaigns(id) on delete cascade,
  day_number        integer not null,
  title             text not null,
  lotr_location_id  text references lotr_locations(id),
  scripture_ref     text not null,
  scripture_text    text not null,
  lore_connection   text not null,
  reflection_prompt text not null,
  xp_reward             integer not null default 155,
  memory_verse          text not null default '',
  -- Level gate: null = no requirement; integer = minimum user level
  min_level             integer,
  level_gate_title      text,
  level_gate_description text,
  created_at            timestamptz not null default now(),
  unique (campaign_id, day_number),
  -- Ensure level gate fields are always supplied together
  constraint level_gate_complete check (
    (min_level is null) or
    (min_level is not null and level_gate_title is not null and level_gate_description is not null)
  )
);

create index if not exists idx_quests_campaign on quests(campaign_id);
create index if not exists idx_quests_day on quests(campaign_id, day_number);

-- ─── Fellowships ─────────────────────────────────────────────────────────────

create table if not exists fellowships (
  id            uuid primary key default uuid_generate_v4(),
  name          text not null,
  created_by    uuid not null,
  campaign_id   text references campaigns(id),
  created_at    timestamptz not null default now(),
  invite_code   text not null unique default upper(substring(md5(random()::text), 1, 6))
);

-- ─── Users ───────────────────────────────────────────────────────────────────

create table if not exists users (
  id                uuid primary key references auth.users(id) on delete cascade,
  email             text not null,
  name              text not null default '',
  race              text not null default 'hobbit' check (race in ('hobbit', 'elf', 'dwarf', 'man')),
  avatar_id         text not null default 'avatar-1',
  level             integer not null default 0,
  xp                integer not null default 0,
  streak_count      integer not null default 0,
  last_active_date  date,
  fellowship_id     uuid references fellowships(id) on delete set null,
  campaign_id       text references campaigns(id) on delete set null,
  created_at        timestamptz not null default now()
);

-- ─── Fellowship Members ───────────────────────────────────────────────────────

create table if not exists fellowship_members (
  id             uuid primary key default uuid_generate_v4(),
  fellowship_id  uuid not null references fellowships(id) on delete cascade,
  user_id        uuid not null references users(id) on delete cascade,
  joined_at      timestamptz not null default now(),
  unique (fellowship_id, user_id)
);

create index if not exists idx_fellowship_members_fellowship on fellowship_members(fellowship_id);
create index if not exists idx_fellowship_members_user on fellowship_members(user_id);

-- ─── User Progress ────────────────────────────────────────────────────────────

create table if not exists user_progress (
  id            uuid primary key default uuid_generate_v4(),
  user_id       uuid not null references users(id) on delete cascade,
  campaign_id   text not null references campaigns(id) on delete cascade,
  current_day   integer not null default 1,
  started_at    timestamptz not null default now(),
  completed_at  timestamptz,
  unique (user_id, campaign_id)
);

create index if not exists idx_user_progress_user on user_progress(user_id);

-- ─── Daily Completions ────────────────────────────────────────────────────────

create table if not exists daily_completions (
  id             uuid primary key default uuid_generate_v4(),
  user_id        uuid not null references users(id) on delete cascade,
  quest_id       text not null references quests(id) on delete cascade,
  date           date not null,
  read_done      boolean not null default false,
  pray_done      boolean not null default false,
  memorise_done  boolean not null default false,
  reflect_done   boolean not null default false,
  xp_earned      integer not null default 0,
  created_at     timestamptz not null default now(),
  unique (user_id, quest_id, date)
);

create index if not exists idx_daily_completions_user on daily_completions(user_id);
create index if not exists idx_daily_completions_date on daily_completions(user_id, date);

-- ─── Journal Entries ──────────────────────────────────────────────────────────

create table if not exists journal_entries (
  id          uuid primary key default uuid_generate_v4(),
  user_id     uuid not null references users(id) on delete cascade,
  quest_id    text not null references quests(id) on delete cascade,
  date        date not null,
  body        text not null default '',
  created_at  timestamptz not null default now(),
  unique (user_id, quest_id, date)
);

create index if not exists idx_journal_entries_user on journal_entries(user_id);

-- ─── Artefacts ────────────────────────────────────────────────────────────────

create table if not exists artefacts (
  id                text primary key,
  name              text not null,
  description       text not null,
  emoji             text not null,
  unlock_condition  text not null,
  unlock_value      integer not null default 1,
  created_at        timestamptz not null default now()
);

-- ─── User Artefacts ───────────────────────────────────────────────────────────

create table if not exists user_artefacts (
  id           uuid primary key default uuid_generate_v4(),
  user_id      uuid not null references users(id) on delete cascade,
  artefact_id  text not null references artefacts(id) on delete cascade,
  earned_at    timestamptz not null default now(),
  unique (user_id, artefact_id)
);

create index if not exists idx_user_artefacts_user on user_artefacts(user_id);

-- ─── Row Level Security ───────────────────────────────────────────────────────

alter table users enable row level security;
alter table user_progress enable row level security;
alter table daily_completions enable row level security;
alter table journal_entries enable row level security;
alter table user_artefacts enable row level security;
alter table fellowships enable row level security;
alter table fellowship_members enable row level security;
alter table campaigns enable row level security;
alter table quests enable row level security;
alter table lotr_locations enable row level security;
alter table artefacts enable row level security;

-- Users: read own, write own
create policy "users_select_own" on users for select using (auth.uid() = id);
create policy "users_insert_own" on users for insert with check (auth.uid() = id);
create policy "users_update_own" on users for update using (auth.uid() = id);

-- Users: fellowship members can see each other
create policy "users_select_fellowship" on users for select using (
  fellowship_id is not null and
  fellowship_id in (
    select fellowship_id from fellowship_members where user_id = auth.uid()
  )
);

-- User progress
create policy "progress_own" on user_progress for all using (auth.uid() = user_id);

-- Daily completions
create policy "completions_own" on daily_completions for all using (auth.uid() = user_id);

-- Fellowship members can see each other's completions (for fellowship panel)
create policy "completions_fellowship" on daily_completions for select using (
  user_id in (
    select fm2.user_id from fellowship_members fm1
    join fellowship_members fm2 on fm1.fellowship_id = fm2.fellowship_id
    where fm1.user_id = auth.uid()
  )
);

-- Journal entries: private
create policy "journal_own" on journal_entries for all using (auth.uid() = user_id);

-- User artefacts
create policy "artefacts_own" on user_artefacts for all using (auth.uid() = user_id);

-- Fellowships: members can read
create policy "fellowships_read" on fellowships for select using (
  id in (select fellowship_id from fellowship_members where user_id = auth.uid())
  or created_by = auth.uid()
);
create policy "fellowships_insert" on fellowships for insert with check (auth.uid() = created_by);

-- Fellowship members
create policy "fellowship_members_read" on fellowship_members for select using (
  fellowship_id in (select fellowship_id from fellowship_members where user_id = auth.uid())
);
create policy "fellowship_members_insert" on fellowship_members for insert with check (auth.uid() = user_id);
create policy "fellowship_members_delete" on fellowship_members for delete using (auth.uid() = user_id);

-- Public read for campaigns, quests, locations, artefacts
create policy "campaigns_read" on campaigns for select using (true);
create policy "quests_read" on quests for select using (true);
create policy "locations_read" on lotr_locations for select using (true);
create policy "artefacts_read" on artefacts for select using (true);

-- ─── Handle New User Trigger ──────────────────────────────────────────────────

create or replace function handle_new_user()
returns trigger as $$
begin
  insert into public.users (id, email)
  values (new.id, new.email)
  on conflict (id) do nothing;
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure handle_new_user();
