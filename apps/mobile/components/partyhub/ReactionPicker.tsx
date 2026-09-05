import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { ReactionType, Reaction } from '@/types/partyhub';

interface ReactionPickerProps {
  onReactionSelect: (type: ReactionType) => void;
  selectedReaction?: ReactionType;
  reactions?: Reaction[];
  showCounts?: boolean;
}

const REACTION_OPTIONS: Array<{
  type: ReactionType;
  emoji: string;
  label: string;
  color: string;
}> = [
  { type: 'love', emoji: '❤️', label: 'Love it', color: '#EF4444' },
  { type: 'excited', emoji: '🎉', label: 'Excited', color: '#F59E0B' },
  { type: 'fire', emoji: '🔥', label: 'On fire', color: '#FF6B35' },
  { type: 'thumbs-up', emoji: '👍', label: 'Agree', color: '#10B981' },
  { type: 'idea', emoji: '💡', label: 'Great idea', color: '#FBBF24' },
  { type: 'thinking', emoji: '🤔', label: 'Hmm...', color: '#8B5CF6' },
  { type: 'against', emoji: '👎', label: 'Disagree', color: '#EF4444' },
  { type: 'expensive', emoji: '💰', label: 'Too costly', color: '#F59E0B' },
  { type: 'no-time', emoji: '⏰', label: 'No time', color: '#6B7280' },
  { type: 'perfect', emoji: '✨', label: 'Perfect', color: '#A78BFA' },
];

export const ReactionPicker: React.FC<ReactionPickerProps> = ({
  onReactionSelect,
  selectedReaction,
  reactions = [],
  showCounts = true,
}) => {
  const getReactionCount = (type: ReactionType): number => {
    return reactions.filter((r) => r.reaction_type === type).length;
  };

  return (
    <View style={styles.container}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {REACTION_OPTIONS.map((option) => {
          const count = getReactionCount(option.type);
          const isSelected = selectedReaction === option.type;
          const hasReactions = count > 0;

          return (
            <TouchableOpacity
              key={option.type}
              style={[
                styles.reactionButton,
                isSelected && styles.reactionButtonSelected,
                { borderColor: option.color },
              ]}
              onPress={() => onReactionSelect(option.type)}
              activeOpacity={0.7}
            >
              <Text style={styles.emoji}>{option.emoji}</Text>
              {showCounts && hasReactions && (
                <View style={[styles.countBadge, { backgroundColor: option.color }]}>
                  <Text style={styles.countText}>{count}</Text>
                </View>
              )}
              <Text
                style={[
                  styles.label,
                  isSelected && { color: option.color, fontWeight: '700' },
                ]}
              >
                {option.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingVertical: 12,
  },
  scrollContent: {
    gap: 12,
    paddingHorizontal: 16,
  },
  reactionButton: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFF',
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#E5E7EB',
    paddingHorizontal: 16,
    paddingVertical: 10,
    minWidth: 80,
    position: 'relative',
  },
  reactionButtonSelected: {
    backgroundColor: '#F9FAFB',
    borderWidth: 3,
  },
  emoji: {
    fontSize: 24,
    marginBottom: 4,
  },
  countBadge: {
    position: 'absolute',
    top: -6,
    right: -6,
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
    borderWidth: 2,
    borderColor: '#FFF',
  },
  countText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#FFF',
  },
  label: {
    fontSize: 11,
    color: '#6B7280',
    fontWeight: '500',
  },
});
