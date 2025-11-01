import { Stack, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { View, Text, ActivityIndicator, StyleSheet } from 'react-native';
import { supabase } from '@/lib/supabase';

export default function CreateEventLayout() {
  const router = useRouter();
  const [isChecking, setIsChecking] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    if (!supabase) {
      setIsAuthenticated(false);
      setIsChecking(false);
      router.replace('/(tabs)');
      return;
    }

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) {
        router.replace('/(tabs)');
      } else {
        setIsAuthenticated(true);
      }
    } catch (error) {
      console.error('Auth check error:', error);
      router.replace('/(tabs)');
    } finally {
      setIsChecking(false);
    }
  };

  if (isChecking) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#6366F1" />
        <Text style={styles.loadingText}>Checking authentication...</Text>
      </View>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <Stack
      screenOptions={{
        headerStyle: {
          backgroundColor: '#6366F1',
        },
        headerTintColor: '#fff',
        headerTitleStyle: {
          fontWeight: 'bold',
        },
      }}>
      <Stack.Screen 
        name="index" 
        options={{ 
          title: 'Create Event',
          headerBackTitle: 'Back'
        }} 
      />
      <Stack.Screen 
        name="basics" 
        options={{ 
          title: 'Event Details',
          headerBackTitle: 'Back'
        }} 
      />
      <Stack.Screen 
        name="guests" 
        options={{ 
          title: 'Guest List',
          headerBackTitle: 'Back'
        }} 
      />
      <Stack.Screen 
        name="timeline" 
        options={{ 
          title: 'Event Timeline',
          headerBackTitle: 'Back'
        }} 
      />
      <Stack.Screen 
        name="template-details" 
        options={{ 
          title: 'Template Details',
          headerBackTitle: 'Back'
        }} 
      />
      <Stack.Screen 
        name="review" 
        options={{ 
          title: 'Review & Publish',
          headerBackTitle: 'Back'
        }} 
      />
    </Stack>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#6B7280',
  },
});