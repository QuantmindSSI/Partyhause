import 'react-native-url-polyfill/auto';
import { DarkTheme, DefaultTheme, Stack, ThemeProvider } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { useEffect } from 'react';
import { ActivityIndicator, Platform, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { AppProviders } from '../providers/AppProviders';
import { useAuthSession } from '@/providers/AuthSessionProvider';
import { useColorScheme } from '@/hooks/use-color-scheme';

// Expo Router requires this named export beside the root layout component.
// eslint-disable-next-line react-refresh/only-export-components
export const unstable_settings = {
  anchor: '(tabs)',
};

function AppStack({ privateRoutesAllowed }: { privateRoutesAllowed: boolean }) {
  return (
    <Stack>
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Protected guard={privateRoutesAllowed}>
        <Stack.Screen name="events" options={{ headerShown: false }} />
        <Stack.Screen name="account" options={{ headerShown: false }} />
      </Stack.Protected>
    </Stack>
  );
}

function RootNavigator() {
  const { status, message, refresh, signOut } = useAuthSession();
  const gateVisible = status === 'checking' || status === 'unavailable';

  return (
    <View style={styles.rootNavigator}>
      <AppStack privateRoutesAllowed={status === 'authenticated'} />
      {gateVisible ? (
        <View style={styles.sessionGate}>
          {status === 'checking' ? (
            <>
              <ActivityIndicator size="large" color="#FF7D66" />
              <Text style={styles.sessionGateText}>Checking your session...</Text>
            </>
          ) : (
            <>
              <Text style={styles.sessionGateTitle}>We could not verify your session</Text>
              <Text style={styles.sessionGateText}>{message}</Text>
              <TouchableOpacity style={styles.primaryButton} onPress={() => { void refresh(); }}>
                <Text style={styles.primaryButtonText}>Try Again</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.secondaryButton} onPress={() => { void signOut(); }}>
                <Text style={styles.secondaryButtonText}>Sign Out</Text>
              </TouchableOpacity>
            </>
          )}
        </View>
      ) : null}
    </View>
  );
}

function RootContent() {
  const colorScheme = useColorScheme();

  useEffect(() => {
    if (Platform.OS !== 'web' || !('serviceWorker' in navigator)) {
      return;
    }

    const registerServiceWorker = () => {
      navigator.serviceWorker.register('/sw.js').catch((error) => {
        console.error('Service Worker registration failed:', error);
      });
    };

    if (document.readyState === 'complete') {
      registerServiceWorker();
      return;
    }

    window.addEventListener('load', registerServiceWorker, { once: true });
    return () => window.removeEventListener('load', registerServiceWorker);
  }, []);

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <RootNavigator />
      <StatusBar style="auto" />
    </ThemeProvider>
  );
}

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <AppProviders>
        <RootContent />
      </AppProviders>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  rootNavigator: {
    flex: 1,
  },
  sessionGate: {
    ...StyleSheet.absoluteFill,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 14,
    padding: 24,
    backgroundColor: '#181311',
  },
  sessionGateTitle: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '700',
    textAlign: 'center',
  },
  sessionGateText: {
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
