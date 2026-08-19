/**
 * Shared page scaffold for PartyHause.
 *
 * Before this component existed every page rebuilt its own sticky header,
 * container and background (with drifting variants: bg-card vs bg-white,
 * max-w-2xl..6xl, ad-hoc back buttons). All standard pages should render
 * inside a PageShell so the shell is defined exactly once.
 *
 * - `PageShell` — bg-background page, sticky bg-card header, centered main.
 * - `UserMenu` — the bell / settings / avatar header cluster used by the
 *   dashboards, with accessible names and real buttons.
 * - `useBackToDashboard` — role-aware "back to my dashboard" navigation,
 *   previously duplicated in SettingsPage and ProfilePage.
 */

import type { ReactNode } from 'react';
import { ArrowLeft, Bell, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { usePartyStore } from '@/store/usePartyStore';
import { useUnreadCount } from '@/features/notifications/useNotifications';

/** Complete class strings so Tailwind's scanner keeps them. */
const MAX_WIDTH_CLASS = {
  sm: 'max-w-2xl',
  md: 'max-w-3xl',
  lg: 'max-w-4xl',
  xl: 'max-w-5xl',
  '2xl': 'max-w-6xl',
} as const;

export type PageShellWidth = keyof typeof MAX_WIDTH_CLASS;

interface PageShellProps {
  /** Header title (page name or brand). */
  title: ReactNode;
  /** Small line under the title (e.g. "Creator Studio"). */
  subtitle?: string;
  /** When provided, renders an accessible back button before the title. */
  onBack?: () => void;
  /** Right-hand header content (e.g. <UserMenu />, action buttons). */
  actions?: ReactNode;
  /** Optional row rendered inside the sticky header, below the title row
      (e.g. filter tabs that must stay visible while scrolling). */
  headerBottom?: ReactNode;
  /** Content width preset; defaults to 'lg' (max-w-4xl). */
  maxWidth?: PageShellWidth;
  children: ReactNode;
}

export function PageShell({
  title,
  subtitle,
  onBack,
  actions,
  headerBottom,
  maxWidth = 'lg',
  children,
}: PageShellProps) {
  const width = MAX_WIDTH_CLASS[maxWidth];
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card sticky top-0 z-10">
        <div className={`${width} mx-auto px-4 py-3`}>
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-2 min-w-0">
              {onBack && (
                <Button variant="ghost" size="icon" aria-label="Go back" onClick={onBack}>
                  <ArrowLeft className="h-5 w-5" />
                </Button>
              )}
              <div className="min-w-0">
                <h1 className="text-xl font-bold text-foreground truncate">{title}</h1>
                {subtitle && <p className="text-xs text-muted-foreground truncate">{subtitle}</p>}
              </div>
            </div>
            {actions && <div className="flex items-center gap-2 flex-shrink-0">{actions}</div>}
          </div>
          {headerBottom && <div className="mt-3">{headerBottom}</div>}
        </div>
      </header>
      <main className={`${width} mx-auto px-4 py-6 space-y-6`}>{children}</main>
    </div>
  );
}

interface UserMenuProps {
  /** Show the dedicated settings gear next to the bell. */
  showSettingsButton?: boolean;
}

export function UserMenu({ showSettingsButton = false }: UserMenuProps) {
  const user = usePartyStore((s) => s.user);
  const setCurrentPage = usePartyStore((s) => s.setCurrentPage);
  const name = user?.name || user?.email || 'Guest';
  // Live unread count from /api/notifications/unread-count (60s poll).
  const { data: unreadCount = 0 } = useUnreadCount();

  return (
    <>
      <Button
        variant="ghost"
        size="icon"
        className="relative rounded-full"
        aria-label={unreadCount > 0 ? `Notifications, ${unreadCount} unread` : 'Notifications'}
        onClick={() => setCurrentPage('notifications')}
      >
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <span
            aria-hidden="true"
            className="absolute -top-0.5 -right-0.5 min-w-4 h-4 px-1 rounded-full bg-primary text-primary-foreground text-[10px] font-bold flex items-center justify-center"
          >
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </Button>
      {showSettingsButton && (
        <Button
          variant="ghost"
          size="icon"
          className="rounded-full"
          aria-label="Settings"
          onClick={() => setCurrentPage('settings')}
        >
          <Settings className="h-5 w-5" />
        </Button>
      )}
      <button
        type="button"
        aria-label="Open your profile"
        className="rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
        onClick={() => setCurrentPage('profile')}
      >
        <Avatar className="h-9 w-9">
          <AvatarFallback className="bg-orange-100 text-orange-600 font-bold text-sm">
            {name.charAt(0).toUpperCase()}
          </AvatarFallback>
        </Avatar>
      </button>
    </>
  );
}

/**
 * Role-aware navigation back to the user's own dashboard.
 * Replaces the copies previously inlined in SettingsPage and ProfilePage.
 */
export function useBackToDashboard(): () => void {
  const role = usePartyStore((s) => s.user?.role || 'user');
  const setCurrentPage = usePartyStore((s) => s.setCurrentPage);
  return () => {
    if (role === 'creator') setCurrentPage('creator-dashboard');
    else if (role === 'vendor') setCurrentPage('vendor-dashboard');
    else setCurrentPage('user-dashboard');
  };
}
