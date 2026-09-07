import { usePartyStore } from '@/store/usePartyStore';
import { Briefcase, ArrowLeftRight, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { PageShell, UserMenu } from '@/components/layout/PageShell';

/**
 * Vendor portal.
 *
 * WHAT THIS USED TO BE
 *   A complete-looking dashboard with four stat cards reading '0', '$0', '0'
 *   and '0', a "0 active" services badge, a "Recent Bookings" section and six
 *   quick-action buttons for Bookings, Earnings, Reviews, Analytics, Profile
 *   Setup and Services.
 *
 *   None of it was connected to anything. The page made zero API calls; every
 *   number was a string literal in the source. All six buttons called
 *   setCurrentPage with a key that App.tsx maps straight back to this same
 *   component, so each one re-rendered the page the user was already on.
 *
 *   The backend agrees: `Vendor` and `VendorTask` exist in schema.prisma and
 *   have no routes, no controllers and no UI anywhere else. There is no
 *   marketplace, no booking flow, no payments and no reviews.
 *
 * WHY IT IS THIS INSTEAD
 *   RoleSelection offers "Vendor" as a real choice, so real people land here.
 *   A dashboard reporting $0 revenue tells them their business account is live
 *   and has no customers. That is a different and much worse statement than
 *   "we have not built this yet", and it is the one they acted on when they
 *   picked the role.
 *
 *   Rebuilding it as a working portal is a marketplace, not a fix: services,
 *   bookings, payouts, reviews and messaging, none of which have an API or a
 *   product decision behind them. Until they do, the honest page is this one,
 *   and the only control on it is the one that actually works.
 */
export default function VendorDashboard() {
  const user = usePartyStore((s) => s.user);
  const setCurrentPage = usePartyStore((s) => s.setCurrentPage);

  const name = user?.name || user?.email || 'there';

  return (
    <PageShell
      title="PartyHause"
      subtitle="Vendor Portal"
      maxWidth="xl"
      actions={<UserMenu showSettingsButton />}
    >
      <div>
        <h2 className="text-2xl font-bold text-foreground">Hi {name.split(' ')[0]}</h2>
        <p className="text-muted-foreground text-sm mt-1">
          Your vendor account is registered. The marketplace is not open yet.
        </p>
      </div>

      <Card>
        <CardContent className="p-8 text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-purple-50 text-purple-600">
            <Briefcase className="h-6 w-6" />
          </div>
          <p className="font-medium text-foreground">The vendor marketplace is still being built</p>
          <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
            Service listings, bookings, payouts and reviews are not available yet. Rather than show
            you an empty dashboard that looks live, we would rather say so. Your role is saved, and
            this page will fill in when the marketplace opens.
          </p>
        </CardContent>
      </Card>

      <section>
        <h3 className="mb-3 font-semibold text-foreground">In the meantime</h3>
        <div className="grid gap-3 sm:grid-cols-2">
          <Card>
            <CardContent className="space-y-3 p-5">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-50 text-orange-600">
                <Sparkles className="h-5 w-5" />
              </div>
              <div>
                <p className="font-medium text-foreground">Host your own events</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Event creation, guest lists, invitations, polls and the planning board all work
                  today.
                </p>
              </div>
              <Button
                variant="outline"
                className="w-full gap-2"
                onClick={() => setCurrentPage('switch-role')}
              >
                <ArrowLeftRight className="h-4 w-4" />
                Switch role
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="space-y-3 p-5">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                <Briefcase className="h-5 w-5" />
              </div>
              <div>
                <p className="font-medium text-foreground">Keep the vendor role</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Nothing else is required from you. You can switch back and forth at any time from
                  Settings.
                </p>
              </div>
              <Button
                variant="ghost"
                className="w-full"
                onClick={() => setCurrentPage('settings')}
              >
                Open settings
              </Button>
            </CardContent>
          </Card>
        </div>
      </section>
    </PageShell>
  );
}
