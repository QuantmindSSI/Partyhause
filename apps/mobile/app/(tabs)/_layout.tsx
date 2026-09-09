import { Stack } from 'expo-router';
import { useAuthSession } from '@/providers/AuthSessionProvider';

export default function TabLayout() {
  const { status } = useAuthSession();
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Protected guard={status === 'authenticated'}>
        <Stack.Screen name="account" />
      </Stack.Protected>
    </Stack>
  );
}
