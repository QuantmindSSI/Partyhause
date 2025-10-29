import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  ScrollView,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LivePresence } from '@/types/partyhub';

interface LivePresenceBarProps {
  presences: LivePresence[];
  maxVisible?: number;
  showTyping?: boolean;
}

export const LivePresenceBar: React.FC<LivePresenceBarProps> = ({
  presences,
  maxVisible = 5,
  showTyping = true,
}) => {
  const activeUsers = presences.filter((p) => {
    const lastActivity = new Date(p.last_activity);
    const now = new Date();
    const minutesSinceActivity = (now.getTime() - lastActivity.getTime()) / 1000 / 60;
    return minutesSinceActivity < 5; // Active in last 5 minutes
  });

  const typingUsers = showTyping
    ? activeUsers.filter((u) => u.is_typing)
    : [];

  const visibleUsers = activeUsers.slice(0, maxVisible);
  const overflowCount = Math.max(0, activeUsers.length - maxVisible);

  if (activeUsers.length === 0) return null;

  return (
    <View style={styles.container}>
      <View style={styles.presenceRow}>
        <View style={styles.avatarGroup}>
          {visibleUsers.map((presence, index) => (
            <View
              key={presence.user_id}
              style={[
                styles.avatarContainer,
                { zIndex: visibleUsers.length - index },
              ]}
            >
              {presence.user_avatar ? (
                <Image
                  source={{ uri: presence.user_avatar }}
                  style={styles.avatar}
                />
              ) : (
                <View style={styles.avatarPlaceholder}>
                  <Text style={styles.avatarInitial}>
                    {presence.user_name.charAt(0).toUpperCase()}
                  </Text>
                </View>
              )}
              <View style={styles.statusDot} />
            </View>
          ))}
          {overflowCount > 0 && (
            <View style={[styles.avatarContainer, styles.overflowBadge]}>
              <Text style={styles.overflowText}>+{overflowCount}</Text>
            </View>
          )}
        </View>

        <View style={styles.statusText}>
          {typingUsers.length > 0 ? (
            <View style={styles.typingContainer}>
              <View style={styles.typingDots}>
                <View style={[styles.typingDot, styles.typingDot1]} />
                <View style={[styles.typingDot, styles.typingDot2]} />
                <View style={[styles.typingDot, styles.typingDot3]} />
              </View>
              <Text style={styles.typingText}>
                {typingUsers.length === 1
                  ? `${typingUsers[0].user_name} is typing...`
                  : typingUsers.length === 2
                  ? `${typingUsers[0].user_name} and ${typingUsers[1].user_name} are typing...`
                  : `${typingUsers.length} people are typing...`}
              </Text>
            </View>
          ) : (
            <Text style={styles.activeText}>
              {activeUsers.length === 1
                ? `${activeUsers[0].user_name} is here`
                : `${activeUsers.length} people active`}
            </Text>
          )}
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
  },
  presenceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  avatarGroup: {
    flexDirection: 'row',
  },
  avatarContainer: {
    marginLeft: -8,
    position: 'relative',
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#FFF',
  },
  avatarPlaceholder: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#8B5CF6',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#FFF',
  },
  avatarInitial: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFF',
  },
  statusDot: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#10B981',
    borderWidth: 2,
    borderColor: '#FFF',
  },
  overflowBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#E5E7EB',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#FFF',
  },
  overflowText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#6B7280',
  },
  statusText: {
    flex: 1,
  },
  typingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  typingDots: {
    flexDirection: 'row',
    gap: 4,
  },
  typingDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#8B5CF6',
  },
  typingDot1: {
    // Animation would be added with Reanimated
  },
  typingDot2: {
    // Animation would be added with Reanimated
  },
  typingDot3: {
    // Animation would be added with Reanimated
  },
  typingText: {
    fontSize: 13,
    color: '#8B5CF6',
    fontWeight: '500',
    fontStyle: 'italic',
  },
  activeText: {
    fontSize: 13,
    color: '#6B7280',
    fontWeight: '500',
  },
});
