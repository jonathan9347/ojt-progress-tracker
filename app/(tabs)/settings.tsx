import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system/legacy';
import { router } from 'expo-router';
import { Alert, ScrollView, StyleSheet } from 'react-native';
import { Button, Card, List, Switch, Text, useTheme } from 'react-native-paper';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { appRadius } from '@/constants/theme';
import { useAppState } from '@/hooks/useAppState';
import { buildCsv, parseImportedBackup, shareFile, writeTextFile } from '@/utils/export';
import { exportBackupData } from '@/utils/storage';
import { cancelDailyReminder, requestNotificationPermission, scheduleDailyReminder } from '@/utils/notifications';

export default function SettingsScreen() {
  const { profile, logs, saveUserProfile, importData, resetAllData } = useAppState();
  const theme = useTheme();
  const insets = useSafeAreaInsets();

  const handleToggleDarkMode = async (value: boolean) => {
    if (!profile) {
      return;
    }
    await saveUserProfile({ ...profile, darkMode: value });
  };

  const handleToggleNotifications = async (value: boolean) => {
    if (!profile) {
      return;
    }

    if (value) {
      const granted = await requestNotificationPermission();
      if (!granted) {
        Alert.alert('Notifications unavailable', 'Permission was not granted for reminders.');
        return;
      }
      await scheduleDailyReminder();
    } else {
      await cancelDailyReminder();
    }

    await saveUserProfile({ ...profile, notificationsEnabled: value });
  };

  const handleExportJson = async () => {
    const backup = await exportBackupData(profile, logs);
    const uri = await writeTextFile('ojt-progress-backup.json', JSON.stringify(backup, null, 2));
    await shareFile(uri);
  };

  const handleExportCsv = async () => {
    const uri = await writeTextFile('ojt-progress-logs.csv', buildCsv(profile, logs));
    await shareFile(uri);
  };

  const handleImport = async () => {
    const result = await DocumentPicker.getDocumentAsync({
      type: 'application/json',
      multiple: false,
      copyToCacheDirectory: true,
    });

    if (result.canceled || !result.assets[0]?.uri) {
      return;
    }

    const content = await FileSystem.readAsStringAsync(result.assets[0].uri, {
      encoding: FileSystem.EncodingType.UTF8,
    });
    const backup = parseImportedBackup(content);
    await importData(backup);
  };

  const handleClear = () => {
    Alert.alert('Clear all data?', 'This will remove your profile and all logged hours from the device.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Clear',
        style: 'destructive',
        onPress: () => {
          void resetAllData();
          router.replace('/onboarding');
        },
      },
    ]);
  };

  return (
    <ScrollView
      style={{ backgroundColor: theme.colors.background }}
      contentContainerStyle={[
        styles.content,
        {
          paddingTop: insets.top + 12,
          paddingBottom: insets.bottom + 120,
        },
      ]}
    >
      <Text variant="headlineMedium" style={styles.title}>
        Settings
      </Text>

      <Card style={styles.card}>
        <Card.Content>
          <Text variant="titleLarge">{profile?.name ?? 'Student Profile'}</Text>
          <Text variant="bodyMedium">Target Hours: {profile?.targetHours ?? 240}</Text>
          <Button style={styles.inlineAction} mode="outlined" onPress={() => router.push('/onboarding')}>
            Edit Profile
          </Button>
        </Card.Content>
      </Card>

      <Card style={styles.card}>
        <List.Item
          title="Daily reminders"
          description="Send an evening reminder to log your hours."
          right={() => <Switch value={profile?.notificationsEnabled ?? false} onValueChange={handleToggleNotifications} />}
        />
        <List.Item
          title="Dark mode"
          description="Switch the app theme between light and dark."
          right={() => <Switch value={profile?.darkMode ?? false} onValueChange={handleToggleDarkMode} />}
        />
      </Card>

      <Card style={styles.card}>
        <Card.Content style={styles.actions}>
          <Button mode="contained" onPress={() => router.push('/report')}>
            Open Report
          </Button>
          <Button mode="outlined" onPress={handleExportJson}>
            Export JSON Backup
          </Button>
          <Button mode="outlined" onPress={handleExportCsv}>
            Export CSV
          </Button>
          <Button mode="outlined" onPress={handleImport}>
            Import Backup
          </Button>
        </Card.Content>
      </Card>

      <Card style={styles.card}>
        <Card.Content style={styles.actions}>
          <Button mode="contained-tonal" buttonColor={theme.colors.error} textColor="#ffffff" onPress={handleClear}>
            Clear All Data
          </Button>
        </Card.Content>
      </Card>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingHorizontal: 20,
    gap: 16,
  },
  card: {
    borderRadius: appRadius.lg,
  },
  inlineAction: {
    marginTop: 12,
    alignSelf: 'flex-start',
  },
  actions: {
    gap: 12,
  },
  title: {
    fontWeight: '800',
  },
});
