import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { router } from 'expo-router';
import { signIn, signUp } from '../../lib/supabase';
import { colors, typography, spacing, radius, shadows } from '../../constants/theme';

type Mode = 'signin' | 'signup';

export default function LoginScreen() {
  const [mode, setMode] = useState<Mode>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  async function handleSubmit() {
    const trimmedEmail = email.trim().toLowerCase();
    if (!trimmedEmail || !password) {
      Alert.alert('Missing fields', 'Please enter your email and password.');
      return;
    }
    if (password.length < 6) {
      Alert.alert('Password too short', 'Password must be at least 6 characters.');
      return;
    }

    setIsLoading(true);
    try {
      if (mode === 'signin') {
        await signIn(trimmedEmail, password);
        // Navigation handled by _layout auth listener
      } else {
        await signUp(trimmedEmail, password);
        Alert.alert(
          'Check your email',
          'We sent you a confirmation link. After confirming, come back and sign in.',
          [{ text: 'OK', onPress: () => setMode('signin') }]
        );
      }
    } catch (err: any) {
      Alert.alert(
        mode === 'signin' ? 'Sign in failed' : 'Sign up failed',
        err?.message ?? 'Something went wrong. Please try again.'
      );
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <KeyboardAvoidingView
      style={styles.root}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Wordmark / logo */}
        <View style={styles.header}>
          <Text style={styles.logoEmoji}>📖</Text>
          <Text style={styles.appName}>Fellowship of the Word</Text>
          <Text style={styles.tagline}>
            Read. Pray. Memorise. Reflect.{'\n'}Walk the road to Mordor.
          </Text>
        </View>

        {/* Form card */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>
            {mode === 'signin' ? 'Welcome back' : 'Begin your journey'}
          </Text>

          <View style={styles.fieldGroup}>
            <Text style={styles.label}>Email</Text>
            <TextInput
              style={styles.input}
              value={email}
              onChangeText={setEmail}
              placeholder="you@example.com"
              placeholderTextColor={colors.parchmentMuted + '60'}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              returnKeyType="next"
            />
          </View>

          <View style={styles.fieldGroup}>
            <Text style={styles.label}>Password</Text>
            <TextInput
              style={styles.input}
              value={password}
              onChangeText={setPassword}
              placeholder="••••••••"
              placeholderTextColor={colors.parchmentMuted + '60'}
              secureTextEntry
              returnKeyType="done"
              onSubmitEditing={handleSubmit}
            />
          </View>

          <TouchableOpacity
            style={[styles.submitButton, isLoading && styles.submitButtonDisabled]}
            onPress={handleSubmit}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color={colors.background} size="small" />
            ) : (
              <Text style={styles.submitText}>
                {mode === 'signin' ? 'Sign In' : 'Create Account'}
              </Text>
            )}
          </TouchableOpacity>
        </View>

        {/* Mode toggle */}
        <View style={styles.toggleRow}>
          <Text style={styles.toggleText}>
            {mode === 'signin' ? "Don't have an account? " : 'Already on the road? '}
          </Text>
          <TouchableOpacity onPress={() => setMode(mode === 'signin' ? 'signup' : 'signin')}>
            <Text style={styles.toggleLink}>
              {mode === 'signin' ? 'Sign up' : 'Sign in'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Flavour quote */}
        <View style={styles.quoteContainer}>
          <Text style={styles.quote}>
            "The road goes ever on and on,{'\n'}down from the door where it began."
          </Text>
          <Text style={styles.quoteAttrib}>— J.R.R. Tolkien</Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scroll: {
    flexGrow: 1,
    padding: spacing.xl,
    justifyContent: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: spacing['2xl'],
  },
  logoEmoji: {
    fontSize: 48,
    marginBottom: spacing.sm,
  },
  appName: {
    fontSize: typography['2xl'],
    fontWeight: typography.bold,
    color: colors.gold,
    textAlign: 'center',
    letterSpacing: 0.5,
    marginBottom: spacing.sm,
  },
  tagline: {
    fontSize: typography.sm,
    color: colors.parchmentMuted,
    textAlign: 'center',
    lineHeight: 22,
  },
  card: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    padding: spacing.xl,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.md,
    marginBottom: spacing.xl,
  },
  cardTitle: {
    fontSize: typography.lg,
    fontWeight: typography.bold,
    color: colors.parchment,
    marginBottom: spacing.lg,
  },
  fieldGroup: {
    marginBottom: spacing.base,
  },
  label: {
    fontSize: typography.sm,
    fontWeight: typography.medium,
    color: colors.parchmentMuted,
    marginBottom: spacing.xs,
    letterSpacing: 0.3,
  },
  input: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.md,
    fontSize: typography.base,
    color: colors.parchment,
  },
  submitButton: {
    backgroundColor: colors.gold,
    borderRadius: radius.md,
    paddingVertical: spacing.md,
    alignItems: 'center',
    marginTop: spacing.sm,
    ...shadows.gold,
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitText: {
    fontSize: typography.base,
    fontWeight: typography.bold,
    color: colors.background,
    letterSpacing: 0.5,
  },
  toggleRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'baseline',
    marginBottom: spacing['2xl'],
  },
  toggleText: {
    fontSize: typography.sm,
    color: colors.parchmentMuted,
  },
  toggleLink: {
    fontSize: typography.sm,
    color: colors.gold,
    fontWeight: typography.semibold,
  },
  quoteContainer: {
    alignItems: 'center',
    opacity: 0.6,
  },
  quote: {
    fontSize: typography.sm,
    color: colors.parchmentMuted,
    fontStyle: 'italic',
    textAlign: 'center',
    lineHeight: 22,
  },
  quoteAttrib: {
    fontSize: typography.xs,
    color: colors.parchmentMuted,
    marginTop: spacing.xs,
  },
});
