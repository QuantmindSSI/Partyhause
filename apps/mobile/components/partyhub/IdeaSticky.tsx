import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Pressable,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { IdeaStickyData } from '@/types/partyhub';
import * as Haptics from 'expo-haptics';

interface IdeaStickyProps {
  data: IdeaStickyData;
  stickyId: string;
  currentUserId: string;
  onVote?: (stickyId: string) => void;
  onReact?: (stickyId: string) => void;
  onConvertToTask?: (stickyId: string) => void;
  onComment?: (stickyId: string) => void;
  isInteractive?: boolean;
}

export const IdeaSticky: React.FC<IdeaStickyProps> = ({
  data,
  stickyId,
  currentUserId,
  onVote,
  onReact,
  onConvertToTask,
  onComment,
  isInteractive = true,
}) => {
  const handleVote = () => {
    if (!isInteractive) return;
    
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onVote?.(stickyId);
  };

  const handleReact = () => {
    if (!isInteractive) return;
    
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onReact?.(stickyId);
  };

  const handleConvertToTask = () => {
    if (!isInteractive) return;
    
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onConvertToTask?.(stickyId);
  };

  const getCategoryColor = (category?: string): string => {
    switch (category) {
      case 'activity': return '#3B82F6';
      case 'food': return '#EF4444';
      case 'entertainment': return '#8B5CF6';
      case 'venue': return '#10B981';
      case 'logistics': return '#F59E0B';
      default: return '#6B7280';
    }
  };

  const getCategoryIcon = (category?: string): keyof typeof Ionicons.glyphMap => {
    switch (category) {
      case 'activity': return 'bicycle';
      case 'food': return 'restaurant';
      case 'entertainment': return 'musical-notes';
      case 'venue': return 'location';
      case 'logistics': return 'car';
      default: return 'bulb';
    }
  };

  const formatCost = (cost?: number): string => {
    if (!cost) return 'No cost estimate';
    return `$${cost.toLocaleString()}`;
  };

  return (
    <View style={[
      styles.container,
      data.converted_to_task && styles.convertedContainer,
    ]}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Ionicons 
            name="bulb" 
            size={18} 
            color={data.converted_to_task ? '#10B981' : '#FCD34D'} 
          />
          <Text style={styles.headerLabel}>IDEA</Text>
        </View>
        <View style={styles.headerRight}>
          {data.category && (
            <View 
              style={[
                styles.categoryBadge, 
                { backgroundColor: `${getCategoryColor(data.category)}20` }
              ]}
            >
              <Ionicons 
                name={getCategoryIcon(data.category)} 
                size={10} 
                color={getCategoryColor(data.category)} 
              />
              <Text 
                style={[
                  styles.categoryText, 
                  { color: getCategoryColor(data.category) }
                ]}
              >
                {data.category.toUpperCase()}
              </Text>
            </View>
          )}
        </View>
      </View>

      {/* Content */}
      <Text style={styles.content} numberOfLines={5}>
        {data.content}
      </Text>

      {/* Cost & Votes Row */}
      <View style={styles.infoRow}>
        {data.estimated_cost && (
          <View style={styles.costSection}>
            <Ionicons name="cash-outline" size={12} color="#6B7280" />
            <Text style={styles.costText}>{formatCost(data.estimated_cost)}</Text>
          </View>
        )}
        
        <Pressable
          style={styles.voteSection}
          onPress={handleVote}
          disabled={!isInteractive}
        >
          <Ionicons 
            name={data.user_has_voted ? "heart" : "heart-outline"} 
            size={14} 
            color={data.user_has_voted ? "#EF4444" : "#6B7280"} 
          />
          <Text style={[
            styles.voteText,
            data.user_has_voted && styles.votedText
          ]}>
            {data.votes}
          </Text>
        </Pressable>
      </View>

      {/* Task Conversion */}
      {data.converted_to_task ? (
        <View style={styles.convertedBanner}>
          <Ionicons name="checkmark-circle" size={14} color="#10B981" />
          <Text style={styles.convertedText}>Converted to task</Text>
          {data.task_id && (
            <TouchableOpacity style={styles.viewTaskButton}>
              <Text style={styles.viewTaskText}>View</Text>
            </TouchableOpacity>
          )}
        </View>
      ) : (
        isInteractive && onConvertToTask && (
          <TouchableOpacity
            style={styles.convertButton}
            onPress={handleConvertToTask}
          >
            <Ionicons name="checkmark-circle-outline" size={14} color="#8B5CF6" />
            <Text style={styles.convertButtonText}>Convert to task</Text>
          </TouchableOpacity>
        )
      )}

      {/* Footer */}
      <View style={styles.footer}>
        <View style={styles.footerLeft}>
          <Text style={styles.authorText}>by {data.created_by_name}</Text>
        </View>
        <View style={styles.footerRight}>
          {onReact && (
            <TouchableOpacity 
              style={styles.iconButton}
              onPress={handleReact}
            >
              <Ionicons name="happy-outline" size={14} color="#6B7280" />
            </TouchableOpacity>
          )}
          {onComment && (
            <TouchableOpacity 
              style={styles.iconButton}
              onPress={() => onComment(stickyId)}
            >
              <Ionicons name="chatbubble-outline" size={14} color="#6B7280" />
            </TouchableOpacity>
          )}
        </View>
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
    borderColor: '#FCD34D',
  },
  convertedContainer: {
    borderColor: '#10B981',
    opacity: 0.95,
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
    color: '#F59E0B',
    letterSpacing: 0.5,
  },
  headerRight: {
    flexDirection: 'row',
    gap: 4,
  },
  categoryBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  categoryText: {
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  content: {
    fontSize: 13,
    color: '#111827',
    marginBottom: 12,
    lineHeight: 18,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  costSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  costText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#6B7280',
  },
  voteSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: '#FEF2F2',
    borderRadius: 6,
  },
  voteText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6B7280',
  },
  votedText: {
    color: '#EF4444',
  },
  convertedBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#D1FAE5',
    padding: 8,
    borderRadius: 8,
    marginBottom: 10,
  },
  convertedText: {
    flex: 1,
    fontSize: 11,
    color: '#059669',
    fontWeight: '600',
  },
  viewTaskButton: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: '#FFFFFF',
    borderRadius: 6,
  },
  viewTaskText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#059669',
  },
  convertButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    backgroundColor: '#F5F3FF',
    padding: 8,
    borderRadius: 8,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#E9D5FF',
  },
  convertButtonText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#8B5CF6',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  footerLeft: {
    flex: 1,
  },
  authorText: {
    fontSize: 10,
    color: '#9CA3AF',
    fontStyle: 'italic',
  },
  footerRight: {
    flexDirection: 'row',
    gap: 8,
  },
  iconButton: {
    padding: 4,
  },
});
