import * as Haptics from 'expo-haptics';
import { Platform } from 'react-native';

async function runHaptic(action: () => Promise<void>) {
  if (Platform.OS === 'web') {
    return;
  }

  try {
    await action();
  } catch {
    // Ignore haptic failures so app actions still complete normally.
  }
}

export async function triggerSelectionHaptic(): Promise<void> {
  await runHaptic(() => Haptics.selectionAsync());
}

export async function triggerSuccessHaptic(): Promise<void> {
  await runHaptic(() => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success));
}

export async function triggerWarningHaptic(): Promise<void> {
  await runHaptic(() => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning));
}
