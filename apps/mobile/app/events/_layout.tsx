import { Stack } from 'expo-router';

export default function EventsLayout() {
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
        name="create" 
        options={{ 
          headerShown: false // Let create/_layout.tsx handle the headers
        }} 
      />
      <Stack.Screen 
        name="[id]" 
        options={{ 
          title: 'Event Details',
          headerBackTitle: 'Events'
        }} 
      />
      <Stack.Screen 
        name="drafts" 
        options={{ 
          title: 'Draft Events',
          headerBackTitle: 'Back'
        }} 
      />
    </Stack>
  );
}