import { useState } from 'react';
import { usePartyStore, type UserRole } from '@/store/usePartyStore';
import { Ticket, Sparkles, Briefcase, CheckCircle2, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface RoleOption {
  role: UserRole;
  icon: React.ElementType;
  title: string;
  desc: string;
  color: string;
  border: string;
  /** Shown as a badge when the role's destination is not built yet. */
  notice?: string;
}

const ROLES: RoleOption[] = [
  {
    role: 'user',
    icon: Ticket,
    title: 'Attendee',
    desc: 'Discover events, RSVP, and connect with friends',
    color: 'bg-blue-50 text-blue-600',
    border: 'border-blue-200 hover:border-blue-400',
  },
  {
    role: 'creator',
    icon: Sparkles,
    title: 'Event Creator',
    desc: 'Host events, manage guests, and build your community',
    color: 'bg-orange-50 text-orange-600',
    border: 'border-orange-200 hover:border-orange-400',
  },
  {
    role: 'vendor',
    icon: Briefcase,
    title: 'Vendor',
    // The old copy, "Offer services, get bookings from event creators",
    // described a marketplace that does not exist. `Vendor` and `VendorTask`
    // are in the schema with no routes and no UI, so choosing this role led to
    // a dashboard of hardcoded zeros. The role is still selectable, because
    // people are entitled to register their intent, but the description now
    // matches what happens next.
    desc: 'Register your interest in listing services',
    color: 'bg-purple-50 text-purple-600',
    border: 'border-purple-200 hover:border-purple-400',
    notice: 'Marketplace not open yet',
  },
];

export const RoleSelection = () => {
  const user = usePartyStore((s) => s.user);
  const setCurrentPage = usePartyStore((s) => s.setCurrentPage);
  const [selected, setSelected] = useState<UserRole | null>(null);
  const [saving, setSaving] = useState(false);

  const handleConfirm = async () => {
    if (!selected || !user) return;
    setSaving(true);
    try {
      usePartyStore.getState().setUser({ ...user, role: selected });
      const page = selected === 'creator' ? 'creator-dashboard'
                 : selected === 'vendor'  ? 'vendor-dashboard'
                 : 'user-dashboard';
      setCurrentPage(page);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="max-w-md w-full space-y-6">
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold text-foreground">How will you use PartyHause?</h1>
          <p className="text-muted-foreground">Choose your role — you can always switch later.</p>
        </div>

        <div className="space-y-3">
          {ROLES.map(({ role, icon: Icon, title, desc, color, border, notice }) => (
            <button
              key={role}
              onClick={() => setSelected(role)}
              className={cn(
                'w-full flex items-center gap-4 p-4 rounded-2xl border-2 bg-card text-left transition-all',
                border,
                selected === role && 'ring-2 ring-offset-2',
                selected === role && role === 'user' && 'ring-blue-400',
                selected === role && role === 'creator' && 'ring-orange-400',
                selected === role && role === 'vendor' && 'ring-purple-400',
              )}
            >
              <div className={`p-3 rounded-xl flex-shrink-0 ${color}`}>
                <Icon className="h-6 w-6" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="font-semibold text-foreground">{title}</p>
                  {notice && (
                    <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                      {notice}
                    </span>
                  )}
                </div>
                <p className="text-sm text-muted-foreground mt-0.5">{desc}</p>
              </div>
              {selected === role && (
                <CheckCircle2 className="h-5 w-5 text-orange-500 flex-shrink-0" />
              )}
            </button>
          ))}
        </div>

        <Button
          className="w-full h-12 text-base font-semibold"
          disabled={!selected || saving}
          onClick={handleConfirm}
        >
          {saving ? <Loader2 className="h-5 w-5 animate-spin" /> : 'Continue'}
        </Button>
      </div>
    </div>
  );
};
