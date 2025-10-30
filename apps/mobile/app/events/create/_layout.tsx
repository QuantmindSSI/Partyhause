import { Stack } from 'expo-router';

export default function CreateEventLayout() {
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