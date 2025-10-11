import React from 'react';
import { GameManager } from '@/components/games/GameManager';
import { usePartyStore } from '@/store/usePartyStore';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Users, Calendar, MapPin } from 'lucide-react';
import { safeFormat } from '@/lib/utils';

export function GamesPage() {
  const { currentEvent, setCurrentPage, user } = usePartyStore();

  if (!currentEvent) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">No Event Selected</h2>
          <p className="text-gray-600 mb-6">Please select an event to access games.</p>
          <Button onClick={() => setCurrentPage('dashboard')}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Dashboard
          </Button>
        </div>
      </div>
    );
  }

  // Mock participants data - in real app, this would come from the event's guest list
  const mockParticipants = [
    { id: user?.id || '1', name: user?.name || 'You', email: user?.email || 'you@example.com' },
    { id: '2', name: 'Alice Johnson', email: 'alice@example.com' },
    { id: '3', name: 'Bob Smith', email: 'bob@example.com' },
    { id: '4', name: 'Carol Davis', email: 'carol@example.com' },
    { id: '5', name: 'David Wilson', email: 'david@example.com' }
  ];

  const isHost = currentEvent.host_id === user?.id;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Button
                variant="ghost"
                onClick={() => setCurrentPage('dashboard')}
                className="text-gray-600 hover:text-gray-900"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back
              </Button>
              
              <div className="h-6 w-px bg-gray-300" />
              
              <div>
                <h1 className="text-xl font-bold text-gray-900">{currentEvent.name}</h1>
                <div className="flex items-center space-x-4 text-sm text-gray-600">
                  <div className="flex items-center space-x-1">
                    <Calendar className="w-4 h-4" />
                    <span>{safeFormat(currentEvent.start_date || currentEvent.date, 'PPP', 'Invalid date')}</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <MapPin className="w-4 h-4" />
                    <span>{currentEvent.location}</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Users className="w-4 h-4" />
                    <span>{mockParticipants.length} participants</span>
                  </div>
                </div>
              </div>
            </div>

            {isHost && (
              <div className="flex items-center space-x-2">
                <span className="text-sm text-green-600 font-medium bg-green-50 px-2 py-1 rounded">
                  Host
                </span>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Games Content */}
      <main className="py-6">
        <GameManager
          eventId={currentEvent.id}
          hostId={currentEvent.host_id}
          participantId={user?.id || ''}
          participants={mockParticipants}
          isHost={isHost}
          onGameEnd={() => setCurrentPage('dashboard')}
        />
      </main>
    </div>
  );
}