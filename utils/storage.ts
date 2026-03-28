import AsyncStorage from '@react-native-async-storage/async-storage';

import type { BackupData, DailyLog, UserProfile } from '@/types';

const PROFILE_KEY = 'ojt.profile';
const LOGS_KEY = 'ojt.logs';

export async function getProfile(): Promise<UserProfile | null> {
  const raw = await AsyncStorage.getItem(PROFILE_KEY);
  return raw ? (JSON.parse(raw) as UserProfile) : null;
}

export async function saveProfile(profile: UserProfile): Promise<void> {
  await AsyncStorage.setItem(PROFILE_KEY, JSON.stringify(profile));
}

export async function getLogs(): Promise<DailyLog[]> {
  const raw = await AsyncStorage.getItem(LOGS_KEY);
  return raw ? (JSON.parse(raw) as DailyLog[]) : [];
}

export async function saveLogs(logs: DailyLog[]): Promise<void> {
  await AsyncStorage.setItem(LOGS_KEY, JSON.stringify(logs));
}

export async function clearAllData(): Promise<void> {
  await AsyncStorage.multiRemove([PROFILE_KEY, LOGS_KEY]);
}

export async function exportBackupData(profile: UserProfile | null, logs: DailyLog[]): Promise<BackupData> {
  return {
    profile,
    logs,
    exportedAt: new Date().toISOString(),
  };
}

export async function importBackupData(backup: BackupData): Promise<void> {
  if (backup.profile) {
    await saveProfile(backup.profile);
  } else {
    await AsyncStorage.removeItem(PROFILE_KEY);
  }
  await saveLogs(backup.logs ?? []);
}
