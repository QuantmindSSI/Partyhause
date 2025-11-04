import React from 'react';
import { useDraggable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import { StickyNote, GripVertical } from 'lucide-react';
import { StickyItem, NoteStickyData } from '../types';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface NoteStickyProps {
  sticky: StickyItem & { data: NoteStickyData };
  isSelected?: boolean;
  onSelect?: (id: string) => void;
  onDoubleClick?: (id: string) => void;
}

export const NoteSticky: React.FC<NoteStickyProps> = ({
  sticky,
  isSelected = false,
  onSelect,
  onDoubleClick,
}) => {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: sticky.id,
    data: sticky,
  });

  const style = {
    transform: CSS.Translate.toString(transform),
    position: 'absolute' as const,
    left: sticky.position.x,
    top: sticky.position.y,
    width: sticky.size.width,
    height: sticky.size.height,
    zIndex: isDragging ? 1000 : sticky.z_index,
    rotate: `${sticky.rotation || 0}deg`,
  };

  const data = sticky.data as NoteStickyData;

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        'cursor-move transition-shadow',
        isDragging && 'opacity-50',
        isSelected && 'ring-2 ring-violet-500'
      )}
      onClick={() => onSelect?.(sticky.id)}
      onDoubleClick={() => onDoubleClick?.(sticky.id)}
    >
      <Card
        className="h-full w-full shadow-lg hover:shadow-xl transition-all"
        style={{
          backgroundColor: data.color,
          color: data.color === '#FEFCE8' ? '#713F12' : '#1F2937',
        }}
      >
        {/* Drag Handle */}
        <div
          {...attributes}
          {...listeners}
          className="flex items-center justify-between p-2 border-b border-gray-300/20 cursor-grab active:cursor-grabbing"
        >
          <div className="flex items-center gap-2">
            <GripVertical className="h-4 w-4 opacity-40" />
            <StickyNote className="h-4 w-4 opacity-60" />
          </div>
          <span className="text-xs opacity-60">
            {sticky.created_by_name.split(' ')[0]}
          </span>
        </div>

        {/* Content */}
        <div
          className="p-3 overflow-hidden"
          style={{
            fontSize: `${data.font_size}px`,
            height: 'calc(100% - 40px)',
          }}
        >
          <p className="whitespace-pre-wrap break-words">{data.content}</p>
        </div>
      </Card>
    </div>
  );
};
