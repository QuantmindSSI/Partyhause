import React from 'react';
import { useDraggable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Lightbulb, 
  Heart, 
  DollarSign, 
  CheckCircle2, 
  GripVertical,
  Smile,
  MessageCircle,
  Bike,
  UtensilsCrossed,
  Music,
  MapPin,
  Car
} from 'lucide-react';
import { IdeaStickyData, StickyItem } from '../types';
import { cn } from '@/lib/utils';

interface IdeaStickyProps {
  sticky: StickyItem & { data: IdeaStickyData };
  currentUserId: string;
  onVote?: (stickyId: string) => void;
  onReact?: (stickyId: string) => void;
  onConvertToTask?: (stickyId: string) => void;
  onComment?: (stickyId: string) => void;
  isSelected?: boolean;
  isInteractive?: boolean;
}

export const IdeaSticky: React.FC<IdeaStickyProps> = ({
  sticky,
  currentUserId,
  onVote,
  onReact,
  onConvertToTask,
  onComment,
  isSelected = false,
  isInteractive = true,
}) => {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: sticky.id,
    disabled: !isInteractive,
  });

  const style = {
    position: 'absolute' as const,
    left: `${sticky.position.x}px`,
    top: `${sticky.position.y}px`,
    width: `${sticky.size.width}px`,
    height: `${sticky.size.height}px`,
    transform: CSS.Translate.toString(transform),
    zIndex: isDragging ? 1000 : sticky.z_index || 1,
    opacity: isDragging ? 0.5 : 1,
  };

  const getCategoryColor = (category?: string): string => {
    switch (category) {
      case 'activity': return 'bg-blue-500';
      case 'food': return 'bg-red-500';
      case 'entertainment': return 'bg-purple-500';
      case 'venue': return 'bg-green-500';
      case 'logistics': return 'bg-amber-500';
      default: return 'bg-gray-500';
    }
  };

  const getCategoryIcon = (category?: string) => {
    const iconProps = { size: 12, className: 'text-current' };
    switch (category) {
      case 'activity': return <Bike {...iconProps} />;
      case 'food': return <UtensilsCrossed {...iconProps} />;
      case 'entertainment': return <Music {...iconProps} />;
      case 'venue': return <MapPin {...iconProps} />;
      case 'logistics': return <Car {...iconProps} />;
      default: return <Lightbulb {...iconProps} />;
    }
  };

  const formatCost = (cost?: number): string => {
    if (!cost) return 'No cost estimate';
    return `$${cost.toLocaleString()}`;
  };

  const handleVote = () => {
    if (!isInteractive) return;
    onVote?.(sticky.id);
  };

  const handleConvertToTask = () => {
    if (!isInteractive) return;
    onConvertToTask?.(sticky.id);
  };

  return (
    <div ref={setNodeRef} style={style}>
      <Card
        className={cn(
          'h-full flex flex-col overflow-hidden shadow-lg border-2 border-yellow-300 bg-white',
          sticky.data.converted_to_task && 'border-green-500 opacity-95',
          isSelected && 'ring-2 ring-violet-500',
          isDragging && 'cursor-grabbing'
        )}
      >
        {/* Drag Handle */}
        {isInteractive && (
          <div
            {...listeners}
            {...attributes}
            className="absolute top-1 left-1 cursor-grab active:cursor-grabbing p-1 hover:bg-gray-100 rounded"
          >
            <GripVertical size={14} className="text-gray-400" />
          </div>
        )}

        <div className="p-3 flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-1">
              <Lightbulb 
                size={16} 
                className={sticky.data.converted_to_task ? 'text-green-500' : 'text-yellow-400'} 
                fill={sticky.data.converted_to_task ? 'currentColor' : 'currentColor'}
              />
              <span className="text-[10px] font-bold text-amber-500 tracking-wider">
                IDEA
              </span>
            </div>
            
            {sticky.data.category && (
              <Badge 
                variant="secondary" 
                className={cn(
                  'flex items-center gap-1 px-2 py-0.5 text-[9px] font-bold',
                  getCategoryColor(sticky.data.category),
                  'text-white'
                )}
              >
                {getCategoryIcon(sticky.data.category)}
                <span>{sticky.data.category.toUpperCase()}</span>
              </Badge>
            )}
          </div>

          {/* Content */}
          <p className="text-xs text-gray-900 mb-3 line-clamp-5 leading-relaxed flex-1">
            {sticky.data.content}
          </p>

          {/* Cost & Votes Row */}
          <div className="flex items-center justify-between mb-2">
            {sticky.data.estimated_cost && (
              <div className="flex items-center gap-1 bg-gray-100 px-2 py-1 rounded-md">
                <DollarSign size={12} className="text-gray-600" />
                <span className="text-[11px] font-semibold text-gray-600">
                  {formatCost(sticky.data.estimated_cost)}
                </span>
              </div>
            )}
            
            <Button
              variant="ghost"
              size="sm"
              onClick={handleVote}
              disabled={!isInteractive}
              className="flex items-center gap-1 bg-red-50 hover:bg-red-100 px-2 py-1 h-auto rounded-md"
            >
              <Heart 
                size={14} 
                className={sticky.data.user_has_voted ? 'text-red-500' : 'text-gray-600'}
                fill={sticky.data.user_has_voted ? 'currentColor' : 'none'}
              />
              <span className={cn(
                'text-xs font-semibold',
                sticky.data.user_has_voted ? 'text-red-500' : 'text-gray-600'
              )}>
                {sticky.data.votes}
              </span>
            </Button>
          </div>

          {/* Task Conversion */}
          {sticky.data.converted_to_task ? (
            <div className="flex items-center gap-2 bg-green-100 p-2 rounded-lg mb-2">
              <CheckCircle2 size={14} className="text-green-600" />
              <span className="flex-1 text-[11px] text-green-700 font-semibold">
                Converted to task
              </span>
              {sticky.data.task_id && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="px-2 py-1 h-auto bg-white rounded-md text-[10px] font-semibold text-green-600"
                >
                  View
                </Button>
              )}
            </div>
          ) : (
            isInteractive && onConvertToTask && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleConvertToTask}
                className="flex items-center justify-center gap-1 bg-violet-50 hover:bg-violet-100 border-violet-200 p-2 mb-2 h-auto"
              >
                <CheckCircle2 size={14} className="text-violet-600" />
                <span className="text-[11px] font-semibold text-violet-600">
                  Convert to task
                </span>
              </Button>
            )
          )}

          {/* Footer */}
          <div className="flex items-center justify-between pt-2 border-t border-gray-200">
            <span className="text-[10px] text-gray-500 italic">
              by {sticky.created_by_name || 'Unknown'}
            </span>
            
            <div className="flex items-center gap-2">
              {onReact && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onReact(sticky.id)}
                  className="p-1 h-auto"
                  disabled={!isInteractive}
                >
                  <Smile size={14} className="text-gray-600" />
                </Button>
              )}
              {onComment && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onComment(sticky.id)}
                  className="p-1 h-auto"
                  disabled={!isInteractive}
                >
                  <MessageCircle size={14} className="text-gray-600" />
                </Button>
              )}
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
};
