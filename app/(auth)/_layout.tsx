import { Stack } from 'expo-router';
import { colors } from '../../constants/theme';

export default function AuthLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: colors.background },
        animation: 'slide_from_right',
      }}
    >
      <Stack.Screen name="login" />
      <Stack.Screen name="onboarding/race" />
      <Stack.Screen name="onboarding/avatar" />
      <Stack.Screen name="onboarding/name" />
    </Stack>
  );
}
