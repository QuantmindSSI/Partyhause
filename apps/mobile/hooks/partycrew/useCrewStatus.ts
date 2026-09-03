/**
 * useCrewStatus Hook
 * Checks and manages connection status with creators
 */

import { useState, useEffect, useCallback } from 'react';
import { getApiBaseUrl } from '../../lib/api';
import { api } from '@/lib/client';
import type { CrewStatus } from '@partyhause/core';

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
    if (!(await api.auth.isAuthenticated())) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    // The Authorization header is attached by the shared transport, so the
    // manual session lookup and header construction are gone.
    const { data, error: apiError } = await api.partycrew.status(creatorId);

    if (apiError) {
      setError(apiError.message);
      console.error('[useCrewStatus Error]:', apiError.message);
    } else {
      setStatus(data);
    }
    setIsLoading(false);
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
