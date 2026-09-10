import { Stack } from 'expo-router';

/**
 * Settings stack.
 *
 * `app/settings/` did not exist until now, while `app/profile/[id].tsx:73`
 * pushed `/settings/profile` behind an `as any` cast that suppressed the type
 * error. Both screens under here are real destinations for controls that were
 * already shipping.
 */
export default function SettingsLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: true,
        headerBackTitle: 'Back',
        headerTintColor: '#FF5233',
        headerTitleStyle: { color: '#26201D', fontWeight: '600' },
      }}
    >
      <Stack.Screen name="index" options={{ title: 'Account' }} />
      <Stack.Screen name="profile" options={{ title: 'Edit Profile' }} />
    </Stack>
  );
}
