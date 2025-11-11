import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useRouter, useLocalSearchParams, Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

interface GameCategory {
  id: string;
  name: string;
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
  description: string;
}

interface Game {
  id: string;
  name: string;
  description: string;
  category: string;
  minPlayers: number;
  maxPlayers: number;
  duration: string;
  difficulty: 'easy' | 'medium' | 'hard';
  isActive: boolean;
}

const GAME_CATEGORIES: GameCategory[] = [
  {
    id: 'icebreaker',
    name: 'Icebreakers',
    icon: 'people',
    color: '#10B981',
    description: 'Help guests get to know each other',
  },
  {
    id: 'trivia',
    name: 'Trivia',
    icon: 'bulb',
    color: '#F59E0B',
    description: 'Test your knowledge',
  },
  {
    id: 'party',
    name: 'Party Games',
    icon: 'happy',
    color: '#EC4899',
    description: 'Fun group activities',
  },
  {
    id: 'music',
    name: 'Music',
    icon: 'musical-notes',
    color: '#8B5CF6',
    description: 'Karaoke and music games',
  },
  {
    id: 'photo',
    name: 'Photo Games',
    icon: 'camera',
    color: '#6366F1',
    description: 'Photo challenges and scavenger hunts',
  },
  {
    id: 'custom',
    name: 'Custom',
    icon: 'create',
    color: '#6B7280',
    description: 'Create your own games',
  },
];

const AVAILABLE_GAMES: Game[] = [
  {
    id: 'truth-or-dare',
    name: 'Truth or Dare',
    description: 'Classic party game with custom questions',
    category: 'party',
    minPlayers: 3,
    maxPlayers: 20,
    duration: '15-30 min',
    difficulty: 'easy',
    isActive: true,
  },
  {
    id: 'trivia-challenge',
    name: 'Trivia Challenge',
    description: 'Compete in trivia with custom categories',
    category: 'trivia',
    minPlayers: 2,
    maxPlayers: 50,
    duration: '20-40 min',
    difficulty: 'medium',
    isActive: true,
  },
  {
    id: 'icebreaker-questions',
    name: 'Icebreaker Questions',
    description: 'Fun questions to get the conversation started',
    category: 'icebreaker',
    minPlayers: 2,
    maxPlayers: 30,
    duration: '10-20 min',
    difficulty: 'easy',
    isActive: true,
  },
  {
    id: 'photo-hunt',
    name: 'Photo Scavenger Hunt',
    description: 'Find and photograph specific items or moments',
    category: 'photo',
    minPlayers: 2,
    maxPlayers: 100,
    duration: '30-60 min',
    difficulty: 'medium',
    isActive: true,
  },
  {
    id: 'karaoke',
    name: 'Karaoke Queue',
    description: 'Manage song requests and performances',
    category: 'music',
    minPlayers: 1,
    maxPlayers: 50,
    duration: 'Ongoing',
    difficulty: 'easy',
    isActive: true,
  },
  {
    id: 'name-that-tune',
    name: 'Name That Tune',
    description: 'Guess songs from short clips',
    category: 'music',
    minPlayers: 2,
    maxPlayers: 30,
    duration: '15-25 min',
    difficulty: 'medium',
    isActive: false,
  },
  {
    id: 'two-truths-lie',
    name: 'Two Truths and a Lie',
    description: 'Guess which statement is false',
    category: 'icebreaker',
    minPlayers: 3,
    maxPlayers: 20,
    duration: '10-20 min',
    difficulty: 'easy',
    isActive: false,
  },
  {
    id: 'charades',
    name: 'Charades',
    description: 'Act out words without speaking',
    category: 'party',
    minPlayers: 4,
    maxPlayers: 20,
    duration: '20-40 min',
    difficulty: 'medium',
    isActive: false,
  },
];

export default function GamesScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const filteredGames = selectedCategory
    ? AVAILABLE_GAMES.filter(game => game.category === selectedCategory)
    : AVAILABLE_GAMES;

  const activeGames = filteredGames.filter(game => game.isActive);
  const availableGames = filteredGames.filter(game => !game.isActive);

  const handleStartGame = (game: Game) => {
    Alert.alert(
      'Start Game',
      `Would you like to start "${game.name}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Start',
          onPress: () => {
            // TODO: Navigate to specific game screen
            Alert.alert('Coming Soon', 'Game implementation in progress!');
          },
        },
      ]
    );
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'easy':
        return '#10B981';
      case 'medium':
        return '#F59E0B';
      case 'hard':
        return '#EF4444';
      default:
        return '#6B7280';
    }
  };

  return (
    <View style={styles.container}>
      <Stack.Screen
        options={{
          title: 'Games',
          headerShown: false,
        }}
      />

      {/* Custom Header */}
      <LinearGradient
        colors={['#8B5CF6', '#6366F1']}
        style={styles.header}
      >
        <View style={styles.headerContent}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
          </TouchableOpacity>
          <View style={styles.headerTextContainer}>
            <Text style={styles.headerTitle}>Party Games</Text>
            <Text style={styles.headerSubtitle}>
              {activeGames.length} active • {availableGames.length} available
            </Text>
          </View>
          <TouchableOpacity
            style={styles.settingsButton}
            onPress={() => Alert.alert('Settings', 'Game settings coming soon!')}
          >
            <Ionicons name="settings-outline" size={24} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
      </LinearGradient>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Categories */}
        <View style={styles.categoriesSection}>
          <Text style={styles.sectionTitle}>Categories</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.categoriesScroll}
          >
            <TouchableOpacity
              style={[
                styles.categoryCard,
                selectedCategory === null && styles.categoryCardActive,
              ]}
              onPress={() => setSelectedCategory(null)}
            >
              <View style={[styles.categoryIcon, { backgroundColor: '#6366F1' }]}>
                <Ionicons name="grid" size={24} color="#FFFFFF" />
              </View>
              <Text
                style={[
                  styles.categoryName,
                  selectedCategory === null && styles.categoryNameActive,
                ]}
              >
                All Games
              </Text>
            </TouchableOpacity>

            {GAME_CATEGORIES.map(category => (
              <TouchableOpacity
                key={category.id}
                style={[
                  styles.categoryCard,
                  selectedCategory === category.id && styles.categoryCardActive,
                ]}
                onPress={() => setSelectedCategory(category.id)}
              >
                <View
                  style={[
                    styles.categoryIcon,
                    { backgroundColor: category.color },
                  ]}
                >
                  <Ionicons name={category.icon} size={24} color="#FFFFFF" />
                </View>
                <Text
                  style={[
                    styles.categoryName,
                    selectedCategory === category.id && styles.categoryNameActive,
                  ]}
                >
                  {category.name}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Active Games */}
        {activeGames.length > 0 && (
          <View style={styles.gamesSection}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Active Games</Text>
              <View style={styles.activeBadge}>
                <View style={styles.activeDot} />
                <Text style={styles.activeBadgeText}>Live</Text>
              </View>
            </View>

            {activeGames.map(game => (
              <TouchableOpacity
                key={game.id}
                style={[styles.gameCard, styles.gameCardActive]}
                onPress={() => handleStartGame(game)}
                activeOpacity={0.7}
              >
                <View style={styles.gameCardHeader}>
                  <View style={styles.gameCardLeft}>
                    <View
                      style={[
                        styles.gameIconContainer,
                        {
                          backgroundColor:
                            GAME_CATEGORIES.find(c => c.id === game.category)
                              ?.color + '20' || '#6366F120',
                        },
                      ]}
                    >
                      <Ionicons
                        name="game-controller"
                        size={24}
                        color={
                          GAME_CATEGORIES.find(c => c.id === game.category)
                            ?.color || '#6366F1'
                        }
                      />
                    </View>
                    <View style={styles.gameInfo}>
                      <Text style={styles.gameName}>{game.name}</Text>
                      <Text style={styles.gameDescription}>
                        {game.description}
                      </Text>
                    </View>
                  </View>
                  <View style={styles.playingBadge}>
                    <Ionicons name="play-circle" size={20} color="#10B981" />
                    <Text style={styles.playingText}>Playing</Text>
                  </View>
                </View>

                <View style={styles.gameCardFooter}>
                  <View style={styles.gameMetaItem}>
                    <Ionicons name="people" size={14} color="#6B7280" />
                    <Text style={styles.gameMetaText}>
                      {game.minPlayers}-{game.maxPlayers}
                    </Text>
                  </View>
                  <View style={styles.gameMetaItem}>
                    <Ionicons name="time" size={14} color="#6B7280" />
                    <Text style={styles.gameMetaText}>{game.duration}</Text>
                  </View>
                  <View style={styles.gameMetaItem}>
                    <View
                      style={[
                        styles.difficultyDot,
                        { backgroundColor: getDifficultyColor(game.difficulty) },
                      ]}
                    />
                    <Text style={styles.gameMetaText}>
                      {game.difficulty.charAt(0).toUpperCase() +
                        game.difficulty.slice(1)}
                    </Text>
                  </View>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Available Games */}
        {availableGames.length > 0 && (
          <View style={styles.gamesSection}>
            <Text style={styles.sectionTitle}>Available Games</Text>

            {availableGames.map(game => (
              <TouchableOpacity
                key={game.id}
                style={styles.gameCard}
                onPress={() => handleStartGame(game)}
                activeOpacity={0.7}
              >
                <View style={styles.gameCardHeader}>
                  <View style={styles.gameCardLeft}>
                    <View
                      style={[
                        styles.gameIconContainer,
                        {
                          backgroundColor:
                            GAME_CATEGORIES.find(c => c.id === game.category)
                              ?.color + '20' || '#6366F120',
                        },
                      ]}
                    >
                      <Ionicons
                        name={
                          GAME_CATEGORIES.find(c => c.id === game.category)
                            ?.icon || 'game-controller'
                        }
                        size={24}
                        color={
                          GAME_CATEGORIES.find(c => c.id === game.category)
                            ?.color || '#6366F1'
                        }
                      />
                    </View>
                    <View style={styles.gameInfo}>
                      <Text style={styles.gameName}>{game.name}</Text>
                      <Text style={styles.gameDescription}>
                        {game.description}
                      </Text>
                    </View>
                  </View>
                  <Ionicons name="chevron-forward" size={24} color="#9CA3AF" />
                </View>

                <View style={styles.gameCardFooter}>
                  <View style={styles.gameMetaItem}>
                    <Ionicons name="people" size={14} color="#6B7280" />
                    <Text style={styles.gameMetaText}>
                      {game.minPlayers}-{game.maxPlayers}
                    </Text>
                  </View>
                  <View style={styles.gameMetaItem}>
                    <Ionicons name="time" size={14} color="#6B7280" />
                    <Text style={styles.gameMetaText}>{game.duration}</Text>
                  </View>
                  <View style={styles.gameMetaItem}>
                    <View
                      style={[
                        styles.difficultyDot,
                        { backgroundColor: getDifficultyColor(game.difficulty) },
                      ]}
                    />
                    <Text style={styles.gameMetaText}>
                      {game.difficulty.charAt(0).toUpperCase() +
                        game.difficulty.slice(1)}
                    </Text>
                  </View>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Empty State */}
        {filteredGames.length === 0 && (
          <View style={styles.emptyState}>
            <Ionicons name="game-controller-outline" size={64} color="#D1D5DB" />
            <Text style={styles.emptyTitle}>No games in this category</Text>
            <Text style={styles.emptySubtitle}>
              Try selecting a different category
            </Text>
            <TouchableOpacity
              style={styles.resetButton}
              onPress={() => setSelectedCategory(null)}
            >
              <Text style={styles.resetButtonText}>View All Games</Text>
            </TouchableOpacity>
          </View>
        )}

        <View style={{ height: 100 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  header: {
    paddingTop: 60,
    paddingBottom: 24,
    paddingHorizontal: 20,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTextContainer: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.9)',
  },
  settingsButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
  },
  categoriesSection: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 16,
  },
  categoriesScroll: {
    gap: 12,
    paddingRight: 20,
  },
  categoryCard: {
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 2,
    borderColor: 'transparent',
    minWidth: 100,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  categoryCardActive: {
    borderColor: '#6366F1',
    backgroundColor: '#F5F3FF',
  },
  categoryIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  categoryName: {
    fontSize: 13,
    fontWeight: '600',
    color: '#6B7280',
  },
  categoryNameActive: {
    color: '#6366F1',
  },
  gamesSection: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  activeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#D1FAE5',
    borderRadius: 12,
  },
  activeDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#10B981',
  },
  activeBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#059669',
  },
  gameCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  gameCardActive: {
    borderWidth: 2,
    borderColor: '#10B981',
    backgroundColor: '#F0FDF4',
  },
  gameCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  gameCardLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  gameIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  gameInfo: {
    flex: 1,
  },
  gameName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  gameDescription: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 18,
  },
  playingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    backgroundColor: '#D1FAE5',
    borderRadius: 12,
  },
  playingText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#059669',
  },
  gameCardFooter: {
    flexDirection: 'row',
    gap: 16,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  gameMetaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  gameMetaText: {
    fontSize: 13,
    color: '#6B7280',
  },
  difficultyDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#374151',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 24,
  },
  resetButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    backgroundColor: '#6366F1',
    borderRadius: 12,
  },
  resetButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});
