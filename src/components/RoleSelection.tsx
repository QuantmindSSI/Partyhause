import { useState } from 'react';
import { usePartyStore, type UserRole } from '@/store/usePartyStore';
import { Ticket, Sparkles, Briefcase, CheckCircle2, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

const ROLES: { role: UserRole; icon: React.ElementType; title: string; desc: string; color: string; border: string }[] = [
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
    desc: 'Offer services, get bookings from event creators',
    color: 'bg-purple-50 text-purple-600',
    border: 'border-purple-200 hover:border-purple-400',
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
          {ROLES.map(({ role, icon: Icon, title, desc, color, border }) => (
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
                <p className="font-semibold text-foreground">{title}</p>
                <p className="text-sm text-muted-foreground mt-0.5">{desc}</p>
              </div>
              {selected === role && (
                <CheckCircle2 className="h-5 w-5 text-orange-500 flex-shrink-0" />
              )}
            </button>
          ))}
        </div>

        <Button
          className="w-full bg-orange-500 hover:bg-orange-600 text-white h-12 text-base font-semibold"
          disabled={!selected || saving}
          onClick={handleConfirm}
        >
          {saving ? <Loader2 className="h-5 w-5 animate-spin" /> : 'Continue'}
        </Button>
      </div>
    </div>
  );
};
