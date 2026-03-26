import React, { createContext, useContext, useEffect, useState } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { Stack, router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import { DBUser } from '../lib/types';
import { getUserProfile, upsertUserProfile } from '../lib/supabase';
import { cacheUserProfile, getCachedUserProfile } from '../lib/storage';
import { colors } from '../constants/theme';

// ─── Auth Context ─────────────────────────────────────────────────────────────

interface AuthContextValue {
  session: Session | null;
  user: DBUser | null;
  isLoading: boolean;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue>({
  session: null,
  user: null,
  isLoading: true,
  refreshUser: async () => {},
});

export function useAuth() {
  return useContext(AuthContext);
}

// ─── Root Layout ──────────────────────────────────────────────────────────────

export default function RootLayout() {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<DBUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  async function loadUser(authUser: User) {
    try {
      const profile = await getUserProfile(authUser.id);
      setUser(profile);
      await cacheUserProfile(profile);
    } catch {
      // Fall back to cached profile (offline)
      const cached = await getCachedUserProfile();
      if (cached) setUser(cached);
      else {
        // New user — create minimal profile
        try {
          const created = await upsertUserProfile({
            id: authUser.id,
            email: authUser.email ?? '',
          });
          setUser(created);
        } catch (e) {
          console.error('Failed to create user profile:', e);
        }
      }
    }
  }

  async function refreshUser() {
    if (!session?.user) return;
    await loadUser(session.user);
  }

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session: s } }) => {
      setSession(s);
      if (s?.user) {
        loadUser(s.user).finally(() => setIsLoading(false));
      } else {
        setIsLoading(false);
      }
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, s) => {
      setSession(s);
      if (s?.user) {
        loadUser(s.user);
      } else {
        setUser(null);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  // Route guard based on auth state
  useEffect(() => {
    if (isLoading) return;

    if (!session) {
      router.replace('/(auth)/login');
      return;
    }

    // Check onboarding complete (user has name + race set)
    if (user && (!user.name || user.name === '' || !user.campaign_id)) {
      // Determine which onboarding step
      if (!user.race || user.race === 'hobbit') {
        router.replace('/(auth)/onboarding/race');
      } else if (!user.name) {
        router.replace('/(auth)/onboarding/name');
      } else {
        router.replace('/(auth)/onboarding/name');
      }
      return;
    }

    if (session && user?.name && user?.campaign_id) {
      router.replace('/(tabs)');
    }
  }, [session, user, isLoading]);

  if (isLoading) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator color={colors.gold} size="large" />
      </View>
    );
  }

  return (
    <AuthContext.Provider value={{ session, user, isLoading, refreshUser }}>
      <GestureHandlerRootView style={styles.root}>
        <StatusBar style="light" />
        <Stack screenOptions={{ headerShown: false, animation: 'fade' }}>
          <Stack.Screen name="(auth)" options={{ headerShown: false }} />
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        </Stack>
      </GestureHandlerRootView>
    </AuthContext.Provider>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.background,
  },
  loading: {
    flex: 1,
    backgroundColor: colors.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
