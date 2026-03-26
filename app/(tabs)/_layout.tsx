import React from 'react';
import { Tabs } from 'expo-router';
import { View, Text, StyleSheet } from 'react-native';
import { colors, typography } from '../../constants/theme';

interface TabIconProps {
  emoji: string;
  label: string;
  focused: boolean;
}

function TabIcon({ emoji, label, focused }: TabIconProps) {
  return (
    <View style={styles.tabIcon}>
      <Text style={[styles.tabEmoji, focused && styles.tabEmojiActive]}>{emoji}</Text>
      <Text style={[styles.tabLabel, focused && styles.tabLabelActive]}>{label}</Text>
    </View>
  );
}

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: styles.tabBar,
        tabBarShowLabel: false,
        tabBarActiveTintColor: colors.gold,
        tabBarInactiveTintColor: colors.parchmentMuted,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Quest',
          tabBarIcon: ({ focused }) => (
            <TabIcon emoji="📖" label="Quest" focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="map"
        options={{
          title: 'Map',
          tabBarIcon: ({ focused }) => (
            <TabIcon emoji="🗺️" label="Map" focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="fellowship"
        options={{
          title: 'Fellowship',
          tabBarIcon: ({ focused }) => (
            <TabIcon emoji="⚔️" label="Fellowship" focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ focused }) => (
            <TabIcon emoji="🧝" label="Profile" focused={focused} />
          ),
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: colors.surface,
    borderTopColor: colors.border,
    borderTopWidth: 1,
    height: 72,
    paddingBottom: 8,
    paddingTop: 8,
  },
  tabIcon: {
    alignItems: 'center',
    gap: 2,
  },
  tabEmoji: {
    fontSize: 22,
    opacity: 0.5,
  },
  tabEmojiActive: {
    opacity: 1,
  },
  tabLabel: {
    fontSize: 10,
    color: colors.parchmentMuted,
    fontWeight: typography.medium,
  },
  tabLabelActive: {
    color: colors.gold,
    fontWeight: typography.semibold,
  },
});
