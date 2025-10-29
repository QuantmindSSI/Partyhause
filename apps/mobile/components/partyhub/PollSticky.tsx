import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Pressable,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { PollStickyData, PollOption, DebatePoint } from '@/types/partyhub';
import * as Haptics from 'expo-haptics';

interface PollStickyProps {
  data: PollStickyData;
  stickyId: string;
  currentUserId: string;
  onVote?: (stickyId: string, optionId: string) => void;
  onVotePoint?: (stickyId: string, pointId: string, side: 'for' | 'against') => void;
  onAddPoint?: (stickyId: string, side: 'for' | 'against') => void;
  onComment?: (stickyId: string) => void;
  onToggleMode?: (stickyId: string) => void;
  isInteractive?: boolean;
}

export const PollSticky: React.FC<PollStickyProps> = ({
  data,
  stickyId,
  currentUserId,
  onVote,
  onVotePoint,
  onAddPoint,
  onComment,
  onToggleMode,
  isInteractive = true,
}) => {
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [expandedSide, setExpandedSide] = useState<'for' | 'against' | null>(null);
  
  const isDiscussionMode = data.discussion_mode || false;
  const hasPositions = data.positions && (data.positions.for.length > 0 || data.positions.against.length > 0);

  const handleVote = (optionId: string) => {
    if (!isInteractive || data.status !== 'active') return;
    
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedOption(optionId);
    onVote?.(stickyId, optionId);
  };

  const handleVotePoint = (pointId: string, side: 'for' | 'against') => {
    if (!isInteractive || data.status !== 'active') return;
    
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onVotePoint?.(stickyId, pointId, side);
  };

  const handleAddPoint = (side: 'for' | 'against') => {
    if (!isInteractive || data.status !== 'active') return;
    
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onAddPoint?.(stickyId, side);
  };

  const toggleExpand = (side: 'for' | 'against') => {
    setExpandedSide(expandedSide === side ? null : side);
  };

  const getOptionPercentage = (option: PollOption): number => {
    if (data.total_votes === 0) return 0;
    return (option.votes / data.total_votes) * 100;
  };

  const getProgressColor = (percentage: number, isWinning: boolean): string => {
    if (percentage >= 60) return '#10B981'; // Green for clear winner
    if (percentage >= 40) return '#F59E0B'; // Orange for competitive
    return '#E5E7EB'; // Gray for losing
  };

  const formatTimeRemaining = (endsAt?: string): string => {
    if (!endsAt) return '';
    const now = new Date();
    const end = new Date(endsAt);
    const diff = end.getTime() - now.getTime();
    
    if (diff <= 0) return 'Ended';
    
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m`;
  };

  const getWinningOption = (): PollOption | null => {
    if (data.options.length === 0) return null;
    return data.options.reduce((max, option) => 
      option.votes > max.votes ? option : max
    );
  };

  const winningOption = getWinningOption();

  // Discussion mode helpers
  const forPercentage = data.total_points && data.total_points > 0 
    ? ((data.for_score || 0) / data.total_points) * 100 
    : 50;
  const againstPercentage = 100 - forPercentage;

  const topForPoints = data.positions?.for 
    ? [...data.positions.for].sort((a, b) => b.votes - a.votes).slice(0, 3)
    : [];
  const topAgainstPoints = data.positions?.against
    ? [...data.positions.against].sort((a, b) => b.votes - a.votes).slice(0, 3)
    : [];

  const renderPoint = (point: DebatePoint, side: 'for' | 'against') => (
    <View key={point.id} style={styles.point}>
      <View style={styles.pointContent}>
        <Text style={styles.pointText} numberOfLines={2}>
          • {point.content}
        </Text>
        <Pressable
          style={styles.voteButton}
          onPress={() => handleVotePoint(point.id, side)}
          disabled={!isInteractive || data.status !== 'active'}
        >
          <Ionicons name="arrow-up" size={12} color="#6B7280" />
          <Text style={styles.voteCount}>{point.votes}</Text>
        </Pressable>
      </View>
      <Text style={styles.pointAuthor}>by {point.user_name}</Text>
    </View>
  );

  return (
    <View style={[
      styles.container,
      data.status === 'closed' && styles.closedContainer,
      data.consensus_reached && styles.consensusContainer,
    ]}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Ionicons 
            name={isDiscussionMode ? "chatbubbles" : "bar-chart"} 
            size={18} 
            color="#8B5CF6" 
          />
          <Text style={styles.headerLabel}>
            {isDiscussionMode ? 'POLL · DISCUSSION' : 'POLL'}
          </Text>
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
              <Text style={[styles.statusText, { color: '#6B7280' }]}>Closed</Text>
            </View>
          )}
          {data.consensus_reached && (
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

      {/* Description */}
      {data.description && (
        <Text style={styles.description} numberOfLines={2}>
          {data.description}
        </Text>
      )}

      {/* Poll Type Indicator */}
      <View style={styles.pollTypeRow}>
        <Ionicons 
          name={data.poll_type === 'single-choice' ? 'radio-button-on' : 'checkbox'} 
          size={12} 
          color="#9CA3AF" 
        />
        <Text style={styles.pollTypeText}>
          {data.poll_type === 'single-choice' ? 'Single choice' : 'Multiple choice'}
        </Text>
        
        {/* Mode Toggle */}
        {onToggleMode && data.allow_arguments && (
          <TouchableOpacity
            style={styles.modeToggle}
            onPress={() => onToggleMode(stickyId)}
          >
            <Ionicons 
              name={isDiscussionMode ? "bar-chart" : "chatbubbles"} 
              size={12} 
              color="#8B5CF6" 
            />
            <Text style={styles.modeToggleText}>
              {isDiscussionMode ? 'View votes' : 'Discuss'}
            </Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Quick Vote Mode */}
      {!isDiscussionMode && (
        <View style={styles.optionsContainer}>
          {data.options.map((option) => {
            const percentage = getOptionPercentage(option);
            const isWinning = winningOption?.id === option.id && data.total_votes > 0;
            const progressColor = getProgressColor(percentage, isWinning);
            
            return (
              <TouchableOpacity
                key={option.id}
                style={[
                  styles.option,
                  option.user_has_voted && styles.selectedOption,
                ]}
                onPress={() => handleVote(option.id)}
                disabled={!isInteractive || data.status !== 'active'}
              >
                <View style={styles.optionHeader}>
                  <View style={styles.optionLeft}>
                    <Ionicons
                      name={
                        data.poll_type === 'single-choice'
                          ? option.user_has_voted
                            ? 'radio-button-on'
                            : 'radio-button-off'
                          : option.user_has_voted
                          ? 'checkbox'
                          : 'square-outline'
                      }
                      size={18}
                      color={option.user_has_voted ? '#8B5CF6' : '#9CA3AF'}
                    />
                    <Text style={[
                      styles.optionText,
                      option.user_has_voted && styles.selectedOptionText,
                    ]}>
                      {option.text}
                    </Text>
                  </View>
                  <Text style={styles.votePercentage}>{Math.round(percentage)}%</Text>
                </View>
                
                {data.total_votes > 0 && (
                  <View style={styles.progressBar}>
                    <View 
                      style={[
                        styles.progressFill, 
                        { 
                          width: `${percentage}%`,
                          backgroundColor: progressColor,
                        }
                      ]} 
                    />
                  </View>
                )}
                
                <Text style={styles.voteCountText}>
                  {option.votes} {option.votes === 1 ? 'vote' : 'votes'}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      )}

      {/* Discussion Mode */}
      {isDiscussionMode && hasPositions && (
        <>
          {/* Score Bar */}
          <View style={styles.scoreBar}>
            <View style={styles.scoreSection}>
              <Text style={styles.scoreLabel}>FOR</Text>
              <Text style={styles.scoreValue}>{data.for_score || 0}</Text>
            </View>
            <View style={styles.progressContainer}>
              <View 
                style={[styles.forProgress, { width: `${forPercentage}%` }]} 
              />
              <View 
                style={[styles.againstProgress, { width: `${againstPercentage}%` }]} 
              />
            </View>
            <View style={styles.scoreSection}>
              <Text style={styles.scoreValue}>{data.against_score || 0}</Text>
              <Text style={styles.scoreLabel}>AGAINST</Text>
            </View>
          </View>

          {/* Positions */}
          <View style={styles.positionsContainer}>
            {/* FOR Section */}
            {data.positions && data.positions.for.length > 0 && (
              <View style={styles.position}>
                <TouchableOpacity
                  style={styles.positionHeader}
                  onPress={() => toggleExpand('for')}
                >
                  <View style={styles.positionHeaderLeft}>
                    <Ionicons name="thumbs-up" size={14} color="#10B981" />
                    <Text style={[styles.positionLabel, { color: '#10B981' }]}>
                      FOR ({data.positions.for.length})
                    </Text>
                  </View>
                  <Ionicons 
                    name={expandedSide === 'for' ? "chevron-up" : "chevron-down"} 
                    size={16} 
                    color="#6B7280" 
                  />
                </TouchableOpacity>
                
                <View style={styles.pointsList}>
                  {(expandedSide === 'for' ? data.positions.for : topForPoints).map(point => 
                    renderPoint(point, 'for')
                  )}
                  {expandedSide !== 'for' && data.positions.for.length > 3 && (
                    <Text style={styles.morePoints}>
                      +{data.positions.for.length - 3} more points
                    </Text>
                  )}
                </View>

                {isInteractive && data.status === 'active' && data.allow_arguments && (
                  <TouchableOpacity
                    style={styles.addPointButton}
                    onPress={() => handleAddPoint('for')}
                  >
                    <Ionicons name="add-circle-outline" size={14} color="#10B981" />
                    <Text style={[styles.addPointText, { color: '#10B981' }]}>
                      Add point
                    </Text>
                  </TouchableOpacity>
                )}
              </View>
            )}

            {/* AGAINST Section */}
            {data.positions && data.positions.against.length > 0 && (
              <View style={styles.position}>
                <TouchableOpacity
                  style={styles.positionHeader}
                  onPress={() => toggleExpand('against')}
                >
                  <View style={styles.positionHeaderLeft}>
                    <Ionicons name="thumbs-down" size={14} color="#EF4444" />
                    <Text style={[styles.positionLabel, { color: '#EF4444' }]}>
                      AGAINST ({data.positions.against.length})
                    </Text>
                  </View>
                  <Ionicons 
                    name={expandedSide === 'against' ? "chevron-up" : "chevron-down"} 
                    size={16} 
                    color="#6B7280" 
                  />
                </TouchableOpacity>
                
                <View style={styles.pointsList}>
                  {(expandedSide === 'against' ? data.positions.against : topAgainstPoints).map(point => 
                    renderPoint(point, 'against')
                  )}
                  {expandedSide !== 'against' && data.positions.against.length > 3 && (
                    <Text style={styles.morePoints}>
                      +{data.positions.against.length - 3} more points
                    </Text>
                  )}
                </View>

                {isInteractive && data.status === 'active' && data.allow_arguments && (
                  <TouchableOpacity
                    style={styles.addPointButton}
                    onPress={() => handleAddPoint('against')}
                  >
                    <Ionicons name="add-circle-outline" size={14} color="#EF4444" />
                    <Text style={[styles.addPointText, { color: '#EF4444' }]}>
                      Add point
                    </Text>
                  </TouchableOpacity>
                )}
              </View>
            )}
          </View>

          {/* Resolution */}
          {data.resolution && (
            <View style={styles.resolution}>
              <Ionicons name="checkmark-done" size={14} color="#10B981" />
              <Text style={styles.resolutionText}>{data.resolution}</Text>
            </View>
          )}
        </>
      )}

      {/* Consensus Indicator */}
      {data.consensus_reached && !isDiscussionMode && (
        <View style={styles.consensusIndicator}>
          <Ionicons name="checkmark-circle" size={16} color="#10B981" />
          <Text style={styles.consensusText}>
            Consensus reached at {data.consensus_threshold}%
          </Text>
        </View>
      )}

      {/* Footer */}
      <View style={styles.footer}>
        <View style={styles.footerLeft}>
          <Ionicons name="people" size={14} color="#6B7280" />
          <Text style={styles.footerText}>
            {data.total_voters} {data.total_voters === 1 ? 'voter' : 'voters'}
          </Text>
          {data.ends_at && data.status === 'active' && (
            <>
              <View style={styles.footerDot} />
              <Ionicons name="time" size={14} color="#6B7280" />
              <Text style={styles.footerText}>{formatTimeRemaining(data.ends_at)}</Text>
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
    borderColor: '#9CA3AF',
    opacity: 0.9,
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
    backgroundColor: '#F5F3FF',
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
    marginBottom: 6,
    lineHeight: 18,
  },
  description: {
    fontSize: 11,
    color: '#6B7280',
    marginBottom: 8,
    lineHeight: 15,
  },
  pollTypeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 10,
  },
  pollTypeText: {
    fontSize: 10,
    color: '#9CA3AF',
  },
  modeToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    marginLeft: 'auto',
    paddingHorizontal: 6,
    paddingVertical: 2,
    backgroundColor: '#F5F3FF',
    borderRadius: 6,
  },
  modeToggleText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#8B5CF6',
  },
  optionsContainer: {
    gap: 8,
  },
  option: {
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
    padding: 10,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  selectedOption: {
    backgroundColor: '#F5F3FF',
    borderColor: '#8B5CF6',
  },
  optionHeader: {
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
  optionText: {
    fontSize: 12,
    color: '#374151',
    fontWeight: '500',
    flex: 1,
  },
  selectedOptionText: {
    color: '#8B5CF6',
    fontWeight: '600',
  },
  votePercentage: {
    fontSize: 13,
    fontWeight: '700',
    color: '#111827',
  },
  progressBar: {
    height: 4,
    backgroundColor: '#E5E7EB',
    borderRadius: 2,
    overflow: 'hidden',
    marginBottom: 4,
  },
  progressFill: {
    height: '100%',
    borderRadius: 2,
  },
  voteCountText: {
    fontSize: 10,
    color: '#9CA3AF',
  },
  scoreBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  scoreSection: {
    alignItems: 'center',
  },
  scoreLabel: {
    fontSize: 9,
    fontWeight: '700',
    color: '#9CA3AF',
    letterSpacing: 0.5,
  },
  scoreValue: {
    fontSize: 14,
    fontWeight: '700',
    color: '#111827',
  },
  progressContainer: {
    flex: 1,
    height: 6,
    backgroundColor: '#F3F4F6',
    borderRadius: 3,
    flexDirection: 'row',
    overflow: 'hidden',
  },
  forProgress: {
    backgroundColor: '#10B981',
    height: '100%',
  },
  againstProgress: {
    backgroundColor: '#EF4444',
    height: '100%',
  },
  positionsContainer: {
    gap: 10,
  },
  position: {
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
    padding: 8,
  },
  positionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  positionHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  positionLabel: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  pointsList: {
    gap: 6,
  },
  point: {
    backgroundColor: '#FFFFFF',
    borderRadius: 6,
    padding: 8,
  },
  pointContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 8,
    marginBottom: 4,
  },
  pointText: {
    fontSize: 11,
    color: '#374151',
    flex: 1,
    lineHeight: 15,
  },
  voteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    paddingHorizontal: 6,
    paddingVertical: 2,
    backgroundColor: '#F3F4F6',
    borderRadius: 4,
  },
  voteCount: {
    fontSize: 10,
    fontWeight: '600',
    color: '#6B7280',
  },
  pointAuthor: {
    fontSize: 9,
    color: '#9CA3AF',
    fontStyle: 'italic',
  },
  morePoints: {
    fontSize: 10,
    color: '#9CA3AF',
    fontStyle: 'italic',
    textAlign: 'center',
    paddingVertical: 4,
  },
  addPointButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingVertical: 6,
    marginTop: 6,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  addPointText: {
    fontSize: 11,
    fontWeight: '600',
  },
  resolution: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#D1FAE5',
    padding: 8,
    borderRadius: 8,
    marginTop: 10,
  },
  resolutionText: {
    flex: 1,
    fontSize: 11,
    color: '#059669',
    fontWeight: '500',
  },
  consensusIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#D1FAE5',
    padding: 8,
    borderRadius: 8,
    marginTop: 10,
  },
  consensusText: {
    fontSize: 11,
    color: '#059669',
    fontWeight: '500',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 10,
    marginTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  footerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  footerDot: {
    width: 3,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: '#D1D5DB',
  },
  footerText: {
    fontSize: 10,
    color: '#6B7280',
  },
  commentButton: {
    padding: 4,
  },
});
