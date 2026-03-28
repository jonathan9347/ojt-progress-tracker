export type UserProfile = {
  name: string;
  targetHours: number;
  startDate: string;
  endDate: string;
  notificationsEnabled: boolean;
  darkMode: boolean;
};

export type DailyLog = {
  id: string;
  date: string;
  hours: number;
  breakMinutes: number;
  netHours: number;
  notes: string;
  createdAt: string;
};

export type HistoryFilter = 'all' | 'week' | 'month';

export type BackupData = {
  profile: UserProfile | null;
  logs: DailyLog[];
  exportedAt: string;
};

export type BackupFileData = {
  version: '1.0';
  exportDate: string;
  appName: 'OJT Progress Tracker';
  data: {
    userProfile: UserProfile | null;
    logs: DailyLog[];
  };
};

export type BackupSummary = {
  profileName: string | null;
  targetHours: number | null;
  logCount: number;
  exportDate: string;
};

export type DashboardSummary = {
  totalHours: number;
  remainingHours: number;
  completionPercentage: number;
  averageDailyHours: number;
  estimatedDaysRemaining: number | null;
  requiredDailyAverage: number;
  projectedFinishDate: string | null;
  daysUntilDeadline: number;
  status: 'On Track' | 'Need to Catch Up' | 'Completed';
};
