import { CategoryInfo, StickyColor } from './types';

export const CATEGORIES: CategoryInfo[] = [
  { id: 'all', label: 'All', icon: 'grid-3x3-gap', color: '#6B7280' },
  { id: 'venue', label: 'Venue', icon: 'map-pin', color: '#3B82F6' },
  { id: 'entertainment', label: 'Entertainment', icon: 'music', color: '#10B981' },
  { id: 'food', label: 'Food', icon: 'utensils', color: '#F59E0B' },
  { id: 'activities', label: 'Activities', icon: 'activity', color: '#EF4444' },
  { id: 'decor', label: 'Decor', icon: 'palette', color: '#EC4899' },
  { id: 'other', label: 'Other', icon: 'more-horizontal', color: '#6B7280' },
];

export const STICKY_COLORS: StickyColor[] = [
  { id: 'yellow', name: 'Yellow', color: '#FEFCE8', textColor: '#713F12' },
  { id: 'pink', name: 'Pink', color: '#FCE7F3', textColor: '#831843' },
  { id: 'blue', name: 'Blue', color: '#DBEAFE', textColor: '#1E3A8A' },
  { id: 'green', name: 'Green', color: '#DCFCE7', textColor: '#14532D' },
  { id: 'purple', name: 'Purple', color: '#EDE9FE', textColor: '#4C1D95' },
  { id: 'orange', name: 'Orange', color: '#FED7AA', textColor: '#7C2D12' },
];

export const DEFAULT_STICKY_SIZE = {
  width: 200,
  height: 200,
};

export const CANVAS_CONFIG = {
  MIN_ZOOM: 0.25,
  MAX_ZOOM: 2.0,
  ZOOM_STEP: 0.25,
  GRID_SIZE: 20,
  DEFAULT_ZOOM: 1.0,
  DEFAULT_PAN: { x: 0, y: 0 },
};

export const STICKY_TYPES = [
  { id: 'note', label: 'Note', icon: 'sticky-note', color: '#F59E0B', description: 'Quick text note' },
  { id: 'poll', label: 'Poll', icon: 'bar-chart-2', color: '#8B5CF6', description: 'Quick vote' },
  { id: 'idea', label: 'Idea', icon: 'lightbulb', color: '#10B981', description: 'Brainstorm idea' },
  { id: 'image', label: 'Image', icon: 'image', color: '#EC4899', description: 'Add a photo' },
  { id: 'link', label: 'Link', icon: 'link', color: '#3B82F6', description: 'Web link' },
  { id: 'checklist', label: 'Checklist', icon: 'check-square', color: '#06B6D4', description: 'Todo list' },
];

export const getCategoryInfo = (categoryId: string): CategoryInfo => {
  return CATEGORIES.find((cat) => cat.id === categoryId) || CATEGORIES[6]; // Default to 'other'
};

export const getStickyColor = (colorId: string): StickyColor => {
  return STICKY_COLORS.find((c) => c.id === colorId) || STICKY_COLORS[0]; // Default to yellow
};
