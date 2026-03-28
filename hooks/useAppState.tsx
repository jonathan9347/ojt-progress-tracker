import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';

import { calculateNetHours, sortLogsNewest } from '@/utils/calculations';
import { clearAllData, getLogs, getProfile, importBackupData, saveLogs, saveProfile } from '@/utils/storage';
import type { BackupData, DailyLog, UserProfile } from '@/types';

type LogPayload = {
  date: string;
  hours: number;
  breakMinutes: number;
  notes: string;
};

type AppStateContextValue = {
  profile: UserProfile | null;
  logs: DailyLog[];
  isReady: boolean;
  refreshData: () => Promise<void>;
  saveUserProfile: (profile: UserProfile) => Promise<void>;
  addLog: (payload: LogPayload) => Promise<void>;
  updateLog: (id: string, payload: LogPayload) => Promise<void>;
  deleteLog: (id: string) => Promise<void>;
  importData: (backup: BackupData) => Promise<void>;
  resetAllData: () => Promise<void>;
};

const AppStateContext = createContext<AppStateContextValue | undefined>(undefined);

export function AppStateProvider({ children }: React.PropsWithChildren) {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [logs, setLogs] = useState<DailyLog[]>([]);
  const [isReady, setIsReady] = useState(false);

  const refreshData = async () => {
    const [storedProfile, storedLogs] = await Promise.all([getProfile(), getLogs()]);
    setProfile(storedProfile);
    setLogs(sortLogsNewest(storedLogs));
    setIsReady(true);
  };

  useEffect(() => {
    void refreshData();
  }, []);

  const saveUserProfile = async (nextProfile: UserProfile) => {
    await saveProfile(nextProfile);
    setProfile(nextProfile);
  };

  const addLog = async ({ date, hours, breakMinutes, notes }: LogPayload) => {
    const log: DailyLog = {
      id: Date.now().toString(),
      date,
      hours,
      breakMinutes,
      netHours: calculateNetHours(hours, breakMinutes),
      notes: notes.trim(),
      createdAt: new Date().toISOString(),
    };

    const nextLogs = sortLogsNewest([log, ...logs]);
    await saveLogs(nextLogs);
    setLogs(nextLogs);
  };

  const updateLog = async (id: string, { date, hours, breakMinutes, notes }: LogPayload) => {
    const nextLogs = sortLogsNewest(
      logs.map((log) =>
        log.id === id
          ? {
              ...log,
              date,
              hours,
              breakMinutes,
              netHours: calculateNetHours(hours, breakMinutes),
              notes: notes.trim(),
            }
          : log,
      ),
    );
    await saveLogs(nextLogs);
    setLogs(nextLogs);
  };

  const deleteLog = async (id: string) => {
    const nextLogs = logs.filter((log) => log.id !== id);
    await saveLogs(nextLogs);
    setLogs(nextLogs);
  };

  const importData = async (backup: BackupData) => {
    await importBackupData(backup);
    await refreshData();
  };

  const resetAllData = async () => {
    await clearAllData();
    setProfile(null);
    setLogs([]);
  };

  const value = useMemo(
    () => ({
      profile,
      logs,
      isReady,
      refreshData,
      saveUserProfile,
      addLog,
      updateLog,
      deleteLog,
      importData,
      resetAllData,
    }),
    [profile, logs, isReady],
  );

  return <AppStateContext.Provider value={value}>{children}</AppStateContext.Provider>;
}

export function useAppState(): AppStateContextValue {
  const context = useContext(AppStateContext);
  if (!context) {
    throw new Error('useAppState must be used within AppStateProvider');
  }
  return context;
}
