import React, { useState, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Dimensions,
  Platform,
  StatusBar,
  Modal,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { 
  GestureHandlerRootView, 
  PanGestureHandler,
  TapGestureHandler,
  State,
} from 'react-native-gesture-handler';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  runOnJS,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';

// ============================================================================
// Types & Interfaces
// ============================================================================

type StickyType = 'image' | 'link' | 'note' | 'video' | 'cost' | 'checklist';
type FilterCategory = 'all' | 'venue' | 'entertainment' | 'food' | 'activities' | 'decor' | 'other';

interface StickyItem {
  id: string;
  type: StickyType;
  position: { x: number; y: number };
  size: { width: number; height: number };
  rotation?: number;
  z_index: number;
  category?: string;
  reaction_count: number;
  created_by: string;
  created_at: string;
  data: NoteStickyData | ImageStickyData | any;
}

interface NoteStickyData {
  content: string;
  color: string;
  font_size: number;
}

interface ImageStickyData {
  url: string;
  caption?: string;
  aspect_ratio: number;
}

interface ListItem {
  id: string;
  content: string;
  category: string;
  estimated_cost?: number;
  reaction_count: number;
  user_id: string;
  user_name: string;
  converted_to_task: boolean;
  sticky_id?: string;
  created_at: string;
}

interface CanvasStats {
  ideas: number;
  tasks: number;
  votes: number;
}

// ============================================================================
// Constants
// ============================================================================

const SCREEN_HEIGHT = Dimensions.get('window').height;
const SCREEN_WIDTH = Dimensions.get('window').width;
const HEADER_HEIGHT = 60;
const DIVIDER_HEIGHT = 40;
const MIN_CANVAS_HEIGHT = 200;
const MIN_LIST_HEIGHT = 200;
const DEFAULT_CANVAS_RATIO = 0.40; // 40% of available height
const STICKY_SIZE = 120; // Width and height of sticky notes

const CATEGORIES: { id: FilterCategory; label: string; icon: string; color: string }[] = [
  { id: 'all', label: 'All', icon: 'apps', color: '#6B7280' },
  { id: 'venue', label: 'Venue', icon: 'location', color: '#3B82F6' },
  { id: 'entertainment', label: 'Entertainment', icon: 'musical-notes', color: '#10B981' },
  { id: 'food', label: 'Food', icon: 'restaurant', color: '#F59E0B' },
  { id: 'activities', label: 'Activities', icon: 'fitness', color: '#EF4444' },
  { id: 'decor', label: 'Decor', icon: 'color-palette', color: '#EC4899' },
  { id: 'other', label: 'Other', icon: 'ellipsis-horizontal', color: '#6B7280' },
];

const STICKY_COLORS = [
  { id: 'yellow', name: 'Yellow', color: '#FEFCE8', textColor: '#713F12' },
  { id: 'pink', name: 'Pink', color: '#FCE7F3', textColor: '#831843' },
  { id: 'blue', name: 'Blue', color: '#DBEAFE', textColor: '#1E3A8A' },
  { id: 'green', name: 'Green', color: '#DCFCE7', textColor: '#14532D' },
  { id: 'purple', name: 'Purple', color: '#EDE9FE', textColor: '#4C1D95' },
  { id: 'orange', name: 'Orange', color: '#FED7AA', textColor: '#7C2D12' },
];

const STICKY_TYPES = [
  { id: 'note', label: 'Write Note', icon: 'create', color: '#F59E0B', description: 'Quick text note' },
  { id: 'image', label: 'Upload Image', icon: 'image', color: '#EC4899', description: 'Add a photo' },
  { id: 'link', label: 'Paste Link', icon: 'link', color: '#3B82F6', description: 'Web link with preview' },
  { id: 'video', label: 'Add Video', icon: 'videocam', color: '#EF4444', description: 'YouTube, Vimeo, etc.' },
  { id: 'cost', label: 'Track Cost', icon: 'cash', color: '#10B981', description: 'Budget item' },
  { id: 'checklist', label: 'Create Checklist', icon: 'checkbox', color: '#8B5CF6', description: 'Todo list' },
];

// ============================================================================
// Mock Data (for Phase 1 testing)
// ============================================================================

const MOCK_LIST_ITEMS: ListItem[] = [
  {
    id: '1',
    content: 'String lights across ceiling for starry night effect',
    category: 'decor',
    estimated_cost: 150,
    reaction_count: 20,
    user_id: 'user1',
    user_name: 'Emma W.',
    converted_to_task: true,
    created_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: '2',
    content: 'Photo booth with props and instant prints',
    category: 'entertainment',
    estimated_cost: 500,
    reaction_count: 15,
    user_id: 'user2',
    user_name: 'Sarah K.',
    converted_to_task: false,
    created_at: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: '3',
    content: 'Outdoor garden venue with fairy lights',
    category: 'venue',
    estimated_cost: 2000,
    reaction_count: 12,
    user_id: 'user3',
    user_name: 'Mike T.',
    converted_to_task: false,
    created_at: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: '4',
    content: 'Taco bar with vegetarian and vegan options',
    category: 'food',
    estimated_cost: 800,
    reaction_count: 18,
    user_id: 'user1',
    user_name: 'Emma W.',
    converted_to_task: true,
    created_at: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
  },
];

// ============================================================================
// Main Component
// ============================================================================

export default function PartyBoardScreen() {
  const router = useRouter();
  const { id: eventId } = useLocalSearchParams<{ id: string }>();

  // ============================================================================
  // State Management
  // ============================================================================

  const [selectedCategory, setSelectedCategory] = useState<FilterCategory>('all');
  const [listItems, setListItems] = useState<ListItem[]>(MOCK_LIST_ITEMS);
  const [canvasZoom, setCanvasZoom] = useState(1.0);
  const [canvasPan, setCanvasPan] = useState({ x: 0, y: 0 });

  // Layout state
  const [canvasHeight, setCanvasHeight] = useState(
    (SCREEN_HEIGHT - HEADER_HEIGHT - DIVIDER_HEIGHT) * DEFAULT_CANVAS_RATIO
  );

  // Animated values for divider
  const dividerY = useSharedValue(canvasHeight);

  // Canvas state
  const [stickies, setStickies] = useState<StickyItem[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedStickyType, setSelectedStickyType] = useState<StickyType | null>(null);
  
  // Note creation state
  const [noteContent, setNoteContent] = useState('');
  const [noteColor, setNoteColor] = useState(STICKY_COLORS[0].id);
  const [noteCategory, setNoteCategory] = useState<string>('other');

  // ============================================================================
  // Computed Values
  // ============================================================================

  const stats: CanvasStats = {
    ideas: listItems.length,
    tasks: listItems.filter((item) => item.converted_to_task).length,
    votes: listItems.reduce((sum, item) => sum + item.reaction_count, 0),
  };

  const filteredItems =
    selectedCategory === 'all'
      ? listItems
      : listItems.filter((item) => item.category === selectedCategory);

  const getCategoryInfo = (categoryId: string) => {
    return CATEGORIES.find((cat) => cat.id === categoryId) || CATEGORIES[6];
  };

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHrs = Math.floor(diffMs / (1000 * 60 * 60));
    
    if (diffHrs < 1) return 'Just now';
    if (diffHrs < 24) return `${diffHrs}h ago`;
    const diffDays = Math.floor(diffHrs / 24);
    return `${diffDays}d ago`;
  };

  // ============================================================================
  // Handlers
  // ============================================================================

  const handleBack = () => {
    router.back();
  };

  const handleCategorySelect = (category: FilterCategory) => {
    setSelectedCategory(category);
  };

  const handleVote = (itemId: string) => {
    setListItems((prev) =>
      prev.map((item) =>
        item.id === itemId
          ? { ...item, reaction_count: item.reaction_count + 1 }
          : item
      )
    );
  };

  const handleConvertToTask = (itemId: string) => {
    setListItems((prev) =>
      prev.map((item) =>
        item.id === itemId ? { ...item, converted_to_task: true } : item
      )
    );
  };

  // Sticky handlers
  const handleOpenAddModal = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setShowAddModal(true);
  };

  const handleCloseAddModal = () => {
    setShowAddModal(false);
    setSelectedStickyType(null);
    setNoteContent('');
    setNoteColor(STICKY_COLORS[0].id);
  };

  const handleSelectStickyType = (type: StickyType) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedStickyType(type);
  };

  const handleCreateNote = () => {
    if (!noteContent.trim()) return;

    const colorInfo = STICKY_COLORS.find(c => c.id === noteColor) || STICKY_COLORS[0];
    const rotation = (Math.random() - 0.5) * 10; // Random -5 to +5 degrees
    
    // Calculate safe bounds for initial position (with margin)
    const margin = 20;
    const maxX = SCREEN_WIDTH - STICKY_SIZE - margin;
    const maxY = canvasHeight - STICKY_SIZE - margin;

    const newSticky: StickyItem = {
      id: `sticky-${Date.now()}`,
      type: 'note',
      position: {
        x: Math.random() * maxX + margin,
        y: Math.random() * maxY + margin,
      },
      size: { width: STICKY_SIZE, height: STICKY_SIZE },
      rotation,
      z_index: stickies.length,
      category: noteCategory,
      reaction_count: 0,
      created_by: 'current-user',
      created_at: new Date().toISOString(),
      data: {
        content: noteContent,
        color: colorInfo.color,
        font_size: 14,
      } as NoteStickyData,
    };

    setStickies([...stickies, newSticky]);
    
    // Also create list item
    const newListItem: ListItem = {
      id: `item-${Date.now()}`,
      content: noteContent,
      category: noteCategory,
      reaction_count: 0,
      user_id: 'current-user',
      user_name: 'You',
      converted_to_task: false,
      sticky_id: newSticky.id,
      created_at: new Date().toISOString(),
    };
    
    setListItems([newListItem, ...listItems]);
    
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    handleCloseAddModal();
  };

  const handleDeleteSticky = (stickyId: string) => {
    setStickies((prev) => prev.filter((s) => s.id !== stickyId));
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  };

  // Divider drag handler
  const onDividerGestureEvent = useCallback((event: any) => {
    'worklet';
    const newY = event.translationY + canvasHeight;
    const availableHeight = SCREEN_HEIGHT - HEADER_HEIGHT - DIVIDER_HEIGHT;
    
    // Constrain within bounds
    if (newY >= MIN_CANVAS_HEIGHT && newY <= availableHeight - MIN_LIST_HEIGHT) {
      dividerY.value = newY;
    }
  }, [canvasHeight]);

  const onDividerGestureEnd = useCallback(() => {
    'worklet';
    const newHeight = dividerY.value;
    runOnJS(setCanvasHeight)(newHeight);
  }, []);

  // ============================================================================
  // Render Functions
  // ============================================================================

  const renderHeader = () => (
    <View style={styles.header}>
      <Pressable onPress={handleBack} style={styles.backButton}>
        <Ionicons name="arrow-back" size={24} color="#1F2937" />
      </Pressable>
      
      <Text style={styles.headerTitle}>PartyBoard</Text>
      
      <View style={styles.headerActions}>
        <Pressable style={styles.iconButton}>
          <Ionicons name="brush" size={24} color="#8B5CF6" />
        </Pressable>
        <Pressable style={styles.iconButton}>
          <Ionicons name="list" size={24} color="#6B7280" />
        </Pressable>
        <Pressable onPress={handleOpenAddModal} style={styles.iconButton}>
          <Ionicons name="add-circle" size={28} color="#8B5CF6" />
        </Pressable>
      </View>
    </View>
  );

  const renderCanvas = () => (
    <View style={[styles.canvasContainer, { height: canvasHeight }]}>
      <TapGestureHandler numberOfTaps={2} onHandlerStateChange={(event) => {
        if (event.nativeEvent.state === State.ACTIVE) {
          handleOpenAddModal();
        }
      }}>
        <Animated.View style={styles.canvas}>
          {stickies.length === 0 ? (
            <View style={styles.canvasPlaceholder}>
              <Ionicons name="color-palette-outline" size={64} color="#D1D5DB" />
              <Text style={styles.canvasPlaceholderText}>
                Double tap anywhere to add sticky
              </Text>
              <Text style={styles.canvasPlaceholderSubtext}>
                Images • Links • Notes • Videos • Costs
              </Text>
            </View>
          ) : (
            stickies.map((sticky) => renderSticky(sticky))
          )}
        </Animated.View>
      </TapGestureHandler>
    </View>
  );

  const renderSticky = (sticky: StickyItem) => {
    if (sticky.type === 'note') {
      return <NoteSticky key={sticky.id} sticky={sticky} onDelete={handleDeleteSticky} />;
    }
    // Other sticky types will be added in future phases
    return null;
  };

  const renderDivider = () => {
    const animatedStyle = useAnimatedStyle(() => ({
      transform: [{ translateY: dividerY.value - canvasHeight }],
    }));

    return (
      <PanGestureHandler
        onGestureEvent={onDividerGestureEvent}
        onEnded={onDividerGestureEnd}
      >
        <Animated.View style={[styles.divider, animatedStyle]}>
          <View style={styles.dividerHandle}>
            <View style={styles.dividerDots} />
            <View style={styles.dividerDots} />
            <View style={styles.dividerDots} />
          </View>
        </Animated.View>
      </PanGestureHandler>
    );
  };

  const renderStatsBar = () => (
    <View style={styles.statsBar}>
      <View style={styles.statItem}>
        <Ionicons name="bulb" size={16} color="#8B5CF6" />
        <Text style={styles.statText}>{stats.ideas} ideas</Text>
      </View>
      <View style={styles.statDivider} />
      <View style={styles.statItem}>
        <Ionicons name="checkmark-circle" size={16} color="#10B981" />
        <Text style={styles.statText}>{stats.tasks} tasks</Text>
      </View>
      <View style={styles.statDivider} />
      <View style={styles.statItem}>
        <Ionicons name="heart" size={16} color="#EF4444" />
        <Text style={styles.statText}>{stats.votes} votes</Text>
      </View>
    </View>
  );

  const renderCategoryFilters = () => (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      style={styles.categoryFiltersContainer}
      contentContainerStyle={styles.categoryFiltersContent}
    >
      {CATEGORIES.map((category) => {
        const isSelected = selectedCategory === category.id;
        return (
          <Pressable
            key={category.id}
            onPress={() => handleCategorySelect(category.id)}
            style={[
              styles.categoryChip,
              isSelected && { backgroundColor: '#8B5CF6' },
            ]}
          >
            <Ionicons
              name={category.icon as any}
              size={16}
              color={isSelected ? '#FFFFFF' : category.color}
            />
            <Text
              style={[
                styles.categoryChipText,
                isSelected && styles.categoryChipTextActive,
              ]}
            >
              {category.label}
            </Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );

  const renderListItem = (item: ListItem) => {
    const categoryInfo = getCategoryInfo(item.category);
    
    return (
      <View key={item.id} style={styles.listItemCard}>
        <View style={styles.listItemHeader}>
          <View style={styles.listItemCategory}>
            <Ionicons name={categoryInfo.icon as any} size={16} color={categoryInfo.color} />
            <Text style={[styles.listItemCategoryText, { color: categoryInfo.color }]}>
              {categoryInfo.label.toUpperCase()}
            </Text>
          </View>
          <View style={styles.listItemMeta}>
            <View style={styles.listItemMetaItem}>
              <Ionicons name="heart" size={14} color="#EF4444" />
              <Text style={styles.listItemMetaText}>{item.reaction_count}</Text>
            </View>
            {item.estimated_cost && (
              <View style={styles.listItemMetaItem}>
                <Text style={styles.listItemCost}>${item.estimated_cost}</Text>
              </View>
            )}
          </View>
        </View>

        <Text style={styles.listItemContent}>{item.content}</Text>

        <View style={styles.listItemFooter}>
          <View style={styles.listItemAuthor}>
            <Ionicons name="person-circle-outline" size={16} color="#6B7280" />
            <Text style={styles.listItemAuthorText}>
              {item.user_name} • {formatTimeAgo(item.created_at)}
            </Text>
          </View>

          {item.converted_to_task ? (
            <View style={styles.taskBadge}>
              <Ionicons name="checkmark-circle" size={16} color="#10B981" />
              <Text style={styles.taskBadgeText}>Task</Text>
            </View>
          ) : (
            <Pressable
              onPress={() => handleConvertToTask(item.id)}
              style={styles.convertButton}
            >
              <Ionicons name="checkmark-circle-outline" size={16} color="#8B5CF6" />
              <Text style={styles.convertButtonText}>Convert</Text>
            </Pressable>
          )}
        </View>
      </View>
    );
  };

  const renderList = () => {
    const listHeight = SCREEN_HEIGHT - HEADER_HEIGHT - canvasHeight - DIVIDER_HEIGHT;

    return (
      <View style={[styles.listContainer, { height: listHeight }]}>
        {renderStatsBar()}
        {renderCategoryFilters()}
        
        <ScrollView
          style={styles.listScrollView}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        >
          {filteredItems.length > 0 ? (
            filteredItems.map(renderListItem)
          ) : (
            <View style={styles.emptyState}>
              <Ionicons name="albums-outline" size={48} color="#D1D5DB" />
              <Text style={styles.emptyStateText}>No items in this category</Text>
              <Text style={styles.emptyStateSubtext}>
                Add your first idea to get started
              </Text>
            </View>
          )}

          <Pressable style={styles.addItemButton} onPress={handleOpenAddModal}>
            <Ionicons name="add-circle" size={24} color="#8B5CF6" />
            <Text style={styles.addItemButtonText}>Add New Item</Text>
          </Pressable>
        </ScrollView>
      </View>
    );
  };

  // ============================================================================
  // Sticky Components
  // ============================================================================

  const NoteSticky = ({ sticky, onDelete }: { sticky: StickyItem; onDelete: (id: string) => void }) => {
    const translateX = useSharedValue(sticky.position.x);
    const translateY = useSharedValue(sticky.position.y);
    const scale = useSharedValue(1);
    const [showMenu, setShowMenu] = useState(false);
    
    // Store initial position when drag starts
    const startPosition = useSharedValue({ x: sticky.position.x, y: sticky.position.y });
    
    // Update shared values when sticky position changes from outside
    React.useEffect(() => {
      translateX.value = sticky.position.x;
      translateY.value = sticky.position.y;
      startPosition.value = { x: sticky.position.x, y: sticky.position.y };
    }, [sticky.position.x, sticky.position.y]);

    const onGestureEvent = useCallback((event: any) => {
      'worklet';
      const newX = event.translationX + startPosition.value.x;
      const newY = event.translationY + startPosition.value.y;
      
      // Apply bounds to keep sticky on canvas
      const maxX = SCREEN_WIDTH - STICKY_SIZE;
      const maxY = canvasHeight - STICKY_SIZE;
      
      translateX.value = Math.max(0, Math.min(newX, maxX));
      translateY.value = Math.max(0, Math.min(newY, maxY));
      scale.value = 1.1;
    }, [canvasHeight]);

    const onGestureEnd = useCallback(() => {
      'worklet';
      scale.value = withSpring(1);
      
      // Get final bounded position
      const newX = translateX.value;
      const newY = translateY.value;
      
      // Update the start position for next drag
      startPosition.value = { x: newX, y: newY };
      
      runOnJS(setStickies)((prev: StickyItem[]) =>
        prev.map((s) =>
          s.id === sticky.id
            ? { ...s, position: { x: newX, y: newY } }
            : s
        )
      );
      
      runOnJS(Haptics.impactAsync)(Haptics.ImpactFeedbackStyle.Light);
    }, [sticky.id]);

    const animatedStyle = useAnimatedStyle(() => ({
      transform: [
        { translateX: translateX.value },
        { translateY: translateY.value },
        { scale: scale.value },
        { rotate: `${sticky.rotation || 0}deg` },
      ],
    }));

    const noteData = sticky.data as NoteStickyData;
    const colorInfo = STICKY_COLORS.find(c => c.color === noteData.color) || STICKY_COLORS[0];

    return (
      <>
        <PanGestureHandler
          onGestureEvent={onGestureEvent}
          onEnded={onGestureEnd}
        >
          <Animated.View style={[styles.noteSticky, animatedStyle]}>
            <Pressable
              onLongPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                setShowMenu(true);
              }}
              style={[
                styles.noteStickyInner,
                { backgroundColor: colorInfo.color },
              ]}
            >
              <Text
                style={[
                  styles.noteStickyText,
                  { color: colorInfo.textColor },
                ]}
                numberOfLines={6}
              >
                {noteData.content}
              </Text>
              
              {sticky.reaction_count > 0 && (
                <View style={styles.noteStickyReaction}>
                  <Ionicons name="heart" size={12} color="#EF4444" />
                  <Text style={styles.noteStickyReactionText}>{sticky.reaction_count}</Text>
                </View>
              )}
            </Pressable>
          </Animated.View>
        </PanGestureHandler>

        <Modal
          visible={showMenu}
          transparent
          animationType="fade"
          onRequestClose={() => setShowMenu(false)}
        >
          <Pressable style={styles.stickyMenuOverlay} onPress={() => setShowMenu(false)}>
            <View style={styles.stickyMenu}>
              <Text style={styles.stickyMenuTitle}>Sticky Options</Text>
              
              <TouchableOpacity
                style={styles.stickyMenuItem}
                onPress={() => {
                  setShowMenu(false);
                  // TODO: Open edit
                }}
              >
                <Ionicons name="create" size={20} color="#6B7280" />
                <Text style={styles.stickyMenuItemText}>Edit</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.stickyMenuItem}
                onPress={() => {
                  setShowMenu(false);
                  // TODO: Add reaction
                }}
              >
                <Ionicons name="heart" size={20} color="#EF4444" />
                <Text style={styles.stickyMenuItemText}>React</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.stickyMenuItem, styles.stickyMenuItemDanger]}
                onPress={() => {
                  setShowMenu(false);
                  onDelete(sticky.id);
                }}
              >
                <Ionicons name="trash" size={20} color="#EF4444" />
                <Text style={[styles.stickyMenuItemText, styles.stickyMenuItemTextDanger]}>
                  Delete
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.stickyMenuCancel}
                onPress={() => setShowMenu(false)}
              >
                <Text style={styles.stickyMenuCancelText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </Pressable>
        </Modal>
      </>
    );
  };

  // ============================================================================
  // Add Sticky Modal
  // ============================================================================

  const renderAddStickyModal = () => (
    <Modal
      visible={showAddModal}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={handleCloseAddModal}
    >
      <SafeAreaView style={styles.modalContainer} edges={['top']}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalKeyboardView}
        >
          <View style={styles.modalHeader}>
            <Pressable onPress={handleCloseAddModal} style={styles.modalCloseButton}>
              <Ionicons name="close" size={28} color="#6B7280" />
            </Pressable>
            <Text style={styles.modalTitle}>
              {selectedStickyType ? 'Create Sticky' : 'Add to Mood Board'}
            </Text>
            <View style={{ width: 28 }} />
          </View>

          <ScrollView style={styles.modalContent} showsVerticalScrollIndicator={false}>
            {!selectedStickyType ? (
              // Type selection
              <View style={styles.stickyTypeGrid}>
                {STICKY_TYPES.map((type) => (
                  <TouchableOpacity
                    key={type.id}
                    style={styles.stickyTypeCard}
                    onPress={() => handleSelectStickyType(type.id as StickyType)}
                  >
                    <View style={[styles.stickyTypeIcon, { backgroundColor: `${type.color}20` }]}>
                      <Ionicons name={type.icon as any} size={32} color={type.color} />
                    </View>
                    <Text style={styles.stickyTypeLabel}>{type.label}</Text>
                    <Text style={styles.stickyTypeDescription}>{type.description}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            ) : selectedStickyType === 'note' ? (
              // Note creation form
              <View style={styles.noteForm}>
                <Text style={styles.formLabel}>Note Content</Text>
                <TextInput
                  style={styles.noteTextInput}
                  placeholder="Write your idea..."
                  placeholderTextColor="#9CA3AF"
                  multiline
                  numberOfLines={6}
                  value={noteContent}
                  onChangeText={setNoteContent}
                  autoFocus
                  textAlignVertical="top"
                />

                <Text style={styles.formLabel}>Sticky Color</Text>
                <View style={styles.colorPicker}>
                  {STICKY_COLORS.map((color) => (
                    <TouchableOpacity
                      key={color.id}
                      style={[
                        styles.colorOption,
                        { backgroundColor: color.color },
                        noteColor === color.id && styles.colorOptionSelected,
                      ]}
                      onPress={() => setNoteColor(color.id)}
                    >
                      {noteColor === color.id && (
                        <Ionicons name="checkmark" size={20} color={color.textColor} />
                      )}
                    </TouchableOpacity>
                  ))}
                </View>

                <Text style={styles.formLabel}>Category</Text>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  style={styles.categoryPickerScroll}
                >
                  {CATEGORIES.filter(c => c.id !== 'all').map((category) => (
                    <TouchableOpacity
                      key={category.id}
                      style={[
                        styles.categoryPickerChip,
                        noteCategory === category.id && {
                          backgroundColor: category.color,
                        },
                      ]}
                      onPress={() => setNoteCategory(category.id)}
                    >
                      <Ionicons
                        name={category.icon as any}
                        size={16}
                        color={noteCategory === category.id ? '#FFFFFF' : category.color}
                      />
                      <Text
                        style={[
                          styles.categoryPickerChipText,
                          noteCategory === category.id && styles.categoryPickerChipTextActive,
                        ]}
                      >
                        {category.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>

                <TouchableOpacity
                  style={[
                    styles.createButton,
                    !noteContent.trim() && styles.createButtonDisabled,
                  ]}
                  onPress={handleCreateNote}
                  disabled={!noteContent.trim()}
                >
                  <Ionicons name="add-circle" size={20} color="#FFFFFF" />
                  <Text style={styles.createButtonText}>Create Sticky Note</Text>
                </TouchableOpacity>
              </View>
            ) : (
              // Placeholder for other types
              <View style={styles.comingSoon}>
                <Ionicons name="construct-outline" size={64} color="#D1D5DB" />
                <Text style={styles.comingSoonText}>Coming Soon</Text>
                <Text style={styles.comingSoonSubtext}>
                  This sticky type will be available in Phase 3
                </Text>
                <TouchableOpacity
                  style={styles.modalBackButton}
                  onPress={() => setSelectedStickyType(null)}
                >
                  <Text style={styles.modalBackButtonText}>← Choose Another Type</Text>
                </TouchableOpacity>
              </View>
            )}
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </Modal>
  );

  // ============================================================================
  // Main Render
  // ============================================================================

  return (
    <GestureHandlerRootView style={styles.container}>
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <StatusBar barStyle="dark-content" />
        
        {renderHeader()}
        {renderCanvas()}
        {renderDivider()}
        {renderList()}
        {renderAddStickyModal()}
      </SafeAreaView>
    </GestureHandlerRootView>
  );
}

// ============================================================================
// Styles
// ============================================================================

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  safeArea: {
    flex: 1,
  },

  // Header
  header: {
    height: HEADER_HEIGHT,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    backgroundColor: '#FFFFFF',
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1F2937',
    flex: 1,
    marginLeft: 12,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  iconButton: {
    padding: 8,
  },

  // Canvas
  canvasContainer: {
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  canvas: {
    flex: 1,
    position: 'relative',
  },
  canvasPlaceholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  canvasPlaceholderText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#9CA3AF',
    marginTop: 16,
    textAlign: 'center',
  },
  canvasPlaceholderSubtext: {
    fontSize: 14,
    color: '#D1D5DB',
    marginTop: 8,
    textAlign: 'center',
  },

  // Divider
  divider: {
    height: DIVIDER_HEIGHT,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#E5E7EB',
  },
  dividerHandle: {
    flexDirection: 'row',
    gap: 4,
    padding: 12,
  },
  dividerDots: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#9CA3AF',
  },

  // Stats Bar
  statsBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#F9FAFB',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  statText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6B7280',
  },
  statDivider: {
    width: 1,
    height: 16,
    backgroundColor: '#D1D5DB',
    marginHorizontal: 16,
  },

  // Category Filters
  categoryFiltersContainer: {
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  categoryFiltersContent: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 8,
  },
  categoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    backgroundColor: '#F3F4F6',
    marginRight: 8,
  },
  categoryChipText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#6B7280',
  },
  categoryChipTextActive: {
    color: '#FFFFFF',
  },

  // List
  listContainer: {
    backgroundColor: '#F9FAFB',
  },
  listScrollView: {
    flex: 1,
  },
  listContent: {
    padding: 16,
  },

  // List Item Card
  listItemCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  listItemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  listItemCategory: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  listItemCategoryText: {
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  listItemMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  listItemMetaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  listItemMetaText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#6B7280',
  },
  listItemCost: {
    fontSize: 13,
    fontWeight: '600',
    color: '#059669',
  },
  listItemContent: {
    fontSize: 15,
    lineHeight: 22,
    color: '#1F2937',
    marginBottom: 8,
  },
  listItemFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  listItemAuthor: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  listItemAuthorText: {
    fontSize: 12,
    color: '#6B7280',
  },
  taskBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: '#D1FAE5',
  },
  taskBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#059669',
  },
  convertButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: '#EDE9FE',
  },
  convertButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#7C3AED',
  },

  // Empty State
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 48,
  },
  emptyStateText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#9CA3AF',
    marginTop: 16,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: '#D1D5DB',
    marginTop: 4,
  },

  // Add Item Button
  addItemButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 16,
    borderRadius: 8,
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: '#D1D5DB',
    backgroundColor: '#F9FAFB',
    marginTop: 8,
  },
  addItemButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#8B5CF6',
  },

  // Note Sticky
  noteSticky: {
    position: 'absolute',
    width: 120,
    height: 120,
  },
  noteStickyInner: {
    width: '100%',
    height: '100%',
    borderRadius: 4,
    padding: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 4,
  },
  noteStickyText: {
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '500',
  },
  noteStickyReaction: {
    position: 'absolute',
    bottom: 8,
    right: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 10,
  },
  noteStickyReactionText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#6B7280',
  },

  // Sticky Menu
  stickyMenuOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  stickyMenu: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingTop: 20,
    paddingBottom: 40,
    paddingHorizontal: 16,
  },
  stickyMenuTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    textAlign: 'center',
    marginBottom: 16,
  },
  stickyMenuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: '#F9FAFB',
    marginBottom: 8,
  },
  stickyMenuItemText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1F2937',
  },
  stickyMenuItemDanger: {
    backgroundColor: '#FEE2E2',
  },
  stickyMenuItemTextDanger: {
    color: '#EF4444',
  },
  stickyMenuCancel: {
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 8,
  },
  stickyMenuCancelText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6B7280',
  },

  // Add Modal
  modalContainer: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  modalKeyboardView: {
    flex: 1,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  modalCloseButton: {
    padding: 8,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
  },
  modalContent: {
    flex: 1,
  },

  // Sticky Type Grid
  stickyTypeGrid: {
    padding: 16,
    gap: 12,
  },
  stickyTypeCard: {
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  stickyTypeIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  stickyTypeLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4,
  },
  stickyTypeDescription: {
    fontSize: 13,
    color: '#6B7280',
    textAlign: 'center',
  },

  // Note Form
  noteForm: {
    padding: 16,
  },
  formLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
    marginTop: 16,
  },
  noteTextInput: {
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
    padding: 12,
    fontSize: 15,
    color: '#1F2937',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    minHeight: 120,
  },
  colorPicker: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 8,
  },
  colorOption: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  colorOptionSelected: {
    borderColor: '#8B5CF6',
    borderWidth: 3,
  },
  categoryPickerScroll: {
    marginBottom: 8,
  },
  categoryPickerChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    backgroundColor: '#F3F4F6',
    marginRight: 8,
  },
  categoryPickerChipText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#6B7280',
  },
  categoryPickerChipTextActive: {
    color: '#FFFFFF',
  },
  createButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#8B5CF6',
    paddingVertical: 16,
    borderRadius: 8,
    marginTop: 24,
  },
  createButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  createButtonDisabled: {
    backgroundColor: '#D1D5DB',
  },

  // Coming Soon
  comingSoon: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 80,
    paddingHorizontal: 32,
  },
  comingSoonText: {
    fontSize: 20,
    fontWeight: '600',
    color: '#9CA3AF',
    marginTop: 16,
  },
  comingSoonSubtext: {
    fontSize: 14,
    color: '#D1D5DB',
    marginTop: 8,
    textAlign: 'center',
  },
  modalBackButton: {
    marginTop: 24,
    paddingVertical: 12,
    paddingHorizontal: 24,
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
  },
  modalBackButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#6B7280',
  },
});
