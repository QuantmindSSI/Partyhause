/**
 * Professional Button Component
 * Inspired by: Linear's crisp buttons, Stripe's sophisticated CTAs
 * Features: Size variants, loading states, icon support, haptic feedback
 */

import React from 'react';
import {
  TouchableOpacity,
  Text,
  ActivityIndicator,
  StyleSheet,
  ViewStyle,
  TextStyle,
  View,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import {
  Colors,
  Typography,
  Radius,
  Spacing,
  Shadows,
  ButtonVariants,
} from '@/constants/design-system';

interface ProfessionalButtonProps {
  title: string;
  onPress: () => void;
  variant?: keyof typeof ButtonVariants;
  size?: 'small' | 'medium' | 'large';
  loading?: boolean;
  disabled?: boolean;
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
  fullWidth?: boolean;
  style?: ViewStyle;
}

export const ProfessionalButton: React.FC<ProfessionalButtonProps> = ({
  title,
  onPress,
  variant = 'primary',
  size = 'medium',
  loading = false,
  disabled = false,
  icon,
  iconPosition = 'left',
  fullWidth = false,
  style,
}) => {
  const handlePress = () => {
    if (!disabled && !loading) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      onPress();
    }
  };

  const sizeStyles = {
    small: {
      paddingVertical: Spacing.xs,
      paddingHorizontal: Spacing.md,
      ...Typography.small,
    },
    medium: {
      paddingVertical: Spacing.sm,
      paddingHorizontal: Spacing.lg,
      ...Typography.button,
    },
    large: {
      paddingVertical: Spacing.md,
      paddingHorizontal: Spacing.xl,
      fontSize: 17,
      lineHeight: 24,
      fontWeight: '600' as const,
    },
  };

  const variantStyle = ButtonVariants[variant];
  const isDisabled = disabled || loading;

  return (
    <TouchableOpacity
      onPress={handlePress}
      disabled={isDisabled}
      activeOpacity={0.7}
      style={[
        styles.button,
        {
          backgroundColor: variantStyle.backgroundColor,
          borderColor: variantStyle.borderColor,
        },
        sizeStyles[size],
        fullWidth && styles.fullWidth,
        isDisabled && styles.disabled,
        style,
      ]}
    >
      <View style={styles.content}>
        {loading ? (
          <ActivityIndicator
            size="small"
            color={variantStyle.textColor}
            style={styles.loader}
          />
        ) : (
          <>
            {icon && iconPosition === 'left' && (
              <View style={styles.iconLeft}>{icon}</View>
            )}
            <Text
              style={[
                styles.text,
                { color: variantStyle.textColor },
                sizeStyles[size],
              ]}
            >
              {title}
            </Text>
            {icon && iconPosition === 'right' && (
              <View style={styles.iconRight}>{icon}</View>
            )}
          </>
        )}
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    borderRadius: Radius.md,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadows.sm,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    fontWeight: '600',
  },
  iconLeft: {
    marginRight: Spacing.xs,
  },
  iconRight: {
    marginLeft: Spacing.xs,
  },
  loader: {
    marginHorizontal: Spacing.xs,
  },
  fullWidth: {
    width: '100%',
  },
  disabled: {
    opacity: 0.5,
  },
});
