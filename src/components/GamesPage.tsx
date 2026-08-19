import { GameManager } from '@/components/games/GameManager';
import { usePartyStore } from '@/store/usePartyStore';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { PageShell } from '@/components/layout/PageShell';
import { ArrowLeft } from 'lucide-react';
import { safeFormat } from '@/lib/utils';

export function GamesPage() {
  const { currentEvent, setCurrentPage, user } = usePartyStore();

  if (!currentEvent) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-foreground mb-4">No Event Selected</h2>
          <p className="text-muted-foreground mb-6">Please select an event to access games.</p>
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
  const meta = [
    safeFormat(currentEvent.start_date || currentEvent.date, 'PPP', 'Date TBD'),
    currentEvent.location,
    `${mockParticipants.length} participants`,
  ]
    .filter(Boolean)
    .join(' · ');

  return (
    <PageShell
      title={currentEvent.name}
      subtitle={meta}
      maxWidth="2xl"
      onBack={() => setCurrentPage('dashboard')}
      actions={
        isHost ? (
          <Badge className="bg-green-50 text-green-700 border-green-200" variant="secondary">
            Host
          </Badge>
        ) : undefined
      }
    >
      <GameManager
        eventId={currentEvent.id}
        hostId={currentEvent.host_id}
        participantId={user?.id || ''}
        participants={mockParticipants}
        isHost={isHost}
        onGameEnd={() => setCurrentPage('dashboard')}
      />
    </PageShell>
  );
}