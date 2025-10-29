import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Activity } from '@/types/partyhub';

interface ActivityFeedItemProps {
  activity: Activity;
  onPress?: () => void;
  showTimestamp?: boolean;
}

export const ActivityFeedItem: React.FC<ActivityFeedItemProps> = ({
  activity,
  onPress,
  showTimestamp = true,
}) => {
  const getActivityIcon = (): string => {
    switch (activity.activity_type) {
      case 'poll_created':
        return 'poll';
      case 'poll_voted':
        return 'check-circle';
      case 'poll_closed':
        return 'lock';
      case 'comment_added':
        return 'comment';
      case 'reaction_added':
        return 'emoticon-happy';
      case 'debate_started':
        return 'forum';
      case 'debate_point_added':
        return 'message-plus';
      case 'brainstorm_started':
        return 'lightbulb-on';
      case 'idea_added':
        return 'lightbulb';
      case 'consensus_reached':
        return 'trophy';
      case 'decision_made':
        return 'gavel';
      case 'task_completed':
        return 'checkbox-marked-circle';
      case 'vendor_updated':
        return 'store';
      default:
        return 'information';
    }
  };

  const getActivityColor = (): string => {
    switch (activity.activity_type) {
      case 'poll_created':
      case 'poll_voted':
        return '#8B5CF6';
      case 'consensus_reached':
      case 'decision_made':
        return '#10B981';
      case 'debate_started':
      case 'debate_point_added':
        return '#F59E0B';
      case 'brainstorm_started':
      case 'idea_added':
        return '#3B82F6';
      case 'task_completed':
        return '#10B981';
      case 'comment_added':
      case 'reaction_added':
        return '#EC4899';
      default:
        return '#6B7280';
    }
  };

  const getActivityDescription = (): string => {
    const data = activity.activity_data;
    
    switch (activity.activity_type) {
      case 'poll_created':
        return `created a poll: "${data.question}"`;
      case 'poll_voted':
        return `voted on "${data.poll_question}"`;
      case 'poll_closed':
        return `closed the poll: "${data.question}"`;
      case 'comment_added':
        return `commented: "${data.content?.slice(0, 50)}${data.content?.length > 50 ? '...' : ''}"`;
      case 'reaction_added':
        return `reacted with ${data.reaction}`;
      case 'debate_started':
        return `started a debate: "${data.title}"`;
      case 'debate_point_added':
        return `added a ${data.point_type} point to debate`;
      case 'brainstorm_started':
        return `started brainstorming: "${data.title}"`;
      case 'idea_added':
        return `shared an idea: "${data.content?.slice(0, 50)}${data.content?.length > 50 ? '...' : ''}"`;
      case 'consensus_reached':
        return `reached consensus on "${data.question}" (${data.percentage}%)`;
      case 'decision_made':
        return `finalized decision: ${data.result}`;
      case 'task_completed':
        return `completed task: "${data.task_name}"`;
      case 'vendor_updated':
        return `updated vendor quote: ${data.vendor_name}`;
      default:
        return 'performed an action';
    }
  };

  const getTimeAgo = (): string => {
    const now = new Date();
    const activityDate = new Date(activity.created_at);
    const seconds = Math.floor((now.getTime() - activityDate.getTime()) / 1000);

    if (seconds < 60) return 'just now';
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    return `${Math.floor(seconds / 86400)}d ago`;
  };

  const iconColor = getActivityColor();

  return (
    <TouchableOpacity
      style={[styles.container, activity.is_live && styles.containerLive]}
      onPress={onPress}
      disabled={!onPress}
      activeOpacity={0.7}
    >
      {activity.is_live && (
        <View style={styles.liveIndicator}>
          <View style={styles.livePulse} />
        </View>
      )}

      <View style={[styles.iconContainer, { backgroundColor: `${iconColor}15` }]}>
        <MaterialCommunityIcons
          name={getActivityIcon() as any}
          size={20}
          color={iconColor}
        />
      </View>

      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={styles.userName}>{activity.user_name}</Text>
          {showTimestamp && (
            <Text style={styles.timeText}>{getTimeAgo()}</Text>
          )}
        </View>
        <Text style={styles.description} numberOfLines={2}>
          {getActivityDescription()}
        </Text>
      </View>

      {onPress && (
        <MaterialCommunityIcons
          name="chevron-right"
          size={20}
          color="#D1D5DB"
        />
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#FFF',
    padding: 12,
    borderRadius: 12,
    marginBottom: 8,
  },
  containerLive: {
    borderWidth: 1,
    borderColor: '#FCA5A5',
    backgroundColor: '#FEF2F2',
  },
  liveIndicator: {
    position: 'absolute',
    top: 8,
    right: 8,
  },
  livePulse: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#EF4444',
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    flex: 1,
    gap: 4,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  userName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
  },
  timeText: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  description: {
    fontSize: 13,
    color: '#6B7280',
    lineHeight: 18,
  },
});
