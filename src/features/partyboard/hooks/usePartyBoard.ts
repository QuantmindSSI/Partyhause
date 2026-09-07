import { useState, useEffect, useCallback, useRef } from 'react';
import { StickyItem, CreateNoteData, CreateIdeaData, IdeaStickyData, CanvasStats } from '../types';
import { DEFAULT_STICKY_SIZE } from '../constants';
import { apiGet, apiPost, apiPatch, apiDelete } from '@/lib/api-client';

interface UsePartyBoardOptions {
  eventId: string;
  sessionId?: string;
  autoRefresh?: boolean;
}

/** Board poll interval. Matches the ten seconds the canvas was written against. */
const REFRESH_INTERVAL_MS = 10_000;

/**
 * Data layer for the collaborative planning canvas.
 *
 * Every call goes through `@/lib/api-client`, not bare `fetch`. The previous
 * implementation constructed its own requests with `Content-Type` as the only
 * header, so no Authorization was ever sent. Now that /api/partyboard exists
 * and requires auth, bare fetch would have turned a 404 into a 401 without
 * fixing anything. The shared client also brings the 15s timeout, the single
 * GET retry on 502/503/504, and the 401 redirect.
 */
export const usePartyBoard = ({ eventId, sessionId, autoRefresh = false }: UsePartyBoardOptions) => {
  const [stickies, setStickies] = useState<StickyItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // The auto-refresh interval must not resurrect state for a board the user
  // has navigated away from, and must not clobber a local optimistic update
  // with a response that was already in flight when it happened.
  const mountedRef = useRef(true);
  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const fetchStickies = useCallback(async () => {
    setLoading(true);
    setError(null);

    const params = new URLSearchParams({ event_id: eventId });
    if (sessionId) params.append('session_id', sessionId);

    const { data, error: apiError } = await apiGet<{ stickies: StickyItem[] }>(
      `/api/partyboard/stickies?${params.toString()}`,
    );

    if (!mountedRef.current) return;

    if (apiError) {
      setError(apiError.message);
    } else {
      setStickies(data?.stickies ?? []);
    }
    setLoading(false);
  }, [eventId, sessionId]);

  const createNote = async (noteData: CreateNoteData): Promise<StickyItem | null> => {
    setLoading(true);
    setError(null);

    const { data, error: apiError } = await apiPost<{ sticky: StickyItem }>(
      '/api/partyboard/stickies',
      {
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
      },
    );

    if (!mountedRef.current) return null;
    setLoading(false);

    if (apiError || !data?.sticky) {
      setError(apiError?.message ?? 'Failed to create note');
      return null;
    }

    setStickies((prev) => [...prev, data.sticky]);
    return data.sticky;
  };

  const createIdea = async (ideaData: CreateIdeaData): Promise<StickyItem | null> => {
    setLoading(true);
    setError(null);

    const { data, error: apiError } = await apiPost<{ sticky: StickyItem }>(
      '/api/partyboard/stickies',
      {
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
        },
      },
    );

    if (!mountedRef.current) return null;
    setLoading(false);

    if (apiError || !data?.sticky) {
      setError(apiError?.message ?? 'Failed to create idea');
      return null;
    }

    setStickies((prev) => [...prev, data.sticky]);
    return data.sticky;
  };

  /**
   * Toggle the current user's vote on an idea.
   *
   * The server owns the count, so the response is applied verbatim rather than
   * incremented locally. A local `votes + 1` would drift from the truth the
   * moment a second person voted between two refreshes.
   */
  const voteOnIdea = async (stickyId: string): Promise<boolean> => {
    const { data, error: apiError } = await apiPatch<{ votes: number; user_has_voted: boolean }>(
      `/api/partyboard/stickies/${stickyId}/vote`,
    );

    if (apiError || !data) {
      setError(apiError?.message ?? 'Failed to vote on idea');
      return false;
    }

    setStickies((prev) =>
      prev.map((sticky) =>
        sticky.id === stickyId
          ? {
              ...sticky,
              reaction_count: data.votes,
              data: {
                ...(sticky.data as IdeaStickyData),
                votes: data.votes,
                user_has_voted: data.user_has_voted,
              },
            }
          : sticky,
      ),
    );

    return true;
  };

  const convertToTask = async (stickyId: string): Promise<boolean> => {
    const { data, error: apiError } = await apiPost<{ task_id: string; status: string }>(
      `/api/partyboard/stickies/${stickyId}/convert-to-task`,
    );

    if (apiError || !data) {
      setError(apiError?.message ?? 'Failed to convert to task');
      return false;
    }

    setStickies((prev) =>
      prev.map((sticky) =>
        sticky.id === stickyId
          ? {
              ...sticky,
              data: {
                ...(sticky.data as IdeaStickyData),
                converted_to_task: true,
                task_id: data.task_id,
              },
            }
          : sticky,
      ),
    );

    return true;
  };

  /**
   * Persist a drag.
   *
   * Position is written optimistically before the request so the sticky does
   * not snap back under the cursor, and rolled back to its previous coordinates
   * if the server rejects it.
   */
  const updateStickyPosition = async (
    stickyId: string,
    position: { x: number; y: number },
  ): Promise<boolean> => {
    const previous = stickies.find((sticky) => sticky.id === stickyId)?.position;

    setStickies((prev) =>
      prev.map((sticky) => (sticky.id === stickyId ? { ...sticky, position } : sticky)),
    );

    const { error: apiError } = await apiPatch(`/api/partyboard/stickies/${stickyId}/position`, {
      position,
    });

    if (apiError) {
      if (previous) {
        setStickies((prev) =>
          prev.map((sticky) =>
            sticky.id === stickyId ? { ...sticky, position: previous } : sticky,
          ),
        );
      }
      setError(apiError.message);
      return false;
    }

    return true;
  };

  const deleteSticky = async (stickyId: string): Promise<boolean> => {
    const { error: apiError } = await apiDelete(`/api/partyboard/stickies/${stickyId}`);

    if (apiError) {
      setError(apiError.message);
      return false;
    }

    setStickies((prev) => prev.filter((sticky) => sticky.id !== stickyId));
    return true;
  };

  /** Board summary for the section header. Complexity: O(n) in sticky count. */
  const getStats = useCallback((): CanvasStats => {
    let ideas = 0;
    let tasks = 0;
    let votes = 0;

    for (const sticky of stickies) {
      votes += sticky.reaction_count;
      if (sticky.type !== 'idea') continue;
      ideas += 1;
      if ((sticky.data as IdeaStickyData).converted_to_task) tasks += 1;
    }

    return { ideas, tasks, votes, stickies: stickies.length };
  }, [stickies]);

  useEffect(() => {
    if (!autoRefresh || !eventId) return;
    const interval = setInterval(() => {
      void fetchStickies();
    }, REFRESH_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [autoRefresh, eventId, fetchStickies]);

  useEffect(() => {
    if (eventId) void fetchStickies();
  }, [eventId, fetchStickies]);

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
