import { Redirect } from 'expo-router';

import { useAppState } from '@/hooks/useAppState';

export default function IndexScreen() {
  const { profile } = useAppState();

  if (!profile) {
    return <Redirect href="/onboarding" />;
  }

  return <Redirect href="/(tabs)/dashboard" />;
}
