import { usePartyStore, type UserRole } from '@/store/usePartyStore';
import { Loader2 } from 'lucide-react';

interface RoleGuardProps {
  allowedRoles: UserRole[];
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export const RoleGuard = ({ allowedRoles, children, fallback }: RoleGuardProps) => {
  const user = usePartyStore((s) => s.user);
  const isLoading = usePartyStore((s) => s.isLoading);

  if (isLoading) {
    return (
      <div className="flex h-screen w-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex h-screen w-screen items-center justify-center">
        <p className="text-muted-foreground">Please sign in to continue.</p>
      </div>
    );
  }

  const userRole: UserRole = user.role || 'user';
  if (!allowedRoles.includes(userRole)) {
    return fallback ? (
      <>{fallback}</>
    ) : (
      <div className="flex h-screen w-screen items-center justify-center">
        <div className="text-center space-y-2">
          <p className="text-lg font-semibold text-foreground">Access Restricted</p>
          <p className="text-muted-foreground text-sm">
            This section is only available for: {allowedRoles.join(', ')} accounts.
          </p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};
