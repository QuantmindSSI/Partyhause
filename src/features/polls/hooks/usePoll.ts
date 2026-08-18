import { useState, useEffect } from 'react';
import { Poll, VoteData, CreatePollData } from '../types';
import { supabase } from '@/lib/supabase';
import { getApiBaseUrl } from '@/lib/apiBase';

interface UsePollOptions {
  eventId?: string;
  pollId?: string;
  autoRefresh?: boolean;
}

export const usePoll = ({ eventId, pollId, autoRefresh = false }: UsePollOptions = {}) => {
  const [polls, setPolls] = useState<Poll[]>([]);
  const [currentPoll, setCurrentPoll] = useState<Poll | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const API_BASE = getApiBaseUrl();

  // Fetch polls for an event
  const fetchPolls = async (eventIdParam?: string) => {
    const id = eventIdParam || eventId;
    if (!id) return;

    setLoading(true);
    setError(null);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      const response = await fetch(`${API_BASE}/api/polls?eventId=${encodeURIComponent(id)}`, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.access_token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch polls');
      }

      const data = await response.json();
      setPolls(data.polls || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch polls');
    } finally {
      setLoading(false);
    }
  };

  // Fetch a single poll
  const fetchPoll = async (pollIdParam?: string) => {
    const id = pollIdParam || pollId;
    if (!id) return;

    setLoading(true);
    setError(null);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      const response = await fetch(`${API_BASE}/api/polls/${encodeURIComponent(id)}`, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.access_token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch poll');
      }

      const data = await response.json();
      setCurrentPoll(data.poll);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch poll');
    } finally {
      setLoading(false);
    }
  };

  // Create a new poll
  const createPoll = async (eventIdParam: string, pollData: CreatePollData): Promise<Poll | null> => {
    setLoading(true);
    setError(null);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      const response = await fetch(`${API_BASE}/api/polls`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.access_token}`,
        },
        body: JSON.stringify({
          event_id: eventIdParam,
          ...pollData,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to create poll');
      }

      const data = await response.json();
      const newPoll = data.poll;

      // Add to polls list if we're viewing this event
      if (eventIdParam === eventId) {
        setPolls((prev) => [newPoll, ...prev]);
      }

      return newPoll;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create poll');
      return null;
    } finally {
      setLoading(false);
    }
  };

  // Vote on a poll
  const vote = async (pollIdParam: string, voteData: VoteData): Promise<boolean> => {
    setLoading(true);
    setError(null);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      const response = await fetch(`${API_BASE}/api/polls/${encodeURIComponent(pollIdParam)}/vote`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.access_token}`,
        },
        body: JSON.stringify(voteData),
      });

      if (!response.ok) {
        throw new Error('Failed to submit vote');
      }

      const data = await response.json();
      const updatedPoll = data.poll;

      // Update the poll in the list
      setPolls((prev) =>
        prev.map((p) => (p.id === pollIdParam ? updatedPoll : p))
      );

      // Update current poll if it's the one we voted on
      if (pollIdParam === pollId) {
        setCurrentPoll(updatedPoll);
      }

      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to submit vote');
      return false;
    } finally {
      setLoading(false);
    }
  };

  // Close a poll
  const closePoll = async (pollIdParam: string): Promise<boolean> => {
    setLoading(true);
    setError(null);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      const response = await fetch(`${API_BASE}/api/polls/${encodeURIComponent(pollIdParam)}/close`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.access_token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to close poll');
      }

      const data = await response.json();
      const updatedPoll = data.poll;

      // Update the poll in the list
      setPolls((prev) =>
        prev.map((p) => (p.id === pollIdParam ? updatedPoll : p))
      );

      // Update current poll if it's the one we closed
      if (pollIdParam === pollId) {
        setCurrentPoll(updatedPoll);
      }

      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to close poll');
      return false;
    } finally {
      setLoading(false);
    }
  };

  // Auto-refresh polls
  useEffect(() => {
    if (autoRefresh && eventId) {
      const interval = setInterval(() => {
        fetchPolls(eventId);
      }, 5000); // Refresh every 5 seconds

      return () => clearInterval(interval);
    }
  }, [autoRefresh, eventId]);

  // Initial fetch
  useEffect(() => {
    if (eventId) {
      fetchPolls(eventId);
    } else if (pollId) {
      fetchPoll(pollId);
    }
  }, [eventId, pollId]);

  return {
    polls,
    currentPoll,
    loading,
    error,
    fetchPolls,
    fetchPoll,
    createPoll,
    vote,
    closePoll,
  };
};
