import { useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { AuthScreen } from '@/components/screens/AuthScreen';
import { DashboardScreen } from '@/components/screens/DashboardScreen';
import { LandingScreen } from '@/components/screens/LandingScreenEnhanced';
import { useAuthSession } from '@/providers/AuthSessionProvider';

type AnonymousView = 'landing' | 'sign-in' | 'sign-up';

export default function HomeScreen() {
  const [anonymousView, setAnonymousView] = useState<AnonymousView>('landing');
  const { status, user, message, refresh, signOut } = useAuthSession();

  if (status === 'checking') {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#FF7D66" />
        <Text style={styles.statusText}>Checking your session...</Text>
      </View>
    );
  }

  if (status === 'unavailable') {
    return (
      <View style={styles.centered}>
        <Text style={styles.statusTitle}>We could not verify your session</Text>
        <Text style={styles.statusText}>{message}</Text>
        <TouchableOpacity style={styles.primaryButton} onPress={() => { void refresh(); }}>
          <Text style={styles.primaryButtonText}>Try Again</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.secondaryButton} onPress={() => { void signOut(); }}>
          <Text style={styles.secondaryButtonText}>Sign Out</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (status === 'authenticated') {
    return (
      <DashboardScreen
        userId={user.id}
        userEmail={user.email}
      />
    );
  }

  if (anonymousView === 'sign-in' || anonymousView === 'sign-up') {
    return (
      <AuthScreen
        onBackToLanding={() => setAnonymousView('landing')}
        onAuthSuccess={refresh}
        initialMode={anonymousView}
      />
    );
  }

  return (
    <LandingScreen
      onGetStarted={() => setAnonymousView('sign-up')}
      onSignIn={() => setAnonymousView('sign-in')}
    />
  );
}

const styles = StyleSheet.create({
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 14,
    padding: 24,
    backgroundColor: '#181311',
  },
  statusTitle: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '700',
    textAlign: 'center',
  },
  statusText: {
    color: '#A8A8B3',
    fontSize: 15,
    textAlign: 'center',
  },
  primaryButton: {
    minWidth: 180,
    alignItems: 'center',
    borderRadius: 12,
    backgroundColor: '#C02A16',
    paddingHorizontal: 20,
    paddingVertical: 14,
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  secondaryButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  secondaryButtonText: {
    color: '#A8A8B3',
    fontWeight: '600',
  },
});
