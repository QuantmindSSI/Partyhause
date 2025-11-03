/**
 * useCrewStatus Hook - Web Version
 * Check PartyCrew connection status between users
 * Ported from mobile app
 */

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { apiRequest } from '../api/client';
import { CrewStatus } from '../types';

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
    if (!creatorId) {
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
      const data = await apiRequest<CrewStatus>(
        `/api/partycrew/toggle?creatorId=${creatorId}`
      );

      setStatus(data);
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to fetch status';
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
