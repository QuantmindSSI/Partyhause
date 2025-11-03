/**
 * JoinCrewButton Component - Web Version
 * Smart button for joining/leaving a creator's PartyCrew
 * Shows 3 states: Join, Crewing ✓, Requested
 * Ported from mobile app
 */

import React from 'react';
import { Button } from '@/components/ui/button';
import { Loader2, UserPlus, Check } from 'lucide-react';
import { usePartyCrew, useCrewStatus } from '../hooks';
import { cn } from '@/lib/utils';

interface JoinCrewButtonProps {
  creatorId: string;
  variant?: 'default' | 'outline' | 'compact';
  onStatusChange?: (isFollowing: boolean) => void;
  className?: string;
}

export function JoinCrewButton({ 
  creatorId, 
  variant = 'default',
  onStatusChange,
  className
}: JoinCrewButtonProps) {
  const { status, isLoading: statusLoading, updateLocalStatus } = useCrewStatus(creatorId);
  const { isJoining, toggleCrew } = usePartyCrew();

  const handleClick = async () => {
    const currentStatus = status?.isFollowing || false;
    const success = await toggleCrew(creatorId, currentStatus);
    
    if (success) {
      // Optimistically update local status
      updateLocalStatus({
        isFollowing: !currentStatus,
        isPending: false
      });
      
      onStatusChange?.(!currentStatus);
    }
  };

  // Loading state
  if (statusLoading) {
    return (
      <Button
        variant={variant === 'outline' ? 'outline' : 'default'}
        size={variant === 'compact' ? 'sm' : 'default'}
        disabled
        className={className}
      >
        <Loader2 className="h-4 w-4 animate-spin" />
      </Button>
    );
  }

  // Determine button state
  const isFollowing = status?.isFollowing || false;
  const isPending = status?.isPending || false;
  
  let buttonText = 'Join Crew';
  let buttonVariant: 'default' | 'outline' | 'secondary' = 'default';
  let Icon = UserPlus;

  if (isFollowing) {
    buttonText = 'Crewing';
    buttonVariant = 'secondary';
    Icon = Check;
  } else if (isPending) {
    buttonText = 'Requested';
    buttonVariant = 'outline';
  }

  if (variant === 'outline') {
    buttonVariant = 'outline';
  }

  return (
    <Button
      variant={buttonVariant}
      size={variant === 'compact' ? 'sm' : 'default'}
      onClick={handleClick}
      disabled={isJoining || isPending}
      className={cn(
        isFollowing && 'bg-green-600 hover:bg-green-700 text-white',
        isPending && 'bg-amber-100 text-amber-800 hover:bg-amber-200 border-amber-300',
        className
      )}
    >
      {isJoining ? (
        <Loader2 className="h-4 w-4 animate-spin mr-2" />
      ) : (
        <Icon className="h-4 w-4 mr-2" />
      )}
      {buttonText}
    </Button>
  );
}
