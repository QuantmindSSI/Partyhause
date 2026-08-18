import { apiGet, apiPut } from './api-client';
import { TimelineBlock } from '@/features/timeline/types';

// Parse "HH:MM" into minutes-since-midnight for sorting. Avoids
// `new Date('1970-01-01 HH:MM')` non-ISO parsing (Safari-fragile, and NaN
// for anything that isn't exactly that shape).
const timeToMinutes = (time: string | undefined): number => {
  if (!time) return Number.MAX_SAFE_INTEGER;
  const match = /^(\d{1,2}):(\d{2})/.exec(time);
  if (!match) return Number.MAX_SAFE_INTEGER;
  return parseInt(match[1], 10) * 60 + parseInt(match[2], 10);
};

export const timelineService = {
  // Get timeline blocks for an event.
  // SOURCE OF TRUTH: the events.timeline_blocks JSON column — that is what
  // every write path updates. (The /api/timeline table endpoint reads the
  // separate timeline_blocks TABLE which nothing populates; reading it here
  // returned [] and made add/update/delete destroy existing timelines.)
  getEventTimeline: async (eventId: string): Promise<TimelineBlock[]> => {
    try {
      const { data, error } = await apiGet<{ event?: { timeline_blocks?: TimelineBlock[] } }>(
        `/api/events/${encodeURIComponent(eventId)}`,
      );

      if (error) throw error;
      const blocks = data?.event?.timeline_blocks;
      return Array.isArray(blocks) ? blocks : [];
    } catch (error) {
      console.error('Error fetching timeline:', error);
      return [];
    }
  },

  // Update timeline blocks for an event
  updateEventTimeline: async (eventId: string, timelineBlocks: TimelineBlock[]): Promise<TimelineBlock[]> => {
    try {
      // Sort blocks by start time (stable numeric comparison on "HH:MM")
      const sortedBlocks = [...timelineBlocks].sort(
        (a, b) => timeToMinutes(a.start_time) - timeToMinutes(b.start_time),
      );

      // Update order based on sort
      const blocksWithOrder = sortedBlocks.map((block, index) => ({
        ...block,
        order: index
      }));

      // timeline_blocks is stored on the event; update via PUT /api/events/:id
      const { data, error } = await apiPut<{ event?: { timeline_blocks?: TimelineBlock[] } }>(
        `/api/events/${encodeURIComponent(eventId)}`,
        { timeline_blocks: blocksWithOrder },
      );

      if (error) throw error;
      // Prefer the timeline_blocks returned on the event, fall back to the
      // locally-computed ordered list so callers always get the new order.
      return data?.event?.timeline_blocks || blocksWithOrder;
    } catch (error) {
      console.error('Error updating timeline:', error);
      throw error;
    }
  },

  // Add a single timeline block to an event
  addTimelineBlock: async (
    eventId: string, 
    blockData: Omit<TimelineBlock, 'id' | 'order'>
  ): Promise<TimelineBlock[]> => {
    try {
      // Get current timeline
      const currentTimeline = await timelineService.getEventTimeline(eventId);

      // Create new block with unique ID
      const newBlock: TimelineBlock = {
        id: `block_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        label: blockData.label,
        description: blockData.description || '',
        start_time: blockData.start_time,
        duration: blockData.duration,
        type: blockData.type,
        guest_visible: blockData.guest_visible !== undefined ? blockData.guest_visible : true,
        notify_before: blockData.notify_before || 0,
        order: currentTimeline.length,
      };

      // Add to timeline
      const updatedTimeline = [...currentTimeline, newBlock];

      // Update in database
      return await timelineService.updateEventTimeline(eventId, updatedTimeline);
    } catch (error) {
      console.error('Error adding timeline block:', error);
      throw error;
    }
  },

  // Update a specific timeline block
  updateTimelineBlock: async (
    eventId: string, 
    blockId: string, 
    blockData: Partial<TimelineBlock>
  ): Promise<TimelineBlock[]> => {
    try {
      // Get current timeline
      const currentTimeline = await timelineService.getEventTimeline(eventId);

      // Find and update the block
      const blockIndex = currentTimeline.findIndex(block => block.id === blockId);
      if (blockIndex === -1) {
        throw new Error('Timeline block not found');
      }

      // Update the block
      const updatedTimeline = currentTimeline.map(block =>
        block.id === blockId
          ? { ...block, ...blockData }
          : block
      );

      // Update in database
      return await timelineService.updateEventTimeline(eventId, updatedTimeline);
    } catch (error) {
      console.error('Error updating timeline block:', error);
      throw error;
    }
  },

  // Delete a timeline block
  deleteTimelineBlock: async (eventId: string, blockId: string): Promise<TimelineBlock[]> => {
    try {
      // Get current timeline
      const currentTimeline = await timelineService.getEventTimeline(eventId);

      // Remove the block
      const updatedTimeline = currentTimeline.filter(block => block.id !== blockId);

      // Update in database
      return await timelineService.updateEventTimeline(eventId, updatedTimeline);
    } catch (error) {
      console.error('Error deleting timeline block:', error);
      throw error;
    }
  },

  // Get timeline blocks visible to guests
  getPublicTimeline: async (eventId: string): Promise<TimelineBlock[]> => {
    try {
      const timeline = await timelineService.getEventTimeline(eventId);
      
      // Filter for guest-visible blocks
      return timeline.filter(block => block.guest_visible);
    } catch (error) {
      console.error('Error fetching public timeline:', error);
      return [];
    }
  }
};