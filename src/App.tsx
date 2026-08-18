import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Loading } from "@/components/ui/loading";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { usePartyStore } from "@/store/usePartyStore";
import { AuthScreen } from "@/components/AuthScreen";
import LandingPageCreative from "@/components/LandingPageCreative";
import { useAuth } from "@/hooks/use-auth";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { PWAInstallBanner } from "@/components/PWAInstallBanner";
import { motion, AnimatePresence } from "framer-motion";
import { lazy, Suspense, useEffect, useState } from "react";
import { HardenedErrorBoundary } from '@/components/HardenedErrorBoundary';
import { BrowserRouter, Routes, Route, useParams } from 'react-router-dom';
import { initializeAuthStateListener } from '@/lib/auth';
import { RoleGuard } from "@/components/RoleGuard";

// ---------------------------------------------------------------------------
// Route-level code splitting.
//
// Every page behind the auth wall is lazy-loaded so the entry bundle carries
// only the shell + landing/auth funnel. Named exports are adapted to the
// default shape React.lazy expects.
// ---------------------------------------------------------------------------
const PartyCultureBlog = lazy(() => import("@/components/PartyCultureBlog"));
const EventCreation = lazy(() =>
  import("@/components/EventCreation").then((m) => ({ default: m.EventCreation })),
);
const EventManagement = lazy(() =>
  import("@/components/EventManagement").then((m) => ({ default: m.EventManagement })),
);
const QRScanner = lazy(() =>
  import("@/components/QRScanner").then((m) => ({ default: m.QRScanner })),
);
const GuestView = lazy(() =>
  import("@/components/GuestView").then((m) => ({ default: m.GuestView })),
);
const GamesPage = lazy(() =>
  import("@/components/GamesPage").then((m) => ({ default: m.GamesPage })),
);
const TemplateManager = lazy(() => import("@/components/TemplateManager"));
const JoinEventPage = lazy(() =>
  import("@/components/JoinEventPage").then((m) => ({ default: m.JoinEventPage })),
);
const RoleSelection = lazy(() =>
  import("@/components/RoleSelection").then((m) => ({ default: m.RoleSelection })),
);
const Logout = lazy(() => import("@/components/Logout"));
const ProfilePage = lazy(() => import("@/pages/ProfilePage"));
const SocialFeedPage = lazy(() => import("@/pages/SocialFeedPage"));
const ExplorePage = lazy(() => import("@/pages/ExplorePage"));
const UserDashboard = lazy(() => import("@/pages/UserDashboard"));
const CreatorDashboard = lazy(() => import("@/pages/CreatorDashboard"));
const VendorDashboard = lazy(() => import("@/pages/VendorDashboard"));
const SettingsPage = lazy(() => import("@/pages/SettingsPage"));

// One QueryClient for the app: bounded retries, no aggressive refetching.
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 30_000,
      refetchOnWindowFocus: false,
    },
    mutations: { retry: 0 },
  },
});

const GuestRoute = () => {
  const { eventId, guestId } = useParams<{ eventId: string; guestId: string }>();
  return <GuestView guestId={guestId || ''} eventId={eventId || ''} />;
};

/** Full-screen branded fallback while a lazy page chunk loads. */
const PageFallback = () => <Loading fullScreen size="lg" />;

const App = () => {
  // Always read currentPage and user from the store (not cached)
  const currentPage = usePartyStore((s) => s.currentPage);
  const user = usePartyStore((s) => s.user);
  // show a quick loading fallback when we have a persisted currentEvent but no events loaded yet
  const persistedCurrentEvent = usePartyStore((s) => s.currentEvent);
  const events = usePartyStore((s) => s.events);
  const { isLoading } = useAuth();

  // New state for landing/auth flow
  const [appMode, setAppMode] = useState<'landing' | 'auth' | 'app'>('landing');
  const [userIntent, setUserIntent] = useState<'create_event' | 'join_event' | 'explore_features'>('explore_features');

  useEffect(() => {
    // Initialize auth state listener once for session management
    initializeAuthStateListener();
  }, []);

  useEffect(() => {
    if (user) {
      setAppMode('app');
      if (currentPage === 'auth' || currentPage === 'landing') {
        usePartyStore.getState().setCurrentPage('dashboard');
      }
    } else {
      // If no user, check currentPage to determine mode
      if (currentPage === 'auth') {
        setAppMode('auth');
      } else if (currentPage === 'landing') {
        setAppMode('landing');
      } else if (appMode === 'app') {
        setAppMode('auth');
      }
      // Don't auto-redirect to auth from landing - let user choose
    }
  }, [user, currentPage, appMode]);

  const handleBackToLanding = () => {
    setAppMode('landing');
    // Also reset the currentPage to ensure consistency
    usePartyStore.getState().setCurrentPage('landing');
  };

  if (isLoading) {
    return <Loading fullScreen size="lg" />;
  }

  // If rehydration left us with a currentEvent id/object but no events array populated,
  // show a loading screen while the rehydrate healing logic runs in the store.
  if (persistedCurrentEvent && (!events || events.length === 0) && user) {
    return <Loading fullScreen size="lg" />;
  }

  const renderPage = () => {
    // Landing and Auth Flow
    if (!user) {
      if (appMode === 'landing') {
        return (
          <LandingPageCreative 
            onStartAuth={(intent) => {
              setUserIntent(intent);
              setAppMode('auth');
            }}
          />
        );
      } else {
        return (
          <AuthScreen 
            initialMode="auth"
            userIntent={userIntent}
            onBackToLanding={handleBackToLanding}
          />
        );
      }
    }

    // Handle special pages for all users
    if (currentPage === 'logout') {
      return <Logout />;
    }

    if (currentPage === 'party-culture-blog') {
      return <PartyCultureBlog />;
    }

    if (currentPage === 'templates') {
      return <ProtectedRoute>
        <TemplateManager />
      </ProtectedRoute>;
    }

    // Handle guest view with dynamic ID
    if (currentPage.startsWith('guest-view-')) {
      const guestId = currentPage.replace('guest-view-', '');
      return <GuestView guestId={guestId} />;
    }

    // Protected routes for authenticated users
    return (
      <ProtectedRoute>
        {(() => {
          const role = user?.role || 'user';

          switch (currentPage) {
            case 'role-selection':
            case 'switch-role':
              return <RoleSelection />;

            case 'profile':
              return <ProfilePage />;

            case 'user-dashboard':
            case 'my-tickets':
            case 'saved-events':
              return <UserDashboard />;

            case 'creator-dashboard':
            case 'analytics':
              return <RoleGuard allowedRoles={['creator']}><CreatorDashboard /></RoleGuard>;

            case 'vendor-dashboard':
            case 'vendor-profile-setup':
            case 'vendor-bookings':
            case 'vendor-earnings':
            case 'vendor-reviews':
            case 'vendor-analytics':
            case 'vendor-services':
              return <RoleGuard allowedRoles={['vendor']}><VendorDashboard /></RoleGuard>;

            case 'create-event':
              return <RoleGuard allowedRoles={['creator']}><EventCreation /></RoleGuard>;

            case 'event-management':
              return <RoleGuard allowedRoles={['creator']}><EventManagement /></RoleGuard>;

            case 'qr-scanner':
              return <RoleGuard allowedRoles={['creator']}><QRScanner /></RoleGuard>;

            case 'games':
              return <GamesPage />;

            case 'settings':
              return <SettingsPage />;

            case 'feed':
              return <SocialFeedPage />;

            case 'explore':
              return <ExplorePage />;

            case 'dashboard':
            default:
              if (role === 'creator') return <CreatorDashboard />;
              if (role === 'vendor') return <VendorDashboard />;
              return <UserDashboard />;
          }
        })()}
      </ProtectedRoute>
    );
  };

  return (
    <BrowserRouter>
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <HardenedErrorBoundary>
            <div className="min-h-screen bg-background text-foreground">
              <Suspense fallback={<PageFallback />}>
                <Routes>
                  <Route path="/join/:token" element={<JoinEventPage />} />
                  <Route path="/event/:eventId/guest/:guestId" element={<GuestRoute />} />
                  <Route path="/templates" element={<ProtectedRoute><TemplateManager /></ProtectedRoute>} />
                  <Route path="/profile/:id" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />
                  <Route path="/feed" element={<ProtectedRoute><SocialFeedPage /></ProtectedRoute>} />
                  <Route path="/explore" element={<ProtectedRoute><ExplorePage /></ProtectedRoute>} />
                  <Route path="*" element={
                    <AnimatePresence mode="wait">
                      <motion.div
                        key={appMode + currentPage}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        transition={{ duration: 0.3 }}
                      >
                        {/* Per-page boundary: a crash inside one page never
                            takes down the app shell (nav/toasters). */}
                        <HardenedErrorBoundary>
                          {renderPage()}
                        </HardenedErrorBoundary>
                      </motion.div>
                    </AnimatePresence>
                  } />
                </Routes>
              </Suspense>
            </div>
            <PWAInstallBanner />
            <Toaster />
            <Sonner />
          </HardenedErrorBoundary>
        </TooltipProvider>
      </QueryClientProvider>
    </BrowserRouter>
  );
};

export default App;
