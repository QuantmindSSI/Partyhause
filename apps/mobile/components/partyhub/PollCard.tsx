import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Pressable,
  LayoutAnimation,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Poll, PollOption } from '@/types/partyhub';
import { LinearGradient } from 'expo-linear-gradient';

interface PollCardProps {
  poll: Poll;
  onVote?: (optionIds: string[]) => void;
  showResults?: boolean;
  compact?: boolean;
}

export const PollCard: React.FC<PollCardProps> = ({
  poll,
  onVote,
  showResults = false,
  compact = false,
}) => {
  const router = useRouter();
  const [selectedOptions, setSelectedOptions] = useState<string[]>([]);

  const handleOptionSelect = (optionId: string) => {
    if (poll.status !== 'active') return;

    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);

    if (poll.poll_type === 'single-choice') {
      setSelectedOptions([optionId]);
      onVote?.([optionId]);
    } else {
      setSelectedOptions((prev) =>
        prev.includes(optionId)
          ? prev.filter((id) => id !== optionId)
          : [...prev, optionId]
      );
    }
  };

  const handleSubmitMultiple = () => {
    if (selectedOptions.length > 0) {
      onVote?.(selectedOptions);
    }
  };

  const getOptionPercentage = (option: PollOption): number => {
    if (poll.total_votes === 0) return 0;
    return (option.votes / poll.total_votes) * 100;
  };

  const getConsensusLevel = (): { level: number; color: string } => {
    const topOption = [...poll.options].sort((a, b) => b.votes - a.votes)[0];
    const percentage = getOptionPercentage(topOption);
    
    if (percentage >= 70) return { level: percentage, color: '#10B981' };
    if (percentage >= 50) return { level: percentage, color: '#F59E0B' };
    return { level: percentage, color: '#EF4444' };
  };

  const consensus = getConsensusLevel();
  const isActive = poll.status === 'active';
  const showConsensusBar = poll.auto_close_on_consensus;

  const handleCardPress = () => {
    router.push(`/events/${poll.event_id}/planning/collaborate/polls/${poll.id}`);
  };

  if (compact) {
    return (
      <TouchableOpacity
        style={styles.compactCard}
        onPress={handleCardPress}
        activeOpacity={0.7}
      >
        <View style={styles.compactHeader}>
          <MaterialCommunityIcons
            name="poll"
            size={20}
            color="#8B5CF6"
          />
          <Text style={styles.compactQuestion} numberOfLines={1}>
            {poll.question}
          </Text>
        </View>
        <View style={styles.compactStats}>
          <Text style={styles.compactStatText}>
            {poll.total_voters} votes
          </Text>
          {isActive && (
            <View style={styles.liveBadge}>
              <View style={styles.liveDot} />
              <Text style={styles.liveText}>LIVE</Text>
            </View>
          )}
        </View>
      </TouchableOpacity>
    );
  }

  return (
    <View style={styles.card}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <MaterialCommunityIcons
            name="poll"
            size={24}
            color="#8B5CF6"
          />
          <View style={styles.headerText}>
            <Text style={styles.creatorName}>{poll.creator_name}</Text>
            <Text style={styles.timeText}>
              {new Date(poll.created_at).toLocaleTimeString([], {
                hour: '2-digit',
                minute: '2-digit',
              })}
            </Text>
          </View>
        </View>
        {isActive && (
          <View style={styles.liveBadge}>
            <View style={styles.liveDot} />
            <Text style={styles.liveText}>LIVE</Text>
          </View>
        )}
      </View>

      {/* Question */}
      <Text style={styles.question}>{poll.question}</Text>

      {/* Consensus Bar */}
      {showConsensusBar && isActive && (
        <View style={styles.consensusContainer}>
          <View style={styles.consensusHeader}>
            <Text style={styles.consensusLabel}>Consensus Progress</Text>
            <Text style={[styles.consensusPercentage, { color: consensus.color }]}>
              {Math.round(consensus.level)}%
            </Text>
          </View>
          <View style={styles.consensusBarContainer}>
            <View
              style={[
                styles.consensusBar,
                {
                  width: `${consensus.level}%`,
                  backgroundColor: consensus.color,
                },
              ]}
            />
            <View style={[styles.thresholdMarker, { left: `${poll.consensus_threshold}%` }]}>
              <Text style={styles.thresholdText}>{poll.consensus_threshold}%</Text>
            </View>
          </View>
        </View>
      )}

      {/* Options */}
      <View style={styles.options}>
        {poll.options.map((option) => {
          const percentage = getOptionPercentage(option);
          const isSelected = selectedOptions.includes(option.id);
          const isLeading = percentage === getConsensusLevel().level;

          return (
            <Pressable
              key={option.id}
              style={[
                styles.option,
                isSelected && styles.optionSelected,
                !isActive && styles.optionDisabled,
              ]}
              onPress={() => handleOptionSelect(option.id)}
              disabled={!isActive}
            >
              {showResults && (
                <View
                  style={[
                    styles.optionProgress,
                    { width: `${percentage}%` },
                    isLeading && styles.optionProgressLeading,
                  ]}
                />
              )}
              <View style={styles.optionContent}>
                <View style={styles.optionLeft}>
                  <View
                    style={[
                      styles.optionRadio,
                      isSelected && styles.optionRadioSelected,
                    ]}
                  >
                    {isSelected && (
                      <View style={styles.optionRadioInner} />
                    )}
                  </View>
                  <Text style={styles.optionText}>{option.text}</Text>
                </View>
                {showResults && (
                  <View style={styles.optionRight}>
                    <Text style={styles.optionVotes}>{option.votes}</Text>
                    <Text style={styles.optionPercentage}>
                      {Math.round(percentage)}%
                    </Text>
                  </View>
                )}
              </View>
            </Pressable>
          );
        })}
      </View>

      {/* Submit for multiple choice */}
      {poll.poll_type === 'multiple-choice' &&
        isActive &&
        selectedOptions.length > 0 && (
          <TouchableOpacity
            style={styles.submitButton}
            onPress={handleSubmitMultiple}
          >
            <LinearGradient
              colors={['#8B5CF6', '#7C3AED']}
              style={styles.submitGradient}
            >
              <Text style={styles.submitText}>
                Submit {selectedOptions.length} vote{selectedOptions.length > 1 ? 's' : ''}
              </Text>
              <MaterialCommunityIcons name="check" size={20} color="#FFF" />
            </LinearGradient>
          </TouchableOpacity>
        )}

      {/* Footer */}
      <TouchableOpacity
        style={styles.footer}
        onPress={handleCardPress}
        activeOpacity={0.7}
      >
        <View style={styles.footerLeft}>
          <MaterialCommunityIcons
            name="comment-outline"
            size={16}
            color="#9CA3AF"
          />
          <Text style={styles.footerText}>View Discussion</Text>
        </View>
        <View style={styles.footerRight}>
          <MaterialCommunityIcons
            name="account-multiple-outline"
            size={16}
            color="#9CA3AF"
          />
          <Text style={styles.footerText}>{poll.total_voters} voted</Text>
        </View>
      </TouchableOpacity>

      {/* Consensus Reached Banner */}
      {poll.status === 'consensus-reached' && (
        <View style={styles.consensusBanner}>
          <MaterialCommunityIcons name="party-popper" size={20} color="#10B981" />
          <Text style={styles.consensusBannerText}>
            Consensus Reached! 🎉
          </Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  headerText: {
    gap: 2,
  },
  creatorName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
  },
  timeText: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  liveBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#FEE2E2',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#EF4444',
  },
  liveText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#EF4444',
    letterSpacing: 0.5,
  },
  question: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 16,
    lineHeight: 24,
  },
  consensusContainer: {
    marginBottom: 16,
    padding: 12,
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
  },
  consensusHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  consensusLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6B7280',
  },
  consensusPercentage: {
    fontSize: 16,
    fontWeight: '700',
  },
  consensusBarContainer: {
    height: 8,
    backgroundColor: '#E5E7EB',
    borderRadius: 4,
    position: 'relative',
    overflow: 'visible',
  },
  consensusBar: {
    height: '100%',
    borderRadius: 4,
  },
  thresholdMarker: {
    position: 'absolute',
    top: -20,
    transform: [{ translateX: -20 }],
  },
  thresholdText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#6B7280',
  },
  options: {
    gap: 12,
    marginBottom: 16,
  },
  option: {
    position: 'relative',
    borderWidth: 2,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    overflow: 'hidden',
  },
  optionSelected: {
    borderColor: '#8B5CF6',
    backgroundColor: '#F5F3FF',
  },
  optionDisabled: {
    opacity: 0.7,
  },
  optionProgress: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    backgroundColor: '#F3F4F6',
  },
  optionProgressLeading: {
    backgroundColor: '#DBEAFE',
  },
  optionContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    position: 'relative',
    zIndex: 1,
  },
  optionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  optionRadio: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#D1D5DB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  optionRadioSelected: {
    borderColor: '#8B5CF6',
  },
  optionRadioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#8B5CF6',
  },
  optionText: {
    fontSize: 16,
    color: '#1F2937',
    fontWeight: '500',
    flex: 1,
  },
  optionRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  optionVotes: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
  },
  optionPercentage: {
    fontSize: 14,
    fontWeight: '700',
    color: '#8B5CF6',
  },
  submitButton: {
    marginBottom: 16,
  },
  submitGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 12,
  },
  submitText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFF',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  footerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  footerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  footerText: {
    fontSize: 13,
    color: '#9CA3AF',
    fontWeight: '500',
  },
  consensusBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#D1FAE5',
    padding: 12,
    borderRadius: 12,
    marginTop: 12,
  },
  consensusBannerText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#10B981',
  },
  compactCard: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  compactHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6,
  },
  compactQuestion: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
    flex: 1,
  },
  compactStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  compactStatText: {
    fontSize: 12,
    color: '#9CA3AF',
  },
});
