import { useEffect, useState } from "react";
import { View, ActivityIndicator, StyleSheet } from "react-native";
import { supabase, requireSupabase } from "@/lib/supabase";
import { LandingScreen } from "@/components/screens/LandingScreenEnhanced";
import { AuthScreen } from "@/components/screens/AuthScreen";
import { DashboardScreen } from "@/components/screens/DashboardScreen";

type AppMode = "loading" | "landing" | "auth" | "dashboard";

export default function HomeScreen() {
  const [appMode, setAppMode] = useState<AppMode>("loading");
  const [userId, setUserId] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState<string | null>(null);

  useEffect(() => {
    checkAuth();

    const authListener = supabase?.auth.onAuthStateChange((event, session) => {
      console.log('[Auth] State changed:', event, session?.user?.email || 'no user');
      
      if (session?.user) {
        setUserId(session.user.id);
        setUserEmail(session.user.email ?? null);
        setAppMode("dashboard");
      } else {
        setUserId(null);
        setUserEmail(null);
        setAppMode("landing");
      }
    });

    return () => {
      authListener?.data?.subscription?.unsubscribe();
    };
  }, []);

  const checkAuth = async () => {
    if (!supabase) {
      console.log('[Auth] No Supabase client available');
      setAppMode("landing");
      return;
    }

    try {
      console.log('[Auth] Checking for existing session...');
      const client = requireSupabase();
      const { data, error } = await client.auth.getSession();

      if (error) {
        // AuthApiError is expected when no session exists, just log quietly
        console.log('[Auth] No existing session');
        setAppMode("landing");
        return;
      }

      if (data.session?.user) {
        console.log('[Auth] Session found for user:', data.session.user.email);
        setUserId(data.session.user.id);
        setUserEmail(data.session.user.email ?? null);
        setAppMode("dashboard");
      } else {
        console.log('[Auth] No active session found');
        setAppMode("landing");
      }
    } catch (error) {
      // Catch any other unexpected errors
      console.log("[Auth] Session check completed, no active session");
      setAppMode("landing");
    }
  };

  const handleSignOut = async () => {
    if (!supabase) return;

    const client = requireSupabase();
    await client.auth.signOut();
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
        onAuthSuccess={() => setAppMode("dashboard")}
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
