/**
 * usePartyCrew Hook
 * Manages PartyCrew operations (join/leave)
 */

import { useState } from 'react';
import type { CrewToggleResult } from '@partyhause/core';
import * as Haptics from 'expo-haptics';
import { api } from '@/lib/client';

interface UsePartyCrewResult {
  isJoining: boolean;
  error: string | null;
  joinCrew: (creatorId: string) => Promise<boolean>;
  leaveCrew: (creatorId: string) => Promise<boolean>;
  toggleCrew: (creatorId: string, currentStatus: boolean) => Promise<boolean>;
}

export function usePartyCrew(): UsePartyCrewResult {
  const [isJoining, setIsJoining] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * The route requires `action`; omitting it is a 400, so it is a required
   * argument here rather than an optional one. Throwing on failure is kept
   * deliberately: both callers already translate a throw into an error haptic.
   */
  const makeRequest = async (
    creatorId: string,
    action: 'join' | 'leave',
  ): Promise<CrewToggleResult> => {
    const { data, error: apiError } = await api.partycrew.toggle(creatorId, action);

    if (apiError) {
      throw new Error(apiError.message);
    }
    if (!data) {
      throw new Error('Request failed');
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
