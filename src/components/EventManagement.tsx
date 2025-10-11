
import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { usePartyStore } from '@/store/usePartyStore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loading } from '@/components/ui/loading';
import { ArrowLeft, Calendar, MapPin, Music, Plus, QrCode, Users, UserCheck, UserX, Mail, Clock } from 'lucide-react';
import format from 'date-fns/format';
import { GuestList } from './GuestList';

export const EventManagement = () => {
  const { currentEvent, events, setCurrentEvent, guests, setCurrentPage, isLoading } = usePartyStore();
  // Ref to track if we've already tried to load guests for this event
  const guestLoadAttempted = useRef<Set<string>>(new Set());
  // Ref to track the last guest count for this event to avoid unnecessary re-fetches
  const lastGuestCount = useRef<Map<string, number>>(new Map());

  useEffect(() => {
    if (!currentEvent || isLoading) return;

    const eventId = currentEvent.id;
    const eventGuests = guests.filter(g => g.event_id === eventId);
    const currentGuestCount = eventGuests.length;
    const previousGuestCount = lastGuestCount.current.get(eventId) || 0;

    // Only fetch if we haven't tried before AND the guest count hasn't changed
    // This prevents infinite loops when guests array updates but count stays the same
    if (!guestLoadAttempted.current.has(eventId) && currentGuestCount === previousGuestCount) {
      guestLoadAttempted.current.add(eventId);
      setCurrentEvent(currentEvent);
    }

    // Update the last known count
    lastGuestCount.current.set(eventId, currentGuestCount);
  }, [currentEvent?.id, guests.length, isLoading, setCurrentEvent]);

  const [showAddGuest, setShowAddGuest] = useState(false);
  const [guestForm, setGuestForm] = useState({ name: '', email: '' });

  const eventGuests = currentEvent ? guests.filter(guest => guest.event_id === currentEvent.id) : [];
  const checkedInCount = eventGuests.filter(guest => guest.is_checked_in).length;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loading size="lg" />
      </div>
    );
  }

  if (!currentEvent && events.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-screen text-xl text-muted-foreground">
        Event not found
      </div>
    );
  }

  if (!currentEvent) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loading size="lg" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <motion.header
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="border-b border-border/50 bg-card/50 backdrop-blur-xl sticky top-0 z-10"
      >
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setCurrentPage('dashboard')}
                className="mr-4"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Dashboard
              </Button>
              <div>
                <h1 className="text-2xl font-bold">{currentEvent.name}</h1>
                <p className="text-muted-foreground">Event Management</p>
              </div>
            </div>
            <Button
              onClick={() => setCurrentPage('qr-scanner')}
              className="btn-party"
            >
              <QrCode className="h-4 w-4 mr-2" />
              Scan QR Code
            </Button>
          </div>
        </div>
      </motion.header>

      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Event Details & Stats */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
            className="lg:col-span-1 space-y-6"
          >
            {/* Event Info Card */}
            <Card className="glass border-primary/20 shadow-2xl">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Calendar className="h-5 w-5 mr-2 text-primary" />
                  Event Details
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center text-muted-foreground">
                  <Calendar className="h-4 w-4 mr-2" />
                  <span>{format(new Date(currentEvent.start_date || currentEvent.date!), 'PPP')}</span>
                </div>
                <div className="flex items-center text-muted-foreground">
                  <Clock className="h-4 w-4 mr-2" />
                  <span>{format(new Date(currentEvent.start_date || currentEvent.date!), 'p')}</span>
                </div>
                <div className="flex items-center text-muted-foreground">
                  <MapPin className="h-4 w-4 mr-2" />
                  <span>{currentEvent.location}</span>
                </div>
                {currentEvent.spotify_playlist_url && (
                  <div className="flex items-center text-muted-foreground">
                    <Music className="h-4 w-4 mr-2" />
                    <span>Spotify Playlist</span>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Stats Card */}
            <Card className="glass border-accent/20 shadow-2xl">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Users className="h-5 w-5 mr-2 text-accent" />
                  Guest Stats
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center bg-primary/10 rounded-lg p-4">
                    <div className="text-2xl font-bold text-primary">
                      {eventGuests.length}
                    </div>
                    <div className="text-sm text-muted-foreground">Total Guests</div>
                  </div>
                  <div className="text-center bg-accent/10 rounded-lg p-4">
                    <div className="text-2xl font-bold text-accent">
                      {checkedInCount}
                    </div>
                    <div className="text-sm text-muted-foreground">Checked In</div>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Check-in Progress</span>
                    <span>{eventGuests.length > 0 ? Math.round((checkedInCount / eventGuests.length) * 100) : 0}%</span>
                  </div>
                  <div className="w-full bg-secondary rounded-full h-2">
                    <motion.div
                      className="bg-gradient-primary h-2 rounded-full"
                      initial={{ width: 0 }}
                      animate={{ width: `${eventGuests.length > 0 ? (checkedInCount / eventGuests.length) * 100 : 0}%` }}
                      transition={{ duration: 0.8, ease: "easeOut" }}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Main Content */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="lg:col-span-2 space-y-6"
          >
            {/* Guest List */}
            <Card className="glass border-primary/20 shadow-2xl">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span className="flex items-center">
                    <Users className="h-5 w-5 mr-2 text-primary" />
                    Guest Management
                  </span>
                  <Badge variant="secondary" className="bg-primary/10 text-primary">
                    {checkedInCount}/{eventGuests.length} Checked In
                  </Badge>
                </CardTitle>
                <CardDescription>
                  Manage your guest list and track check-ins in real-time
                </CardDescription>
              </CardHeader>
              <CardContent>
                <GuestList eventId={currentEvent.id} />
              </CardContent>
            </Card>

            {/* Spotify Playlist */}
            {currentEvent.spotify_playlist_url && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.4 }}
              >
                <Card className="glass border-accent/20 shadow-2xl">
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <Music className="h-5 w-5 mr-2 text-accent" />
                      Party Playlist
                    </CardTitle>
                    <CardDescription>
                      Your collaborative Spotify playlist for the event
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="aspect-video w-full">
                      <iframe
                        src={`https://open.spotify.com/embed/playlist/${currentEvent.spotify_playlist_url.split('/').pop()}`}
                        width="100%"
                        height="100%"
                        frameBorder="0"
                        allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
                        loading="lazy"
                        className="rounded-lg"
                      />
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )}
          </motion.div>
        </div>
      </div>
    </div>
  );
};