/**
 * usePartyCrew Hook
 * Manages PartyCrew operations (join/leave)
 */

import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import * as Haptics from 'expo-haptics';

interface UsePartyCrewResult {
  isJoining: boolean;
  error: string | null;
  joinCrew: (creatorId: string) => Promise<boolean>;
  leaveCrew: (creatorId: string) => Promise<boolean>;
  toggleCrew: (creatorId: string, currentStatus: boolean) => Promise<boolean>;
}

interface ToggleResponse {
  success: boolean;
  action: 'joined' | 'left' | 'requested';
  partycrew_count?: number;
  message: string;
  error?: string;
}

export function usePartyCrew(): UsePartyCrewResult {
  const [isJoining, setIsJoining] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const makeRequest = async (
    creatorId: string, 
    action?: 'join' | 'leave'
  ): Promise<ToggleResponse> => {
    if (!supabase) {
      throw new Error('Supabase not initialized');
    }

    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session?.access_token) {
      throw new Error('Not authenticated');
    }

    const apiUrl = process.env.EXPO_PUBLIC_API_URL || 'https://www.partyhause.com';
    const response = await fetch(`${apiUrl}/api/partycrew/toggle`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${session.access_token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        creatorId,
        ...(action && { action })
      }),
    });

    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.message || data.error || 'Request failed');
    }

    return data;
  };

  const joinCrew = async (creatorId: string): Promise<boolean> => {
    setIsJoining(true);
    setError(null);

    try {
      const result = await makeRequest(creatorId, 'join');
      
      // Haptic feedback
      if (result.success) {
        if (result.action === 'joined') {
          await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        } else if (result.action === 'requested') {
          await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        }
      }

      return result.success;
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to join PartyCrew';
      setError(errorMsg);
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      return false;
    } finally {
      setIsJoining(false);
    }
  };

  const leaveCrew = async (creatorId: string): Promise<boolean> => {
    setIsJoining(true);
    setError(null);

    try {
      const result = await makeRequest(creatorId, 'leave');
      
      if (result.success) {
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }

      return result.success;
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to leave PartyCrew';
      setError(errorMsg);
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      return false;
    } finally {
      setIsJoining(false);
    }
  };

  const toggleCrew = async (creatorId: string, currentStatus: boolean): Promise<boolean> => {
    if (currentStatus) {
      return leaveCrew(creatorId);
    } else {
      return joinCrew(creatorId);
    }
  };

  return {
    isJoining,
    error,
    joinCrew,
    leaveCrew,
    toggleCrew,
  };
}
