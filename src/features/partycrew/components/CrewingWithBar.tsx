/**
 * CrewingWithBar Component - Web Version
 * Horizontal scrollable bar showing creators the user is following
 * Ported from mobile app
 */

import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useCrewingWith } from '../hooks';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Loader2, CheckCircle2, ArrowLeftRight } from 'lucide-react';
import { cn } from '@/lib/utils';

interface CrewingWithBarProps {
  userId?: string;
  onCreatorPress?: (creatorId: string) => void;
  className?: string;
}

export function CrewingWithBar({ userId, onCreatorPress, className }: CrewingWithBarProps) {
  const navigate = useNavigate();
  const { creators, isLoading } = useCrewingWith(userId, 20);

  const handleCreatorPress = (creatorId: string) => {
    if (onCreatorPress) {
      onCreatorPress(creatorId);
    } else {
      navigate(`/profile/${creatorId}`);
    }
  };

  if (isLoading) {
    return (
      <div className={cn("flex items-center justify-center py-4", className)}>
        <Loader2 className="h-5 w-5 animate-spin text-primary" />
      </div>
    );
  }

  if (!creators || creators.length === 0) {
    return null;
  }

  return (
    <div className={cn("space-y-3", className)}>
      <h3 className="text-lg font-semibold text-gray-900">Crewing With</h3>
      <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide">
        {creators.map((creator) => (
          <button
            key={creator.id}
            onClick={() => handleCreatorPress(creator.id)}
            className="flex flex-col items-center gap-2 min-w-[100px] group cursor-pointer"
          >
            <div className="relative">
              <Avatar className="h-16 w-16 border-2 border-gray-200 group-hover:border-primary transition-colors">
                <AvatarImage src={creator.avatar_url || undefined} alt={creator.display_name} />
                <AvatarFallback className="bg-gradient-to-br from-purple-400 to-pink-400 text-white text-xl font-bold">
                  {creator.display_name.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              
              {creator.is_verified && (
                <div className="absolute -top-1 -right-1 bg-blue-500 rounded-full p-0.5">
                  <CheckCircle2 className="h-4 w-4 text-white" />
                </div>
              )}
              
              {creator.is_mutual && (
                <div className="absolute -bottom-1 -right-1 bg-green-500 rounded-full p-0.5">
                  <ArrowLeftRight className="h-3 w-3 text-white" />
                </div>
              )}
            </div>
            
            <div className="text-center max-w-[100px]">
              <p className="text-sm font-semibold text-gray-900 truncate group-hover:text-primary transition-colors">
                {creator.display_name}
              </p>
              <p className="text-xs text-gray-500 truncate">
                @{creator.username}
              </p>
              {creator.events_hosted > 0 && (
                <p className="text-xs text-gray-400 mt-1">
                  {creator.events_hosted} event{creator.events_hosted !== 1 ? 's' : ''}
                </p>
              )}
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
