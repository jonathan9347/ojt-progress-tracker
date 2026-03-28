import 'react-native-gesture-handler';

import { Stack } from 'expo-router';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { PaperProvider } from 'react-native-paper';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { AppStateProvider, useAppState } from '@/hooks/useAppState';
import { darkTheme, lightTheme } from '@/constants/theme';

function RootNavigator() {
  const { isReady, profile } = useAppState();
  const theme = profile?.darkMode ? darkTheme : lightTheme;

  if (!isReady) {
    return (
      <View style={[styles.loading, { backgroundColor: theme.colors.background }]}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  return (
    <PaperProvider theme={theme}>
      <Stack
        screenOptions={{
          headerShown: false,
          animation: 'ios_from_right',
          gestureEnabled: true,
        }}
      >
        <Stack.Screen name="index" />
        <Stack.Screen name="onboarding" />
        <Stack.Screen name="report" options={{ presentation: 'modal', animation: 'slide_from_bottom' }} />
        <Stack.Screen name="(tabs)" />
      </Stack>
    </PaperProvider>
  );
}

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={styles.flex}>
      <SafeAreaProvider>
        <AppStateProvider>
          <RootNavigator />
        </AppStateProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  loading: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
