import { useState } from 'react';
import { UserPlus, Check, Loader2, Mail, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { supabase } from '@/lib/supabase';

interface Guest {
  id: string;
  name: string;
  email?: string;
  user_id?: string;
  rsvp_status: 'pending' | 'confirmed' | 'declined' | 'maybe';
  checked_in?: boolean;
  checked_in_at?: string;
}

interface GuestListWithCrewProps {
  guests: Guest[];
  eventId: string;
  onGuestUpdated?: () => void;
}

export function GuestListWithCrew({ guests, eventId, onGuestUpdated }: GuestListWithCrewProps) {
  const [convertingGuests, setConvertingGuests] = useState<Set<string>>(new Set());
  const [convertedGuests, setConvertedGuests] = useState<Set<string>>(new Set());

  const convertToCrew = async (guest: Guest) => {
    if (!guest.user_id) {
      alert('This guest must sign up for an account before they can be added to your crew');
      return;
    }

    setConvertingGuests(prev => new Set(prev).add(guest.id));

    try {
      const { data: { session } } = await supabase.auth.getSession();

      const response = await fetch('/api/convert-guest-to-crew', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.access_token}`,
        },
        body: JSON.stringify({
          guest_id: guest.id,
          event_id: eventId,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to add to crew');
      }

      const data = await response.json();

      // Success - add to converted set
      setConvertedGuests(prev => new Set(prev).add(guest.id));

      // Show success message
      alert(`${data.connection.user_profiles.display_name || guest.name} has been added to your crew! 🎉`);

      // Callback to refresh data if needed
      onGuestUpdated?.();
    } catch (error) {
      console.error('Failed to convert guest:', error);
      alert(error instanceof Error ? error.message : 'Failed to add guest to crew');
    } finally {
      setConvertingGuests(prev => {
        const newSet = new Set(prev);
        newSet.delete(guest.id);
        return newSet;
      });
    }
  };

  const getRSVPBadge = (status: Guest['rsvp_status']) => {
    const variants: Record<string, { variant: any; label: string }> = {
      confirmed: { variant: 'default', label: 'Confirmed' },
      pending: { variant: 'secondary', label: 'Pending' },
      declined: { variant: 'destructive', label: 'Declined' },
      maybe: { variant: 'outline', label: 'Maybe' },
    };

    const config = variants[status] || variants.pending;

    return (
      <Badge variant={config.variant as any}>
        {config.label}
      </Badge>
    );
  };

  return (
    <div className="space-y-3">
      {guests.map((guest) => {
        const isConverting = convertingGuests.has(guest.id);
        const isConverted = convertedGuests.has(guest.id);
        const hasAccount = !!guest.user_id;

        return (
          <div
            key={guest.id}
            className="flex items-center justify-between p-4 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
          >
            {/* Guest Info */}
            <div className="flex-1 space-y-1">
              <div className="flex items-center gap-2">
                <p className="font-medium">{guest.name}</p>
                {getRSVPBadge(guest.rsvp_status)}
                {guest.checked_in && (
                  <Badge variant="outline" className="gap-1">
                    <Check className="h-3 w-3" />
                    Checked In
                  </Badge>
                )}
              </div>

              {guest.email && (
                <div className="flex items-center gap-1 text-sm text-muted-foreground">
                  <Mail className="h-3 w-3" />
                  {guest.email}
                </div>
              )}

              {guest.checked_in_at && (
                <p className="text-xs text-muted-foreground">
                  Checked in {new Date(guest.checked_in_at).toLocaleString()}
                </p>
              )}
            </div>

            {/* Add to Crew Button */}
            <div className="flex items-center gap-2">
              {hasAccount ? (
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        size="sm"
                        variant={isConverted ? "outline" : "default"}
                        onClick={() => convertToCrew(guest)}
                        disabled={isConverting || isConverted || guest.rsvp_status === 'declined'}
                        className="gap-2"
                      >
                        {isConverting ? (
                          <>
                            <Loader2 className="h-4 w-4 animate-spin" />
                            Adding...
                          </>
                        ) : isConverted ? (
                          <>
                            <Check className="h-4 w-4" />
                            In Crew
                          </>
                        ) : (
                          <>
                            <UserPlus className="h-4 w-4" />
                            Add to Crew
                          </>
                        )}
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>
                        {isConverted 
                          ? 'Already in your crew' 
                          : 'Add this guest to your crew to see their events'}
                      </p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              ) : (
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div>
                        <Button
                          size="sm"
                          variant="outline"
                          disabled
                          className="gap-2 opacity-50"
                        >
                          <User className="h-4 w-4" />
                          No Account
                        </Button>
                      </div>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Guest needs to create an account to join your crew</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              )}
            </div>
          </div>
        );
      })}

      {guests.length === 0 && (
        <div className="text-center py-12 text-muted-foreground">
          <p>No guests yet</p>
          <p className="text-sm mt-1">Generate a QR code to invite guests</p>
        </div>
      )}
    </div>
  );
}
