import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Pressable,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { PollStickyData, PollOption } from '@/types/partyhub';
import * as Haptics from 'expo-haptics';

interface PollStickyProps {
  data: PollStickyData;
  stickyId: string;
  currentUserId: string;
  onVote?: (stickyId: string, optionId: string) => void;
  onComment?: (stickyId: string) => void;
  isInteractive?: boolean;
}

export const PollSticky: React.FC<PollStickyProps> = ({
  data,
  stickyId,
  currentUserId,
  onVote,
  onComment,
  isInteractive = true,
}) => {
  const [selectedOption, setSelectedOption] = useState<string | null>(null);

  const handleVote = (optionId: string) => {
    if (!isInteractive || data.status !== 'active') return;
    
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setSelectedOption(optionId);
    onVote?.(stickyId, optionId);
  };

  const getProgressColor = (percentage: number): string => {
    if (percentage >= 60) return '#10B981'; // Green - winning
    if (percentage >= 40) return '#F59E0B'; // Orange - competitive
    return '#6B7280'; // Gray - losing
  };

  const formatTimeRemaining = (endsAt?: string): string => {
    if (!endsAt) return '';
    const now = new Date();
    const end = new Date(endsAt);
    const diff = end.getTime() - now.getTime();
    
    if (diff <= 0) return 'Ended';
    
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    
    if (hours > 0) return `${hours}h ${minutes}m left`;
    return `${minutes}m left`;
  };

  const isConsensusReached = data.consensus_reached || 
    (data.options.some(opt => (opt.votes / data.total_votes) * 100 >= data.consensus_threshold));

  return (
    <View style={[
      styles.container,
      data.status === 'closed' && styles.closedContainer,
      isConsensusReached && styles.consensusContainer,
    ]}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Ionicons name="bar-chart" size={18} color="#8B5CF6" />
          <Text style={styles.headerLabel}>POLL</Text>
        </View>
        <View style={styles.headerRight}>
          {data.status === 'active' && (
            <View style={styles.statusBadge}>
              <View style={styles.liveDot} />
              <Text style={styles.statusText}>Live</Text>
            </View>
          )}
          {data.status === 'closed' && (
            <View style={[styles.statusBadge, styles.closedBadge]}>
              <Text style={styles.statusText}>Closed</Text>
            </View>
          )}
          {isConsensusReached && (
            <View style={[styles.statusBadge, styles.consensusBadge]}>
              <Ionicons name="checkmark-circle" size={14} color="#10B981" />
              <Text style={[styles.statusText, { color: '#10B981' }]}>Consensus</Text>
            </View>
          )}
        </View>
      </View>

      {/* Question */}
      <Text style={styles.question} numberOfLines={3}>
        {data.question}
      </Text>

      {/* Poll Type Indicator */}
      <View style={styles.typeIndicator}>
        <Ionicons 
          name={data.poll_type === 'single-choice' ? 'radio-button-on' : 'checkbox'} 
          size={12} 
          color="#6B7280" 
        />
        <Text style={styles.typeText}>
          {data.poll_type === 'single-choice' ? 'Single choice' : 
           data.poll_type === 'multiple-choice' ? 'Multiple choice' : 'Ranking'}
        </Text>
      </View>

      {/* Options */}
      <View style={styles.optionsContainer}>
        {data.options.map((option, index) => {
          const percentage = data.total_votes > 0 
            ? (option.votes / data.total_votes) * 100 
            : 0;
          const isWinning = percentage === Math.max(...data.options.map(o => 
            data.total_votes > 0 ? (o.votes / data.total_votes) * 100 : 0
          ));
          const hasVoted = selectedOption === option.id;

          return (
            <Pressable
              key={option.id}
              style={[
                styles.option,
                hasVoted && styles.optionSelected,
                isWinning && data.total_votes > 0 && styles.optionWinning,
              ]}
              onPress={() => handleVote(option.id)}
              disabled={!isInteractive || data.status !== 'active'}
            >
              <View style={styles.optionContent}>
                <View style={styles.optionLeft}>
                  {data.poll_type === 'single-choice' ? (
                    <View style={[
                      styles.radio,
                      hasVoted && styles.radioSelected,
                    ]}>
                      {hasVoted && <View style={styles.radioDot} />}
                    </View>
                  ) : (
                    <View style={[
                      styles.checkbox,
                      hasVoted && styles.checkboxSelected,
                    ]}>
                      {hasVoted && <Ionicons name="checkmark" size={12} color="#FFF" />}
                    </View>
                  )}
                  <Text style={[
                    styles.optionText,
                    hasVoted && styles.optionTextSelected,
                  ]} numberOfLines={2}>
                    {option.text}
                  </Text>
                </View>
                <Text style={styles.optionPercentage}>
                  {percentage.toFixed(0)}%
                </Text>
              </View>
              
              {/* Progress Bar */}
              {data.total_votes > 0 && (
                <View style={styles.progressBarContainer}>
                  <View 
                    style={[
                      styles.progressBar,
                      { 
                        width: `${percentage}%`,
                        backgroundColor: getProgressColor(percentage),
                      }
                    ]} 
                  />
                </View>
              )}

              {/* Vote Count */}
              <Text style={styles.voteCount}>
                {option.votes} {option.votes === 1 ? 'vote' : 'votes'}
              </Text>
            </Pressable>
          );
        })}
      </View>

      {/* Footer */}
      <View style={styles.footer}>
        <View style={styles.footerLeft}>
          <Ionicons name="people" size={14} color="#6B7280" />
          <Text style={styles.footerText}>
            {data.total_voters} {data.total_voters === 1 ? 'voter' : 'voters'}
          </Text>
          {data.ends_at && (
            <>
              <Text style={styles.footerDivider}>•</Text>
              <Ionicons name="time" size={14} color="#6B7280" />
              <Text style={styles.footerText}>
                {formatTimeRemaining(data.ends_at)}
              </Text>
            </>
          )}
        </View>
        {onComment && (
          <TouchableOpacity 
            style={styles.commentButton}
            onPress={() => onComment(stickyId)}
          >
            <Ionicons name="chatbubble-outline" size={14} color="#8B5CF6" />
          </TouchableOpacity>
        )}
      </View>

      {/* Consensus Indicator */}
      {data.auto_close_on_consensus && !isConsensusReached && (
        <View style={styles.consensusInfo}>
          <Ionicons name="flag" size={12} color="#6B7280" />
          <Text style={styles.consensusText}>
            Auto-closes at {data.consensus_threshold}% consensus
          </Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    borderWidth: 2,
    borderColor: '#8B5CF6',
  },
  closedContainer: {
    opacity: 0.7,
    borderColor: '#9CA3AF',
  },
  consensusContainer: {
    borderColor: '#10B981',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  headerLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#8B5CF6',
    letterSpacing: 0.5,
  },
  headerRight: {
    flexDirection: 'row',
    gap: 4,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
    backgroundColor: '#F3E8FF',
  },
  closedBadge: {
    backgroundColor: '#F3F4F6',
  },
  consensusBadge: {
    backgroundColor: '#D1FAE5',
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#EF4444',
  },
  statusText: {
    fontSize: 9,
    fontWeight: '600',
    color: '#8B5CF6',
  },
  question: {
    fontSize: 13,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 8,
    lineHeight: 18,
  },
  typeIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 10,
  },
  typeText: {
    fontSize: 10,
    color: '#6B7280',
  },
  optionsContainer: {
    gap: 8,
    marginBottom: 10,
  },
  option: {
    borderRadius: 8,
    backgroundColor: '#F9FAFB',
    padding: 10,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  optionSelected: {
    backgroundColor: '#F3E8FF',
    borderColor: '#8B5CF6',
  },
  optionWinning: {
    borderColor: '#10B981',
    borderWidth: 2,
  },
  optionContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  optionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  radio: {
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#D1D5DB',
    justifyContent: 'center',
    alignItems: 'center',
  },
  radioSelected: {
    borderColor: '#8B5CF6',
  },
  radioDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#8B5CF6',
  },
  checkbox: {
    width: 16,
    height: 16,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: '#D1D5DB',
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxSelected: {
    backgroundColor: '#8B5CF6',
    borderColor: '#8B5CF6',
  },
  optionText: {
    fontSize: 12,
    color: '#374151',
    flex: 1,
  },
  optionTextSelected: {
    fontWeight: '600',
    color: '#8B5CF6',
  },
  optionPercentage: {
    fontSize: 12,
    fontWeight: '700',
    color: '#6B7280',
  },
  progressBarContainer: {
    height: 4,
    backgroundColor: '#E5E7EB',
    borderRadius: 2,
    overflow: 'hidden',
    marginBottom: 4,
  },
  progressBar: {
    height: '100%',
    borderRadius: 2,
  },
  voteCount: {
    fontSize: 9,
    color: '#9CA3AF',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  footerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  footerText: {
    fontSize: 10,
    color: '#6B7280',
  },
  footerDivider: {
    fontSize: 10,
    color: '#D1D5DB',
    marginHorizontal: 2,
  },
  commentButton: {
    padding: 4,
  },
  consensusInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 6,
    paddingTop: 6,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  consensusText: {
    fontSize: 9,
    color: '#6B7280',
    fontStyle: 'italic',
  },
});
