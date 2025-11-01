/**
 * useCrewStatus Hook
 * Checks and manages connection status with creators
 */

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';

interface CrewStatus {
  isFollowing: boolean;
  isPending: boolean;
  isMutual: boolean;
  connection: {
    id: string;
    created_at: string;
    notify_on_events: boolean;
    notify_on_posts: boolean;
  } | null;
  request: {
    id: string;
    status: string;
    created_at: string;
  } | null;
}

interface UseCrewStatusResult {
  status: CrewStatus | null;
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  updateLocalStatus: (newStatus: Partial<CrewStatus>) => void;
}

export function useCrewStatus(creatorId: string | undefined): UseCrewStatusResult {
  const [status, setStatus] = useState<CrewStatus | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStatus = useCallback(async () => {
    if (!creatorId || !supabase) {
      setIsLoading(false);
      return;
    }

    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session?.access_token) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const apiUrl = process.env.EXPO_PUBLIC_API_URL || 'https://partyhause.vercel.app';
      const response = await fetch(
        `${apiUrl}/api/partycrew/toggle?creatorId=${creatorId}`,
        {
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error('Failed to fetch status');
      }

      const data = await response.json();
      setStatus(data);
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to check status';
      setError(errorMsg);
      console.error('[useCrewStatus Error]:', err);
    } finally {
      setIsLoading(false);
    }
  }, [creatorId]);

  useEffect(() => {
    fetchStatus();
  }, [fetchStatus]);

  const updateLocalStatus = useCallback((newStatus: Partial<CrewStatus>) => {
    setStatus(prev => prev ? { ...prev, ...newStatus } : null);
  }, []);

  return {
    status,
    isLoading,
    error,
    refetch: fetchStatus,
    updateLocalStatus,
  };
}
