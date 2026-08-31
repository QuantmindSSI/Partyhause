import { useEffect, useState } from "react";
import { View, ActivityIndicator, StyleSheet } from "react-native";
import { api } from "@/lib/client";
import { LandingScreen } from "@/components/screens/LandingScreenEnhanced";
import { AuthScreen } from "@/components/screens/AuthScreen";
import { DashboardScreen } from "@/components/screens/DashboardScreen";

type AppMode = "loading" | "landing" | "auth" | "dashboard";

export default function HomeScreen() {
  const [appMode, setAppMode] = useState<AppMode>("loading");
  const [userId, setUserId] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState<string | null>(null);

  // The previous implementation subscribed to Supabase's onAuthStateChange.
  // There is no event stream now: the JWT lives in AsyncStorage and changes
  // only when this app signs in or out, both of which are local actions we
  // already observe. Checking once on mount is sufficient and removes a
  // subscription that returned a no-op unsubscribe anyway.
  useEffect(() => {
    void checkAuth();
  }, []);

  /**
   * Establish whether a usable session exists.
   *
   * A stored token is necessary but not sufficient: it can be expired or
   * revoked server-side. Trusting local state alone would land the user on a
   * dashboard whose every query then fails with 401. So the token is validated
   * against /api/auth/me, and a rejection is treated as signed out. The
   * transport clears the stored credentials on 401, so no stale token lingers.
   */
  const checkAuth = async () => {
    if (!(await api.auth.isAuthenticated())) {
      setAppMode("landing");
      return;
    }

    const { data, error } = await api.auth.me();
    if (error || !data) {
      setUserId(null);
      setUserEmail(null);
      setAppMode("landing");
      return;
    }

    setUserId(data.id);
    setUserEmail(data.email);
    setAppMode("dashboard");
  };

  const handleSignOut = async () => {
    // Clears the local session even if the network call fails, so a user can
    // always sign out while offline.
    await api.auth.signOut();
    setUserId(null);
    setUserEmail(null);
    setAppMode("landing");
  };

  if (appMode === "loading") {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#6C63FF" />
      </View>
    );
  }

  if (appMode === "landing") {
    return (
      <LandingScreen
        onGetStarted={() => setAppMode("auth")}
      />
    );
  }

  if (appMode === "auth") {
    return (
      <AuthScreen
        onBackToLanding={() => setAppMode("landing")}
        // Re-running checkAuth rather than setting the mode directly: the
        // dashboard renders `userId!`, and the previous handler switched mode
        // without ever populating userId or userEmail, so it would have passed
        // null into a non-null assertion.
        onAuthSuccess={() => { void checkAuth(); }}
      />
    );
  }

  return (
    <DashboardScreen
      userId={userId!}
      userEmail={userEmail ?? "User"}
      onSignOut={handleSignOut}
    />
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#0a0a0f",
  },
});
