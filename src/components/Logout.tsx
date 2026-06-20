import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { usePartyStore } from '@/store/usePartyStore';
import { Loader2, LogOut } from 'lucide-react';

const Logout = () => {
  const { signOut } = useAuth();
  const setCurrentPage = usePartyStore((s) => s.setCurrentPage);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const handleLogout = async () => {
      try {
        await signOut();
        setCurrentPage('auth');
      } catch (err) {
        setError('An error occurred during logout. Please try again.');
      }
    };

    handleLogout();
  }, []);

  if (error) {
    return (
      <div className="flex h-screen w-screen items-center justify-center">
        <div className="text-center space-y-3">
          <p className="text-destructive font-medium">{error}</p>
          <button
            onClick={() => setCurrentPage('dashboard')}
            className="text-sm text-muted-foreground underline"
          >
            Back to dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen w-screen items-center justify-center">
      <div className="text-center space-y-3">
        <LogOut className="h-8 w-8 text-muted-foreground mx-auto" />
        <p className="text-foreground font-medium">Signing you out…</p>
        <Loader2 className="h-5 w-5 animate-spin text-orange-500 mx-auto" />
      </div>
    </div>
  );
};

export default Logout;
