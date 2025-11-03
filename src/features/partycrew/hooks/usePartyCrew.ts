/**
 * usePartyCrew Hook - Web Version
 * Manages PartyCrew operations (join/leave)
 * Ported from mobile app
 */

import { useState } from 'react';
import { apiRequest } from '../api/client';
import { ToggleResponse } from '../types';
import { useToast } from '@/hooks/use-toast';

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
  const { toast } = useToast();

  const makeRequest = async (
    creatorId: string, 
    action?: 'join' | 'leave'
  ): Promise<ToggleResponse> => {
    const response = await apiRequest<ToggleResponse>('/api/partycrew/toggle', {
      method: 'POST',
      body: JSON.stringify({
        creatorId,
        ...(action && { action })
      }),
    });

    return response;
  };

  const joinCrew = async (creatorId: string): Promise<boolean> => {
    setIsJoining(true);
    setError(null);

    try {
      const result = await makeRequest(creatorId, 'join');
      
      if (result.success) {
        if (result.action === 'joined') {
          toast({
            title: "Success!",
            description: "You're now following this creator.",
            variant: "default",
          });
        } else if (result.action === 'requested') {
          toast({
            title: "Request Sent",
            description: "Your follow request has been sent.",
            variant: "default",
          });
        }
      }

      return result.success;
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to join PartyCrew';
      setError(errorMsg);
      toast({
        title: "Error",
        description: errorMsg,
        variant: "destructive",
      });
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
        toast({
          title: "Unfollowed",
          description: "You've unfollowed this creator.",
          variant: "default",
        });
      }

      return result.success;
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to leave PartyCrew';
      setError(errorMsg);
      toast({
        title: "Error",
        description: errorMsg,
        variant: "destructive",
      });
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
