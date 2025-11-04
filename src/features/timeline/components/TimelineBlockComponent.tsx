import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Trash2, Edit, GripVertical, Eye, EyeOff, Bell } from 'lucide-react';
import { TimelineBlock as TimelineBlockType, getBlockTypeConfig, formatDuration, calculateEndTime } from '../types';
import { cn } from '@/lib/utils';

interface TimelineBlockProps {
  block: TimelineBlockType;
  onEdit?: (block: TimelineBlockType) => void;
  onDelete?: (id: string) => void;
  isDraggable?: boolean;
}

export const TimelineBlockComponent: React.FC<TimelineBlockProps> = ({
  block,
  onEdit,
  onDelete,
  isDraggable = false,
}) => {
  const typeConfig = getBlockTypeConfig(block.type);
  const endTime = calculateEndTime(block.start_time, block.duration);

  return (
    <Card
      className={cn(
        'transition-all duration-200 hover:shadow-lg',
        'border-l-4',
      )}
      style={{ borderLeftColor: typeConfig.color }}
    >
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          {/* Drag Handle */}
          {isDraggable && (
            <div className="cursor-grab active:cursor-grabbing pt-1">
              <GripVertical className="h-5 w-5 text-gray-400" />
            </div>
          )}

          {/* Icon */}
          <div
            className="flex-shrink-0 w-12 h-12 rounded-lg flex items-center justify-center text-2xl"
            style={{ backgroundColor: `${typeConfig.color}20` }}
          >
            {typeConfig.icon}
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            {/* Header */}
            <div className="flex items-start justify-between gap-2 mb-2">
              <div className="flex-1 min-w-0">
                <h4 className="font-semibold text-gray-900 truncate">
                  {block.label}
                </h4>
                <Badge
                  variant="secondary"
                  className="mt-1"
                  style={{ backgroundColor: `${typeConfig.color}20`, color: typeConfig.color }}
                >
                  {typeConfig.label}
                </Badge>
              </div>
              
              {/* Actions */}
              <div className="flex items-center gap-1">
                {onEdit && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onEdit(block)}
                    className="h-8 w-8 p-0"
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                )}
                {onDelete && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onDelete(block.id)}
                    className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>

            {/* Description */}
            {block.description && (
              <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                {block.description}
              </p>
            )}

            {/* Time Info */}
            <div className="flex flex-wrap items-center gap-4 text-sm">
              <div className="flex items-center gap-2 text-gray-700">
                <span className="font-medium">{block.start_time}</span>
                <span className="text-gray-400">→</span>
                <span className="font-medium">{endTime}</span>
              </div>
              
              <div className="flex items-center gap-1 text-gray-600">
                <span>⏱️</span>
                <span>{formatDuration(block.duration)}</span>
              </div>

              {/* Guest Visibility */}
              <div className="flex items-center gap-1">
                {block.guest_visible ? (
                  <>
                    <Eye className="h-4 w-4 text-green-600" />
                    <span className="text-xs text-green-600">Visible to guests</span>
                  </>
                ) : (
                  <>
                    <EyeOff className="h-4 w-4 text-gray-400" />
                    <span className="text-xs text-gray-500">Private</span>
                  </>
                )}
              </div>

              {/* Notification */}
              {block.notify_before && block.notify_before > 0 && (
                <div className="flex items-center gap-1 text-amber-600">
                  <Bell className="h-4 w-4" />
                  <span className="text-xs">{block.notify_before}min before</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
