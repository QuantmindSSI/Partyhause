import { useState, useEffect, useCallback } from 'react';
import { StickyItem, CreateNoteData, CreateIdeaData, UpdateStickyPosition, CanvasStats } from '../types';
import { DEFAULT_STICKY_SIZE, STICKY_COLORS } from '../constants';

interface UsePartyBoardOptions {
  eventId: string;
  sessionId?: string;
  autoRefresh?: boolean;
}

export const usePartyBoard = ({ eventId, sessionId, autoRefresh = false }: UsePartyBoardOptions) => {
  const [stickies, setStickies] = useState<StickyItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch stickies for the event/session
  const fetchStickies = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams({ event_id: eventId });
      if (sessionId) {
        params.append('session_id', sessionId);
      }

      const response = await fetch(`/api/partyboard/stickies?${params}`, {
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch stickies');
      }

      const data = await response.json();
      setStickies(data.stickies || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch stickies');
    } finally {
      setLoading(false);
    }
  }, [eventId, sessionId]);

  // Create a new note sticky
  const createNote = async (noteData: CreateNoteData): Promise<StickyItem | null> => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/partyboard/stickies', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          event_id: eventId,
          session_id: sessionId,
          type: 'note',
          position: noteData.position || { x: 100, y: 100 },
          size: DEFAULT_STICKY_SIZE,
          category: noteData.category,
          data: {
            content: noteData.content,
            color: noteData.color,
            font_size: 14,
          },
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to create note');
      }

      const data = await response.json();
      const newSticky = data.sticky;

      // Add to local state
      setStickies((prev) => [...prev, newSticky]);

      return newSticky;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create note');
      return null;
    } finally {
      setLoading(false);
    }
  };

  // Create a new idea sticky
  const createIdea = async (ideaData: CreateIdeaData): Promise<StickyItem | null> => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/partyboard/stickies', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          event_id: eventId,
          session_id: sessionId,
          type: 'idea',
          position: ideaData.position || { x: 100, y: 100 },
          size: DEFAULT_STICKY_SIZE,
          category: ideaData.category,
          data: {
            content: ideaData.content,
            category: ideaData.category,
            estimated_cost: ideaData.estimated_cost,
            votes: 0,
            user_has_voted: false,
            reactions: 0,
            converted_to_task: false,
          },
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to create idea');
      }

      const data = await response.json();
      const newSticky = data.sticky;

      // Add to local state
      setStickies((prev) => [...prev, newSticky]);

      return newSticky;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create idea');
      return null;
    } finally {
      setLoading(false);
    }
  };

  // Vote on an idea
  const voteOnIdea = async (stickyId: string): Promise<boolean> => {
    try {
      const response = await fetch(`/api/partyboard/stickies/${stickyId}/vote`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to vote on idea');
      }

      const data = await response.json();

      // Update local state with optimistic update
      setStickies((prev) =>
        prev.map((sticky) =>
          sticky.id === stickyId
            ? {
                ...sticky,
                data: {
                  ...sticky.data,
                  votes: data.votes,
                  user_has_voted: data.user_has_voted,
                } as any,
              }
            : sticky
        )
      );

      return true;
    } catch (err) {
      console.error('Failed to vote on idea:', err);
      return false;
    }
  };

  // Convert idea to task
  const convertToTask = async (stickyId: string): Promise<boolean> => {
    try {
      const response = await fetch(`/api/partyboard/stickies/${stickyId}/convert-to-task`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to convert to task');
      }

      const data = await response.json();

      // Update local state
      setStickies((prev) =>
        prev.map((sticky) =>
          sticky.id === stickyId
            ? {
                ...sticky,
                data: {
                  ...sticky.data,
                  converted_to_task: true,
                  task_id: data.task_id,
                } as any,
              }
            : sticky
        )
      );

      return true;
    } catch (err) {
      console.error('Failed to convert to task:', err);
      return false;
    }
  };

  // Update sticky position
  const updateStickyPosition = async (stickyId: string, position: { x: number; y: number }): Promise<boolean> => {
    try {
      const response = await fetch(`/api/partyboard/stickies/${stickyId}/position`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ position }),
      });

      if (!response.ok) {
        throw new Error('Failed to update position');
      }

      // Update local state
      setStickies((prev) =>
        prev.map((sticky) =>
          sticky.id === stickyId ? { ...sticky, position } : sticky
        )
      );

      return true;
    } catch (err) {
      console.error('Failed to update sticky position:', err);
      return false;
    }
  };

  // Delete a sticky
  const deleteSticky = async (stickyId: string): Promise<boolean> => {
    try {
      const response = await fetch(`/api/partyboard/stickies/${stickyId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to delete sticky');
      }

      // Remove from local state
      setStickies((prev) => prev.filter((sticky) => sticky.id !== stickyId));

      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete sticky');
      return false;
    }
  };

  // Calculate canvas stats
  const getStats = useCallback((): CanvasStats => {
    const ideas = stickies.filter((s) => s.type === 'idea').length;
    const tasks = stickies.filter((s) => s.type === 'idea' && (s.data as any).converted_to_task).length;
    const votes = stickies.reduce((sum, s) => sum + s.reaction_count, 0);

    return {
      ideas,
      tasks,
      votes,
      stickies: stickies.length,
    };
  }, [stickies]);

  // Auto-refresh
  useEffect(() => {
    if (autoRefresh && eventId) {
      const interval = setInterval(() => {
        fetchStickies();
      }, 10000); // Refresh every 10 seconds

      return () => clearInterval(interval);
    }
  }, [autoRefresh, eventId, fetchStickies]);

  // Initial fetch
  useEffect(() => {
    if (eventId) {
      fetchStickies();
    }
  }, [eventId, sessionId, fetchStickies]);

  return {
    stickies,
    loading,
    error,
    fetchStickies,
    createNote,
    createIdea,
    voteOnIdea,
    convertToTask,
    updateStickyPosition,
    deleteSticky,
    getStats,
  };
};
