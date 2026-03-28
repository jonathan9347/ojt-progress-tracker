import * as DocumentPicker from 'expo-document-picker';
import { router } from 'expo-router';
import { format } from 'date-fns';
import { useEffect, useState } from 'react';
import { Alert, ScrollView, StyleSheet, View } from 'react-native';
import { Avatar, Button, Card, List, Snackbar, Switch, Text, useTheme } from 'react-native-paper';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ActionAnimationOverlay } from '@/components/ActionAnimationOverlay';
import { appRadius } from '@/constants/theme';
import { useAppState } from '@/hooks/useAppState';
import type { BackupSummary } from '@/types';
import {
  exportData,
  getAutoBackupBeforeClearEnabled,
  getLastBackupAt,
  importData as importBackupFile,
  setAutoBackupBeforeClearEnabled,
} from '@/utils/backup';
import { buildCsv, shareFile, writeTextFile } from '@/utils/export';
import { cancelDailyReminder, requestNotificationPermission, scheduleDailyReminder } from '@/utils/notifications';
import { triggerSelectionHaptic, triggerSuccessHaptic } from '@/utils/haptics';

export default function SettingsScreen() {
  const { profile, logs, saveUserProfile, importData: importAppData, resetAllData } = useAppState();
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [isClearing, setIsClearing] = useState(false);
  const [lastBackupAt, setLastBackupAt] = useState<string | null>(null);
  const [autoBackupBeforeClear, setAutoBackupBeforeClear] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarVisible, setSnackbarVisible] = useState(false);
  const [actionLabel, setActionLabel] = useState('Syncing Data');
  const [actionDescription, setActionDescription] = useState('Please wait a moment...');

  useEffect(() => {
    void loadBackupPreferences();
  }, []);

  const loadBackupPreferences = async () => {
    const [storedLastBackupAt, storedAutoBackup] = await Promise.all([getLastBackupAt(), getAutoBackupBeforeClearEnabled()]);
    setLastBackupAt(storedLastBackupAt);
    setAutoBackupBeforeClear(storedAutoBackup);
  };

  const showMessage = (message: string) => {
    setSnackbarMessage(message);
    setSnackbarVisible(true);
  };

  const handleToggleDarkMode = async (value: boolean) => {
    if (!profile) {
      return;
    }
    await triggerSelectionHaptic();
    await saveUserProfile({ ...profile, darkMode: value });
  };

  const handleToggleNotifications = async (value: boolean) => {
    if (!profile) {
      return;
    }

    await triggerSelectionHaptic();
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

  const handleToggleAutoBackup = async (value: boolean) => {
    await triggerSelectionHaptic();
    setAutoBackupBeforeClear(value);
    await setAutoBackupBeforeClearEnabled(value);
    showMessage(value ? 'Auto-backup before clearing is now enabled.' : 'Auto-backup before clearing is now disabled.');
  };

  const handleExportBackup = async (share = true) => {
    setActionLabel('Exporting Backup');
    setActionDescription('Preparing your backup file...');
    setIsExporting(true);
    try {
      const result = await exportData({ profile, logs, share });
      setLastBackupAt(result.backupFile.exportDate);
      await triggerSuccessHaptic();
      Alert.alert('Backup created', `Saved as ${result.fileName}\n\nLocation:\n${result.uri}`);
      showMessage('Backup exported successfully.');
      return result;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unable to export your backup right now.';
      Alert.alert('Export failed', message);
      return null;
    } finally {
      setIsExporting(false);
    }
  };

  const handleExportCsv = async () => {
    try {
      await triggerSelectionHaptic();
      setActionLabel('Exporting Data');
      setActionDescription('Preparing your CSV export...');
      setIsExporting(true);
      const uri = await writeTextFile('ojt-progress-logs.csv', buildCsv(profile, logs));
      await shareFile(uri);
      showMessage('CSV exported successfully.');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unable to export CSV right now.';
      Alert.alert('Export failed', message);
    } finally {
      setIsExporting(false);
    }
  };

  const handleImport = async () => {
    try {
      await triggerSelectionHaptic();
      const result = await DocumentPicker.getDocumentAsync({
        type: 'application/json',
        multiple: false,
        copyToCacheDirectory: true,
      });

      if (result.canceled || !result.assets[0]?.uri) {
        return;
      }

      setActionLabel('Reading Backup');
      setActionDescription('Checking the selected backup file...');
      setIsImporting(true);
      const preparedImport = await importBackupFile(result.assets[0].uri);
      setIsImporting(false);

      Alert.alert('Import this backup?', buildImportPreview(preparedImport.summary), [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Import',
          style: 'destructive',
          onPress: () => {
            void confirmImport(preparedImport.backupData, preparedImport.summary);
          },
        },
      ]);
    } catch (error) {
      setIsImporting(false);
      const message = error instanceof Error ? error.message : 'Unable to import the selected backup.';
      Alert.alert('Import failed', message);
    }
  };

  const confirmImport = async (backupData: Parameters<typeof importAppData>[0], summary: BackupSummary) => {
    setActionLabel('Importing Backup');
    setActionDescription('Restoring your saved data...');
    setIsImporting(true);
    try {
      await importAppData(backupData);
      await triggerSuccessHaptic();
      Alert.alert('Import complete', `Profile: ${summary.profileName ?? 'None'}\nLogs imported: ${summary.logCount}`);
      showMessage('Backup imported successfully.');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unable to finish importing the backup.';
      Alert.alert('Import failed', message);
    } finally {
      setIsImporting(false);
    }
  };

  const handleClear = () => {
    Alert.alert('Clear all data?', 'This will remove your profile and all logged hours from the device.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Clear', style: 'destructive', onPress: () => void clearAllData() },
    ]);
  };

  const clearAllData = async () => {
    setActionLabel('Clearing Data');
    setActionDescription('Removing local data and saving changes...');
    setIsClearing(true);
    try {
      let autoBackupLocation = '';

      if (autoBackupBeforeClear) {
        const backupResult = await exportData({ profile, logs, share: false });
        autoBackupLocation = backupResult.uri;
        setLastBackupAt(backupResult.backupFile.exportDate);
      }

      await resetAllData();
      Alert.alert(
        'Data cleared',
        autoBackupLocation
          ? `Your data was cleared.\n\nA backup was saved to:\n${autoBackupLocation}`
          : 'Your profile and logs were removed from this device.',
      );
      router.replace('/onboarding');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unable to clear your data right now.';
      Alert.alert('Clear failed', message);
    } finally {
      setIsClearing(false);
    }
  };

  const formattedLastBackup =
    lastBackupAt && !Number.isNaN(new Date(lastBackupAt).getTime())
      ? format(new Date(lastBackupAt), 'MMM d, yyyy h:mm a')
      : 'No backup created yet';

  return (
    <ScrollView
      style={{ backgroundColor: theme.colors.background }}
      contentContainerStyle={[
        styles.content,
        {
          paddingTop: insets.top + 10,
          paddingBottom: insets.bottom + 100,
        },
      ]}
      showsVerticalScrollIndicator={false}
    >
      <Text variant="headlineLarge" style={styles.title}>
        Settings
      </Text>

      <Card style={styles.card}>
        <Card.Content style={styles.profileCard}>
          <Avatar.Text size={48} label={(profile?.name ?? 'O').slice(0, 1).toUpperCase()} />
          <View style={styles.profileCopy}>
            <Text variant="titleLarge" style={styles.profileName}>
              {profile?.name ?? 'Student Profile'}
            </Text>
            <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant }}>
              Target Hours: {profile?.targetHours ?? 240}
            </Text>
          </View>
          <Button mode="text" compact onPress={() => router.push('/onboarding')}>
            Edit
          </Button>
        </Card.Content>
      </Card>

      <Text variant="labelLarge" style={styles.groupLabel}>
        Preferences
      </Text>
      <Card style={styles.card}>
        <List.Item
          title="Daily reminders"
          description="Evening reminder to log your duty hours."
          right={() => <Switch value={profile?.notificationsEnabled ?? false} onValueChange={handleToggleNotifications} />}
        />
        <List.Item
          title="Dark mode"
          description="Switch the app theme between light and dark."
          right={() => <Switch value={profile?.darkMode ?? false} onValueChange={handleToggleDarkMode} />}
        />
        <List.Item
          title="Auto-backup before clear"
          description="Create a JSON backup before removing local data."
          right={() => <Switch value={autoBackupBeforeClear} onValueChange={handleToggleAutoBackup} />}
        />
      </Card>

      <Text variant="labelLarge" style={styles.groupLabel}>
        Backup & Export
      </Text>
      <Card style={styles.card}>
        <List.Item title="Last Backup" description={formattedLastBackup} left={() => <List.Icon icon="cloud-outline" />} />
        <List.Item
          title="Backup Data"
          description="Create a full JSON backup"
          left={() => <List.Icon icon="cloud-upload-outline" />}
          right={() => <Button mode="text" onPress={() => void handleExportBackup(true)} loading={isExporting}>Open</Button>}
        />
        <List.Item
          title="Import Backup"
          description="Restore from a saved JSON file"
          left={() => <List.Icon icon="folder-download-outline" />}
          right={() => <Button mode="text" onPress={() => void handleImport()} loading={isImporting}>Open</Button>}
        />
        <List.Item
          title="Export CSV/PDF"
          description="Share your logs as files"
          left={() => <List.Icon icon="export-variant" />}
          right={() => <Button mode="text" onPress={handleExportCsv}>Share</Button>}
        />
      </Card>

      <Text variant="labelLarge" style={styles.groupLabel}>
        More
      </Text>
      <Card style={styles.card}>
        <List.Item title="Open Report" left={() => <List.Icon icon="file-chart-outline" />} onPress={() => router.push('/report')} />
        <List.Item title="Clear All Data" left={() => <List.Icon icon="trash-can-outline" />} onPress={handleClear} />
      </Card>

      <Text variant="bodySmall" style={styles.version}>
        OJT Progress Tracker v1.0.0
      </Text>

      <Snackbar visible={snackbarVisible} onDismiss={() => setSnackbarVisible(false)} duration={3000}>
        {snackbarMessage}
      </Snackbar>

      <ActionAnimationOverlay
        visible={isExporting || isImporting || isClearing}
        title={actionLabel}
        description={actionDescription}
      />
    </ScrollView>
  );
}

function buildImportPreview(summary: BackupSummary): string {
  return [
    `Profile: ${summary.profileName ?? 'None'}`,
    `Target hours: ${summary.targetHours ?? '--'}`,
    `Logs to import: ${summary.logCount}`,
    `Exported on: ${format(new Date(summary.exportDate), 'MMM d, yyyy h:mm a')}`,
  ].join('\n');
}

const styles = StyleSheet.create({
  content: {
    paddingHorizontal: 20,
    gap: 10,
  },
  title: {
    fontWeight: '800',
    marginBottom: 4,
  },
  groupLabel: {
    marginTop: 10,
    color: '#8E8E93',
    fontWeight: '700',
  },
  card: {
    borderRadius: 16,
  },
  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  profileCopy: {
    flex: 1,
    gap: 2,
  },
  profileName: {
    fontWeight: '800',
  },
  version: {
    marginTop: 18,
    marginBottom: 8,
    textAlign: 'center',
    color: '#8E8E93',
  },
});
