/**
 * The tab bar button, with a soft haptic on press-in for iOS.
 *
 * Both the component and its prop type come from expo-router's vendored copy
 * of React Navigation, not from the standalone `@react-navigation/*` packages.
 *
 * SDK 57 vendors bottom-tabs and elements inside expo-router, and the two
 * copies are no longer structurally compatible: expo-router types `pressColor`
 * and `hoverEffect.color` as React Native's `ColorValue`, which admits the
 * opaque handle from `PlatformColor`, while the standalone copy still says
 * `string`. Since it is expo-router's `Tabs` that invokes this through
 * `screenOptions.tabBarButton`, expo-router's types describe what actually
 * arrives, and its `PlatformPressable` is what actually accepts them. Mixing
 * the two was the whole source of the mismatch.
 *
 * The imports reach into `build/` because expo-router publishes no `exports`
 * map and no public re-export of either. That is deliberate and narrow: the
 * module is plain CommonJS with a named `PlatformPressable` export, and if a
 * later SDK moves it this fails at compile time rather than drifting silently.
 */

import * as Haptics from 'expo-haptics';
import { PlatformPressable } from 'expo-router/build/react-navigation/elements/PlatformPressable';
import type { BottomTabBarButtonProps } from 'expo-router/build/react-navigation/bottom-tabs/types';
import type { GestureResponderEvent } from 'react-native';

export function HapticTab(props: BottomTabBarButtonProps) {
  return (
    <PlatformPressable
      {...props}
      onPressIn={(ev: GestureResponderEvent) => {
        if (process.env.EXPO_OS === 'ios') {
          // A soft haptic on press-in, not on press-out: the feedback should
          // land when the finger makes contact, matching the platform's own
          // tab bars.
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        }
        props.onPressIn?.(ev);
      }}
    />
  );
}
