import { Stack } from 'expo-router';

export default function PartyHubLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: '#F9FAFB' },
      }}
    >
      <Stack.Screen
        name="index"
        options={{
          title: 'PartyHub',
          headerShown: true,
        }}
      />
      <Stack.Screen
        name="partyboard/index"
        options={{
          title: 'PartyBoard',
          headerShown: true,
        }}
      />
    </Stack>
  );
}
