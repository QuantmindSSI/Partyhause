import { usePartyStore } from '@/store/usePartyStore';
import { Briefcase, Star, MessageSquare, DollarSign, ClipboardList, ArrowRight, TrendingUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { PageShell, UserMenu } from '@/components/layout/PageShell';

export default function VendorDashboard() {
  const user = usePartyStore((s) => s.user);
  const setCurrentPage = usePartyStore((s) => s.setCurrentPage);

  const name = user?.name || user?.email || 'Vendor';

  return (
    <PageShell
      title="PartyHause"
      subtitle="Vendor Portal"
      maxWidth="xl"
      actions={<UserMenu showSettingsButton />}
    >
        {/* Welcome */}
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-2xl font-bold text-foreground">Welcome, {name.split(' ')[0]}</h2>
            <p className="text-muted-foreground text-sm mt-1">Manage your services and bookings</p>
          </div>
          <Button className="gap-2 shadow-md" onClick={() => setCurrentPage('vendor-profile-setup')}>
            <Briefcase className="h-4 w-4" /> My Profile
          </Button>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: 'Active Bookings', value: '0', icon: ClipboardList, color: 'text-blue-600 bg-blue-50' },
            { label: 'Revenue', value: '$0', icon: DollarSign, color: 'text-green-600 bg-green-50' },
            { label: 'Reviews', value: '0', icon: Star, color: 'text-yellow-600 bg-yellow-50' },
            { label: 'Messages', value: '0', icon: MessageSquare, color: 'text-purple-600 bg-purple-50' },
          ].map(({ label, value, icon: Icon, color }) => (
            <Card key={label}>
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
            { icon: ClipboardList, label: 'Bookings', page: 'vendor-bookings', color: 'bg-blue-50 text-blue-600' },
            { icon: DollarSign, label: 'Earnings', page: 'vendor-earnings', color: 'bg-green-50 text-green-600' },
            { icon: Star, label: 'Reviews', page: 'vendor-reviews', color: 'bg-yellow-50 text-yellow-600' },
            { icon: TrendingUp, label: 'Analytics', page: 'vendor-analytics', color: 'bg-purple-50 text-purple-600' },
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

        {/* Bookings */}
        <section>
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-foreground">Recent Bookings</h3>
            <button
              onClick={() => setCurrentPage('vendor-bookings')}
              className="text-xs text-orange-500 font-medium flex items-center gap-1 hover:underline"
            >
              View all <ArrowRight className="h-3 w-3" />
            </button>
          </div>
          <Card>
            <CardContent className="p-8 text-center">
              <ClipboardList className="h-12 w-12 text-muted-foreground mx-auto mb-3 opacity-40" />
              <p className="font-medium text-foreground">No bookings yet</p>
              <p className="text-sm text-muted-foreground mt-1 max-w-xs mx-auto">
                Complete your vendor profile so event creators can find and book your services
              </p>
              <Button className="mt-4" onClick={() => setCurrentPage('vendor-profile-setup')}>
                <Briefcase className="h-4 w-4 mr-2" /> Set Up Profile
              </Button>
            </CardContent>
          </Card>
        </section>

        {/* Services I Offer */}
        <section>
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-foreground">My Services</h3>
            <Badge variant="outline">0 active</Badge>
          </div>
          <Card className="border-dashed border-2 border-muted hover:border-orange-300 transition-colors cursor-pointer"
            onClick={() => setCurrentPage('vendor-services')}>
            <CardContent className="p-6 text-center">
              <p className="text-sm text-muted-foreground">+ Add a service to start receiving bookings</p>
            </CardContent>
          </Card>
        </section>
    </PageShell>
  );
}
