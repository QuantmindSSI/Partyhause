import { usePartyStore } from '@/store/usePartyStore';
import { Calendar, Search, Ticket, Users, Star, MapPin, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { PageShell, UserMenu } from '@/components/layout/PageShell';

export default function UserDashboard() {
  const user = usePartyStore((s) => s.user);
  const setCurrentPage = usePartyStore((s) => s.setCurrentPage);

  const name = user?.name || user?.email || 'Guest';

  return (
    <PageShell
      title="PartyHause"
      subtitle="Attendee"
      maxWidth="lg"
      actions={<UserMenu />}
    >
        {/* Welcome */}
        <div>
          <h2 className="text-2xl font-bold text-foreground">Hey, {name.split(' ')[0]} 👋</h2>
          <p className="text-muted-foreground text-sm mt-1">Discover events and manage your RSVPs</p>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[
            { icon: Search, label: 'Explore', page: 'explore', color: 'bg-blue-50 text-blue-600' },
            { icon: Ticket, label: 'My Tickets', page: 'my-tickets', color: 'bg-orange-50 text-orange-600' },
            { icon: Users, label: 'Friends', page: 'feed', color: 'bg-purple-50 text-purple-600' },
            { icon: Star, label: 'Saved', page: 'saved-events', color: 'bg-yellow-50 text-yellow-600' },
          ].map(({ icon: Icon, label, page, color }) => (
            <button
              key={page}
              onClick={() => setCurrentPage(page)}
              className="flex flex-col items-center gap-2 p-4 rounded-2xl border bg-card hover:shadow-md transition-all"
            >
              <div className={`p-3 rounded-xl ${color}`}>
                <Icon className="h-5 w-5" />
              </div>
              <span className="text-xs font-medium text-foreground">{label}</span>
            </button>
          ))}
        </div>

        {/* Upcoming RSVPs */}
        <section>
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-foreground">Your Upcoming Events</h3>
            <button
              onClick={() => setCurrentPage('my-tickets')}
              className="text-xs text-orange-500 font-medium flex items-center gap-1 hover:underline"
            >
              View all <ArrowRight className="h-3 w-3" />
            </button>
          </div>
          <Card>
            <CardContent className="p-6 text-center">
              <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-3 opacity-40" />
              <p className="font-medium text-foreground">No upcoming events</p>
              <p className="text-sm text-muted-foreground mt-1">Find events near you and RSVP!</p>
              <Button className="mt-4" onClick={() => setCurrentPage('explore')}>
                Explore Events
              </Button>
            </CardContent>
          </Card>
        </section>

        {/* Nearby Events */}
        <section>
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-foreground">Discover Nearby</h3>
            <Badge variant="outline" className="text-xs flex items-center gap-1">
              <MapPin className="h-3 w-3" /> Your area
            </Badge>
          </div>
          <Card>
            <CardContent className="p-6 text-center">
              <MapPin className="h-12 w-12 text-muted-foreground mx-auto mb-3 opacity-40" />
              <p className="font-medium text-foreground">No events found nearby</p>
              <p className="text-sm text-muted-foreground mt-1">Check back soon for events in your area</p>
            </CardContent>
          </Card>
        </section>

        {/* Switch Role hint */}
        <div className="rounded-2xl border border-dashed border-orange-200 bg-orange-50 p-4 flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold text-orange-700">Want to host events?</p>
            <p className="text-xs text-orange-600 mt-0.5">Switch to a Creator account</p>
          </div>
          <Button
            size="sm"
            variant="outline"
            className="border-orange-400 text-orange-600 hover:bg-orange-100"
            onClick={() => setCurrentPage('switch-role')}
          >
            Upgrade
          </Button>
        </div>
    </PageShell>
  );
}
