// Privacy settings. Replaces the Settings "Privacy — Coming soon" dead row.
// Backed by the user_profiles privacy flags that already existed in the
// schema (is_private, show_attending_events, show_partycrew_list,
// show_activity_status) via GET/PUT /api/users/me/profile.

import { useEffect, useState } from 'react';
import { Loader2, Shield } from 'lucide-react';
import { PageShell } from '@/components/layout/PageShell';
import { Card, CardContent } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { EmptyState } from '@/components/ui/empty-state';
import { apiGet, apiPut } from '@/lib/api-client';
import { usePartyStore } from '@/store/usePartyStore';
import { toast } from 'sonner';

interface PrivacyProfile {
  is_private: boolean;
  show_attending_events: boolean;
  show_partycrew_list: boolean;
  show_activity_status: boolean;
}

type PrivacyFlag = keyof PrivacyProfile;

const FLAGS: Array<{ key: PrivacyFlag; label: string; description: string }> = [
  {
    key: 'is_private',
    label: 'Private account',
    description: 'People must request to join your PartyCrew instead of joining instantly',
  },
  {
    key: 'show_attending_events',
    label: 'Show events you attend',
    description: 'Let others see events you have RSVPed to',
  },
  {
    key: 'show_partycrew_list',
    label: 'Show your PartyCrew',
    description: 'Let others browse who is in your PartyCrew',
  },
  {
    key: 'show_activity_status',
    label: 'Show activity status',
    description: 'Let your crew see when you were last active',
  },
];

export default function PrivacySettingsPage() {
  const setCurrentPage = usePartyStore((s) => s.setCurrentPage);
  const [profile, setProfile] = useState<PrivacyProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);
  const [saving, setSaving] = useState<PrivacyFlag | null>(null);

  const load = async () => {
    setLoading(true);
    setFailed(false);
    const { data, error } = await apiGet<{ profile: PrivacyProfile }>('/api/users/me/profile');
    if (error || !data) {
      setFailed(true);
    } else {
      setProfile({
        is_private: data.profile.is_private,
        show_attending_events: data.profile.show_attending_events,
        show_partycrew_list: data.profile.show_partycrew_list,
        show_activity_status: data.profile.show_activity_status,
      });
    }
    setLoading(false);
  };

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const toggle = async (key: PrivacyFlag, value: boolean) => {
    if (!profile) return;
    const previous = profile[key];
    // Optimistic update; roll back on failure.
    setProfile({ ...profile, [key]: value });
    setSaving(key);
    const { error } = await apiPut('/api/users/me/profile', { [key]: value });
    setSaving(null);
    if (error) {
      setProfile((current) => (current ? { ...current, [key]: previous } : current));
      toast.error(`Could not update "${FLAGS.find((f) => f.key === key)?.label}": ${error.message}`);
    }
  };

  return (
    <PageShell
      title="Privacy"
      subtitle="Control what others can see"
      maxWidth="sm"
      onBack={() => setCurrentPage('settings')}
    >
      {loading && (
        <div className="flex justify-center py-12" role="status" aria-label="Loading privacy settings">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" aria-hidden="true" />
        </div>
      )}

      {!loading && failed && (
        <EmptyState
          icon={Shield}
          title="Could not load privacy settings"
          description="Something went wrong while loading your settings."
          action={{ label: 'Try again', onClick: () => void load() }}
        />
      )}

      {!loading && profile && (
        <div className="space-y-2">
          {FLAGS.map(({ key, label, description }) => (
            <Card key={key}>
              <CardContent className="p-4 flex items-center gap-4">
                <div className="flex-1">
                  <p className="font-medium text-foreground">{label}</p>
                  <p className="text-xs text-muted-foreground">{description}</p>
                </div>
                <Switch
                  checked={profile[key]}
                  disabled={saving === key}
                  onCheckedChange={(value) => void toggle(key, value)}
                  aria-label={label}
                />
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </PageShell>
  );
}
