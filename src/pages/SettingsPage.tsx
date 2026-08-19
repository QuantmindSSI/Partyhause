import { usePartyStore } from '@/store/usePartyStore';
import { useAuth } from '@/hooks/use-auth';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { PageShell, useBackToDashboard } from '@/components/layout/PageShell';
import { User, Bell, Shield, LogOut, ChevronRight } from 'lucide-react';

interface SettingsItem {
  icon: typeof User;
  label: string;
  description: string;
  page: string | null;
}

export default function SettingsPage() {
  const user = usePartyStore((s) => s.user);
  const setCurrentPage = usePartyStore((s) => s.setCurrentPage);
  const { signOut } = useAuth();
  const handleBack = useBackToDashboard();

  const name = user?.name || user?.email || 'User';
  const role = user?.role || 'user';

  const handleLogout = async () => {
    await signOut();
    setCurrentPage('auth');
  };

  // page: null marks sections that do not exist yet. They render as
  // non-interactive "Coming soon" rows instead of links back to this page.
  const settingsItems: SettingsItem[] = [
    { icon: User, label: 'Profile', page: 'profile', description: 'View and edit your profile' },
    { icon: Bell, label: 'Notifications', page: null, description: 'Manage notification preferences' },
    { icon: Shield, label: 'Privacy', page: null, description: 'Privacy and security settings' },
  ];

  return (
    <PageShell title="Settings" maxWidth="sm" onBack={handleBack}>
      {/* Account Info */}
      <Card>
        <CardContent className="p-4 flex items-center gap-4">
          <Avatar className="h-16 w-16">
            <AvatarFallback className="bg-orange-100 text-orange-600 font-bold text-xl">
              {name.charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div>
            <p className="font-semibold text-foreground">{name}</p>
            <p className="text-sm text-muted-foreground capitalize">{role}</p>
          </div>
        </CardContent>
      </Card>

      {/* Settings List */}
      <div className="space-y-2">
        {settingsItems.map(({ icon: Icon, label, page, description }) =>
          page ? (
            <button
              key={label}
              type="button"
              className="w-full text-left rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              onClick={() => setCurrentPage(page)}
            >
              <Card className="hover:shadow-md transition-all">
                <CardContent className="p-4 flex items-center gap-4">
                  <div className="p-2 rounded-xl bg-muted">
                    <Icon className="h-5 w-5 text-foreground" />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-foreground">{label}</p>
                    <p className="text-xs text-muted-foreground">{description}</p>
                  </div>
                  <ChevronRight className="h-5 w-5 text-muted-foreground" />
                </CardContent>
              </Card>
            </button>
          ) : (
            <Card key={label} className="opacity-70">
              <CardContent className="p-4 flex items-center gap-4">
                <div className="p-2 rounded-xl bg-muted">
                  <Icon className="h-5 w-5 text-muted-foreground" />
                </div>
                <div className="flex-1">
                  <p className="font-medium text-muted-foreground">{label}</p>
                  <p className="text-xs text-muted-foreground">{description}</p>
                </div>
                <Badge variant="outline" className="text-xs">Coming soon</Badge>
              </CardContent>
            </Card>
          ),
        )}
      </div>

      {/* Switch Role */}
      <button
        type="button"
        className="w-full text-left rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        onClick={() => setCurrentPage('switch-role')}
      >
        <Card className="hover:shadow-md transition-all">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-2 rounded-xl bg-orange-50">
              <User className="h-5 w-5 text-orange-600" />
            </div>
            <div className="flex-1">
              <p className="font-medium text-foreground">Switch Role</p>
              <p className="text-xs text-muted-foreground">Change your account type</p>
            </div>
            <ChevronRight className="h-5 w-5 text-muted-foreground" />
          </CardContent>
        </Card>
      </button>

      {/* Logout */}
      <Button variant="destructive" className="w-full" onClick={handleLogout}>
        <LogOut className="h-4 w-4 mr-2" />
        Logout
      </Button>
    </PageShell>
  );
}
