import Constants from 'expo-constants';
import * as Notifications from 'expo-notifications';

let notificationHandlerInitialized = false;

function isExpoGo(): boolean {
  return Constants.appOwnership === 'expo';
}

function ensureNotificationHandler(): void {
  if (notificationHandlerInitialized || isExpoGo()) {
    return;
  }

  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldPlaySound: true,
      shouldSetBadge: false,
      shouldShowBanner: true,
      shouldShowList: true,
    }),
  });

  notificationHandlerInitialized = true;
}

export async function requestNotificationPermission(): Promise<boolean> {
  if (isExpoGo()) {
    return false;
  }

  ensureNotificationHandler();
  const settings = await Notifications.getPermissionsAsync();
  if (settings.granted) {
    return true;
  }

  const requested = await Notifications.requestPermissionsAsync();
  return requested.granted;
}

export async function scheduleDailyReminder(): Promise<void> {
  if (isExpoGo()) {
    throw new Error('Daily reminders require a development build or standalone APK. Expo Go no longer supports Android push notifications.');
  }

  ensureNotificationHandler();
  await Notifications.cancelAllScheduledNotificationsAsync();
  await Notifications.scheduleNotificationAsync({
    content: {
      title: 'Log your OJT hours',
      body: 'Keep your internship progress up to date today.',
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DAILY,
      hour: 20,
      minute: 0,
    },
  });
}

export async function cancelDailyReminder(): Promise<void> {
  if (isExpoGo()) {
    return;
  }

  await Notifications.cancelAllScheduledNotificationsAsync();
}
