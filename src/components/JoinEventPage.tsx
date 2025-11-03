import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Loader2, PartyPopper, Users, Calendar, MapPin, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { supabase } from '@/lib/supabase';

interface Event {
  id: string;
  name: string;
  description?: string;
  start_date: string;
  venue?: string;
  location?: string;
  host_id: string;
}

interface JoinResponse {
  message: string;
  guest: any;
  event: Event;
  connection: {
    type: 'connected' | 'request_sent' | 'already_connected';
    connection?: any;
    request?: any;
  } | null;
  show_crew_prompt: boolean;
}

export function JoinEventPage() {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  
  const [loading, setLoading] = useState(true);
  const [joining, setJoining] = useState(false);
  const [showCrewModal, setShowCrewModal] = useState(false);
  const [eventData, setEventData] = useState<JoinResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    checkAuth();
  }, []);

  useEffect(() => {
    if (token && isAuthenticated !== null) {
      joinEvent(false);
    }
  }, [token, isAuthenticated]);

  const checkAuth = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      setIsAuthenticated(!!session);
    } catch (error) {
      console.error('Auth check failed:', error);
      setIsAuthenticated(false);
    }
  };

  const joinEvent = async (addToCrew: boolean = false) => {
    if (!token) return;

    setJoining(true);
    setLoading(true);
    setError(null);

    try {
      const { data: { session } } = await supabase.auth.getSession();

      const response = await fetch('/api/join-event', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(session?.access_token && {
            'Authorization': `Bearer ${session.access_token}`,
          }),
        },
        body: JSON.stringify({
          token,
          also_add_to_crew: addToCrew,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to join event');
      }

      const data: JoinResponse = await response.json();
      setEventData(data);

      if (data.show_crew_prompt && !addToCrew) {
        setShowCrewModal(true);
      } else {
        // Show success message briefly, then navigate
        setTimeout(() => {
          navigate(`/events/${data.event.id}`);
        }, 2000);
      }
    } catch (error) {
      console.error('Failed to join event:', error);
      setError(error instanceof Error ? error.message : 'Failed to join event');
    } finally {
      setLoading(false);
      setJoining(false);
    }
  };

  const handleCrewAccept = () => {
    setShowCrewModal(false);
    joinEvent(true);
  };

  const handleCrewDecline = () => {
    setShowCrewModal(false);
    if (eventData) {
      navigate(`/events/${eventData.event.id}`);
    }
  };

  if (loading && !showCrewModal) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 to-pink-50">
        <Card className="w-full max-w-md">
          <CardContent className="pt-12 pb-12 flex flex-col items-center gap-4">
            <Loader2 className="h-12 w-12 animate-spin text-primary" />
            <p className="text-lg font-medium">Joining event...</p>
            <p className="text-sm text-muted-foreground">Please wait</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 to-pink-50 p-4">
        <Card className="w-full max-w-md border-destructive">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-destructive">
              <span>❌</span> Unable to Join
            </CardTitle>
            <CardDescription>
              {error}
            </CardDescription>
          </CardHeader>
          <CardFooter>
            <Button
              variant="outline"
              onClick={() => navigate('/')}
              className="w-full"
            >
              Go to Home
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  if (!isAuthenticated && !loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 to-pink-50 p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PartyPopper className="h-6 w-6 text-primary" />
              Join Event
            </CardTitle>
            <CardDescription>
              Sign in to join this event and access all features
            </CardDescription>
          </CardHeader>
          <CardFooter className="flex gap-2">
            <Button
              onClick={() => navigate('/auth')}
              className="flex-1"
            >
              Sign In
            </Button>
            <Button
              variant="outline"
              onClick={() => navigate('/')}
              className="flex-1"
            >
              Cancel
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  // Success state (before crew modal or navigation)
  if (eventData && !showCrewModal) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 to-pink-50 p-4">
        <Card className="w-full max-w-md border-green-500">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-green-600">
              <Check className="h-6 w-6" />
              Successfully Joined!
            </CardTitle>
            <CardDescription>
              You've been added to {eventData.event.name}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Redirecting to event page...
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Crew prompt modal
  if (showCrewModal && eventData) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 to-pink-50 p-4">
        <Card className="w-full max-w-lg">
          <CardHeader className="text-center pb-4">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
              <PartyPopper className="h-8 w-8 text-primary" />
            </div>
            <CardTitle className="text-2xl">🎉 You're In!</CardTitle>
            <CardDescription className="text-base">
              Successfully joined <strong>{eventData.event.name}</strong>
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-6">
            {/* Event Details */}
            <div className="rounded-lg bg-muted/50 p-4 space-y-2">
              <div className="flex items-start gap-3">
                <Calendar className="h-5 w-5 text-muted-foreground mt-0.5" />
                <div>
                  <p className="text-sm font-medium">
                    {new Date(eventData.event.start_date).toLocaleDateString('en-US', {
                      weekday: 'long',
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                      hour: 'numeric',
                      minute: '2-digit',
                    })}
                  </p>
                </div>
              </div>
              {(eventData.event.venue || eventData.event.location) && (
                <div className="flex items-start gap-3">
                  <MapPin className="h-5 w-5 text-muted-foreground mt-0.5" />
                  <p className="text-sm">
                    {eventData.event.venue || eventData.event.location}
                  </p>
                </div>
              )}
            </div>

            {/* Crew Prompt */}
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-primary">
                <Users className="h-5 w-5" />
                <h3 className="font-semibold">Add Host to Your Crew?</h3>
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Join the host's crew to automatically see their future events in your feed. 
                Stay connected and never miss out on the next party!
              </p>
            </div>
          </CardContent>

          <CardFooter className="flex flex-col gap-2">
            <Button
              onClick={handleCrewAccept}
              disabled={joining}
              className="w-full gap-2"
              size="lg"
            >
              {joining ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Adding to Crew...
                </>
              ) : (
                <>
                  <Users className="h-4 w-4" />
                  Yes — Add to Crew
                </>
              )}
            </Button>
            <Button
              onClick={handleCrewDecline}
              disabled={joining}
              variant="outline"
              className="w-full"
              size="lg"
            >
              No Thanks — Just Join Event
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  return null;
}
