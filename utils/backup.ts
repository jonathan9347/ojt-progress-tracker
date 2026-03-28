import AsyncStorage from '@react-native-async-storage/async-storage';
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import { format } from 'date-fns';

import type { BackupData, BackupFileData, BackupSummary, DailyLog, UserProfile } from '@/types';

const BACKUP_VERSION = '1.0';
const APP_NAME = 'OJT Progress Tracker';
const LAST_BACKUP_AT_KEY = 'ojt.backup.lastBackupAt';
const AUTO_BACKUP_BEFORE_CLEAR_KEY = 'ojt.backup.autoBackupBeforeClear';

type ExportDataParams = {
  profile: UserProfile | null;
  logs: DailyLog[];
  share?: boolean;
};

type ExportDataResult = {
  uri: string;
  fileName: string;
  summary: BackupSummary;
  backupFile: BackupFileData;
};

type ImportDataResult = {
  backupData: BackupData;
  backupFile: BackupFileData;
  summary: BackupSummary;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function assertString(value: unknown, field: string): asserts value is string {
  if (typeof value !== 'string' || !value.trim()) {
    throw new Error(`${field} is missing or invalid.`);
  }
}

function assertNumber(value: unknown, field: string): asserts value is number {
  if (typeof value !== 'number' || Number.isNaN(value)) {
    throw new Error(`${field} is missing or invalid.`);
  }
}

function validateUserProfile(value: unknown): UserProfile | null {
  if (value == null) {
    return null;
  }

  if (!isRecord(value)) {
    throw new Error('Profile data is not in the expected format.');
  }

  assertString(value.name, 'Profile name');
  assertNumber(value.targetHours, 'Profile target hours');
  assertString(value.startDate, 'Profile start date');
  assertString(value.endDate, 'Profile end date');

  return {
    name: value.name,
    targetHours: value.targetHours,
    startDate: value.startDate,
    endDate: value.endDate,
    notificationsEnabled: typeof value.notificationsEnabled === 'boolean' ? value.notificationsEnabled : false,
    darkMode: typeof value.darkMode === 'boolean' ? value.darkMode : false,
  };
}

function validateLog(value: unknown, index: number): DailyLog {
  if (!isRecord(value)) {
    throw new Error(`Log #${index + 1} is not in the expected format.`);
  }

  assertString(value.id, `Log #${index + 1} id`);
  assertString(value.date, `Log #${index + 1} date`);
  assertNumber(value.hours, `Log #${index + 1} hours`);
  assertNumber(value.netHours, `Log #${index + 1} net hours`);

  if (value.notes != null && typeof value.notes !== 'string') {
    throw new Error(`Log #${index + 1} notes are invalid.`);
  }

  const breakMinutes = typeof value.breakMinutes === 'number' && !Number.isNaN(value.breakMinutes) ? value.breakMinutes : 0;
  const createdAt = typeof value.createdAt === 'string' && value.createdAt ? value.createdAt : new Date().toISOString();

  return {
    id: value.id,
    date: value.date,
    hours: value.hours,
    breakMinutes,
    netHours: value.netHours,
    notes: typeof value.notes === 'string' ? value.notes : '',
    createdAt,
  };
}

function normalizeLegacyBackup(value: Record<string, unknown>): BackupFileData {
  const profile = validateUserProfile(value.profile);
  const logsRaw = Array.isArray(value.logs) ? value.logs : [];
  const logs = logsRaw.map((log, index) => validateLog(log, index));
  const exportDate = typeof value.exportedAt === 'string' && value.exportedAt ? value.exportedAt : new Date().toISOString();

  return {
    version: BACKUP_VERSION,
    exportDate,
    appName: APP_NAME,
    data: {
      userProfile: profile,
      logs,
    },
  };
}

function buildFileName(date: Date): string {
  return `OJT_Backup_${format(date, 'yyyy-MM-dd_HH-mm-ss')}.json`;
}

export function validateBackupData(raw: unknown): BackupFileData {
  if (!isRecord(raw)) {
    throw new Error('The selected file is not a valid JSON backup.');
  }

  if ('data' in raw) {
    const version = raw.version;
    const exportDate = raw.exportDate;
    const appName = raw.appName;

    if (version !== BACKUP_VERSION) {
      throw new Error('This backup version is not supported by the app.');
    }

    assertString(exportDate, 'Export date');

    if (appName !== APP_NAME) {
      throw new Error('This file does not belong to OJT Progress Tracker.');
    }

    if (!isRecord(raw.data)) {
      throw new Error('Backup data is missing.');
    }

    const userProfile = validateUserProfile(raw.data.userProfile);
    const logsRaw = raw.data.logs;
    if (!Array.isArray(logsRaw)) {
      throw new Error('Backup logs are missing or invalid.');
    }

    return {
      version: BACKUP_VERSION,
      exportDate,
      appName: APP_NAME,
      data: {
        userProfile,
        logs: logsRaw.map((log, index) => validateLog(log, index)),
      },
    };
  }

  if ('profile' in raw || 'logs' in raw || 'exportedAt' in raw) {
    return normalizeLegacyBackup(raw);
  }

  throw new Error('The selected file is not a recognized OJT backup.');
}

export function getBackupSummary(backupFile: BackupFileData): BackupSummary {
  return {
    profileName: backupFile.data.userProfile?.name ?? null,
    targetHours: backupFile.data.userProfile?.targetHours ?? null,
    logCount: backupFile.data.logs.length,
    exportDate: backupFile.exportDate,
  };
}

export async function exportData({ profile, logs, share = true }: ExportDataParams): Promise<ExportDataResult> {
  const exportDate = new Date();
  const fileName = buildFileName(exportDate);
  const directory = FileSystem.documentDirectory ?? FileSystem.cacheDirectory;

  if (!directory) {
    throw new Error('No writable folder is available on this device.');
  }

  const backupFile: BackupFileData = {
    version: BACKUP_VERSION,
    exportDate: exportDate.toISOString(),
    appName: APP_NAME,
    data: {
      userProfile: profile,
      logs,
    },
  };

  const uri = `${directory}${fileName}`;
  await FileSystem.writeAsStringAsync(uri, JSON.stringify(backupFile, null, 2), {
    encoding: FileSystem.EncodingType.UTF8,
  });

  await AsyncStorage.setItem(LAST_BACKUP_AT_KEY, backupFile.exportDate);

  if (share) {
    const sharingAvailable = await Sharing.isAvailableAsync();
    if (!sharingAvailable) {
      throw new Error(`Backup created successfully, but sharing is not available on this device. File saved to: ${uri}`);
    }

    await Sharing.shareAsync(uri, {
      mimeType: 'application/json',
      dialogTitle: 'Save or share your OJT backup',
      UTI: 'public.json',
    });
  }

  return {
    uri,
    fileName,
    summary: getBackupSummary(backupFile),
    backupFile,
  };
}

export async function importData(fileUri: string): Promise<ImportDataResult> {
  const rawContent = await FileSystem.readAsStringAsync(fileUri, {
    encoding: FileSystem.EncodingType.UTF8,
  });

  let parsed: unknown;
  try {
    parsed = JSON.parse(rawContent) as unknown;
  } catch {
    throw new Error('The selected file is not valid JSON.');
  }

  const backupFile = validateBackupData(parsed);
  const summary = getBackupSummary(backupFile);

  return {
    backupFile,
    summary,
    backupData: {
      profile: backupFile.data.userProfile,
      logs: backupFile.data.logs,
      exportedAt: backupFile.exportDate,
    },
  };
}

export async function getLastBackupAt(): Promise<string | null> {
  return AsyncStorage.getItem(LAST_BACKUP_AT_KEY);
}

export async function getAutoBackupBeforeClearEnabled(): Promise<boolean> {
  const raw = await AsyncStorage.getItem(AUTO_BACKUP_BEFORE_CLEAR_KEY);
  return raw === 'true';
}

export async function setAutoBackupBeforeClearEnabled(value: boolean): Promise<void> {
  await AsyncStorage.setItem(AUTO_BACKUP_BEFORE_CLEAR_KEY, String(value));
}
