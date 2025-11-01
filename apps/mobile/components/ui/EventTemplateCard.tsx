/**
 * Event Template Card - Novel Design
 * Inspired by: Pinterest pins, Dribbble shots, Behance projects
 * Features: Gradient overlays, asymmetric layouts, visual hierarchy
 */

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import {
  Colors,
  Typography,
  Spacing,
  Radius,
  Shadows,
} from '@/constants/design-system';

interface EventTemplateCardProps {
  name: string;
  description: string;
  category: string;
  onPress: () => void;
  index: number;
}

const { width } = Dimensions.get('window');
const CARD_WIDTH = (width - Spacing.lg * 3) / 2;

export const EventTemplateCard: React.FC<EventTemplateCardProps> = ({
  name,
  description,
  category,
  onPress,
  index,
}) => {
  const handlePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onPress();
  };

  // Alternate card heights for visual interest (masonry effect)
  const isOdd = index % 2 === 1;
  const cardHeight = isOdd ? 200 : 180;

  // Different gradient combinations for each category
  const gradientColors = getCategoryGradient(category);

  return (
    <TouchableOpacity
      onPress={handlePress}
      activeOpacity={0.8}
      style={[styles.container, { width: CARD_WIDTH, height: cardHeight }]}
    >
      <LinearGradient
        colors={gradientColors}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.gradient}
      >
        {/* Category badge */}
        <View style={styles.categoryBadge}>
          <Text style={styles.categoryText}>{category}</Text>
        </View>

        {/* Content area */}
        <View style={styles.content}>
          <Text style={styles.name} numberOfLines={2}>
            {name}
          </Text>
          <Text style={styles.description} numberOfLines={2}>
            {description}
          </Text>
        </View>

        {/* Action indicator */}
        <View style={styles.actionIndicator}>
          <View style={styles.arrow}>
            <Text style={styles.arrowText}>→</Text>
          </View>
        </View>
      </LinearGradient>
    </TouchableOpacity>
  );
};

// Helper function to get gradient based on category
function getCategoryGradient(category: string): [string, string] {
  const gradients: Record<string, [string, string]> = {
    birthday: [Colors.brand[400], Colors.brand[600]],
    wedding: [Colors.accent[400], Colors.accent[600]],
    corporate: [Colors.neutral[700], Colors.neutral[900]],
    party: [Colors.brand[500], Colors.accent[500]],
    conference: [Colors.success[400], Colors.success[600]],
    celebration: [Colors.warning[400], Colors.accent[500]],
    default: [Colors.brand[500], Colors.brand[700]],
  };

  return gradients[category.toLowerCase()] || gradients.default;
}

const styles = StyleSheet.create({
  container: {
    marginBottom: Spacing.md,
    borderRadius: Radius.xl,
    overflow: 'hidden',
    ...Shadows.md,
  },
  gradient: {
    flex: 1,
    padding: Spacing.md,
    justifyContent: 'space-between',
  },
  categoryBadge: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xxs,
    borderRadius: Radius.full,
    backdropFilter: 'blur(10px)',
  },
  categoryText: {
    ...Typography.tiny,
    color: Colors.text.inverse,
    fontSize: 10,
    fontWeight: '700',
  },
  content: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  name: {
    ...Typography.h5,
    color: Colors.text.inverse,
    marginBottom: Spacing.xxs,
    fontWeight: '700',
  },
  description: {
    ...Typography.small,
    color: 'rgba(255, 255, 255, 0.85)',
    marginBottom: Spacing.xs,
  },
  actionIndicator: {
    alignSelf: 'flex-end',
  },
  arrow: {
    width: 32,
    height: 32,
    borderRadius: Radius.full,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  arrowText: {
    color: Colors.text.inverse,
    fontSize: 18,
    fontWeight: '700',
  },
});
