/**
 * Modern Card Component
 * Inspired by: Airbnb listings, Stripe dashboard cards
 * Features: Hover states, subtle shadows, smooth interactions
 */

import React from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  ViewStyle,
  StyleProp,
  GestureResponderEvent,
} from 'react-native';
import { Colors, Shadows, Radius, Spacing } from '@/constants/design-system';

interface ModernCardProps {
  children: React.ReactNode;
  onPress?: (event: GestureResponderEvent) => void;
  variant?: 'default' | 'elevated' | 'bordered' | 'flat';
  style?: StyleProp<ViewStyle>;
  padding?: keyof typeof Spacing;
}

export const ModernCard: React.FC<ModernCardProps> = ({
  children,
  onPress,
  variant = 'default',
  style,
  padding = 'lg',
}) => {
  const Container = onPress ? TouchableOpacity : View;

  const variantStyles = {
    default: {
      ...Shadows.md,
      backgroundColor: Colors.background.elevated,
      borderWidth: 1,
      borderColor: Colors.border.light,
    },
    elevated: {
      ...Shadows.lg,
      backgroundColor: Colors.background.elevated,
      borderWidth: 0,
    },
    bordered: {
      ...Shadows.none,
      backgroundColor: Colors.background.elevated,
      borderWidth: 2,
      borderColor: Colors.border.medium,
    },
    flat: {
      ...Shadows.none,
      backgroundColor: Colors.background.secondary,
      borderWidth: 0,
    },
  };

  return (
    <Container
      onPress={onPress}
      activeOpacity={onPress ? 0.7 : 1}
      style={[
        styles.card,
        variantStyles[variant],
        { padding: Spacing[padding] },
        style,
      ]}
    >
      {children}
    </Container>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: Radius.lg,
    overflow: 'hidden',
  },
});
