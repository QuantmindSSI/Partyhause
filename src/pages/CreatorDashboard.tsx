import { usePartyStore } from '@/store/usePartyStore';
import { Plus, Calendar, Users, BarChart2, Bell, Settings, ArrowRight, Sparkles, QrCode } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { format } from 'date-fns';

export default function CreatorDashboard() {
  const user = usePartyStore((s) => s.user);
  const events = usePartyStore((s) => s.events);
  const setCurrentPage = usePartyStore((s) => s.setCurrentPage);
  const setCurrentEvent = usePartyStore((s) => s.setCurrentEvent);

  const name = user?.name || user?.email || 'Creator';
  const upcomingEvents = events.filter(
    (e) => new Date(e.start_date || e.date || '') >= new Date()
  );
  const totalGuests = events.reduce((sum, e) => sum + (e.max_guests || 0), 0);

  const handleEventClick = async (event: typeof events[0]) => {
    await setCurrentEvent(event);
    setCurrentPage('event-management');
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-foreground">PartyHause</h1>
            <p className="text-xs text-muted-foreground">Creator Studio</p>
          </div>
          <div className="flex items-center gap-3">
            <button
              className="relative p-2 rounded-full hover:bg-muted transition-colors"
              onClick={() => setCurrentPage('settings')}
            >
              <Bell className="h-5 w-5 text-foreground" />
            </button>
            <button
              className="p-2 rounded-full hover:bg-muted transition-colors"
              onClick={() => setCurrentPage('settings')}
            >
              <Settings className="h-5 w-5 text-foreground" />
            </button>
            <Avatar className="h-9 w-9 cursor-pointer" onClick={() => setCurrentPage('profile')}>
              <AvatarFallback className="bg-orange-100 text-orange-600 font-bold text-sm">
                {name.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-6 space-y-6">
        {/* Welcome + Create CTA */}
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-2xl font-bold text-foreground">Welcome back, {name.split(' ')[0]}</h2>
            <p className="text-muted-foreground text-sm mt-1">Manage your events and grow your audience</p>
          </div>
          <Button
            className="bg-orange-500 hover:bg-orange-600 text-white gap-2 shadow-md"
            onClick={() => setCurrentPage('create-event')}
          >
            <Plus className="h-4 w-4" /> New Event
          </Button>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: 'Total Events', value: events.length, icon: Calendar, color: 'text-blue-600 bg-blue-50' },
            { label: 'Upcoming', value: upcomingEvents.length, icon: Sparkles, color: 'text-orange-600 bg-orange-50' },
            { label: 'Total Guests', value: totalGuests, icon: Users, color: 'text-purple-600 bg-purple-50' },
            { label: 'Analytics', value: '→', icon: BarChart2, color: 'text-green-600 bg-green-50', action: () => setCurrentPage('analytics') },
          ].map(({ label, value, icon: Icon, color, action }) => (
            <Card
              key={label}
              className={`cursor-pointer hover:shadow-md transition-all ${action ? 'hover:border-orange-300' : ''}`}
              onClick={action}
            >
              <CardContent className="p-4 flex items-center gap-3">
                <div className={`p-2 rounded-xl ${color}`}>
                  <Icon className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-xl font-bold text-foreground">{value}</p>
                  <p className="text-xs text-muted-foreground">{label}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { icon: Plus, label: 'Create Event', page: 'create-event', color: 'bg-orange-500 text-white' },
            { icon: Sparkles, label: 'Templates', page: 'templates', color: 'bg-purple-50 text-purple-600' },
            { icon: QrCode, label: 'QR Scanner', page: 'qr-scanner', color: 'bg-blue-50 text-blue-600' },
            { icon: Users, label: 'Crew', page: 'feed', color: 'bg-green-50 text-green-600' },
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

        {/* Events List */}
        <section>
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-foreground">Your Events</h3>
            <Badge variant="outline">{events.length} total</Badge>
          </div>

          {events.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-3 opacity-40" />
                <p className="font-medium text-foreground">No events yet</p>
                <p className="text-sm text-muted-foreground mt-1">Create your first event to get started</p>
                <Button
                  className="mt-4 bg-orange-500 hover:bg-orange-600 text-white"
                  onClick={() => setCurrentPage('create-event')}
                >
                  <Plus className="h-4 w-4 mr-2" /> Create Event
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {events.map((event) => (
                <Card
                  key={event.id}
                  className="cursor-pointer hover:shadow-md hover:border-orange-200 transition-all"
                  onClick={() => handleEventClick(event)}
                >
                  <CardContent className="p-4 flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-foreground truncate">{event.name}</p>
                      <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {event.start_date
                            ? format(new Date(event.start_date), 'MMM d, yyyy')
                            : event.date
                            ? format(new Date(event.date), 'MMM d, yyyy')
                            : 'Date TBD'}
                        </span>
                        {event.location && (
                          <span className="truncate">{event.location}</span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 ml-4">
                      <Badge
                        variant="secondary"
                        className={
                          event.is_public
                            ? 'bg-green-50 text-green-700 border-green-200'
                            : 'bg-gray-100 text-gray-600'
                        }
                      >
                        {event.is_public ? 'Public' : 'Private'}
                      </Badge>
                      <ArrowRight className="h-4 w-4 text-muted-foreground" />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
