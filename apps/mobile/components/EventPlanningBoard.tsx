/**
 * Event Planning Blocks - Mobile Component Mockup
 * 
 * This is a conceptual implementation showing how the Kanban-style
 * planning blocks feature could work in the mobile app.
 */

import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Dimensions } from 'react-native';
import { GestureDetector, Gesture } from 'react-native-gesture-handler';
import Animated, { useSharedValue, useAnimatedStyle, withSpring } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// Block types with colors and icons
const BLOCK_TYPES = {
  catering: { icon: '🍽️', color: '#FF6B6B', name: 'Catering' },
  entertainment: { icon: '🎵', color: '#A78BFA', name: 'Entertainment' },
  venue: { icon: '📍', color: '#10B981', name: 'Venue' },
  photography: { icon: '📸', color: '#3B82F6', name: 'Photography' },
  decoration: { icon: '🎨', color: '#EC4899', name: 'Decoration' },
  gifts: { icon: '🎁', color: '#F59E0B', name: 'Gifts & Favors' },
  transportation: { icon: '🚗', color: '#6366F1', name: 'Transportation' },
  invitations: { icon: '💌', color: '#8B5CF6', name: 'Invitations' },
  desserts: { icon: '🎂', color: '#F97316', name: 'Desserts' },
  audioVisual: { icon: '🎤', color: '#14B8A6', name: 'Audio/Visual' },
  attire: { icon: '👔', color: '#6B7280', name: 'Attire' },
  activities: { icon: '🎮', color: '#06B6D4', name: 'Activities' },
};

// Kanban stages
const STAGES = [
  { id: 'to-plan', title: '📋 To Plan', color: '#9CA3AF' },
  { id: 'in-planning', title: '💭 In Planning', color: '#3B82F6' },
  { id: 'vendor-assigned', title: '🤝 Vendor Assigned', color: '#F59E0B' },
  { id: 'confirmed', title: '✅ Confirmed', color: '#10B981' },
  { id: 'in-progress', title: '🚀 In Progress', color: '#8B5CF6' },
  { id: 'completed', title: '✔️ Completed', color: '#059669' },
];

interface PlanningBlock {
  id: string;
  type: keyof typeof BLOCK_TYPES;
  title: string;
  status: string;
  progress: number;
  assignedTo?: {
    name: string;
    role: string;
    avatar?: string;
  };
  vendor?: {
    name: string;
    status: string;
  };
  tasks: {
    total: number;
    completed: number;
  };
  budget?: {
    estimated: number;
    actual?: number;
  };
  lastUpdate?: string;
  dueDate?: string;
}

// Sample data
const SAMPLE_BLOCKS: PlanningBlock[] = [
  {
    id: '1',
    type: 'catering',
    title: 'Wedding Catering',
    status: 'in-planning',
    progress: 60,
    assignedTo: { name: 'Sarah', role: 'Host' },
    tasks: { total: 5, completed: 3 },
    budget: { estimated: 2500 },
    lastUpdate: '2 hours ago',
    dueDate: 'Nov 15',
  },
  {
    id: '2',
    type: 'venue',
    title: 'Grand Ballroom',
    status: 'confirmed',
    progress: 100,
    vendor: { name: 'Manhattan Hall', status: 'Confirmed' },
    assignedTo: { name: 'John', role: 'Venue Manager' },
    tasks: { total: 4, completed: 4 },
    budget: { estimated: 5000, actual: 4800 },
    lastUpdate: '1 day ago',
  },
  {
    id: '3',
    type: 'photography',
    title: 'Event Photography',
    status: 'vendor-assigned',
    progress: 30,
    vendor: { name: 'Studio Flash', status: 'Pending Approval' },
    tasks: { total: 3, completed: 1 },
    budget: { estimated: 1500 },
    lastUpdate: '3 hours ago',
  },
  {
    id: '4',
    type: 'entertainment',
    title: 'DJ & Sound',
    status: 'to-plan',
    progress: 0,
    tasks: { total: 0, completed: 0 },
    budget: { estimated: 800 },
  },
];

export const EventPlanningBoard = ({ eventId }: { eventId: string }) => {
  const [blocks, setBlocks] = useState<PlanningBlock[]>(SAMPLE_BLOCKS);
  const [selectedStage, setSelectedStage] = useState('all');
  const [viewMode, setViewMode] = useState<'kanban' | 'timeline' | 'grid'>('kanban');

  const renderBlockCard = (block: PlanningBlock) => {
    const blockType = BLOCK_TYPES[block.type];
    
    return (
      <TouchableOpacity
        key={block.id}
        style={[styles.blockCard, { borderLeftColor: blockType.color }]}
        activeOpacity={0.7}
      >
        {/* Header */}
        <View style={styles.blockHeader}>
          <View style={[styles.iconBadge, { backgroundColor: blockType.color + '20' }]}>
            <Text style={styles.blockIcon}>{blockType.icon}</Text>
          </View>
          <View style={styles.blockInfo}>
            <Text style={styles.blockTitle}>{block.title}</Text>
            <Text style={styles.blockType}>{blockType.name}</Text>
          </View>
          <TouchableOpacity style={styles.moreButton}>
            <Text style={styles.moreIcon}>⋮</Text>
          </TouchableOpacity>
        </View>

        {/* Progress Bar */}
        {block.progress > 0 && (
          <View style={styles.progressSection}>
            <View style={styles.progressBar}>
              <View
                style={[
                  styles.progressFill,
                  { width: `${block.progress}%`, backgroundColor: blockType.color },
                ]}
              />
            </View>
            <Text style={styles.progressText}>{block.progress}% Complete</Text>
          </View>
        )}

        {/* Tasks */}
        {block.tasks.total > 0 && (
          <View style={styles.tasksSection}>
            <Text style={styles.tasksText}>
              {block.tasks.completed} of {block.tasks.total} tasks done
            </Text>
          </View>
        )}

        {/* Assignment */}
        {block.assignedTo && (
          <View style={styles.assignmentSection}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>
                {block.assignedTo.name.charAt(0)}
              </Text>
            </View>
            <View>
              <Text style={styles.assignedName}>{block.assignedTo.name}</Text>
              <Text style={styles.assignedRole}>{block.assignedTo.role}</Text>
            </View>
          </View>
        )}

        {/* Vendor */}
        {block.vendor && (
          <View style={styles.vendorSection}>
            <Text style={styles.vendorIcon}>🤝</Text>
            <View>
              <Text style={styles.vendorName}>{block.vendor.name}</Text>
              <Text style={styles.vendorStatus}>{block.vendor.status}</Text>
            </View>
          </View>
        )}

        {/* Footer */}
        <View style={styles.blockFooter}>
          {block.budget && (
            <Text style={styles.budgetText}>
              💰 ${block.budget.actual || block.budget.estimated}
            </Text>
          )}
          {block.lastUpdate && (
            <Text style={styles.updateText}>🕐 {block.lastUpdate}</Text>
          )}
        </View>

        {/* Live indicator if recently updated */}
        {block.lastUpdate?.includes('ago') && parseInt(block.lastUpdate) < 10 && (
          <View style={styles.liveIndicator}>
            <View style={styles.liveDot} />
            <Text style={styles.liveText}>LIVE</Text>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  const renderKanbanView = () => {
    return (
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.kanbanScroll}>
        {STAGES.map((stage) => {
          const stageBlocks = blocks.filter((b) => b.status === stage.id);
          
          return (
            <View key={stage.id} style={styles.kanbanColumn}>
              <View style={[styles.stageHeader, { backgroundColor: stage.color + '20' }]}>
                <Text style={styles.stageTitle}>{stage.title}</Text>
                <View style={[styles.stageBadge, { backgroundColor: stage.color }]}>
                  <Text style={styles.stageBadgeText}>{stageBlocks.length}</Text>
                </View>
              </View>
              
              <ScrollView style={styles.stageContent} showsVerticalScrollIndicator={false}>
                {stageBlocks.map(renderBlockCard)}
                
                {/* Add block button */}
                <TouchableOpacity style={styles.addBlockButton}>
                  <Text style={styles.addBlockIcon}>+</Text>
                  <Text style={styles.addBlockText}>Add Block</Text>
                </TouchableOpacity>
              </ScrollView>
            </View>
          );
        })}
      </ScrollView>
    );
  };

  const renderBlockLibrary = () => {
    return (
      <View style={styles.blockLibrary}>
        <Text style={styles.libraryTitle}>📚 Block Library</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {Object.entries(BLOCK_TYPES).map(([key, value]) => (
            <TouchableOpacity
              key={key}
              style={[styles.libraryBlock, { borderColor: value.color }]}
            >
              <Text style={styles.libraryIcon}>{value.icon}</Text>
              <Text style={styles.libraryName}>{value.name}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>
    );
  };

  const renderVendorMarketplace = () => {
    return (
      <View style={styles.marketplaceSection}>
        <TouchableOpacity style={styles.marketplaceButton}>
          <LinearGradient
            colors={['#6366F1', '#8B5CF6']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.marketplaceGradient}
          >
            <Text style={styles.marketplaceIcon}>🔍</Text>
            <Text style={styles.marketplaceText}>Find Vendors</Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.eventTitle}>🎉 Sarah's Wedding</Text>
          <Text style={styles.eventSubtitle}>
            {blocks.filter((b) => b.status === 'completed').length} of {blocks.length} blocks complete
          </Text>
        </View>
        <TouchableOpacity style={styles.viewToggle}>
          <Text style={styles.viewToggleText}>≡</Text>
        </TouchableOpacity>
      </View>

      {/* Overall Progress */}
      <View style={styles.overallProgress}>
        <View style={styles.progressCircle}>
          <Text style={styles.progressPercentage}>
            {Math.round(
              (blocks.reduce((sum, b) => sum + b.progress, 0) / blocks.length)
            )}%
          </Text>
        </View>
        <View style={styles.progressInfo}>
          <Text style={styles.progressTitle}>Event Planning Progress</Text>
          <Text style={styles.progressDetails}>
            On track • {blocks.filter((b) => b.vendor).length} vendors hired
          </Text>
        </View>
      </View>

      {/* Block Library */}
      {renderBlockLibrary()}

      {/* Vendor Marketplace */}
      {renderVendorMarketplace()}

      {/* Main Content */}
      {viewMode === 'kanban' && renderKanbanView()}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  eventTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#111827',
  },
  eventSubtitle: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 4,
  },
  viewToggle: {
    width: 40,
    height: 40,
    borderRadius: 8,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  viewToggleText: {
    fontSize: 20,
    color: '#6B7280',
  },
  overallProgress: {
    flexDirection: 'row',
    padding: 20,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
  },
  progressCircle: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: '#EEF2FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  progressPercentage: {
    fontSize: 24,
    fontWeight: '700',
    color: '#6366F1',
  },
  progressInfo: {
    flex: 1,
  },
  progressTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  progressDetails: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 4,
  },
  blockLibrary: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  libraryTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 12,
  },
  libraryBlock: {
    width: 80,
    height: 80,
    borderRadius: 12,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    backgroundColor: '#FFFFFF',
  },
  libraryIcon: {
    fontSize: 28,
  },
  libraryName: {
    fontSize: 10,
    color: '#6B7280',
    marginTop: 4,
    textAlign: 'center',
  },
  marketplaceSection: {
    padding: 16,
    backgroundColor: '#FFFFFF',
  },
  marketplaceButton: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  marketplaceGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
  },
  marketplaceIcon: {
    fontSize: 20,
    marginRight: 8,
  },
  marketplaceText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  kanbanScroll: {
    flex: 1,
  },
  kanbanColumn: {
    width: SCREEN_WIDTH * 0.85,
    marginLeft: 16,
    marginTop: 16,
  },
  stageHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
  },
  stageTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  stageBadge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  stageBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  stageContent: {
    flex: 1,
  },
  blockCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderLeftWidth: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  blockHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  iconBadge: {
    width: 40,
    height: 40,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  blockIcon: {
    fontSize: 20,
  },
  blockInfo: {
    flex: 1,
  },
  blockTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  blockType: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
  },
  moreButton: {
    padding: 4,
  },
  moreIcon: {
    fontSize: 20,
    color: '#9CA3AF',
  },
  progressSection: {
    marginBottom: 12,
  },
  progressBar: {
    height: 6,
    backgroundColor: '#E5E7EB',
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: 4,
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
  },
  progressText: {
    fontSize: 12,
    color: '#6B7280',
  },
  tasksSection: {
    marginBottom: 12,
  },
  tasksText: {
    fontSize: 13,
    color: '#6B7280',
  },
  assignmentSection: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#6366F1',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  avatarText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  assignedName: {
    fontSize: 14,
    fontWeight: '500',
    color: '#111827',
  },
  assignedRole: {
    fontSize: 12,
    color: '#6B7280',
  },
  vendorSection: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
    marginBottom: 12,
  },
  vendorIcon: {
    fontSize: 20,
    marginRight: 8,
  },
  vendorName: {
    fontSize: 14,
    fontWeight: '500',
    color: '#111827',
  },
  vendorStatus: {
    fontSize: 12,
    color: '#6B7280',
  },
  blockFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  budgetText: {
    fontSize: 13,
    color: '#059669',
    fontWeight: '500',
  },
  updateText: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  liveIndicator: {
    position: 'absolute',
    top: 12,
    right: 12,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EF4444',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#FFFFFF',
    marginRight: 4,
  },
  liveText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  addBlockButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#E5E7EB',
    borderStyle: 'dashed',
    backgroundColor: '#F9FAFB',
  },
  addBlockIcon: {
    fontSize: 20,
    color: '#9CA3AF',
    marginRight: 8,
  },
  addBlockText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6B7280',
  },
});

export default EventPlanningBoard;
