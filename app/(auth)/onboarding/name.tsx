import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { router } from 'expo-router';
import { useAuth } from '../../_layout';
import { upsertUserProfile, startCampaign } from '../../../lib/supabase';
import { colors, typography, spacing, radius, shadows } from '../../../constants/theme';
import campaignsData from '../../../data/campaigns.json';
import { CampaignData } from '../../../lib/types';

const campaigns = campaignsData as CampaignData[];

export default function NameScreen() {
  const { session, refreshUser } = useAuth();
  const [name, setName] = useState('');
  const [selectedCampaign, setSelectedCampaign] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  async function handleBegin() {
    if (!name.trim() || !selectedCampaign || !session?.user) return;

    const trimmedName = name.trim();
    if (trimmedName.length < 2) {
      Alert.alert('Name too short', 'Your name must be at least 2 characters.');
      return;
    }
    if (trimmedName.length > 30) {
      Alert.alert('Name too long', 'Your name must be 30 characters or fewer.');
      return;
    }

    setIsLoading(true);
    try {
      await upsertUserProfile({
        id: session.user.id,
        email: session.user.email ?? '',
        name: trimmedName,
        campaign_id: selectedCampaign,
      });
      await startCampaign(session.user.id, selectedCampaign);
      await refreshUser();
      router.replace('/(tabs)');
    } catch (e: any) {
      Alert.alert('Error', e?.message ?? 'Failed to save. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <SafeAreaView style={styles.root}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.step}>Step 3 of 3</Text>
            <Text style={styles.title}>Name & Campaign</Text>
            <Text style={styles.subtitle}>
              What shall you be called? And which road calls you first?
            </Text>
          </View>

          {/* Name input */}
          <View style={styles.fieldGroup}>
            <Text style={styles.label}>Your Name</Text>
            <TextInput
              style={styles.input}
              value={name}
              onChangeText={setName}
              placeholder="e.g. Frodo, Aragorn, Éowyn..."
              placeholderTextColor={colors.parchmentMuted + '50'}
              maxLength={30}
              autoCapitalize="words"
              returnKeyType="done"
            />
            <Text style={styles.charCount}>{name.length}/30</Text>
          </View>

          {/* Campaign selection */}
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Choose a Campaign</Text>
            <Text style={styles.sectionSubtitle}>You can join others later.</Text>
          </View>

          <View style={styles.campaignList}>
            {campaigns.map((campaign) => {
              const isSelected = selectedCampaign === campaign.id;
              return (
                <TouchableOpacity
                  key={campaign.id}
                  style={[styles.campaignCard, isSelected && styles.campaignCardSelected]}
                  onPress={() => setSelectedCampaign(campaign.id)}
                  activeOpacity={0.75}
                >
                  <View style={styles.campaignTop}>
                    <View style={styles.campaignMeta}>
                      <Text style={[styles.campaignTitle, isSelected && styles.campaignTitleSelected]}>
                        {campaign.title}
                      </Text>
                      <View style={styles.durationBadge}>
                        <Text style={styles.durationText}>{campaign.duration_days} days</Text>
                      </View>
                    </View>
                    <View style={[styles.radioOuter, isSelected && styles.radioOuterSelected]}>
                      {isSelected && <View style={styles.radioInner} />}
                    </View>
                  </View>
                  <Text style={styles.campaignBiblical}>{campaign.biblical_content}</Text>
                  <Text style={styles.campaignArc} numberOfLines={2}>
                    {campaign.lotr_arc}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Begin */}
          <TouchableOpacity
            style={[
              styles.beginButton,
              (!name.trim() || !selectedCampaign || isLoading) && styles.beginButtonDisabled,
            ]}
            onPress={handleBegin}
            disabled={!name.trim() || !selectedCampaign || isLoading}
          >
            <Text style={styles.beginText}>
              {isLoading ? 'Preparing your journey...' : 'Begin the Journey ✦'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <Text style={styles.backText}>← Back</Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scroll: {
    padding: spacing.xl,
    paddingBottom: spacing['4xl'],
  },
  header: {
    marginBottom: spacing.xl,
  },
  step: {
    fontSize: typography.xs,
    color: colors.gold,
    fontWeight: typography.semibold,
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginBottom: spacing.sm,
  },
  title: {
    fontSize: typography['2xl'],
    fontWeight: typography.bold,
    color: colors.parchment,
    marginBottom: spacing.sm,
  },
  subtitle: {
    fontSize: typography.base,
    color: colors.parchmentMuted,
    lineHeight: 24,
  },
  fieldGroup: {
    marginBottom: spacing.xl,
  },
  label: {
    fontSize: typography.sm,
    fontWeight: typography.medium,
    color: colors.parchmentMuted,
    marginBottom: spacing.xs,
    letterSpacing: 0.3,
  },
  input: {
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.md,
    fontSize: typography.lg,
    color: colors.parchment,
    fontWeight: typography.medium,
  },
  charCount: {
    fontSize: typography.xs,
    color: colors.parchmentMuted,
    textAlign: 'right',
    marginTop: spacing.xs,
    opacity: 0.6,
  },
  sectionHeader: {
    marginBottom: spacing.md,
  },
  sectionTitle: {
    fontSize: typography.md,
    fontWeight: typography.bold,
    color: colors.parchment,
    marginBottom: 4,
  },
  sectionSubtitle: {
    fontSize: typography.sm,
    color: colors.parchmentMuted,
  },
  campaignList: {
    gap: spacing.sm,
    marginBottom: spacing.xl,
  },
  campaignCard: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.base,
    ...shadows.sm,
  },
  campaignCardSelected: {
    borderColor: colors.gold,
    backgroundColor: colors.gold + '08',
  },
  campaignTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.sm,
  },
  campaignMeta: {
    flex: 1,
    gap: 4,
  },
  campaignTitle: {
    fontSize: typography.base,
    fontWeight: typography.bold,
    color: colors.parchmentMuted,
  },
  campaignTitleSelected: {
    color: colors.gold,
  },
  durationBadge: {
    alignSelf: 'flex-start',
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: colors.border,
  },
  durationText: {
    fontSize: typography.xs,
    color: colors.parchmentMuted,
  },
  campaignBiblical: {
    fontSize: typography.sm,
    color: colors.elvish,
    fontWeight: typography.medium,
    marginBottom: 4,
  },
  campaignArc: {
    fontSize: typography.sm,
    color: colors.parchmentMuted,
    lineHeight: 20,
    fontStyle: 'italic',
  },
  radioOuter: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: colors.border,
    justifyContent: 'center',
    alignItems: 'center',
    flexShrink: 0,
  },
  radioOuterSelected: {
    borderColor: colors.gold,
  },
  radioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.gold,
  },
  beginButton: {
    backgroundColor: colors.gold,
    borderRadius: radius.md,
    paddingVertical: spacing.md,
    alignItems: 'center',
    marginBottom: spacing.md,
    ...shadows.gold,
  },
  beginButtonDisabled: {
    opacity: 0.4,
  },
  beginText: {
    fontSize: typography.base,
    fontWeight: typography.bold,
    color: colors.background,
    letterSpacing: 0.5,
  },
  backButton: {
    alignItems: 'center',
    padding: spacing.sm,
  },
  backText: {
    fontSize: typography.sm,
    color: colors.parchmentMuted,
  },
});
