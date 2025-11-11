import React, { useState, useCallback } from 'react';
import {
  DndContext,
  DragEndEvent,
  DragStartEvent,
  MouseSensor,
  TouchSensor,
  useSensor,
  useSensors,
  DragOverlay,
} from '@dnd-kit/core';
import { ZoomIn, ZoomOut, Maximize2, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { NoteSticky } from './NoteSticky';
import { IdeaSticky } from './IdeaSticky';
import { StickyItem, CanvasState, NoteStickyData, IdeaStickyData } from '../types';
import { CANVAS_CONFIG } from '../constants';
import { cn } from '@/lib/utils';

interface PartyBoardCanvasProps {
  eventId: string;
  stickies: StickyItem[];
  onUpdateStickyPosition: (stickyId: string, position: { x: number; y: number }) => void;
  onCreateSticky: () => void;
  onSelectSticky?: (stickyId: string) => void;
  onVoteOnIdea?: (stickyId: string) => void;
  onConvertToTask?: (stickyId: string) => void;
}

export const PartyBoardCanvas: React.FC<PartyBoardCanvasProps> = ({
  eventId,
  stickies,
  onUpdateStickyPosition,
  onCreateSticky,
  onSelectSticky,
  onVoteOnIdea,
  onConvertToTask,
}) => {
  const [canvasState, setCanvasState] = useState<CanvasState>({
    zoom: CANVAS_CONFIG.DEFAULT_ZOOM,
    pan: CANVAS_CONFIG.DEFAULT_PAN,
    gridSize: CANVAS_CONFIG.GRID_SIZE,
    showGrid: true,
  });

  const [selectedStickyId, setSelectedStickyId] = useState<string | null>(null);
  const [activeDragId, setActiveDragId] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(MouseSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: 250,
        tolerance: 5,
      },
    })
  );

  const handleDragStart = (event: DragStartEvent) => {
    setActiveDragId(event.active.id as string);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, delta } = event;

    if (delta.x !== 0 || delta.y !== 0) {
      const sticky = stickies.find((s) => s.id === active.id);
      if (sticky) {
        const newX = sticky.position.x + delta.x / canvasState.zoom;
        const newY = sticky.position.y + delta.y / canvasState.zoom;
        onUpdateStickyPosition(sticky.id, { x: newX, y: newY });
      }
    }

    setActiveDragId(null);
  };

  const handleZoomIn = () => {
    setCanvasState((prev) => ({
      ...prev,
      zoom: Math.min(prev.zoom + CANVAS_CONFIG.ZOOM_STEP, CANVAS_CONFIG.MAX_ZOOM),
    }));
  };

  const handleZoomOut = () => {
    setCanvasState((prev) => ({
      ...prev,
      zoom: Math.max(prev.zoom - CANVAS_CONFIG.ZOOM_STEP, CANVAS_CONFIG.MIN_ZOOM),
    }));
  };

  const handleResetView = () => {
    setCanvasState({
      zoom: CANVAS_CONFIG.DEFAULT_ZOOM,
      pan: CANVAS_CONFIG.DEFAULT_PAN,
      gridSize: CANVAS_CONFIG.GRID_SIZE,
      showGrid: true,
    });
  };

  const handleSelectSticky = useCallback(
    (stickyId: string) => {
      setSelectedStickyId(stickyId);
      onSelectSticky?.(stickyId);
    },
    [onSelectSticky]
  );

  const activeDragSticky = stickies.find((s) => s.id === activeDragId);

  return (
    <Card className="relative w-full h-full overflow-hidden bg-gray-50">
      {/* Toolbar */}
      <div className="absolute top-4 left-4 z-10 flex items-center gap-2 bg-white rounded-lg shadow-md p-2">
        <Button
          variant="ghost"
          size="icon"
          onClick={handleZoomOut}
          disabled={canvasState.zoom <= CANVAS_CONFIG.MIN_ZOOM}
        >
          <ZoomOut className="h-4 w-4 text-orange-600" />
        </Button>
        <span className="text-sm font-medium px-2 min-w-[60px] text-center">
          {Math.round(canvasState.zoom * 100)}%
        </span>
        <Button
          variant="ghost"
          size="icon"
          onClick={handleZoomIn}
          disabled={canvasState.zoom >= CANVAS_CONFIG.MAX_ZOOM}
        >
          <ZoomIn className="h-4 w-4 text-orange-600" />
        </Button>
        <div className="w-px h-6 bg-gray-200 mx-1" />
        <Button variant="ghost" size="icon" onClick={handleResetView}>
          <Maximize2 className="h-4 w-4 text-orange-600" />
        </Button>
      </div>

      {/* Add Sticky Button */}
      <div className="absolute top-4 right-4 z-10">
        <Button onClick={onCreateSticky} className="bg-orange-600 hover:bg-orange-700 shadow-md font-semibold">
          <Plus className="h-4 w-4 mr-2 text-white" />
          Add Sticky
        </Button>
      </div>

      {/* Canvas */}
      <DndContext
        sensors={sensors}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <div
          className="relative w-full h-full"
          style={{
            transform: `scale(${canvasState.zoom})`,
            transformOrigin: 'top left',
          }}
        >
          {/* Grid Background */}
          {canvasState.showGrid && (
            <div
              className="absolute inset-0 opacity-30"
              style={{
                backgroundImage: `
                  repeating-linear-gradient(
                    0deg,
                    transparent,
                    transparent ${canvasState.gridSize - 1}px,
                    #e5e7eb ${canvasState.gridSize - 1}px,
                    #e5e7eb ${canvasState.gridSize}px
                  ),
                  repeating-linear-gradient(
                    90deg,
                    transparent,
                    transparent ${canvasState.gridSize - 1}px,
                    #e5e7eb ${canvasState.gridSize - 1}px,
                    #e5e7eb ${canvasState.gridSize}px
                  )
                `,
                backgroundSize: `${canvasState.gridSize}px ${canvasState.gridSize}px`,
              }}
            />
          )}

          {/* Canvas Content */}
          <div
            className="relative"
            style={{
              width: '2000px',
              height: '2000px',
              minWidth: '100%',
              minHeight: '100%',
            }}
          >
            {/* Stickies */}
            {stickies.map((sticky) => {
              switch (sticky.type) {
                case 'note':
                  return (
                    <NoteSticky
                      key={sticky.id}
                      sticky={sticky as StickyItem & { data: NoteStickyData }}
                      isSelected={selectedStickyId === sticky.id}
                      onSelect={handleSelectSticky}
                    />
                  );
                case 'idea':
                  return (
                    <IdeaSticky
                      key={sticky.id}
                      sticky={sticky as StickyItem & { data: IdeaStickyData }}
                      currentUserId={''} // TODO: Get from auth context
                      isSelected={selectedStickyId === sticky.id}
                      onVote={onVoteOnIdea}
                      onConvertToTask={onConvertToTask}
                    />
                  );
                default:
                  return null;
              }
            })}
          </div>
        </div>

        {/* Drag Overlay */}
        <DragOverlay>
          {activeDragSticky && (
            <div
              style={{
                width: activeDragSticky.size.width,
                height: activeDragSticky.size.height,
              }}
              className="opacity-80"
            >
              {activeDragSticky.type === 'note' && (
                <NoteSticky sticky={activeDragSticky as StickyItem & { data: NoteStickyData }} />
              )}
              {activeDragSticky.type === 'idea' && (
                <IdeaSticky 
                  sticky={activeDragSticky as StickyItem & { data: IdeaStickyData }}
                  currentUserId={''}
                  onVote={onVoteOnIdea}
                  onConvertToTask={onConvertToTask}
                />
              )}
            </div>
          )}
        </DragOverlay>
      </DndContext>

      {/* Empty State */}
      {stickies.length === 0 && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="text-center max-w-md">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-orange-100 mb-4">
              <Plus className="w-8 h-8 text-orange-600" />
            </div>
            <h3 className="text-lg font-semibold mb-2">Start Your PartyBoard</h3>
            <p className="text-gray-500">
              Add sticky notes, polls, ideas, and more to plan your event collaboratively.
            </p>
          </div>
        </div>
      )}
    </Card>
  );
};
