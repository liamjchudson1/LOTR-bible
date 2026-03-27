import 'react-native-url-polyfill/auto';
import { createClient } from '@supabase/supabase-js';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

// ─── Secure Storage Adapter ───────────────────────────────────────────────────

const ExpoSecureStoreAdapter = {
  getItem: (key: string) => {
    return SecureStore.getItemAsync(key);
  },
  setItem: (key: string, value: string) => {
    SecureStore.setItemAsync(key, value);
  },
  removeItem: (key: string) => {
    SecureStore.deleteItemAsync(key);
  },
};

// ─── Supabase Client ──────────────────────────────────────────────────────────

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL ?? '';
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? '';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: Platform.OS === 'web' ? undefined : ExpoSecureStoreAdapter,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: Platform.OS === 'web',
  },
});

// ─── Auth Helpers ─────────────────────────────────────────────────────────────

export async function signIn(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw error;
  return data;
}

export async function signUp(email: string, password: string) {
  const { data, error } = await supabase.auth.signUp({ email, password });
  if (error) throw error;
  return data;
}

export async function signOut() {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}

export async function getCurrentUser() {
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();
  if (error) throw error;
  return user;
}

// ─── Database Helpers ─────────────────────────────────────────────────────────

export async function getUserProfile(userId: string) {
  const { data, error } = await supabase.from('users').select('*').eq('id', userId).single();
  if (error) throw error;
  return data;
}

export async function upsertUserProfile(profile: {
  id: string;
  email: string;
  name?: string;
  race?: string;
  avatar_id?: string;
  campaign_id?: string;
}) {
  const { data, error } = await supabase.from('users').upsert(profile).select().single();
  if (error) throw error;
  return data;
}

export async function getTodayCompletion(userId: string, questId: string, date: string) {
  const { data, error } = await supabase
    .from('daily_completions')
    .select('*')
    .eq('user_id', userId)
    .eq('quest_id', questId)
    .eq('date', date)
    .maybeSingle();
  if (error) throw error;
  return data;
}

export async function upsertDailyCompletion(completion: {
  user_id: string;
  quest_id: string;
  date: string;
  read_done: boolean;
  pray_done: boolean;
  memorise_done: boolean;
  reflect_done: boolean;
  xp_earned: number;
}) {
  const { data, error } = await supabase
    .from('daily_completions')
    .upsert(completion, { onConflict: 'user_id,quest_id,date' })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function updateUserXPAndStreak(
  userId: string,
  xp: number,
  streak_count: number,
  last_active_date: string
) {
  const { data, error } = await supabase
    .from('users')
    .update({ xp, streak_count, last_active_date })
    .eq('id', userId)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function getCampaignQuest(campaignId: string, dayNumber: number) {
  const { data, error } = await supabase
    .from('quests')
    .select('*, lotr_locations(*)')
    .eq('campaign_id', campaignId)
    .eq('day_number', dayNumber)
    .maybeSingle();
  if (error) throw error;
  return data;
}

export async function getUserProgress(userId: string, campaignId: string) {
  const { data, error } = await supabase
    .from('user_progress')
    .select('*')
    .eq('user_id', userId)
    .eq('campaign_id', campaignId)
    .maybeSingle();
  if (error) throw error;
  return data;
}

export async function startCampaign(userId: string, campaignId: string) {
  const { data, error } = await supabase
    .from('user_progress')
    .upsert(
      { user_id: userId, campaign_id: campaignId, current_day: 1, started_at: new Date().toISOString() },
      { onConflict: 'user_id,campaign_id' }
    )
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function getFellowshipMembers(fellowshipId: string) {
  const { data, error } = await supabase
    .from('fellowship_members')
    .select('*, users(*)')
    .eq('fellowship_id', fellowshipId);
  if (error) throw error;
  return data;
}

export async function getUserArtefacts(userId: string) {
  const { data, error } = await supabase
    .from('user_artefacts')
    .select('*, artefacts(*)')
    .eq('user_id', userId);
  if (error) throw error;
  return data;
}

export async function saveJournalEntry(entry: {
  user_id: string;
  quest_id: string;
  date: string;
  body: string;
}) {
  const { data, error } = await supabase
    .from('journal_entries')
    .upsert({ ...entry, created_at: new Date().toISOString() }, { onConflict: 'user_id,quest_id,date' })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function getJournalEntry(
  userId: string,
  questId: string,
  date: string,
): Promise<string | null> {
  const { data, error } = await supabase
    .from('journal_entries')
    .select('body')
    .eq('user_id', userId)
    .eq('quest_id', questId)
    .eq('date', date)
    .maybeSingle();
  if (error) throw error;
  return data?.body ?? null;
}

// ─── Artefact Unlocking ───────────────────────────────────────────────────────

export async function getTotalCompletedHabits(userId: string): Promise<number> {
  const { data, error } = await supabase
    .from('daily_completions')
    .select('read_done, pray_done, memorise_done, reflect_done')
    .eq('user_id', userId);
  if (error) throw error;
  if (!data) return 0;
  return data.reduce((sum, row) => {
    return (
      sum +
      (row.read_done ? 1 : 0) +
      (row.pray_done ? 1 : 0) +
      (row.memorise_done ? 1 : 0) +
      (row.reflect_done ? 1 : 0)
    );
  }, 0);
}

export async function getCompletedCampaignIds(userId: string): Promise<string[]> {
  const { data, error } = await supabase
    .from('user_progress')
    .select('campaign_id')
    .eq('user_id', userId)
    .not('completed_at', 'is', null);
  if (error) throw error;
  return (data ?? []).map((r) => r.campaign_id);
}

/**
 * Checks all artefact unlock conditions against the provided stats, awards any
 * newly-earned artefacts, and returns the IDs of what was just unlocked.
 * Safe to call repeatedly — already-earned artefacts are skipped.
 */
export async function checkAndAwardArtefacts(
  userId: string,
  stats: {
    streakCount: number;
    xp: number;
    level: number;
    totalHabits: number;
    completedCampaignIds: string[];
    fellowshipWeekActive: boolean;
  },
): Promise<string[]> {
  // Load all artefacts and what the user already has
  const [{ data: allArts, error: e1 }, { data: earnedArts, error: e2 }] = await Promise.all([
    supabase.from('artefacts').select('id, unlock_condition, unlock_value'),
    supabase.from('user_artefacts').select('artefact_id').eq('user_id', userId),
  ]);
  if (e1 || e2) return [];

  const earnedIds = new Set((earnedArts ?? []).map((r) => r.artefact_id));
  const toAward: string[] = [];

  for (const art of allArts ?? []) {
    if (earnedIds.has(art.id)) continue;

    let qualifies = false;
    switch (art.unlock_condition) {
      case 'streak':
        qualifies = stats.streakCount >= art.unlock_value;
        break;
      case 'level':
        qualifies = stats.level >= art.unlock_value;
        break;
      case 'total_habits':
        qualifies = stats.totalHabits >= art.unlock_value;
        break;
      case 'complete_campaign':
        qualifies = stats.completedCampaignIds.includes('the-long-defeat');
        break;
      case 'complete_any_campaign':
        qualifies = stats.completedCampaignIds.length >= 1;
        break;
      case 'all_campaigns':
        qualifies = stats.completedCampaignIds.length >= art.unlock_value;
        break;
      case 'fellowship_week':
        qualifies = stats.fellowshipWeekActive;
        break;
    }

    if (qualifies) toAward.push(art.id);
  }

  if (toAward.length === 0) return [];

  const { error: insertError } = await supabase.from('user_artefacts').insert(
    toAward.map((artefact_id) => ({ user_id: userId, artefact_id })),
  );
  if (insertError) return [];

  return toAward;
}
