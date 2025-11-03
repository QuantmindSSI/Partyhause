/**
 * useSuggestedUsers Hook - Web Version
 * Fetches suggested users/creators to follow
 */

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { apiRequest } from '../api/client';
import { Creator } from '../types';

interface UseSuggestedUsersResult {
  users: Creator[];
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export function useSuggestedUsers(limit: number = 20): UseSuggestedUsersResult {
  const [users, setUsers] = useState<Creator[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchUsers = useCallback(async () => {
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session?.access_token) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const data = await apiRequest<{ users: Creator[] }>(
        `/api/users/suggested?limit=${limit}`
      );

      setUsers(data.users || []);
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to load suggested users';
      setError(errorMsg);
      console.error('[useSuggestedUsers Error]:', err);
    } finally {
      setIsLoading(false);
    }
  }, [limit]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  return {
    users,
    isLoading,
    error,
    refetch: fetchUsers,
  };
}
