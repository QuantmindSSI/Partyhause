import React, { useState } from 'react';
import { Layers, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loading } from '@/components/ui/loading';
import { PartyBoardCanvas } from './PartyBoardCanvas';
import { CreateStickyDialog } from './CreateStickyDialog';
import { usePartyBoard } from '../hooks/usePartyBoard';

interface PartyBoardSectionProps {
  eventId: string;
}

export const PartyBoardSection: React.FC<PartyBoardSectionProps> = ({ eventId }) => {
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  
  const {
    stickies,
    loading,
    error,
    createNote,
    updateStickyPosition,
    getStats,
  } = usePartyBoard({
    eventId,
    autoRefresh: true,
  });

  const stats = getStats();

  const handleCreateSticky = () => {
    setShowCreateDialog(true);
  };

  const handleCreateNote = async (data: any) => {
    await createNote(data);
  };

  if (loading && stickies.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Layers className="h-5 w-5 text-violet-600" />
            PartyBoard
          </CardTitle>
          <CardDescription>Collaborative planning canvas</CardDescription>
        </CardHeader>
        <CardContent className="flex justify-center py-8">
          <Loading />
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Layers className="h-5 w-5 text-violet-600" />
            PartyBoard
          </CardTitle>
          <CardDescription>Collaborative planning canvas</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-red-500">
            <p>Failed to load PartyBoard: {error}</p>
            <Button
              variant="outline"
              className="mt-4"
              onClick={() => window.location.reload()}
            >
              Retry
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Layers className="h-5 w-5 text-violet-600" />
              PartyBoard
            </CardTitle>
            <CardDescription>
              Drag sticky notes to plan collaboratively
            </CardDescription>
          </div>
          <div className="flex items-center gap-4">
            {stickies.length > 0 && (
              <div className="flex items-center gap-4 text-sm text-gray-600">
                <span>{stats.stickies} stickies</span>
                <span>{stats.ideas} ideas</span>
                <span>{stats.votes} votes</span>
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="h-[600px]">
            <PartyBoardCanvas
              eventId={eventId}
              stickies={stickies}
              onUpdateStickyPosition={updateStickyPosition}
              onCreateSticky={handleCreateSticky}
            />
          </div>
        </CardContent>
      </Card>

      {/* Create Sticky Dialog */}
      <CreateStickyDialog
        open={showCreateDialog}
        onOpenChange={setShowCreateDialog}
        onCreateNote={handleCreateNote}
      />
    </>
  );
};
