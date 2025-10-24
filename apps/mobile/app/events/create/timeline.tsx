import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

interface TimelineBlock {
  id: string;
  label: string;
  description: string;
  start_time: string;
  duration: number;
  type: 'activity' | 'meal' | 'speech' | 'performance' | 'break' | 'custom';
  guest_visible: boolean;
  notify_before?: number;
}

const BLOCK_TYPES = [
  { value: 'activity', label: 'Activity', icon: 'sparkles', color: '#6366F1' },
  { value: 'meal', label: 'Meal', icon: 'restaurant', color: '#10B981' },
  { value: 'speech', label: 'Speech', icon: 'mic', color: '#F59E0B' },
  { value: 'performance', label: 'Performance', icon: 'musical-notes', color: '#EC4899' },
  { value: 'break', label: 'Break', icon: 'time', color: '#6B7280' },
  { value: 'custom', label: 'Custom', icon: 'add-circle', color: '#8B5CF6' },
];

export default function TimelineScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  
  const [blocks, setBlocks] = useState<TimelineBlock[]>([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newBlock, setNewBlock] = useState({
    label: '',
    description: '',
    start_time: '',
    duration: 60,
    type: 'activity' as TimelineBlock['type'],
    guest_visible: true,
    notify_before: 0,
  });
  const [isLoading, setIsLoading] = useState(false);

  const addBlock = () => {
    if (!newBlock.label.trim()) {
      Alert.alert('Error', 'Please enter a block label');
      return;
    }

    if (!newBlock.start_time) {
      Alert.alert('Error', 'Please enter a start time');
      return;
    }

    const block: TimelineBlock = {
      id: Date.now().toString(),
      ...newBlock,
    };

    setBlocks([...blocks, block].sort((a, b) => 
      a.start_time.localeCompare(b.start_time)
    ));
    
    setNewBlock({
      label: '',
      description: '',
      start_time: '',
      duration: 60,
      type: 'activity',
      guest_visible: true,
      notify_before: 0,
    });
    setShowAddForm(false);
  };

  const removeBlock = (id: string) => {
    setBlocks(blocks.filter(b => b.id !== id));
  };

  const handleContinue = () => {
    if (blocks.length === 0) {
      Alert.alert(
        'No Timeline',
        'You can add timeline blocks later, or add some now.',
        [
          { text: 'Add Blocks', style: 'cancel' },
          {
            text: 'Skip',
            onPress: () => router.push({
              pathname: '/events/create/review',
              params: { ...params, timelineCount: '0' },
            }),
          },
        ]
      );
      return;
    }

    router.push({
      pathname: '/events/create/review',
      params: { 
        ...params, 
        timeline: JSON.stringify(blocks),
        timelineCount: blocks.length.toString(),
      },
    });
  };

  const getTypeConfig = (type: string) => {
    return BLOCK_TYPES.find(t => t.value === type) || BLOCK_TYPES[0];
  };

  return (
    <ScrollView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#000" />
        </TouchableOpacity>
        <Text style={styles.title}>Timeline</Text>
        <View style={{ width: 24 }} />
      </View>

      {/* Progress Indicator */}
      <View style={styles.progressContainer}>
        <View style={[styles.progressDot, styles.progressDotActive]} />
        <View style={[styles.progressLine, styles.progressLineActive]} />
        <View style={[styles.progressDot, styles.progressDotActive]} />
        <View style={[styles.progressLine, styles.progressLineActive]} />
        <View style={[styles.progressDot, styles.progressDotActive]} />
        <View style={[styles.progressLine, styles.progressLineActive]} />
        <View style={[styles.progressDot, styles.progressDotActive]} />
        <View style={styles.progressLine} />
        <View style={styles.progressDot} />
      </View>
      <Text style={styles.stepText}>Step 4 of 5</Text>

      {/* Add Block Button */}
      {!showAddForm && (
        <View style={styles.section}>
          <TouchableOpacity
            style={styles.addBlockButton}
            onPress={() => setShowAddForm(true)}
          >
            <Ionicons name="add-circle" size={24} color="#6366F1" />
            <Text style={styles.addBlockButtonText}>Add Timeline Block</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Add Block Form */}
      {showAddForm && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>New Timeline Block</Text>

          <TextInput
            style={styles.input}
            placeholder="Block Label *"
            value={newBlock.label}
            onChangeText={(text) => setNewBlock({ ...newBlock, label: text })}
          />

          <TextInput
            style={styles.input}
            placeholder="Description"
            value={newBlock.description}
            onChangeText={(text) => setNewBlock({ ...newBlock, description: text })}
            multiline
            numberOfLines={3}
          />

          <Text style={styles.label}>Block Type</Text>
          <View style={styles.typeGrid}>
            {BLOCK_TYPES.map((type) => (
              <TouchableOpacity
                key={type.value}
                style={[
                  styles.typeButton,
                  newBlock.type === type.value && {
                    backgroundColor: type.color,
                    borderColor: type.color,
                  },
                ]}
                onPress={() => setNewBlock({ ...newBlock, type: type.value as any })}
              >
                <Ionicons
                  name={type.icon as any}
                  size={20}
                  color={newBlock.type === type.value ? '#FFF' : type.color}
                />
                <Text
                  style={[
                    styles.typeButtonText,
                    newBlock.type === type.value && styles.typeButtonTextActive,
                  ]}
                >
                  {type.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <TextInput
            style={styles.input}
            placeholder="Start Time (HH:MM) *"
            value={newBlock.start_time}
            onChangeText={(text) => setNewBlock({ ...newBlock, start_time: text })}
            keyboardType="numbers-and-punctuation"
          />

          <View style={styles.durationContainer}>
            <Text style={styles.label}>Duration (minutes)</Text>
            <View style={styles.durationControls}>
              <TouchableOpacity
                style={styles.durationButton}
                onPress={() =>
                  setNewBlock({
                    ...newBlock,
                    duration: Math.max(15, newBlock.duration - 15),
                  })
                }
              >
                <Ionicons name="remove" size={20} color="#6366F1" />
              </TouchableOpacity>
              <Text style={styles.durationValue}>{newBlock.duration} min</Text>
              <TouchableOpacity
                style={styles.durationButton}
                onPress={() =>
                  setNewBlock({ ...newBlock, duration: newBlock.duration + 15 })
                }
              >
                <Ionicons name="add" size={20} color="#6366F1" />
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.switchRow}>
            <Text style={styles.label}>Visible to guests</Text>
            <TouchableOpacity
              style={[
                styles.switch,
                newBlock.guest_visible && styles.switchActive,
              ]}
              onPress={() =>
                setNewBlock({ ...newBlock, guest_visible: !newBlock.guest_visible })
              }
            >
              <View
                style={[
                  styles.switchThumb,
                  newBlock.guest_visible && styles.switchThumbActive,
                ]}
              />
            </TouchableOpacity>
          </View>

          <View style={styles.formActions}>
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={() => setShowAddForm(false)}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.saveButton} onPress={addBlock}>
              <Text style={styles.saveButtonText}>Add Block</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Timeline Blocks List */}
      {blocks.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            Timeline ({blocks.length} blocks)
          </Text>
          {blocks.map((block) => {
            const typeConfig = getTypeConfig(block.type);
            return (
              <View key={block.id} style={styles.blockCard}>
                <View style={styles.blockHeader}>
                  <View style={[styles.blockIcon, { backgroundColor: typeConfig.color }]}>
                    <Ionicons name={typeConfig.icon as any} size={16} color="#FFF" />
                  </View>
                  <View style={styles.blockInfo}>
                    <Text style={styles.blockLabel}>{block.label}</Text>
                    <Text style={styles.blockTime}>
                      {block.start_time} • {block.duration} min
                    </Text>
                  </View>
                  <TouchableOpacity onPress={() => removeBlock(block.id)}>
                    <Ionicons name="trash-outline" size={20} color="#EF4444" />
                  </TouchableOpacity>
                </View>
                {block.description ? (
                  <Text style={styles.blockDescription}>{block.description}</Text>
                ) : null}
                <View style={styles.blockMeta}>
                  <Text style={styles.blockType}>{typeConfig.label}</Text>
                  {block.guest_visible && (
                    <Text style={styles.blockVisible}>Visible to guests</Text>
                  )}
                </View>
              </View>
            );
          })}
        </View>
      )}

      {/* Continue Button */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={styles.continueButton}
          onPress={handleContinue}
          disabled={isLoading}
        >
          {isLoading ? (
            <ActivityIndicator color="#FFF" />
          ) : (
            <>
              <Text style={styles.continueButtonText}>Continue</Text>
              <Ionicons name="arrow-forward" size={20} color="#FFF" />
            </>
          )}
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#FFF',
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 32,
    paddingTop: 20,
  },
  progressDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#E5E7EB',
  },
  progressDotActive: {
    backgroundColor: '#6366F1',
  },
  progressLine: {
    flex: 1,
    height: 2,
    backgroundColor: '#E5E7EB',
    marginHorizontal: 4,
  },
  progressLineActive: {
    backgroundColor: '#6366F1',
  },
  stepText: {
    textAlign: 'center',
    color: '#6B7280',
    fontSize: 14,
    marginTop: 8,
  },
  section: {
    backgroundColor: '#FFF',
    padding: 16,
    marginTop: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
  },
  addBlockButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    backgroundColor: '#EEF2FF',
    borderRadius: 8,
    gap: 8,
  },
  addBlockButtonText: {
    color: '#6366F1',
    fontSize: 16,
    fontWeight: '600',
  },
  input: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    marginBottom: 12,
    backgroundColor: '#FFF',
  },
  label: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 8,
  },
  typeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  typeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    gap: 4,
  },
  typeButtonText: {
    fontSize: 14,
    color: '#374151',
  },
  typeButtonTextActive: {
    color: '#FFF',
    fontWeight: '600',
  },
  durationContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  durationControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  durationButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#EEF2FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  durationValue: {
    fontSize: 16,
    fontWeight: '600',
    minWidth: 70,
    textAlign: 'center',
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  switch: {
    width: 50,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#D1D5DB',
    padding: 2,
  },
  switchActive: {
    backgroundColor: '#6366F1',
  },
  switchThumb: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: '#FFF',
  },
  switchThumbActive: {
    transform: [{ translateX: 20 }],
  },
  formActions: {
    flexDirection: 'row',
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    padding: 14,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
  },
  saveButton: {
    flex: 1,
    padding: 14,
    backgroundColor: '#6366F1',
    borderRadius: 8,
    alignItems: 'center',
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFF',
  },
  blockCard: {
    padding: 12,
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
    marginBottom: 12,
  },
  blockHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  blockIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  blockInfo: {
    flex: 1,
  },
  blockLabel: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  blockTime: {
    fontSize: 14,
    color: '#6B7280',
  },
  blockDescription: {
    fontSize: 14,
    color: '#374151',
    marginBottom: 8,
    marginLeft: 44,
  },
  blockMeta: {
    flexDirection: 'row',
    gap: 12,
    marginLeft: 44,
  },
  blockType: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '500',
  },
  blockVisible: {
    fontSize: 12,
    color: '#10B981',
    fontWeight: '500',
  },
  footer: {
    padding: 16,
    paddingBottom: 32,
  },
  continueButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#6366F1',
    padding: 16,
    borderRadius: 8,
    gap: 8,
  },
  continueButtonText: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: '600',
  },
});
