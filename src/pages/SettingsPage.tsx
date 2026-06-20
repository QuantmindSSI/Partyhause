import { usePartyStore } from '@/store/usePartyStore';
import { useAuth } from '@/hooks/use-auth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { ArrowLeft, User, Bell, Shield, LogOut, ChevronRight } from 'lucide-react';

export default function SettingsPage() {
  const user = usePartyStore((s) => s.user);
  const setCurrentPage = usePartyStore((s) => s.setCurrentPage);
  const { signOut } = useAuth();

  const name = user?.name || user?.email || 'User';
  const role = user?.role || 'user';

  const handleBack = () => {
    if (role === 'creator') setCurrentPage('creator-dashboard');
    else if (role === 'vendor') setCurrentPage('vendor-dashboard');
    else setCurrentPage('user-dashboard');
  };

  const handleLogout = async () => {
    await signOut();
    setCurrentPage('auth');
  };

  const settingsItems = [
    { icon: User, label: 'Profile', page: 'profile', description: 'View and edit your profile' },
    { icon: Bell, label: 'Notifications', page: 'settings', description: 'Manage notification preferences' },
    { icon: Shield, label: 'Privacy', page: 'settings', description: 'Privacy and security settings' },
  ];

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card sticky top-0 z-10">
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={handleBack}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-xl font-bold text-foreground">Settings</h1>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-6 space-y-6">
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
          {settingsItems.map(({ icon: Icon, label, page, description }) => (
            <Card
              key={label}
              className="cursor-pointer hover:shadow-md transition-all"
              onClick={() => setCurrentPage(page)}
            >
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
          ))}
        </div>

        {/* Switch Role */}
        <Card
          className="cursor-pointer hover:shadow-md transition-all"
          onClick={() => setCurrentPage('switch-role')}
        >
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

        {/* Logout */}
        <Button
          variant="destructive"
          className="w-full"
          onClick={handleLogout}
        >
          <LogOut className="h-4 w-4 mr-2" />
          Logout
        </Button>
      </main>
    </div>
  );
}
