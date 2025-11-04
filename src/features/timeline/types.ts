/**
 * Timeline Types for Event Management
 * Port from mobile: apps/mobile/app/events/create/timeline.tsx
 */

export type TimelineBlockType = 'activity' | 'meal' | 'speech' | 'performance' | 'break' | 'custom';

export interface TimelineBlock {
  id: string;
  label: string;
  description: string;
  start_time: string; // HH:MM format
  duration: number; // in minutes
  type: TimelineBlockType;
  guest_visible: boolean;
  notify_before?: number; // minutes before to notify
  order?: number;
}

export interface TimelineBlockTypeConfig {
  value: TimelineBlockType;
  label: string;
  icon: string;
  color: string;
}

export const BLOCK_TYPES: TimelineBlockTypeConfig[] = [
  { value: 'activity', label: 'Activity', icon: '✨', color: '#6366F1' },
  { value: 'meal', label: 'Meal', icon: '🍽️', color: '#10B981' },
  { value: 'speech', label: 'Speech', icon: '🎤', color: '#F59E0B' },
  { value: 'performance', label: 'Performance', icon: '🎭', color: '#EC4899' },
  { value: 'break', label: 'Break', icon: '⏸️', color: '#6B7280' },
  { value: 'custom', label: 'Custom', icon: '➕', color: '#8B5CF6' },
];

export const getBlockTypeConfig = (type: TimelineBlockType): TimelineBlockTypeConfig => {
  return BLOCK_TYPES.find(t => t.value === type) || BLOCK_TYPES[0];
};

export const formatDuration = (minutes: number): string => {
  if (minutes < 60) {
    return `${minutes}min`;
  }
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (mins === 0) {
    return `${hours}h`;
  }
  return `${hours}h ${mins}min`;
};

export const calculateEndTime = (startTime: string, duration: number): string => {
  const [hours, minutes] = startTime.split(':').map(Number);
  const startMinutes = hours * 60 + minutes;
  const endMinutes = startMinutes + duration;
  const endHours = Math.floor(endMinutes / 60) % 24;
  const endMins = endMinutes % 60;
  return `${endHours.toString().padStart(2, '0')}:${endMins.toString().padStart(2, '0')}`;
};
