import { Tabs } from 'expo-router';
import React from 'react';

import { HapticTab } from '@/components/haptic-tab';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

/**
 * Home is the only tab.
 *
 * Explore and Games were removed on 2026-09-05. Neither had a backend: there is
 * no discovery endpoint behind Explore (GAP-EVT-10) and no games API behind
 * Games, whose event-specific screen ended in an "unavailable" alert
 * (GAP-PLAN-09). A tab bar is a promise about what the product does, and two
 * thirds of this one were promising nothing.
 *
 * They are removed rather than finished because finishing them is months of
 * backend work and App Review rejects visible non-functional surface. The
 * register sequences this first, as Gate 1: remove misleading surface area.
 */
export default function TabLayout() {
  const colorScheme = useColorScheme();

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: Colors[colorScheme ?? 'light'].tint,
        headerShown: false,
        tabBarButton: HapticTab,
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color }) => <IconSymbol size={28} name="house.fill" color={color} />,
        }}
      />
    </Tabs>
  );
}
