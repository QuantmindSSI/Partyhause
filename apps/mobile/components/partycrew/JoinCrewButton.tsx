/**
 * JoinCrewButton Component
 * Smart button for joining/leaving a creator's PartyCrew
 * Shows 3 states: Join, Crewing ✓, Requested
 */

import React from 'react';
import { 
  TouchableOpacity, 
  Text, 
  StyleSheet, 
  ActivityIndicator, 
  View 
} from 'react-native';
import { usePartyCrew } from '@/hooks/partycrew/usePartyCrew';
import { useCrewStatus } from '@/hooks/partycrew/useCrewStatus';

interface JoinCrewButtonProps {
  creatorId: string;
  variant?: 'default' | 'outline' | 'compact';
  onStatusChange?: (isFollowing: boolean) => void;
}

export function JoinCrewButton({ 
  creatorId, 
  variant = 'default',
  onStatusChange 
}: JoinCrewButtonProps) {
  const { status, isLoading: statusLoading, updateLocalStatus } = useCrewStatus(creatorId);
  const { isJoining, toggleCrew } = usePartyCrew();

  const handlePress = async () => {
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
      <View style={[
        styles.button, 
        styles.buttonOutline,
        variant === 'compact' && styles.buttonCompact
      ]}>
        <ActivityIndicator size="small" color="#6366F1" />
      </View>
    );
  }

  // Determine button state
  const isFollowing = status?.isFollowing || false;
  const isPending = status?.isPending || false;
  
  let buttonText = 'Join Crew';
  let colorStyle = styles.buttonPrimary;

  if (isFollowing) {
    buttonText = 'Crewing ✓';
    colorStyle = styles.buttonSuccess;
  } else if (isPending) {
    buttonText = 'Requested';
    colorStyle = styles.buttonPending;
  }

  if (variant === 'outline') {
    colorStyle = styles.buttonOutline;
  }

  const buttonStyles: any = [
    styles.button,
    colorStyle,
    variant === 'compact' && styles.buttonCompact
  ];

  const textStyles: any = [
    styles.buttonText,
    variant === 'outline' ? styles.buttonTextOutline : styles.buttonTextPrimary,
    variant === 'compact' && styles.buttonTextCompact
  ];

  return (
    <TouchableOpacity
      style={buttonStyles}
      onPress={handlePress}
      disabled={isJoining || isPending}
      activeOpacity={0.7}
    >
      {isJoining ? (
        <ActivityIndicator size="small" color={variant === 'outline' ? '#6366F1' : '#FFF'} />
      ) : (
        <Text style={textStyles}>{buttonText}</Text>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 120,
  },
  buttonPrimary: {
    backgroundColor: '#6366F1',
  },
  buttonSuccess: {
    backgroundColor: '#10B981',
  },
  buttonPending: {
    backgroundColor: '#F59E0B',
  },
  buttonOutline: {
    backgroundColor: 'transparent',
    borderWidth: 1.5,
    borderColor: '#6366F1',
  },
  buttonCompact: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    minWidth: 90,
  },
  buttonText: {
    fontSize: 15,
    fontWeight: '600',
  },
  buttonTextPrimary: {
    color: '#FFFFFF',
  },
  buttonTextSuccess: {
    color: '#FFFFFF',
  },
  buttonTextPending: {
    color: '#FFFFFF',
  },
  buttonTextOutline: {
    color: '#6366F1',
  },
  buttonTextCompact: {
    fontSize: 13,
  },
});
