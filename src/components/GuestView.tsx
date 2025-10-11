import { useEffect, useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { usePartyStore } from '@/store/usePartyStore';
import { supabase } from '@/lib/supabase';
import { Loading } from '@/components/ui/loading';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar, MapPin, Music, QrCode, Sparkles, User } from 'lucide-react';
import { safeFormat } from '@/lib/utils';
import { QRCodeCanvas } from 'qrcode.react';

interface GuestViewProps {
  guestId: string;
  eventId?: string;
}

export const GuestView = ({ guestId, eventId }: GuestViewProps) => {
  const { events, guests, currentEvent } = usePartyStore();
  const setGuests = usePartyStore((s) => s.setGuests);
  const setEvents = usePartyStore((s) => s.setEvents);
  const setCurrentEvent = usePartyStore((s) => s.setCurrentEvent);
  const [showQR, setShowQR] = useState(false);
  const [isFetching, setIsFetching] = useState(false);
  const triedFetch = useRef(false);
  
  const guest = guests.find(g => g.id === guestId);
  const event = guest ? events.find(e => e.id === guest.event_id) || currentEvent : null;

  // If guest or event missing, attempt to fetch them once from Supabase
  useEffect(() => {
    let mounted = true;
    const fetchGuestAndEvent = async () => {
      if (guest || isFetching || triedFetch.current) return;
      triedFetch.current = true;
      setIsFetching(true);
      try {
        const { data: fetchedGuest } = await supabase
          .from('guests')
          .select('*')
          .eq('id', guestId)
          .maybeSingle();

        if (!mounted) return;
        if (fetchedGuest) {
          // merge into store guests
          setGuests([...(guests || []).filter(g => g.id !== fetchedGuest.id), fetchedGuest]);
          // fetch event for guest
          const { data: fetchedEvent } = await supabase
            .from('events')
            .select('*')
            .eq('id', fetchedGuest.event_id)
            .maybeSingle();
          if (!mounted) return;
          if (fetchedEvent) {
            // Merge fetchedEvent into the existing events array without reordering
            const existing = events || [];
            const foundIndex = existing.findIndex(e => e.id === fetchedEvent.id);
            let merged: typeof existing;
            if (foundIndex >= 0) {
              merged = [...existing.slice(0, foundIndex), fetchedEvent, ...existing.slice(foundIndex + 1)];
            } else {
              merged = [...existing, fetchedEvent];
            }
            setEvents(merged);

            // set currentEvent for the UI using the action which will also load guests
            try {
              await setCurrentEvent(fetchedEvent);
            } catch (e) {
              // fallback: call action without await
              setCurrentEvent(fetchedEvent);
            }
          }
        }
      } catch (e) {
        // ignore, will show not found below
      } finally {
        if (mounted) setIsFetching(false);
      }
    };

    fetchGuestAndEvent();

    return () => { mounted = false; };
  }, [guest, guestId, guests, events, isFetching, setGuests, setEvents, setCurrentEvent]);

  if (isFetching) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loading size="lg" />
      </div>
    );
  }

  if (!guest || !event) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="glass border-destructive/20">
          <CardContent className="text-center py-8">
            <h2 className="text-2xl font-bold mb-2">Invitation Not Found</h2>
            <p className="text-muted-foreground">
              This invitation link may be invalid or expired.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-hero">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          {/* Welcome Header */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-8"
          >
            <motion.h1 
              className="text-4xl font-bold bg-gradient-primary bg-clip-text text-transparent mb-2"
              animate={{ 
                filter: ["drop-shadow(0 0 20px hsl(280 100% 70% / 0.5))", "drop-shadow(0 0 40px hsl(280 100% 70% / 0.8))", "drop-shadow(0 0 20px hsl(280 100% 70% / 0.5))"]
              }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              You're Invited!
            </motion.h1>
            <p className="text-xl text-foreground/80">
              Hey {guest.name}, get ready to party! 🎉
            </p>
          </motion.div>

          {/* Event Details Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="mb-6"
          >
            <Card className="glass border-primary/20 shadow-2xl overflow-hidden">
              <div className="absolute inset-0 bg-gradient-primary opacity-5" />
              <CardHeader className="relative text-center">
                <motion.div
                  animate={{ rotate: [0, 10, -10, 0] }}
                  transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
                  className="mx-auto mb-4"
                >
                  <Sparkles className="h-12 w-12 text-primary animate-neon-flicker" />
                </motion.div>
                <CardTitle className="text-3xl">{event.name}</CardTitle>
                <CardDescription className="text-lg">
                  You're invited to join the celebration!
                </CardDescription>
              </CardHeader>
              
              <CardContent className="relative space-y-6">
                {/* Event Info */}
                <div className="space-y-4">
                  <div className="flex items-center p-4 bg-secondary/20 rounded-lg">
                    <Calendar className="h-6 w-6 text-primary mr-4" />
                    <div>
                      <p className="font-semibold">When</p>
                      <p className="text-muted-foreground">
                        {safeFormat(event.start_date || event.date, 'EEEE, MMMM do, yyyy', '')}
                      </p>
                      <p className="text-muted-foreground">
                        {safeFormat(event.start_date || event.date, 'h:mm a', '')}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center p-4 bg-secondary/20 rounded-lg">
                    <MapPin className="h-6 w-6 text-accent mr-4" />
                    <div>
                      <p className="font-semibold">Where</p>
                      <p className="text-muted-foreground">{event.location}</p>
                    </div>
                  </div>

                  <div className="flex items-center p-4 bg-secondary/20 rounded-lg">
                    <User className="h-6 w-6 text-primary mr-4" />
                    <div>
                      <p className="font-semibold">Your Details</p>
                      <p className="text-muted-foreground">{guest.name}</p>
                      <p className="text-sm text-muted-foreground">{guest.email}</p>
                    </div>
                  </div>
                </div>

                {/* QR Code Section */}
                <div className="text-center">
                  {!showQR ? (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: 0.4 }}
                    >
                      <Button
                        onClick={() => setShowQR(true)}
                        className="btn-party h-16 px-8 text-xl font-bold"
                        size="lg"
                      >
                        <QrCode className="h-8 w-8 mr-4" />
                        Show My QR Code
                      </Button>
                      <p className="text-sm text-muted-foreground mt-3">
                        Present this QR code at the event for quick check-in
                      </p>
                    </motion.div>
                  ) : (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ duration: 0.5 }}
                      className="qr-container rounded-xl p-8 mx-auto max-w-sm"
                    >
                      <h3 className="text-xl font-bold mb-4 text-center">Your Entry QR Code</h3>
                      <div className="bg-white p-4 rounded-lg mb-4">
                        <QRCodeCanvas
                          value={guest.id}
                          size={200}
                          level="H"
                          className="mx-auto"
                        />
                      </div>
                      <p className="text-sm text-muted-foreground mb-4">
                        Present this code to the host for instant check-in
                      </p>
                      <Button
                        variant="outline"
                        onClick={() => setShowQR(false)}
                        className="border-primary/30 hover:bg-primary/10"
                      >
                        Hide QR Code
                      </Button>
                    </motion.div>
                  )}
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Spotify Playlist */}
          {event.spotify_playlist_url && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
            >
              <Card className="glass border-primary/20 shadow-2xl">
                <CardHeader className="text-center">
                  <CardTitle className="flex items-center justify-center">
                    <Music className="h-6 w-6 mr-2 text-primary animate-neon-flicker" />
                    Party Playlist
                  </CardTitle>
                  <CardDescription>
                    Get in the mood with our collaborative playlist!
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="aspect-square rounded-lg overflow-hidden bg-gradient-primary/10 border border-primary/20">
                    <iframe
                      src={event.spotify_playlist_url.replace('playlist/', 'embed/playlist/')}
                      width="100%"
                      height="100%"
                      frameBorder="0"
                      allow="encrypted-media"
                      className="rounded-lg"
                    />
                  </div>
                  <p className="text-sm text-center text-muted-foreground mt-4">
                    Add your favorite songs to make this party even better!
                  </p>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* Fun Animation */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1 }}
            className="text-center mt-8"
          >
            <motion.div
              animate={{ 
                y: [0, -10, 0],
                rotate: [0, 5, -5, 0]
              }}
              transition={{ 
                duration: 3,
                repeat: Infinity,
                ease: "easeInOut"
              }}
              className="inline-block"
            >
              <Sparkles className="h-8 w-8 text-accent animate-party-pulse" />
            </motion.div>
            <p className="text-muted-foreground mt-2">
              Can't wait to see you there!
            </p>
          </motion.div>
        </div>
      </div>
    </div>
  );
};